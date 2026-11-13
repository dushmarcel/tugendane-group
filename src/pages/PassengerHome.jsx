import { RWANDA_CITIES, POPULAR_ROUTES } from "../services/rwandaRoutes";
import RideCard from "../components/RideCard";
import RwandaRouteMap from "../components/RwandaRouteMap";

function isUpcoming(departureDate, departureTime = "23:59") {
  if (!departureDate) return true;
  try {
    const dt = new Date(`${departureDate}T${departureTime || "00:00"}`);
    return Number.isNaN(dt.getTime()) ? true : dt.getTime() >= Date.now();
  } catch {
    return true;
  }
}

export default function PassengerHome({
  fromCity,
  setFromCity,
  toCity,
  setToCity,
  searchDate,
  setSearchDate,
  searchSeats,
  setSearchSeats,
  activePreference,
  setActivePreference,
  rides,
  filteredRides,
  loadingRides,
  setSelectedRideForBooking,
  setBookingSeatsCount,
  getWhatsAppLink,
  handleSelectRouteShortcut,
  lang,
  t,
}) {
  return (
    <>
      {/* SEARCH CARD */}
      <section className="search-card">
        <div className="search-header">
          <div className="search-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
            <span>{t.whereGoing}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
            {rides.filter((r) => r.status === "active" && isUpcoming(r.departureDate, r.departureTime)).length}{" "}
            {lang === "en" ? "available rides across Rwanda" : "ingendo ziboneka mu Rwanda"}
          </div>
        </div>

        <div className="search-grid">
          <div className="form-group">
            <label>{t.fromCity}</label>
            <select value={fromCity} onChange={(e) => setFromCity(e.target.value)}>
              {RWANDA_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t.toCity}</label>
            <select value={toCity} onChange={(e) => setToCity(e.target.value)}>
              {RWANDA_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t.travelDate}</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{t.seatsNeeded}</label>
            <input
              type="number"
              min="1"
              max="6"
              value={searchSeats}
              onChange={(e) => setSearchSeats(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Ride Preferences Filter Pills */}
        <div className="preference-filters">
          <span className="filter-label">{t.filterLabel}</span>
          <button
            className={`pref-chip ${activePreference === null ? "active" : ""}`}
            onClick={() => setActivePreference(null)}
          >
            {t.allPreferences}
          </button>
          <button
            className={`pref-chip ${activePreference === "womenOnly" ? "active" : ""}`}
            onClick={() => setActivePreference(activePreference === "womenOnly" ? null : "womenOnly")}
          >
            {t.prefWomenOnly}
          </button>
          <button
            className={`pref-chip ${activePreference === "noSmoking" ? "active" : ""}`}
            onClick={() => setActivePreference(activePreference === "noSmoking" ? null : "noSmoking")}
          >
            {t.prefNoSmoking}
          </button>
          <button
            className={`pref-chip ${activePreference === "ac" ? "active" : ""}`}
            onClick={() => setActivePreference(activePreference === "ac" ? null : "ac")}
          >
            {t.prefAC}
          </button>
          <button
            className={`pref-chip ${activePreference === "quietRide" ? "active" : ""}`}
            onClick={() => setActivePreference(activePreference === "quietRide" ? null : "quietRide")}
          >
            {t.prefQuiet}
          </button>
        </div>
      </section>

      {/* INTERACTIVE ROUTE MAP */}
      <RwandaRouteMap
        fromCity={fromCity}
        toCity={toCity}
        onSelectRoute={(from, to) => {
          setFromCity(from);
          setToCity(to);
        }}
        lang={lang}
      />

      {/* FREQUENT INTERCITY SHORTCUTS */}
      <div style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "700", color: "var(--dark-muted)" }}>
        {t.frequentRoutes}:
      </div>
      <div className="quick-routes-row">
        {POPULAR_ROUTES.map((route, i) => (
          <button
            key={i}
            className="quick-route-btn"
            onClick={() => handleSelectRouteShortcut(route)}
          >
            <span>{route.from}</span>
            <span className="quick-route-arrow">&rarr;</span>
            <span>{route.to}</span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--dark-muted)",
                background: "var(--light-bg)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {route.avgDuration}
            </span>
          </button>
        ))}
      </div>

      {/* RIDES LIST */}
      <div className="rides-section-title">
        <h2>{t.availableRidesTitle}</h2>
        <span className="rides-count-badge">
          {filteredRides.length} {lang === "en" ? "Found" : "Zibonetse"}
        </span>
      </div>

      {loadingRides ? (
        <div className="empty-box">
          <div className="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 2s linear infinite" }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="empty-title">
            {lang === "en" ? "Finding available rides…" : "Turashaka ingendo zihari…"}
          </div>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--dark-muted)" }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="empty-title">{t.noRidesFound}</div>
          <p className="empty-subtitle">{t.noRidesTip}</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFromCity("");
              setToCity("");
              setSearchDate("");
              setActivePreference(null);
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="rides-list-grid">
          {filteredRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onBook={(r) => {
                setSelectedRideForBooking(r);
                setBookingSeatsCount(1);
              }}
              getWhatsAppLink={getWhatsAppLink}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}
    </>
  );
}
