import { useState } from "react";
import { calculateServiceFee } from "../services/rwandaRoutes";

function extractMtnTxId(raw) {
  if (!raw) return "";
  const text = String(raw).trim();
  if (/^[A-Za-z0-9_-]{6,30}$/.test(text)) return text;
  const match = text.match(/(?:Transaction\s*Id|TxId|Txn\s*Id|Financial\s*Transaction\s*Id|ID)[\s:]*([A-Za-z0-9_-]{6,25})/i);
  if (match && match[1]) return match[1];
  const digits = text.match(/\b\d{8,16}\b/);
  if (digits && digits[0]) return digits[0];
  return text;
}

function ServiceFeePrompt({ booking, onSubmitServiceFee, error, lang }) {
  const [reference, setReference] = useState("");
  const [proofImage, setProofImage] = useState("");
  const [proofError, setProofError] = useState("");
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [showScreenshotUpload, setShowScreenshotUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ticketAmount = Number(booking.subtotal || booking.totalPrice || 0);
  const feeAmount = calculateServiceFee(ticketAmount);
  const ussdCode = `*182*8*2*744405*${feeAmount}#`;

  async function openMtnPayment() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(ussdCode);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = ussdCode;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand("copy");
      fallback.remove();
    }
    setPaymentOpened(true);
    window.location.href = `tel:${ussdCode.replace("#", "%23")}`;
  }

  function handleProofChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProofError("");
    if (!file.type.startsWith("image/")) {
      setProofError("Choose an image file such as a payment screenshot.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setProofError("This image could not be opened. Try another screenshot.");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => setProofError("This image could not be opened. Try another screenshot.");
      image.onload = () => {
        const scale = Math.min(1200 / image.width, 1200 / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.68);
        if (compressed.length > 380_000) {
          setProofError("This screenshot is too large to attach. Choose a smaller image.");
          return;
        }
        setProofImage(compressed);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    const cleanRef = extractMtnTxId(reference);
    if (!cleanRef && !proofImage) {
      setProofError(lang === "en" ? "Enter your MTN Transaction ID or paste the SMS receipt." : "Shyiramo Transaction ID ya MTN cyangwa ubutumwa wahawe.");
      return;
    }
    setSubmitting(true);
    const submitted = await onSubmitServiceFee(booking, { reference: cleanRef, proofImage });
    if (submitted) {
      setReference("");
      setProofImage("");
      setProofError("");
    }
    setSubmitting(false);
  }

  if (booking.serviceFeeStatus === "review_pending") {
    return (
      <div className="service-fee-pending" role="status">
        Your payment {booking.serviceFeeReference ? `reference ${booking.serviceFeeReference}` : "screenshot"} is being checked. Driver details and chat unlock after review.
      </div>
    );
  }

  return (
    <section className="service-fee-prompt">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
        <strong>{lang === "en" ? "Pay Tugendane 15% Booking Fee" : "Ishyura Umusanzu wa 15% wa Tugendane"}</strong>
        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--primary)" }}>{feeAmount.toLocaleString()} RWF</span>
      </div>

      <p style={{ fontSize: "12.5px", color: "var(--dark-muted)", margin: "4px 0 12px", lineHeight: 1.4 }}>
        {lang === "en"
          ? "Dial the code to pay the 15% fee via MTN MoMo, then enter the Transaction ID below to unlock Trip Chat and driver details instantly!"
          : "Kanda hasi wishyure 15% ukoresheje MTN MoMo, maze wandike Transaction ID ngo ubutumwa n'amakuru by'umushoferi bifunguke ako kanya!"}
      </p>

      {/* 1. One-click Dial/Copy Button */}
      <button
        type="button"
        className="btn btn-primary btn-full service-fee-pay-button"
        onClick={openMtnPayment}
        style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "12px", fontSize: "14px" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
        <span>{lang === "en" ? `Dial *182*8*2*744405*${feeAmount}#` : `Kanda *182*8*2*744405*${feeAmount}#`}</span>
      </button>

      <small className="service-fee-code-hint" style={{ display: "block", marginTop: "4px", textAlign: "center" }}>
        {lang === "en"
          ? `Tapping copies ${ussdCode} and opens your phone dialer ready to pay.`
          : `Gukanda hano bihita bikopera ${ussdCode} no gufungura telefoni yawe.`}
      </small>

      {paymentOpened && (
        <p className="service-fee-copy-confirmation" role="status" style={{ marginTop: "6px" }}>
          {lang === "en"
            ? "Code copied to clipboard! If dialer did not open, paste into your phone keypad."
            : "Nomero yakopewe! Niba telefoni idahise ifunguka, yandike ahandikirwa nomero."}
        </p>
      )}

      {/* 2. Instant Verification Form */}
      <form onSubmit={submit} className="service-fee-proof-form" style={{ marginTop: "14px", background: "rgba(11, 94, 215, 0.04)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(11, 94, 215, 0.12)" }}>
        <div className="form-group" style={{ marginBottom: "8px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700" }}>
            {lang === "en" ? "MTN Transaction ID (or paste full SMS receipt):" : "Transaction ID ya MTN (cyangwa kopi y'ubutumwa):"}
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(extractMtnTxId(e.target.value))}
            maxLength={120}
            placeholder={lang === "en" ? "e.g. 1982736452 or paste SMS from MTN" : "urugero: 1982736452 cyangwa ubutumwa bwa MTN"}
            style={{ fontWeight: "600", fontSize: "13.5px" }}
          />
          <small style={{ color: "var(--dark-muted)", fontSize: "11px", display: "block", marginTop: "3px" }}>
            {lang === "en"
              ? "Tip: You can paste the whole SMS from MTN and the ID will be extracted automatically."
              : "Inama: Ushobora gukopera ubutumwa bwose bwa MTN ukabushyiramo ako kanya."}
          </small>
        </div>

        {/* Optional Screenshot */}
        <div style={{ marginBottom: "10px" }}>
          <button
            type="button"
            onClick={() => setShowScreenshotUpload((open) => !open)}
            style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "11.5px", cursor: "pointer", fontWeight: 600, padding: 0 }}
          >
            {showScreenshotUpload
              ? (lang === "en" ? "▲ Hide screenshot upload" : "▲ Hisha gufata screenshot")
              : (lang === "en" ? "Attach payment screenshot (optional)" : "Shyiraho screenshot y'ubwishyu (niba ubishaka)")}
          </button>
        </div>

        {showScreenshotUpload && (
          <label className="form-group service-fee-upload-label" style={{ marginBottom: "10px" }}>
            <span style={{ fontSize: "12px" }}>Upload receipt screenshot</span>
            <input type="file" accept="image/*" onChange={handleProofChange} />
          </label>
        )}

        {proofImage && <img className="service-fee-proof-preview" src={proofImage} alt="Payment screenshot preview" style={{ marginBottom: "10px" }} />}
        {proofError && <p className="feedback-error" role="alert" style={{ fontSize: "12px", marginBottom: "8px" }}>{proofError}</p>}
        {error && <p className="feedback-error" role="alert" style={{ fontSize: "12px", marginBottom: "8px" }}>{error}</p>}

        <button
          className="btn btn-primary btn-full"
          type="submit"
          disabled={submitting || (!reference.trim() && !proofImage)}
          style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", fontWeight: "700" }}
        >
          <span>{submitting ? "Verifying..." : (lang === "en" ? "Verify & Unlock Trip Chat Instantly" : "Emeza & Fungura Ubutumwa Ako Kanya")}</span>
        </button>
      </form>

      <p className="service-fee-policy" style={{ marginTop: "10px", fontSize: "11px", color: "var(--dark-muted)", lineHeight: 1.4 }}>
        {lang === "en"
          ? "The remaining 85% is paid directly to the driver at meetup. If the driver does not show up, contact Tugendane for assistance."
          : "85% asigaye ahabwa umushoferi muhuye. Niba umushoferi ataje, menyesha Tugendane bagufashe."}
      </p>
    </section>
  );
}

