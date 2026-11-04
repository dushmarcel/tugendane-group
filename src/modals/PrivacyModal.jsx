import { ADMIN_EMAIL } from "../locales/texts";

export default function PrivacyModal({ isOpen, onClose, lang }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window privacy-modal-window" style={{ overflowY: "auto", textAlign: "left" }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <span style={{ fontSize: "28px" }}>📜</span>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "800" }}>Tugendane Privacy & Data Use</h2>
            <div style={{ fontSize: "12px", color: "var(--dark-muted)" }}>Tugendane Rides • How account and trip information is used</div>
          </div>
        </div>

        <div style={{ fontSize: "13.5px", lineHeight: "1.6", color: "var(--dark)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p><strong>1. Service:</strong> Tugendane Rides helps people find pre-planned shared trips in private vehicles. It is not an on-demand taxi dispatch service.</p>
          <p><strong>2. Information:</strong> The app stores account details you provide, including your name, email, phone number, optional National ID, driver licence and vehicle details, ride listings, booking requests, and trip messages.</p>
          <p><strong>3. Sharing:</strong> Contact and pickup details may be shown to the other person on a booking so you can coordinate the trip. Do not include sensitive personal details in trip notes or chat.</p>
          <p><strong>4. Payments:</strong> After a driver accepts, riders pay Tugendane a separate 15% booking fee using MTN MoMo code 744405 and submit the transaction ID or a payment screenshot. An administrator reviews the proof before driver details and chat are unlocked. The full ticket price is paid to the driver at the meetup. Never share a mobile money PIN in chat.</p>
          <p><strong>5. Safety and location:</strong> Emergency buttons open a phone call to the selected number. WhatsApp sharing sends a message only; it does not notify emergency services or share live location.</p>
          <p><strong>6. Verification:</strong> ID and licence details entered in the app are not automatically verified. A badge must not be treated as proof unless Tugendane has completed a separate review.</p>
          <p><strong>7. Privacy requests:</strong> For access, correction, or deletion requests, email <a href={`mailto:${ADMIN_EMAIL}`}>{ADMIN_EMAIL}</a>. Account and trip records may require review before removal.</p>
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop: "20px" }} onClick={onClose}>
          {lang === "en" ? "I Understand & Agree" : "Nabyumvise kandi ndabyemeye"}
        </button>
      </div>
    </div>
  );
}
