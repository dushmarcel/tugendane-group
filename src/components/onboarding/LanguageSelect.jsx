import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "rw", label: "Kinyarwanda", native: "Ikinyarwanda", flag: "🇷🇼" },
];

export default function LanguageSelect({ onSelect }) {
  const [selected, setSelected] = useState("en");

  return (
    <div className="lang-select-screen">
      {/* Background image with green overlay */}
      <div className="lang-select-bg" />
      <div className="lang-select-overlay" />

      {/* Content */}
      <div className="lang-select-content">
        {/* Logo / App name */}
        <div className="lang-select-brand">
          <img
            src="/tugendane-car.png"
            alt="Tugendane logo"
            className="lang-select-logo"
          />
          <h1 className="lang-select-app-name">TUGENDANE</h1>
          <p className="lang-select-tagline">TUJYANE — Let's Go Together</p>
        </div>

        {/* Language picker */}
        <div className="lang-select-card">
          <p className="lang-select-prompt">
            🌍 Choose your language / Hitamo ururimi
          </p>
          <div className="lang-select-options">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`lang-option-btn ${selected === lang.code ? "active" : ""}`}
                onClick={() => setSelected(lang.code)}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-native">{lang.native}</span>
                {selected === lang.code && (
                  <span className="lang-check">✓</span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary lang-continue-btn"
            onClick={() => onSelect(selected)}
          >
            Continue / Komeza ➔
          </button>
        </div>
      </div>
    </div>
  );
}
