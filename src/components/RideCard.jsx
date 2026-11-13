export default function RideCard({
  ride,
  onBook,
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
                {ride.isVerified && (
                  <span className="verified-icon" title={t.verifiedDriver}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-1px' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </span>
              <span className="driver-rating-sub">
                {ride.driverRating ? (
                  <span className="star-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '3px' }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {ride.driverRating}
                  </span>
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <span>{ride.vehicle}</span>
          <span>•</span>
          <span style={{ fontWeight: "600", color: "var(--dark)" }}>{ride.plate}</span>
        </div>

        {/* Preferences & Features Badges */}
        <div className="ride-badges-row">
          <span className="badge-pill badge-seats">
            {ride.availableSeats} {t.seatsLeft}
          </span>
          {ride.preferences?.womenOnly && (
            <span className="badge-pill badge-women">Women Only</span>
          )}
          {ride.preferences?.noSmoking && (
            <span className="badge-pill">No Smoking</span>
          )}
          {ride.preferences?.ac && <span className="badge-pill">AC</span>}
          {ride.preferences?.quietRide && (
            <span className="badge-pill">Quiet</span>
          )}
          {ride.preferences?.musicAllowed && (
            <span className="badge-pill">Music</span>
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
      </div>
    </div>
  );
}
