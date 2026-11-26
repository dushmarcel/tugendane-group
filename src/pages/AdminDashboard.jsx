import { useEffect, useState } from "react";
import { ADMIN_EMAIL } from "../locales/texts";
import { calculateServiceFee } from "../services/rwandaRoutes";

export default function AdminDashboard({
  adminUsers,
  adminUsersLoading,
  adminError,
  adminSelectedUser,
  setAdminSelectedUser,
  adminUserHistory,
  setAdminUserHistory,
  adminHistoryLoading,
  adminFeeBookings,
  adminFeedbackItems,
  adminAllBookings = [],
  confirmRideBooking,
  declineRideBooking,
  openTripChat,
  openCall,
  toggleAdminUserActive,
  openAdminUserHistory,
  reviewServiceFee,
  closeFeedbackItem,
  handleLogout,
}) {
  const [bookingFilter, setBookingFilter] = useState("all");

  const pendingBookings = adminAllBookings.filter((b) => b.status === "Pending");
  const confirmedBookings = adminAllBookings.filter((b) => b.status === "Confirmed");
  const displayedBookings = adminAllBookings.filter((b) => {
    if (bookingFilter === "pending") return b.status === "Pending";
    if (bookingFilter === "confirmed") return b.status === "Confirmed";
    return true;
  });

  useEffect(() => {
    if (!adminSelectedUser) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [adminSelectedUser]);

  return (
    <div className="admin-console">
      <header className="admin-console-header">
        <div className="admin-console-brand">
          <img src="/tugendane-car.png" alt="Tugendane" />
          <div>
            <strong>TUGENDANE RIDES</strong>
            <span>Administrator portal</span>
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="admin-console-main">
        <section className="admin-welcome-card">
          <div>
            <span className="admin-kicker">CONTROL CENTRE</span>
            <h1>People & account access</h1>
            <p>Review member accounts, manage access, and inspect trip history.</p>
          </div>
          <div className="admin-total-pill">{adminUsers.length} members</div>
        </section>

        {adminError && (
          <div className="admin-error" role="alert">
            {adminError}
            <p>
              Publish the latest firestore.rules file. It must authorize this administrator account’s
              Firebase UID.
            </p>
          </div>
        )}

        {/* RIDE BOOKINGS & CONFIRMATION SECTION */}
        <section className="admin-table-card">
          <div className="admin-section-heading">
            <div>
              <h2>Ride Bookings & Confirmation</h2>
              <p>Review passenger seat requests, confirm rides smoothly, call or text drivers and passengers.</p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {pendingBookings.length > 0 && (
                <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "800" }}>
                  {pendingBookings.length} Need Confirmation
                </span>
              )}
              <div className="admin-total-pill">{adminAllBookings.length} bookings</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn btn-sm ${bookingFilter === "all" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setBookingFilter("all")}
            >
              All ({adminAllBookings.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${bookingFilter === "pending" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setBookingFilter("pending")}
              style={bookingFilter === "pending" ? { background: "#b45309", borderColor: "#b45309" } : {}}
            >
              Pending Approval ({pendingBookings.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${bookingFilter === "confirmed" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setBookingFilter("confirmed")}
            >
              Confirmed ({confirmedBookings.length})
            </button>
          </div>

          {displayedBookings.length === 0 ? (
            <div className="admin-empty">No ride bookings found in this view.</div>
          ) : (
            <div className="admin-review-list">
              {displayedBookings.map((b) => (
                <article
                  className="admin-review-row"
                  key={b.firestoreId || b.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "16px",
                    borderLeft: b.status === "Pending" ? "4px solid #f59e0b" : "4px solid #10b981",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "16px", color: "var(--dark)" }}>
                        {b.from} → {b.to}
                      </strong>
                      <div style={{ fontSize: "13px", color: "var(--dark-muted)", marginTop: "2px" }}>
                        📅 {b.departureDate} at {b.departureTime} · 💺 {b.seatsBooked} seat(s) · 💰 {Number(b.subtotal || b.totalPrice || 0).toLocaleString()} RWF
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: b.status === "Confirmed" ? "#d1fae5" : "#fef3c7",
                        color: b.status === "Confirmed" ? "#065f46" : "#b45309",
                      }}
                    >
                      {b.status === "Confirmed" ? "✓ Confirmed" : "⏳ Pending Confirmation"}
                    </span>
                  </div>

                  <div style={{ background: "var(--light-bg, #f8fafc)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--primary)" }}>Passenger:</div>
                      <div>{b.passengerName || "Passenger"}</div>
                      <div style={{ color: "var(--dark-muted)", fontSize: "12px" }}>📞 {b.passengerPhone || "No phone listed"}</div>
                      <div style={{ color: "var(--secondary)", fontSize: "12px", marginTop: "2px" }}>📍 Pickup: {b.pickupLocation}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--primary)" }}>Driver:</div>
                      <div>{b.driverName || "Driver"}</div>
                      <div style={{ color: "var(--dark-muted)", fontSize: "12px" }}>📞 {b.driverPhone || "No phone listed"}</div>
                      <div style={{ color: "var(--dark-muted)", fontSize: "12px", marginTop: "2px" }}>🚗 {b.vehicle} ({b.plate})</div>
                    </div>
                  </div>

                  {b.notes && (
                    <div style={{ fontSize: "12.5px", fontStyle: "italic", color: "var(--dark-muted)" }}>
                      Note: "{b.notes}"
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                    {b.status === "Pending" && confirmRideBooking && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => confirmRideBooking(b)}
                        style={{ background: "#059669", borderColor: "#059669", fontWeight: "700" }}
                      >
                        ✓ Confirm Ride
                      </button>
                    )}

                    {b.status === "Pending" && declineRideBooking && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => declineRideBooking(b)}
                      >
                        ✕ Decline
                      </button>
                    )}

                    {openCall && (
                      <button
                        type="button"
                        className="btn btn-sm btn-call"
                        onClick={() => openCall(b)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: "4px" }}>
                          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                        </svg>
                        Call in App
                      </button>
                    )}

                    {openTripChat && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openTripChat(b)}
                      >
                        💬 Text in App
                      </button>
                    )}

                    {b.passengerPhone && (
                      <a href={`tel:${b.passengerPhone}`} className="btn btn-sm btn-secondary" style={{ fontSize: "12px" }}>
                        Dial Passenger
                      </a>
                    )}

                    {b.driverPhone && (
                      <a href={`tel:${b.driverPhone}`} className="btn btn-sm btn-secondary" style={{ fontSize: "12px" }}>
                        Dial Driver
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-table-card">
          <div className="admin-section-heading">
            <div>
              <h2>MTN service fee audit & checks</h2>
              <p>Audit passenger MTN transaction IDs against your MTN MoMo statement. Flag fraudulent IDs to re-lock trips.</p>
            </div>
            <div className="admin-total-pill">{adminFeeBookings.length} logged</div>
          </div>
          {adminFeeBookings.length === 0 ? (
            <div className="admin-empty">No service fee references recorded yet.</div>
          ) : (
            <div className="admin-review-list">
              {adminFeeBookings.map((booking) => (
                <article className="admin-review-row" key={booking.firestoreId}>
                  <div>
                    <strong>
                      {booking.passengerName || "Passenger"}
                      {booking.passengerPhone ? ` (${booking.passengerPhone})` : ""}
                      {booking.driverPhone ? ` | Driver: ${booking.driverPhone}` : ""} · {booking.from} → {booking.to}
                    </strong>
                    <span>{calculateServiceFee(booking.subtotal || booking.totalPrice).toLocaleString()} RWF · MTN TxID: <b style={{ color: "var(--primary)" }}>{booking.serviceFeeReference || "Not provided"}</b></span>
                    {booking.serviceFeeProofImage && (
                      <a className="admin-proof-link" href={booking.serviceFeeProofImage} target="_blank" rel="noreferrer">
                        <img className="admin-proof-thumbnail" src={booking.serviceFeeProofImage} alt="Passenger MTN payment screenshot" />
                        View payment screenshot
                      </a>
                    )}
                  </div>
                  <div className="admin-review-actions">
                    {booking.serviceFeeStatus === "verified" ? (
                      <>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#065f46", background: "#d1fae5", padding: "4px 8px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Active / Verified
                        </span>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => reviewServiceFee(booking, false)}>
                          Flag Fake ID
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => reviewServiceFee(booking, true)}>Verify</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => reviewServiceFee(booking, false)}>Reject</button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-table-card">
          <div className="admin-section-heading">
            <div>
              <h2>Open feedback reports</h2>
              <p>Issues submitted by signed-in members.</p>
            </div>
            <div className="admin-total-pill">{adminFeedbackItems.length} open</div>
          </div>
          {adminFeedbackItems.length === 0 ? (
            <div className="admin-empty">No open feedback reports.</div>
          ) : (
            <div className="admin-review-list">
              {adminFeedbackItems.map((item) => (
                <article className="admin-review-row" key={item.id}>
                  <div>
                    <strong>{item.category} · {item.senderName}</strong>
                    <span>{item.message}</span>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => closeFeedbackItem(item.id)}>Mark resolved</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-table-card">
          <div className="admin-section-heading">
            <div>
              <h2>Member accounts</h2>
              <p>Deactivated members cannot publish or book rides.</p>
            </div>
          </div>

          {adminUsersLoading ? (
            <div className="admin-empty">Loading member accounts…</div>
          ) : adminError ? null : adminUsers.length === 0 ? (
            <div className="admin-empty">
              No member profiles are available yet. Accounts appear here after their profile is saved
              in Tugendane Rides.
            </div>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((member) => (
                    <tr key={member.uid}>
                      <td data-label="Username">
                        <div className="admin-member-name">
                          {member.fullName || member.email || "Unnamed member"}
                        </div>
                        <small>{member.email || member.uid}</small>
                      </td>
                      <td data-label="Role">
                        <span
                          className={`admin-role-pill admin-role-${
                            member.email?.toLowerCase() === ADMIN_EMAIL
                              ? "admin"
                              : member.role === "driver"
                              ? "driver"
                              : "passenger"
                          }`}
                        >
                          {member.email?.toLowerCase() === ADMIN_EMAIL
                            ? "Administrator"
                            : member.role === "driver"
                            ? "Driver"
                            : "Passenger"}
                        </span>
                      </td>
                      <td data-label="Active">
                        <button
                          type="button"
                          className={`admin-active-button ${
                            member.active ? "is-active" : "is-inactive"
                          }`}
                          disabled={member.email?.toLowerCase() === ADMIN_EMAIL}
                          title={
                            member.email?.toLowerCase() === ADMIN_EMAIL
                              ? "The administrator account cannot deactivate itself here."
                              : undefined
                          }
                          onClick={() => toggleAdminUserActive(member)}
                        >
                          {member.email?.toLowerCase() === ADMIN_EMAIL
                            ? "Admin protected"
                            : member.active
                            ? "Active · turn off"
                            : "Inactive · turn on"}
                        </button>
                      </td>
                      <td data-label="Actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => openAdminUserHistory(member)}
                        >
                          View history
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {adminSelectedUser && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setAdminSelectedUser(null);
            setAdminUserHistory(null);
          }}
        >
          <section
            className="modal-window admin-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-history-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              type="button"
              aria-label="Close history"
              onClick={() => {
                setAdminSelectedUser(null);
                setAdminUserHistory(null);
              }}
            >
              ×
            </button>
            <span className="admin-kicker">MEMBER ACTIVITY</span>
            <h2 id="admin-history-title">
              {adminSelectedUser.fullName || adminSelectedUser.email}
            </h2>

            {adminHistoryLoading ? (
              <p>Loading trip history…</p>
            ) : (
              adminUserHistory && (
                <>
                  <div className="admin-history-stats">
                    <div>
                      <strong>{adminUserHistory.rides.length}</strong>
                      <span>Rides posted</span>
                    </div>
                    <div>
                      <strong>{adminUserHistory.bookings.length}</strong>
                      <span>Bookings</span>
                    </div>
                    <div>
                      <strong>{adminUserHistory.estimatedEarnings.toLocaleString()} RWF</strong>
                      <span>Estimated driver share from approved bookings</span>
                    </div>
                    <div>
                      <strong>{adminUserHistory.rating ?? "—"}</strong>
                      <span>{adminUserHistory.rating == null ? "No rating recorded" : "Rating"}</span>
                    </div>
                  </div>
                  <h3>Recent trip activity</h3>
                  {adminUserHistory.bookings.length ? (
                    <ul className="admin-activity-list">
                      {adminUserHistory.bookings.slice(0, 8).map((booking) => (
                        <li key={booking.id}>
                          <strong>
                            {booking.from} → {booking.to}
                          </strong>
                          <span>
                            {booking.status} · {booking.departureDate || "Date not recorded"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No booking history recorded.</p>
                  )}
                </>
              )
            )}
          </section>
        </div>
      )}
    </div>
  );
}
