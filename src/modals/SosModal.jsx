export default function SosModal({ isOpen, onClose, t }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window sos-card">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className="sos-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="modal-title">{t.sosTitle}</div>
        <p className="modal-subtitle">{t.sosSubtitle}</p>

        <div className="sos-call-buttons">
          <a href="tel:112" className="sos-call-btn sos-police">
            <span>{t.emergencyPolice}</span>
            <span>Call 112 &rarr;</span>
          </a>

          <a href="tel:111" className="sos-call-btn sos-ambulance">
            <span>{t.emergencyAmbulance}</span>
            <span>Call 111 &rarr;</span>
          </a>

          <a href="tel:113" className="sos-call-btn" style={{ background: "var(--primary)" }}>
            <span>{t.emergencyTraffic}</span>
            <span>Call 113 &rarr;</span>
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
          {t.shareTripBtn}
        </a>
      </div>
    </div>
  );
}