const SUPPORT_PHONE = "0784411121";

export default function TripsView({
  bookings,
  role,
  setCurrentTab,
  getShareTripMessage,
  openTripChat,
  openCall,
  lang,
  t,
  onSubmitServiceFee,
  feeSubmitError,
}) {
  return (
    <div>
      <div className="rides-section-title">
        <h2>{t.myTrips}</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--dark-muted)" }}>
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="empty-title">
            {lang === "en" ? (role === "driver" ? "No passenger bookings yet" : "No booked trips yet") : "Nta ngendo uratunganya"}
          </div>
          <p className="empty-subtitle">
            {lang === "en"
              ? (role === "driver" ? "Passenger bookings for your rides will appear here." : "Search for an empty seat and travel comfortably across Rwanda with Tugendane Rides.")
              : "Shakisha intebe isigaye maze ugende neza mu gihugu hose na Tugendane Rides."}
          </p>
          <button className="btn btn-primary" onClick={() => setCurrentTab("home")}>
            {t.home}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {bookings.map((booking) => (
            <div key={booking.id || booking.firestoreId} className="ride-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--primary)" }}>
                    {booking.from} &rarr; {booking.to}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
                    {booking.departureDate} at {booking.departureTime}
                  </div>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "700",
                    background:
                      booking.status === "Confirmed" ? "var(--success-light)" : "var(--warning-light)",
                    color: booking.status === "Confirmed" ? "var(--success)" : "var(--warning)",
                  }}
                >
                  {booking.status}
                </span>
              </div>

              <div
                style={{
                  background: "var(--light-bg)",
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "14px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "13.5px",
                  }}
                >
                  {role === "driver" ? (
                    <>
                      <div><strong>Passenger: </strong>{booking.passengerName}</div>
                      <div><strong>Seats booked: </strong>{booking.seatsBooked}</div>
                    </>
                  ) : booking.serviceFeeStatus === "verified" ? (
                    <>
                      <div><strong>Driver: </strong> {booking.driverName} ({booking.vehicle})</div>
                      <div><strong>Car Plate: </strong> {booking.plate}</div>
                    </>
                  ) : (
                    <div className="driver-info-locked">Driver contact and vehicle details are hidden until the service fee is verified.</div>
                  )}
                  {(role === "driver" || booking.serviceFeeStatus === "verified") && <div><strong>Pickup: </strong> {booking.pickupLocation}</div>}
                  <div><strong>Seats Booked: </strong> {booking.seatsBooked}</div>
                  <div>
                    <strong>Ticket to driver at meetup: </strong> {booking.subtotal?.toLocaleString() ?? booking.totalPrice?.toLocaleString()} RWF
                  </div>
                  {role === "driver" && <div><strong>Payment: </strong> {booking.paymentMethod}</div>}
                </div>
                {(role === "driver" || booking.serviceFeeStatus === "verified") && Number.isFinite(booking.pickupLatitude) && Number.isFinite(booking.pickupLongitude) && (
                  <a
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: 12 }}
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${booking.pickupLatitude}&mlon=${booking.pickupLongitude}#map=16/${booking.pickupLatitude}/${booking.pickupLongitude}`}
                  >
                    View exact pickup point
                  </a>
                )}
              </div>

              {role !== "driver" && booking.status === "Confirmed" && booking.serviceFeeStatus !== "verified" && (
                booking.serviceFeeStatus === "rejected" ? (
                  <>
                    <div className="service-fee-pending" role="alert">The transaction reference could not be verified. Check it against your receipt and submit again.</div>
                    <ServiceFeePrompt booking={{ ...booking, serviceFeeStatus: "unpaid" }} onSubmitServiceFee={onSubmitServiceFee} error={feeSubmitError} lang={lang} t={t} />
                  </>
                ) : (
                  <ServiceFeePrompt booking={booking} onSubmitServiceFee={onSubmitServiceFee} error={feeSubmitError} lang={lang} t={t} />
                )
              )}

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {/* In-app Chat */}
                {booking.status === "Confirmed" && booking.serviceFeeStatus === "verified" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => openTripChat(booking)}
                  >
                    {role === "driver" ? "Message Passenger" : "Message Driver"}
                  </button>
                )}

                {/* In-app VoIP Call */}
                {booking.status === "Confirmed" && booking.serviceFeeStatus === "verified" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-call"
                    onClick={() => openCall(booking)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "4px" }}>
                      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                    </svg>
                    {role === "driver" ? "Call Passenger" : "Call Driver"}
                  </button>
                )}

                {/* In-app Chat with Admin */}
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => openTripChat({ ...booking, isAdminChat: true, chatTarget: "admin" })}
                  style={{ fontSize: "12px" }}
                >
                  💬 {lang === "en" ? "Chat Admin" : "Vugana n'Ubuyobozi"}
                </button>

                {/* In-app VoIP Call to Admin */}
                <button
                  type="button"
                  className="btn btn-sm btn-call"
                  onClick={() => openCall(booking)}
                  style={{ fontSize: "12px" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "4px" }}>
                    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                  </svg>
                  {lang === "en" ? "Call Admin in App" : "Hamagara Ubuyobozi"}
                </button>

                {/* Call Support hotline fallback */}
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: "12px" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "4px" }}>
                    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                  </svg>
                  {lang === "en" ? "Support Hotline" : "Hotline y'Ubuyobozi"}
                </a>

                {/* Share trip details */}
                {role !== "driver" && <a
                  href={getShareTripMessage({
                    driverName: booking.driverName,
                    vehicle: booking.vehicle,
                    plate: booking.plate,
                    from: booking.from,
                    to: booking.to,
                    departureDate: booking.departureDate,
                    departureTime: booking.departureTime,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  {t.shareTripBtn}
                </a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
