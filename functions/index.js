const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

const ZEGO_APP_ID = 534311044;

/**
 * Generate a ZegoCloud token04 server-side.
 */
function generateZegoToken04(appID, userID, serverSecret, effectiveTimeInSeconds, payload) {
  const nonce = Math.floor(Math.random() * 2147483647);
  const createTime = Math.floor(Date.now() / 1000);
  const expireTime = createTime + effectiveTimeInSeconds;
  const tokenInfo = JSON.stringify({
    app_id: appID,
    user_id: userID,
    nonce,
    ctime: createTime,
    expire: expireTime,
    payload: payload || "",
  });
  const secretBuf = Buffer.from(serverSecret, "hex").slice(0, 16);
  const cipher = crypto.createCipheriv("aes-128-ecb", secretBuf, null);
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(tokenInfo)), cipher.final()]);
  const content = Buffer.alloc(8 + encrypted.length);
  content.writeUInt32BE(expireTime, 0);
  content.writeUInt32BE(nonce >>> 0, 4);
  encrypted.copy(content, 8);
  const appIDHex = appID.toString(16).padStart(8, "0");
  return "04" + appIDHex + content.toString("base64");
}

/**
 * 0. Callable Cloud Function: Generate ZegoCloud Kit Token (server-side)
 * Replaces dangerous client-side token generation that exposed ZEGO_SERVER_SECRET.
 */
exports.generateZegoKitToken = onCall(
  { secrets: ["ZEGO_SERVER_SECRET"], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to start a call.");
    }

    const { roomID, userName } = request.data || {};
    if (!roomID || !userName) {
      throw new HttpsError("invalid-argument", "Missing roomID or userName.");
    }

    const userID = request.auth.uid;
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!serverSecret) {
      throw new HttpsError("internal", "ZegoCloud server secret is not configured.");
    }

    const token = generateZegoToken04(ZEGO_APP_ID, userID, serverSecret, 3600, "");

    return {
      token,
      appID: ZEGO_APP_ID,
      roomID,
      userID,
      userName,
    };
  }
);

/**
 * Obtain an access token from Paypack Rwanda API
 */
async function getPaypackAccessToken() {
  const clientId = process.env.PAYPACK_CLIENT_ID;
  const clientSecret = process.env.PAYPACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Paypack credentials are not configured in Firebase secrets or environment.");
  }

  const response = await axios.post(
    "https://payments.paypack.rw/api/auth/agents/authorize",
    {
      client_id: clientId,
      client_secret: clientSecret,
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    }
  );

  return response.data.access;
}

/**
 * 1. Callable Cloud Function: Initiate Mobile Money Prompt (MTN / Airtel Rwanda)
 * Called from Tugendane frontend when passenger chooses to pay the service fee via MoMo.
 */
