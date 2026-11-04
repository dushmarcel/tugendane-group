import { useState } from "react";
import { RWANDA_CITY_COORDINATES } from "../services/rwandaRoutes";

// Bounding box for Rwanda geographical projection
// Lat: -1.04 to -2.85, Lng: 28.85 to 30.90
const MIN_LAT = -2.85;
const MAX_LAT = -1.04;
const MIN_LNG = 28.85;
const MAX_LNG = 30.90;

const WIDTH = 480;
const HEIGHT = 400;

function project(lat, lng) {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * (WIDTH - 60) + 30;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (HEIGHT - 60) + 30;
  return { x: Math.round(x), y: Math.round(y) };
}

// Major Rwanda National Highways connecting hubs
const HIGHWAY_CORRIDORS = [
  // RN1: Kigali -> Muhanga -> Ruhango -> Nyanza -> Huye
  ["Kigali", "Muhanga"],
  ["Muhanga", "Ruhango"],
  ["Ruhango", "Nyanza"],
  ["Nyanza", "Huye"],
  // RN2: Kigali -> Gicumbi, Kigali -> Musanze -> Rubavu
  ["Kigali", "Gicumbi"],
  ["Kigali", "Musanze"],
  ["Musanze", "Rubavu"],
  // RN3 / RN4: Kigali -> Rwamagana -> Kayonza -> Nyagatare
  ["Kigali", "Rwamagana"],
  ["Rwamagana", "Kayonza"],
  ["Kayonza", "Nyagatare"],
  // Eastern / Southern extensions
  ["Kigali", "Bugesera"],
  ["Muhanga", "Karongi"],
  ["Huye", "Rusizi"],
];

export default function RwandaRouteMap({
  fromCity,
  toCity,
  onSelectRoute,
  lang = "en",
}) {
  const [selectedPin, setSelectedPin] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fromCoords = RWANDA_CITY_COORDINATES[fromCity];
  const toCoords = RWANDA_CITY_COORDINATES[toCity];

  const fromPoint = fromCoords ? project(fromCoords.lat, fromCoords.lng) : null;
  const toPoint = toCoords ? project(toCoords.lat, toCoords.lng) : null;

  return (
    <div className="rwanda-map-card" style={{
      background: "var(--card-bg, #ffffff)",
      borderRadius: "var(--radius-lg, 16px)",
      border: "1px solid var(--border-color, #e2e8f0)",
      padding: "16px",
      marginBottom: "20px",
      boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: isExpanded ? "12px" : "0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🗺️</span>
          <div>
            <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--dark, #0f172a)" }}>
              {lang === "en" ? "Rwanda Intercity Route Corridors" : "Ikarita y'Inzira n'Ibyerekezo mu Rwanda"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--dark-muted, #64748b)" }}>
              {fromCity && toCity
                ? `${fromCity} ➔ ${toCity}`
                : lang === "en" ? "Tap any city hub to inspect" : "Kanda ku mujyi ushaka kureba"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "none",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: "600",
            color: "var(--primary, #0284c7)",
          }}
        >
          {isExpanded ? (lang === "en" ? "Hide Map" : "Hisha") : (lang === "en" ? "Show Map" : "Erekana")}
        </button>
      </div>

      {isExpanded && (
        <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{
              width: "100%",
              maxHeight: "340px",
              background: "#071A35",
              borderRadius: "12px",
              display: "block",
            }}
          >
            {/* Background grid lines */}
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subtle Rwanda border representation */}
            <rect x="15" y="15" width={WIDTH - 30} height={HEIGHT - 30} rx="10" fill="#0b2447" opacity="0.6" stroke="#1e3a5f" strokeDasharray="4 4" />

            {/* Highway Corridors */}
            {HIGHWAY_CORRIDORS.map(([c1, c2], idx) => {
              const p1 = RWANDA_CITY_COORDINATES[c1];
              const p2 = RWANDA_CITY_COORDINATES[c2];
              if (!p1 || !p2) return null;
              const xy1 = project(p1.lat, p1.lng);
              const xy2 = project(p2.lat, p2.lng);
              return (
                <line
                  key={idx}
                  x1={xy1.x}
                  y1={xy1.y}
                  x2={xy2.x}
                  y2={xy2.y}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="2 3"
                />
              );
            })}

            {/* Active Route Highlight Line */}
            {fromPoint && toPoint && (
              <g>
                <line
                  x1={fromPoint.x}
                  y1={fromPoint.y}
                  x2={toPoint.x}
                  y2={toPoint.y}
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  filter="url(#glow)"
                />
                <circle cx={fromPoint.x} cy={fromPoint.y} r="8" fill="#10b981" opacity="0.4" />
                <circle cx={toPoint.x} cy={toPoint.y} r="8" fill="#38bdf8" opacity="0.4" />
              </g>
            )}

            {/* City Hub Pins */}
            {Object.entries(RWANDA_CITY_COORDINATES).map(([cityName, info]) => {
              const pt = project(info.lat, info.lng);
              const isFrom = cityName === fromCity;
              const isTo = cityName === toCity;
              const isSelected = selectedPin === cityName;

              let fillColor = "#94a3b8";
              let radius = 5;

              if (isFrom) {
                fillColor = "#10b981";
                radius = 8;
              } else if (isTo) {
                fillColor = "#38bdf8";
                radius = 8;
              } else if (cityName === "Kigali") {
                fillColor = "#f59e0b";
                radius = 7;
              }

              return (
                <g
                  key={cityName}
                  onClick={() => setSelectedPin(cityName)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={radius}
                    fill={fillColor}
                    stroke={isSelected ? "#f59e0b" : "#ffffff"}
                    strokeWidth={isSelected ? "3" : isFrom || isTo ? "2" : "1"}
                  />
                  <text
                    x={pt.x}
                    y={pt.y - (radius + 4)}
                    fill={isFrom || isTo || cityName === "Kigali" ? "#ffffff" : "#94a3b8"}
                    fontSize={isFrom || isTo || cityName === "Kigali" ? "11" : "9.5"}
                    fontWeight={isFrom || isTo || cityName === "Kigali" ? "700" : "500"}
                    textAnchor="middle"
                  >
                    {cityName}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Selected Pin Quick Action Overlay */}
          {selectedPin && (
            <div style={{
              marginTop: "8px",
              padding: "10px 14px",
              background: "var(--light-bg, #f8fafc)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
            }}>
              <div>
                <strong>📍 {selectedPin}</strong>
                <span style={{ color: "var(--dark-muted, #64748b)", marginLeft: "8px" }}>
                  {RWANDA_CITY_COORDINATES[selectedPin]?.label}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ padding: "4px 8px", fontSize: "11px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px" }}
                  onClick={() => {
                    if (onSelectRoute) onSelectRoute(selectedPin, toCity);
                    setSelectedPin(null);
                  }}
                >
                  Set as From
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ padding: "4px 8px", fontSize: "11px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "4px" }}
                  onClick={() => {
                    if (onSelectRoute) onSelectRoute(fromCity, selectedPin);
                    setSelectedPin(null);
                  }}
                >
                  Set as To
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--dark-muted)" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
