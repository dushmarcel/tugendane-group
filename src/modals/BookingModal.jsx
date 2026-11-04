import { calculatePricingBreakdown } from "../services/rwandaRoutes";

export default function BookingModal({
  selectedRideForBooking,
  setSelectedRideForBooking,
  bookingSuccessMsg,
  bookingSeatsCount,
  setBookingSeatsCount,
  bookingPickupSpot,
  setBookingPickupSpot,
  bookingPaymentMethod,
  setBookingPaymentMethod,
  bookingNotes,
  setBookingNotes,
  handleConfirmBooking,
  t,
}) {
  if (!selectedRideForBooking) return null;

  const pricing = calculatePricingBreakdown(selectedRideForBooking.price, bookingSeatsCount);

  return (
    <div className="modal-backdrop">
      <div className="modal-window">
        <button
          className="modal-close-btn"
          onClick={() => setSelectedRideForBooking(null)}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="modal-title">{t.modalBookTitle}</div>
        <div className="modal-subtitle">
          {selectedRideForBooking.from} ➔ {selectedRideForBooking.to} ({selectedRideForBooking.departureDate} at {selectedRideForBooking.departureTime})
        </div>

        {bookingSuccessMsg ? (
          <div
            style={{
              background: "var(--success-light)",
              color: "var(--success)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            {bookingSuccessMsg}
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label>{t.selectSeats}</label>
              <select
                value={bookingSeatsCount}
                onChange={(e) => setBookingSeatsCount(Number(e.target.value))}
              >
                {Array.from({ length: selectedRideForBooking.availableSeats }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "seat" : "seats"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t.pickupSpotLabel}</label>
              <input
                type="text"
                value={bookingPickupSpot || selectedRideForBooking.pickupLocation}
                onChange={(e) => setBookingPickupSpot(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{t.paymentMethod}</label>
              <select
                value={bookingPaymentMethod}
                onChange={(e) => setBookingPaymentMethod(e.target.value)}
              >
                <option value="Cash at Pickup">Cash when you meet</option>
                <option value="MTN Mobile Money (*182#)">MTN MoMo (arrange with driver)</option>
                <option value="Airtel Money (*500#)">Airtel Money (arrange with driver)</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.notesLabel}</label>
              <input
                type="text"
                placeholder="e.g. I have one small backpack"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
              />
            </div>

            {/* Price Breakdown */}
            <div className="price-breakdown-card">
              <div className="breakdown-row">
                <span>
                  {t.seatContribution} ({bookingSeatsCount} × {pricing.pricePerSeat.toLocaleString()} RWF)
                </span>
                <span>{pricing.subtotal.toLocaleString()} RWF</span>
              </div>
              <div className="breakdown-row">
                <span>{t.platformFee}</span>
                <span>{pricing.platformFee.toLocaleString()} RWF</span>
              </div>
              <div className="breakdown-row total-row">
                <span>{t.totalPayable}</span>
                <span style={{ color: "var(--primary)" }}>{pricing.passengerTotal.toLocaleString()} RWF</span>
              </div>
              <div className="breakdown-row driver-net-row">
                <span>{t.driverEarnings}</span>
                <span>{pricing.subtotal.toLocaleString()} RWF</span>
              </div>
            </div>

            <p className="booking-payment-note">
              The 10% Tugendane service fee is due after the driver accepts. Pay it to MTN MoMo code <strong>744405</strong>; driver details and chat open after an admin verifies your transaction reference. Pay the full ticket price to the driver when you meet.
            </p>

            <button className="btn btn-primary btn-full" onClick={handleConfirmBooking}>
              {t.confirmBookingBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