exports.initiateMoMoPayment = onCall(
  { secrets: ["PAYPACK_CLIENT_ID", "PAYPACK_CLIENT_SECRET"], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to pay service fees.");
    }

    const { bookingId, phone, amount } = request.data || {};
    if (!bookingId || !phone || !amount) {
      throw new HttpsError("invalid-argument", "Missing bookingId, phone number, or amount.");
    }

    const normalizedPhone = String(phone).replace(/[^0-9]/g, "");
    if (normalizedPhone.length < 10) {
      throw new HttpsError("invalid-argument", "Enter a valid Rwandan mobile number (078/079/072/073).");
    }

    try {
      // 1. Verify the booking exists and belongs to the caller
      const bookingRef = db.collection("bookings").doc(bookingId);
      const bookingSnap = await bookingRef.get();
      if (!bookingSnap.exists) {
        throw new HttpsError("not-found", "Booking not found.");
      }

      const bookingData = bookingSnap.data();
      if (bookingData.passengerId !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Only the passenger can pay this service fee.");
      }

      // 2. Authorize with Paypack
      const token = await getPaypackAccessToken();

      // 3. Initiate Cashin (Prompts MoMo PIN dialog on the passenger's mobile phone)
      const cashinRes = await axios.post(
        "https://payments.paypack.rw/api/transactions/cashin",
        {
          phone: normalizedPhone,
          amount: Number(amount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const paypackRef = cashinRes.data?.ref || "";

      // 4. Update the booking with tracking info
      await bookingRef.update({
        serviceFeePaypackRef: paypackRef,
        serviceFeeStatus: "payment_pending",
        serviceFeePaymentMethod: "Paypack Mobile Money",
        serviceFeeInitiatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        ref: paypackRef,
        message: "Payment prompt sent to phone. Please approve with your PIN.",
      };
    } catch (error) {
      console.error("Paypack initiation failed:", error.response?.data || error.message);
      const details = error.response?.data?.message || error.message;
      throw new HttpsError("internal", `Payment initiation failed: ${details}`);
    }
  }
);

/**
 * 2. HTTP Webhook: Paypack Webhook Callback
 * Triggered automatically by Paypack when transaction completes (successful / failed).
 */
exports.paypackWebhook = onRequest(
  { secrets: ["PAYPACK_CLIENT_ID", "PAYPACK_CLIENT_SECRET", "PAYPACK_WEBHOOK_SECRET"] },
  async (req, res) => {
    try {
      const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET;
      if (webhookSecret) {
        const providedSecret = req.headers["x-paypack-signature"] || req.query.secret;
        if (providedSecret !== webhookSecret) {
          console.warn("Paypack webhook unauthorized: secret signature mismatch.");
          res.status(401).send({ error: "Unauthorized" });
          return;
        }
      }

      const event = req.body;
      console.log("Paypack webhook received:", JSON.stringify(event));

      if (event && event.event_kind === "transaction:processed") {
        const { ref, status, amount } = event.data || {};

        if (status === "successful" && ref) {
          // Find the booking document that has this Paypack reference
          const querySnap = await db
            .collection("bookings")
            .where("serviceFeePaypackRef", "==", ref)
            .limit(1)
            .get();

          if (!querySnap.empty) {
            const bookingDoc = querySnap.docs[0];
            const booking = bookingDoc.data();

            // Automatically verify service fee and unlock trip chat!
            await bookingDoc.ref.update({
              serviceFeeStatus: "verified",
              paymentStatus: "Service fee paid",
              serviceFeePaidAt: admin.firestore.FieldValue.serverTimestamp(),
              serviceFeeAmountPaid: amount || null,
            });

            console.log(`Booking ${bookingDoc.id} automatically verified via Paypack webhook.`);

            // Send instant in-app alerts to passenger and driver
            const notificationPayload = {
              title: "Payment Confirmed! 💬",
              body: `Service fee for trip ${booking.from} to ${booking.to} has been received. Trip chat is now open!`,
              data: { bookingId: bookingDoc.id, type: "fee_verified" },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            await Promise.all([
              db.collection("users").doc(booking.passengerId).collection("notifications").add(notificationPayload),
              db.collection("users").doc(booking.driverId).collection("notifications").add(notificationPayload),
            ]);
          } else {
            console.warn(`No booking found matching Paypack ref ${ref}`);
          }
        }
      }

      res.status(200).send({ received: true });
    } catch (err) {
      console.error("Error processing Paypack webhook:", err);
      res.status(500).send({ error: err.message });
    }
  }
);

/**
 * 3. Native Background Push Notifications via FCM HTTP v1
 * Triggers on every new notification document in users/{userId}/notifications/{notificationId}
 * Dispatches an FCM alert to the recipient's physical device even when the app is closed.
 */
exports.sendNativePushNotification = onDocumentCreated(
  "users/{userId}/notifications/{notificationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;

    const notification = snapshot.data();
    const userId = event.params.userId;

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;

      if (!fcmToken) {
        console.log(`User ${userId} does not have an FCM token registered.`);
        return null;
      }

      const fcmMessage = {
        token: fcmToken,
        notification: {
          title: notification.title || "Tugendane Rides",
          body: notification.body || "",
        },
        data: {
          bookingId: String(notification.data?.bookingId || ""),
          rideId: String(notification.data?.rideId || ""),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "tujyane_rides_alerts",
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(fcmMessage);
      console.log(`Push notification sent to user ${userId}:`, response);
      return response;
    } catch (pushError) {
      console.error(`Failed to dispatch push notification to user ${userId}:`, pushError);

      // Clean up invalid or expired device tokens
      if (
        pushError.code === "messaging/registration-token-not-registered" ||
        pushError.code === "messaging/invalid-registration-token"
      ) {
        await db.collection("users").doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete(),
        });
        console.log(`Removed invalid FCM token for user ${userId}`);
      }
      return null;
    }
  }
);
