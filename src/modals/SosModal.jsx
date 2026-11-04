export default function SosModal({ isOpen, onClose, t }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window sos-card">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="sos-icon">🚨</div>
        <div className="modal-title">{t.sosTitle}</div>
        <p className="modal-subtitle">{t.sosSubtitle}</p>

        <div className="sos-call-buttons">
          <a href="tel:112" className="sos-call-btn sos-police">
            <span>👮 {t.emergencyPolice}</span>
            <span>Call 112 ➔</span>
          </a>

          <a href="tel:111" className="sos-call-btn sos-ambulance">
            <span>🚑 {t.emergencyAmbulance}</span>
            <span>Call 111 ➔</span>
          </a>

          <a href="tel:113" className="sos-call-btn" style={{ background: "#0284c7" }}>
            <span>🚦 {t.emergencyTraffic}</span>
            <span>Call 113 ➔</span>
          </a>
        </div>

        <div style={{ background: "var(--light-bg)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "left", fontSize: "13px", color: "var(--dark-muted)", marginBottom: "16px" }}>
          <strong>Trip Safety Guide:</strong>
          <p style={{ marginTop: "4px" }}>
            Match the plate and vehicle to the trip listing before entering. Send the trip details to someone you trust.
          </p>
          <p style={{ marginTop: "8px" }}>{t.shareTripText}</p>
        </div>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            "I need help. I am using Tugendane Rides. Please call me. This WhatsApp message does not contact emergency services or share my live location."
          )}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-whatsapp btn-full"
        >
          📤 {t.shareTripBtn}
        </a>
      </div>
    </div>
  );
}
