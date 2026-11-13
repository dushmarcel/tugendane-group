export default function Header({
  currentTab,
  setCurrentTab,
  bookingsCount,
  lang,
  setLang,
  showMenu,
  setShowMenu,
  userProfile,
  currentUser,
  role,
  handleAccountModeChange,
  setShowPrivacyModal,
  setShowSosModal,
  setShowStoryWalkthrough,
  handleLogout,
  t,
}) {
  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <button className="header-brand" onClick={() => setCurrentTab("home")} aria-label="Tugendane Rides home">
            <span className="header-logo">
              <img src="/tugendane-car.png" alt="Tugendane" />
            </span>
            <span className="header-title">TUGENDANE RIDES</span>
          </button>

          <nav className="header-nav" aria-label="Main navigation">
            <button
              className={`nav-link ${currentTab === "home" ? "active" : ""}`}
              onClick={() => setCurrentTab("home")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>{t.home}</span>
            </button>
            <button
              className={`nav-link trips-nav-link ${currentTab === "trips" ? "active" : ""}`}
              aria-label={t.myTrips}
              onClick={() => setCurrentTab("trips")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <rect x="3.5" y="7" width="17" height="13" rx="2" />
                <path d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7M3.5 12h17M10 12v2h4v-2" />
              </svg>
              <span>{t.myTrips}</span>
              {bookingsCount > 0 && <span className="role-badge">{bookingsCount}</span>}
            </button>
            <button
              className="nav-link language-nav-link"
              type="button"
              aria-label="Change language"
              onClick={() => setLang(lang === "en" ? "rw" : "en")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>{lang === "en" ? "EN" : "RW"}</span>
            </button>
            <button
              className={`menu-toggle ${showMenu ? "is-open" : ""}`}
              type="button"
              aria-label={showMenu ? "Close menu" : "Open menu"}
              aria-expanded={showMenu}
              onClick={() => setShowMenu((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </nav>
        </div>
      </header>

      {showMenu && (
        <div className="menu-overlay" onClick={() => setShowMenu(false)}>
          <section className="app-menu" role="dialog" aria-label="App menu" onClick={(e) => e.stopPropagation()}>
            <div className="app-menu-heading">
              <span>{userProfile?.userName?.trim() || userProfile?.fullName?.trim().split(/\s+/).filter(Boolean).at(-1) || currentUser?.email}</span>
              <button type="button" aria-label="Close menu" onClick={() => setShowMenu(false)}>
                &times;
              </button>
            </div>
            <button
              className="app-menu-item"
              onClick={() => {
                setCurrentTab("profile");
                setShowMenu(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{t.profile}</span>
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                setCurrentTab("feedback");
                setShowMenu(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{lang === "en" ? "Feedback & Ratings" : "Ibitekerezo n'amanota"}</span>
            </button>
            <button className="app-menu-item" onClick={handleAccountModeChange}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{role === "passenger" ? (lang === "en" ? "Switch to Driver Mode" : "Hindura ube Umushoferi") : (lang === "en" ? "Switch to Passenger Mode" : "Hindura ube Umugenzi")}</span>
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                if (setShowStoryWalkthrough) setShowStoryWalkthrough(true);
                setShowMenu(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>{lang === "en" ? "App Story (How It Works)" : "Inkuru n'Uko Ikora"}</span>
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                setShowPrivacyModal(true);
                setShowMenu(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>{t.privacyPolicy}</span>
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                setShowSosModal(true);
                setShowMenu(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>{t.safety}</span>
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                setLang(lang === "en" ? "rw" : "en");
                setShowMenu(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>{lang === "en" ? "Kinyarwanda" : "English"}</span>
            </button>
            <button className="app-menu-item app-menu-logout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{t.logout}</span>
            </button>
          </section>
        </div>
      )}
    </>
  );
}
