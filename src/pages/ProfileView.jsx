export default function ProfileView({
  currentUser,
  userProfile,
  role,
  setAuthModalReason,
  setAuthMode,
  setShowPrivacyModal,
  handleLogout,
  lang,
  t,
}) {
  return (
    <div className="search-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
      {!currentUser ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              margin: "0 auto 16px",
            }}
          >
            👤
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>
            {t.guestAccountTitle}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--dark-muted)", marginBottom: "24px" }}>
            {t.guestAccountDesc}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                setAuthModalReason("");
                setAuthMode("signup");
              }}
            >
              ✨ {t.createAccount}
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => {
                setAuthModalReason("");
                setAuthMode("login");
              }}
            >
              🔑 {t.login}
            </button>
          </div>

          <div
            style={{
              background: "var(--light-bg)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              textAlign: "left",
              fontSize: "13px",
              color: "var(--dark-muted)",
              border: "1px solid var(--border)",
              marginBottom: "18px",
            }}
          >
            <strong style={{ color: "var(--dark)" }}>
              🌟 {lang === "en" ? "Tugendane Member Benefits:" : "Ibyiza byo kugira konti:"}
            </strong>
            <ul
              style={{
                paddingLeft: "18px",
                marginTop: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <li>
                {lang === "en"
                  ? "Find rides and request seats on routes across Rwanda"
                  : "Shaka ingendo kandi usabe intebe mu Rwanda"}
              </li>
              <li>
                {lang === "en"
                  ? "Clear driver and vehicle details before you request a seat"
                  : "Reba amakuru y'umushoferi n'imodoka mbere yo gusaba intebe"}
              </li>
              <li>
                {lang === "en"
                  ? "Track booking requests and driver decisions in My Trips"
                  : "Kurikirana ubusabe n'icyemezo cy'umushoferi muri Ingendo Zanjye"}
              </li>
              <li>
                {lang === "en"
                  ? "Register private car and publish trips to share fuel"
                  : "Kwandikisha imodoka yawe no gusangira lisansi"}
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              textDecoration: "underline",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            📜 {t.privacyPolicy}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <div className="driver-avatar" style={{ width: "64px", height: "64px", fontSize: "24px" }}>
              {userProfile?.fullName?.charAt(0) || currentUser.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
                {userProfile?.fullName || currentUser.displayName || currentUser.email?.split("@")[0]}
              </h2>
              <div
                style={{
                  fontSize: "13px",
                  color:
                    userProfile?.nationalIdVerified && userProfile?.nationalIdStatus === "verified"
                      ? "var(--secondary)"
                      : "var(--dark-muted)",
                  fontWeight: "600",
                }}
              >
                {userProfile?.nationalIdVerified && userProfile?.nationalIdStatus === "verified"
                  ? `✅ ${t.verifiedCitizen}`
                  : userProfile?.nationalId
                  ? `📝 ${t.idPendingReview}`
                  : `ℹ️ ${t.unverifiedCitizen}`}
                {userProfile?.nationalId ? ` • ID: ${userProfile.nationalId.slice(0, 5)}...` : ""}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "var(--light-bg)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              marginBottom: "20px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
              <div>
                <strong>Email: </strong> {currentUser.email}
              </div>
              <div>
                <strong>Phone: </strong>{" "}
                {userProfile?.phone || (lang === "en" ? "Not added yet" : "Ntiyashyirwamo")}
              </div>
              <div>
                <strong>Account Type: </strong>{" "}
                {role === "driver"
                  ? lang === "en"
                    ? "Driver profile 🚗"
                    : "Umwirondoro w'umushoferi 🚗"
                  : "Tugendane Traveler 🎒"}
              </div>
              {userProfile?.vehicle && (
                <div>
                  <strong>Vehicle: </strong> {userProfile.vehicle} ({userProfile.plate || "N/A"})
                </div>
              )}
              <div>
                <strong>Language: </strong> {lang === "en" ? "English" : "Kinyarwanda"}
              </div>
              <div>
                <strong>Emergency Contact: </strong> Toll-Free 112 (Rwanda Police)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              className="btn btn-full"
              style={{
                background: "#ffffff",
                border: "1px solid var(--border)",
                color: "var(--dark-muted)",
                fontSize: "13.5px",
              }}
              onClick={() => setShowPrivacyModal(true)}
            >
              📜 {t.privacyPolicy}
            </button>

            <button
              className="btn btn-full"
              style={{
                background: "var(--danger-light)",
                color: "var(--danger)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
              onClick={handleLogout}
            >
              🚪 {t.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
