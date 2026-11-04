import { ADMIN_EMAIL } from "../locales/texts";

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
  toggleAdminUserActive,
  openAdminUserHistory,
  reviewServiceFee,
  closeFeedbackItem,
  handleLogout,
}) {
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

        <section className="admin-table-card">
          <div className="admin-section-heading">
            <div>
              <h2>MTN service fee checks</h2>
              <p>Check the transaction reference in MTN records before confirming payment.</p>
            </div>
            <div className="admin-total-pill">{adminFeeBookings.length} waiting</div>
          </div>
          {adminFeeBookings.length === 0 ? (
            <div className="admin-empty">No service fee references are waiting for review.</div>
          ) : (
            <div className="admin-review-list">
              {adminFeeBookings.map((booking) => (
                <article className="admin-review-row" key={booking.firestoreId}>
                  <div>
                    <strong>{booking.passengerName || "Passenger"} · {booking.from} → {booking.to}</strong>
                    <span>{(booking.platformFee || Math.round(Number(booking.subtotal || 0) * .1)).toLocaleString()} RWF · MTN ref: <b>{booking.serviceFeeReference}</b></span>
                  </div>
                  <div className="admin-review-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => reviewServiceFee(booking, true)}>Verify payment</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => reviewServiceFee(booking, false)}>Reject reference</button>
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
