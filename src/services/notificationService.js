import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Initialize Push Notifications for the logged-in user.
 * On native mobile devices (Android/iOS), registers with FCM via Capacitor PushNotifications plugin
 * and saves the FCM device token to the user's Firestore profile.
 */
export async function registerPushNotifications(userId) {
  if (!userId) return null;

  try {
    if (Capacitor.isNativePlatform()) {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt" || permStatus.receive === "prompt-with-rationale") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === "granted") {
        await PushNotifications.register();

        PushNotifications.addListener("registration", async (token) => {
          console.log("Push registration success, token:", token.value);
          try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
              fcmToken: token.value,
              fcmTokenUpdatedAt: serverTimestamp(),
              platform: Capacitor.getPlatform(),
            });
          } catch (err) {
            console.warn("Could not save FCM token to user profile:", err);
          }
        });

        PushNotifications.addListener("registrationError", (error) => {
          console.error("Push registration error:", error);
        });
      } else {
        console.log("Push notification permission denied by user.");
      }
    } else {
      // Web browser fallback
      if ("Notification" in window && Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          console.log("Web Notification permission status:", permission);
        } catch (e) {
          console.warn("Web notification permission error:", e);
        }
      }
    }
  } catch (err) {
    console.error("Error initializing push notifications:", err);
  }
}

/**
 * Register foreground and action listeners for push notifications.
 */
export function setupNotificationListeners(onReceived, onActionPerformed) {
  if (!Capacitor.isNativePlatform()) return () => {};

  try {
    const receivedListener = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push notification received in foreground:", notification);
        if (typeof onReceived === "function") {
          onReceived(notification);
        }
      }
    );

    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        console.log("Push notification action performed:", action);
        if (typeof onActionPerformed === "function") {
          onActionPerformed(action);
        }
      }
    );

    return () => {
      receivedListener.remove();
      actionListener.remove();
    };
  } catch (err) {
    console.warn("Could not setup notification listeners:", err);
    return () => {};
  }
}

/**
 * Dispatch an in-app & push notification event to a user.
 * Stores a notification record in Firestore under `notifications` and presents
 * web/in-app notification if applicable.
 */
export async function sendNotificationToUser({ recipientUserId, title, body, data = {} }) {
  if (!recipientUserId) return;

  try {
    // Save in-app notification record
    await addDoc(collection(db, "users", recipientUserId, "notifications"), {
      title,
      body,
      data,
      read: false,
      createdAt: serverTimestamp(),
    });

    // The recipient's active app watches this collection and shows the alert there.
  } catch (err) {
    console.warn("Could not save notification to Firestore:", err);
  }
}
