import { RWANDA_CITIES, getSuggestedPrice } from "../services/rwandaRoutes";

export default function DriverDashboard({
  rides,
  bookings,
  userProfile,
  driverPostForm,
  setDriverPostForm,
  updatePostRoute,
  pinCurrentPickup,
  handlePublishRide,
  handleBookingStatusUpdate,
  openTripChat,
  lang,
  t,
}) {
  return (
    <div>
      {/* Stat Cards */}
      <div className="driver-stat-grid">
        <div className="driver-stat-card">
          <div className="stat-num">
            {rides.filter((r) => r.driverName === userProfile?.fullName).length}
          </div>
          <div className="stat-desc">{t.upcomingTrips}</div>
        </div>

        <div className="driver-stat-card">
          <div className="stat-num">{bookings.length}</div>
          <div className="stat-desc">{t.passengerRequests}</div>
        </div>

        <div className="driver-stat-card">
          <div className="stat-num">
            {(bookings.reduce((sum, b) => sum + (b.subtotal || 0), 0) * 0.95).toLocaleString()} RWF
          </div>
          <div className="stat-desc">{t.driverEarnings} (Net Fuel Recovery)</div>
        </div>
      </div>

      {/* POST A RIDE FORM */}
      <div className="search-card" style={{ marginBottom: "32px" }}>
        <div className="search-header">
          <div className="search-title">
            <span>🚗</span>
            <span>{t.postFormTitle}</span>
          </div>
          <span className="role-badge">Tugendane Driver</span>
        </div>

        <form onSubmit={handlePublishRide}>
          <div className="form-row">
            <div className="form-group">
              <label>{t.fromCity}</label>
              <select
                value={driverPostForm.from}
                onChange={(e) => updatePostRoute("from", e.target.value)}
              >
                {RWANDA_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t.toCity}</label>
              <select
                value={driverPostForm.to}
                onChange={(e) => updatePostRoute("to", e.target.value)}
              >
                {RWANDA_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.departureSpotLabel}</label>
              <input
                type="text"
                placeholder="e.g. University of Rwanda Huye Main Gate"
                value={driverPostForm.pickupLocation}
                onChange={(e) =>
                  setDriverPostForm({ ...driverPostForm, pickupLocation: e.target.value })
                }
              />
              <button
                className="btn btn-sm btn-secondary"
                type="button"
                style={{ marginTop: 8 }}
                onClick={pinCurrentPickup}
              >
                📍 Use my current location as the exact pickup point
              </button>
              {Number.isFinite(driverPostForm.pickupLatitude) &&
                Number.isFinite(driverPostForm.pickupLongitude) && (
                  <div style={{ marginTop: 10 }}>
                    <iframe
                      title="Pinned driver pickup point map"
                      width="100%"
                      height="180"
                      style={{ border: "1px solid var(--border)", borderRadius: 12 }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${driverPostForm.pickupLongitude - 0.006}%2C${driverPostForm.pickupLatitude - 0.004}%2C${driverPostForm.pickupLongitude + 0.006}%2C${driverPostForm.pickupLatitude + 0.004}&layer=mapnik&marker=${driverPostForm.pickupLatitude}%2C${driverPostForm.pickupLongitude}`}
                    />
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${driverPostForm.pickupLatitude}&mlon=${driverPostForm.pickupLongitude}#map=16/${driverPostForm.pickupLatitude}/${driverPostForm.pickupLongitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open pinned point in map
                    </a>
                  </div>
                )}
            </div>

            <div className="form-group">
              <label>{t.dropoffSpotLabel}</label>
              <input
                type="text"
                placeholder="e.g. Nyabugogo or Kigali Downtown"
                value={driverPostForm.dropoffLocation}
                onChange={(e) =>
                  setDriverPostForm({ ...driverPostForm, dropoffLocation: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.travelDate}</label>
              <input
                type="date"
                value={driverPostForm.departureDate}
                onChange={(e) =>
                  setDriverPostForm({ ...driverPostForm, departureDate: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>{t.departureTime}</label>
              <input
                type="time"
                value={driverPostForm.departureTime}
                onChange={(e) =>
                  setDriverPostForm({ ...driverPostForm, departureTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.seatsAvailable}</label>
              <input
                type="number"
                min="1"
                max="6"
                value={driverPostForm.availableSeats}
                onChange={(e) =>
                  setDriverPostForm({
                    ...driverPostForm,
                    availableSeats: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>{t.seatPriceLabel}</label>
              <input
                type="number"
                step="500"
                value={driverPostForm.price}
                onChange={(e) =>
                  setDriverPostForm({ ...driverPostForm, price: Number(e.target.value) })
                }
              />
              <div className="suggested-price-notice">
                <span>💡</span>
                <span>
                  {t.suggestedPriceLabel}{" "}
                  <strong>
                    {getSuggestedPrice(driverPostForm.from, driverPostForm.to).toLocaleString()} RWF
                  </strong>
                  . {t.fairPriceExplainer}
                </span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.carModelLabel}</label>
              <input
                type="text"
                placeholder="e.g. Toyota RAV4 (Silver)"
                value={driverPostForm.vehicle}
                onChange={(e) =>
                  setDriverPostForm({ ...driverPostForm, vehicle: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>{t.carPlateLabel}</label>
              <input
                type="text"
                placeholder="e.g. RAF 782 C"
                value={driverPostForm.plate}
                onChange={(e) =>
                  setDriverPostForm({ ...driverPostForm, plate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Driver Preferences */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                fontSize: "13.5px",
                fontWeight: "700",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {lang === "en" ? "Ride Preferences:" : "Ibyo wemerera mu modoka:"}
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "13.5px",
                }}
              >
                <input
                  type="checkbox"
                  checked={driverPostForm.preferences.noSmoking}
                  onChange={(e) =>
                    setDriverPostForm({
                      ...driverPostForm,
                      preferences: { ...driverPostForm.preferences, noSmoking: e.target.checked },
                    })
                  }
                />
                🚭 No Smoking
              </label>

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "13.5px",
                }}
              >
                <input
                  type="checkbox"
                  checked={driverPostForm.preferences.womenOnly}
                  onChange={(e) =>
                    setDriverPostForm({
                      ...driverPostForm,
                      preferences: { ...driverPostForm.preferences, womenOnly: e.target.checked },
                    })
                  }
                />
                👩 Women Only
              </label>

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "13.5px",
                }}
              >
                <input
                  type="checkbox"
                  checked={driverPostForm.preferences.ac}
                  onChange={(e) =>
                    setDriverPostForm({
                      ...driverPostForm,
                      preferences: { ...driverPostForm.preferences, ac: e.target.checked },
                    })
                  }
                />
                ❄️ AC Available
              </label>

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "13.5px",
                }}
              >
                <input
                  type="checkbox"
                  checked={driverPostForm.preferences.quietRide}
                  onChange={(e) =>
                    setDriverPostForm({
                      ...driverPostForm,
                      preferences: { ...driverPostForm.preferences, quietRide: e.target.checked },
                    })
                  }
                />
                🤫 Quiet Trip
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>{t.rideDescription}</label>
            <textarea
              rows={2}
              placeholder="e.g. Plenty of space for bags, safe driving, leaving on time."
              value={driverPostForm.description}
              onChange={(e) =>
                setDriverPostForm({ ...driverPostForm, description: e.target.value })
              }
            />
          </div>

          <div
            style={{
              background: "var(--light-bg)",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              marginBottom: "16px",
              fontSize: "13px",
              color: "var(--dark-muted)",
            }}
          >
            💰 <strong>Earnings Transparency:</strong> If you take 3 passengers at{" "}
            {driverPostForm.price.toLocaleString()} RWF ={" "}
            {(driverPostForm.price * 3).toLocaleString()} RWF total. You receive{" "}
            {Math.round(driverPostForm.price * 3 * 0.95).toLocaleString()} RWF for fuel. Tugendane platform fee is only 5% ({Math.round(driverPostForm.price * 3 * 0.05).toLocaleString()} RWF).
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            🚀 {t.publishRideBtn}
          </button>
        </form>
      </div>

      {/* PASSENGER REQUESTS LIST */}
      <div className="rides-section-title">
        <h2>📥 {t.passengerRequests}</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">📭</div>
          <div className="empty-title">{t.noRequests}</div>
          <p className="empty-subtitle">
            {lang === "en"
              ? "When passengers book your empty seats, their requests will appear here."
              : "Igihe abagenzi bafashe intebe zawe, ubutumwa buzaboneka hano."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {bookings.map((booking) => (
            <div key={booking.id || booking.firestoreId} className="ride-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "16px" }}>{booking.passengerName}</strong>
                  <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
                    Route: {booking.from} ➔ {booking.to} • {booking.seatsBooked} seat(s)
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--secondary)", fontWeight: "600" }}>
                    Pickup: {booking.pickupLocation}
                  </div>
                  {Number.isFinite(booking.pickupLatitude) &&
                    Number.isFinite(booking.pickupLongitude) && (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.openstreetmap.org/?mlat=${booking.pickupLatitude}&mlon=${booking.pickupLongitude}#map=16/${booking.pickupLatitude}/${booking.pickupLongitude}`}
                      >
                        📍 Open pickup point
                      </a>
                    )}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "17px", fontWeight: "800", color: "var(--primary)" }}>
                    {booking.totalPrice?.toLocaleString()} RWF
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background:
                        booking.status === "Confirmed" ? "var(--success-light)" : "var(--warning-light)",
                      color: booking.status === "Confirmed" ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                {booking.status === "Pending" && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      handleBookingStatusUpdate(booking.firestoreId || booking.id, "Confirmed")
                    }
                  >
                    ✓ {t.accept}
                  </button>
                )}
                {booking.status === "Confirmed" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => openTripChat(booking)}
                  >
                    💬 Message passenger
                  </button>
                )}
                {booking.passengerPhone && (
                  <a
                    href={`https://wa.me/${(booking.passengerPhone || "").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-whatsapp"
                  >
                    💬 WhatsApp Passenger
                  </a>
                )}
                {booking.passengerPhone && (
                  <a href={`tel:${booking.passengerPhone}`} className="btn btn-sm btn-secondary">
                    📞 Call Passenger
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
