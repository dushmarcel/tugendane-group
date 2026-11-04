export default function RideCard({
  ride,
  onBook,
  getWhatsAppLink,
  lang,
  t,
}) {
  return (
    <div className="ride-card">
      <div>
        {/* Driver top info */}
        <div className="ride-card-top">
          <div className="driver-mini-profile">
            <div className="driver-avatar">{ride.driverName.charAt(0)}</div>
            <div className="driver-meta">
              <span className="driver-name">
                {ride.driverName}
                {ride.isVerified && <span className="verified-icon" title={t.verifiedDriver}>✓</span>}
              </span>
              <span className="driver-rating-sub">
                {ride.driverRating ? (
                  <span className="star-text">★ {ride.driverRating}</span>
                ) : (
                  <span>{lang === "en" ? "New driver" : "Umushoferi mushya"}</span>
                )}
                {ride.driverTrips > 0 && <span>• {ride.driverTrips} {t.tripsCount}</span>}
              </span>
            </div>
          </div>

          <div className="price-tag-box">
            <div className="price-amount">{ride.price.toLocaleString()} RWF</div>
            <div className="price-sub">{t.fuelShareNote}</div>
          </div>
        </div>

        {/* Timeline (Pickup -> Dropoff) */}
        <div className="route-timeline">
          <div className="timeline-point">
            <div className="point-dot" />
            <div className="point-info">
              <div>
                <div className="point-city">{ride.from}</div>
                <div className="point-spot">{ride.pickupLocation}</div>
              </div>
              <div style={{ fontWeight: "700", color: "var(--primary)" }}>
                {ride.departureTime}
              </div>
            </div>
          </div>

          <div className="timeline-divider" />

          <div className="timeline-point">
            <div className="point-dot dest" />
            <div className="point-info">
              <div>
                <div className="point-city">{ride.to}</div>
                <div className="point-spot">{ride.dropoffLocation}</div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--dark-muted)" }}>
                {ride.departureDate}
              </div>
            </div>
          </div>
        </div>

        {/* Car Details */}
        <div className="ride-car-info">
          <span>🚘</span>
          <span>{ride.vehicle}</span>
          <span>•</span>
          <span style={{ fontWeight: "600", color: "var(--dark)" }}>{ride.plate}</span>
        </div>

        {/* Preferences & Features Badges */}
        <div className="ride-badges-row">
          <span className="badge-pill badge-seats">
            🪑 {ride.availableSeats} {t.seatsLeft}
          </span>
          {ride.preferences?.womenOnly && (
            <span className="badge-pill badge-women">👩 Women Only</span>
          )}
          {ride.preferences?.noSmoking && (
            <span className="badge-pill">🚭 No Smoking</span>
          )}
          {ride.preferences?.ac && <span className="badge-pill">❄️ AC</span>}
          {ride.preferences?.quietRide && (
            <span className="badge-pill">🤫 Quiet</span>
          )}
          {ride.preferences?.musicAllowed && (
            <span className="badge-pill">🎵 Music</span>
          )}
        </div>

        {ride.description && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--dark-muted)",
              fontStyle: "italic",
              marginBottom: "16px",
            }}
          >
            "{ride.description}"
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="ride-card-actions">
        <button className="btn btn-primary" onClick={() => onBook(ride)}>
          {t.bookSeat}
        </button>

        {ride.driverPhone && (
          <a
            href={getWhatsAppLink(ride.driverPhone, ride)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-whatsapp btn-sm"
            title="Chat with driver on WhatsApp"
          >
            💬 {t.whatsAppDriver}
          </a>
        )}

        {ride.driverPhone && (
          <a
            href={`tel:${ride.driverPhone}`}
            className="btn btn-secondary btn-sm"
            title="Call driver directly"
          >
            📞 {t.callDriver}
          </a>
        )}
      </div>
    </div>
  );
}
