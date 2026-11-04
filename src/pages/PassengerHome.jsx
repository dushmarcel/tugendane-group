import { RWANDA_CITIES, POPULAR_ROUTES } from "../services/rwandaRoutes";
import RideCard from "../components/RideCard";
import RwandaRouteMap from "../components/RwandaRouteMap";

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
            <span>🚗</span>
            <span>{t.whereGoing}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
            {rides.filter((r) => r.status === "active").length}{" "}
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
            <span className="quick-route-arrow">➔</span>
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
          <div className="empty-icon">⏳</div>
          <div className="empty-title">
            {lang === "en" ? "Finding available rides…" : "Turashaka ingendo zihari…"}
          </div>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">🚗</div>
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
