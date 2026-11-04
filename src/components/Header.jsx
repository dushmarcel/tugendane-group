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
              <span aria-hidden="true">🪑</span>
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
              <span aria-hidden="true">🌐</span>
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
              <span>{userProfile?.fullName || currentUser?.email}</span>
              <button type="button" aria-label="Close menu" onClick={() => setShowMenu(false)}>
                ×
              </button>
            </div>
            <button
              className="app-menu-item"
              onClick={() => {
                setCurrentTab("profile");
                setShowMenu(false);
              }}
            >
              👤 {t.profile}
            </button>
            <button className="app-menu-item" onClick={handleAccountModeChange}>
              {role === "passenger" ? "🚗 Log out to switch to Driver" : "🧳 Log out to switch to Passenger"}
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                if (setShowStoryWalkthrough) setShowStoryWalkthrough(true);
                setShowMenu(false);
              }}
            >
              📖 {lang === "en" ? "App Story (How It Works)" : "Inkuru n'Uko Ikora"}
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                setShowPrivacyModal(true);
                setShowMenu(false);
              }}
            >
              📜 {t.privacyPolicy}
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                setShowSosModal(true);
                setShowMenu(false);
              }}
            >
              🛡️ {t.safety}
            </button>
            <button
              className="app-menu-item"
              onClick={() => {
                setLang(lang === "en" ? "rw" : "en");
                setShowMenu(false);
              }}
            >
              🌐 {lang === "en" ? "Kinyarwanda" : "English"}
            </button>
            <button className="app-menu-item app-menu-logout" onClick={handleLogout}>
              ↪ {t.logout}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
