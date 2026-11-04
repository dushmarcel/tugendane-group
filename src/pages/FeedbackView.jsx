import { useMemo, useState } from "react";

export default function FeedbackView({ bookings, submitDriverRating, submitGeneralFeedback, setCurrentTab }) {
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("App issue");
  const [message, setMessage] = useState("");
  const [ratingComment, setRatingComment] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const completedBookings = useMemo(() => bookings.filter((booking) => {
    if (booking.status !== "Confirmed") return false;
    const departure = new Date(`${booking.departureDate}T${booking.departureTime || "00:00"}`);
    return !Number.isNaN(departure.getTime()) && departure <= new Date();
  }), [bookings]);
  const selectedBooking = completedBookings.find((booking) => booking.firestoreId === selectedBookingId);

  async function handleRatingSubmit(event) {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    try {
      if (!selectedBooking) throw new Error("Choose a completed trip first.");
      await submitDriverRating({ booking: selectedBooking, rating, comment: ratingComment.trim() });
      setStatusMessage("Thanks. Your driver rating has been saved.");
      setRatingComment("");
    } catch (submitError) {
      setError(submitError.message || "Your rating could not be saved.");
    }
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    try {
      if (message.trim().length < 8) throw new Error("Please add a little more detail so we can understand the issue.");
      await submitGeneralFeedback({ category, message });
      setMessage("");
      setStatusMessage("Your feedback was sent. Thank you for reporting it.");
    } catch (submitError) {
      setError(submitError.message || "Your feedback could not be sent.");
    }
  }

  return (
    <div className="feedback-page">
      <div className="feedback-page-heading">
        <div>
          <span className="feedback-kicker">HELP US IMPROVE</span>
          <h1>Feedback &amp; ratings</h1>
          <p>Rate a driver after your trip or tell us about an issue.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setCurrentTab("home")}>← Back</button>
      </div>

      {error && <div className="feedback-error" role="alert">{error}</div>}
      {statusMessage && <div className="feedback-success" role="status">{statusMessage}</div>}

      <div className="feedback-card-grid">
        <section className="feedback-card">
          <h2>Rate a driver</h2>
          {completedBookings.length === 0 ? (
            <p className="feedback-muted">Completed confirmed trips will appear here after their departure time.</p>
          ) : (
            <form onSubmit={handleRatingSubmit}>
              <label className="form-group">
                <span>Completed trip</span>
                <select value={selectedBookingId} onChange={(event) => setSelectedBookingId(event.target.value)} required>
                  <option value="">Choose a trip</option>
                  {completedBookings.map((booking) => (
                    <option key={booking.firestoreId} value={booking.firestoreId}>
                      {booking.from} → {booking.to} · {booking.departureDate} · {booking.driverName || "Driver"}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="feedback-rating-picker">
                <legend>Your rating</legend>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" aria-pressed={rating === value} onClick={() => setRating(value)}>
                    {value <= rating ? "★" : "☆"}
                  </button>
                ))}
                <span>{rating} / 5</span>
              </fieldset>
              <label className="form-group">
                <span>Optional note</span>
                <textarea rows="3" maxLength="600" value={ratingComment} onChange={(event) => setRatingComment(event.target.value)} placeholder="How was the ride?" />
              </label>
              <button className="btn btn-primary btn-full" type="submit" disabled={!selectedBooking}>Save rating</button>
            </form>
          )}
        </section>

        <section className="feedback-card">
          <h2>Report an issue</h2>
          <form onSubmit={handleFeedbackSubmit}>
            <label className="form-group">
              <span>What is this about?</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>App issue</option>
                <option>Booking or payment</option>
                <option>Driver or passenger conduct</option>
                <option>Safety concern</option>
                <option>Other</option>
              </select>
            </label>
            <label className="form-group">
              <span>Details</span>
              <textarea rows="5" maxLength="2000" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe what happened and include the trip route if relevant." required />
            </label>
            <button className="btn btn-primary btn-full" type="submit">Send feedback</button>
          </form>
        </section>
      </div>
    </div>
  );
}
