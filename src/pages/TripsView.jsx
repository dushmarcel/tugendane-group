export default function TripsView({
  bookings,
  role,
  setCurrentTab,
  getShareTripMessage,
  openTripChat,
  lang,
  t,
}) {
  return (
    <div>
      <div className="rides-section-title">
        <h2>🧳 {t.myTrips}</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">🎒</div>
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
                    {booking.from} ➔ {booking.to}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
                    📅 {booking.departureDate} at {booking.departureTime}
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
                  ) : (
                    <>
                      <div><strong>Driver: </strong> {booking.driverName} ({booking.vehicle})</div>
                      <div><strong>Car Plate: </strong> {booking.plate}</div>
                    </>
                  )}
                  <div>
                    <strong>Pickup: </strong> {booking.pickupLocation}
                  </div>
                  <div>
                    <strong>Seats Booked: </strong> {booking.seatsBooked}
                  </div>
                  <div>
                    <strong>Total Contribution: </strong> {booking.totalPrice?.toLocaleString()} RWF
                  </div>
                  <div>
                    <strong>Payment: </strong> {booking.paymentMethod}
                  </div>
                </div>
                {Number.isFinite(booking.pickupLatitude) && Number.isFinite(booking.pickupLongitude) && (
                  <a
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: 12 }}
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${booking.pickupLatitude}&mlon=${booking.pickupLongitude}#map=16/${booking.pickupLatitude}/${booking.pickupLongitude}`}
                  >
                    📍 View exact pickup point
                  </a>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                  📤 {t.shareTripBtn}
                </a>}

                {role !== "driver" && booking.driverPhone && (
                  <a
                    href={`https://wa.me/${(booking.driverPhone || "").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-whatsapp"
                  >
                    💬 WhatsApp Driver
                  </a>
                )}
                {role === "driver" && booking.passengerPhone && (
                  <a
                    href={`https://wa.me/${booking.passengerPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-whatsapp"
                  >
                    💬 WhatsApp Passenger
                  </a>
                )}
                {booking.status === "Confirmed" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => openTripChat(booking)}
                  >
                    💬 {role === "driver" ? "Message passenger" : "Message driver"}
                  </button>
                )}

                {role !== "driver" && booking.driverPhone && (
                  <a href={`tel:${booking.driverPhone}`} className="btn btn-sm btn-call">
                    📞 Call Driver
                  </a>
                )}
                {role === "driver" && booking.passengerPhone && (
                  <a href={`tel:${booking.passengerPhone}`} className="btn btn-sm btn-call">
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
