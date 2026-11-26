import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import ComplianceBanner from "../components/ComplianceBanner";

export default function AuthScreen({
  visibleAuthMode,
  setAuthMode,
  authModalReason,
  setAuthModalReason,
  authError,
  authForm,
  setAuthForm,
  handleAuthSubmit,
  handleGoogleAuth,
  authLoading,
  lang,
  t,
}) {
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSendResetEmail(e) {
    e.preventDefault();
    setResetError("");
    setResetSent(false);
    const emailToReset = authForm.email?.trim();
    if (!emailToReset) {
      setResetError(lang === "en" ? "Please enter your email address." : "Shyiramo imeli yawe.");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailToReset);
      setResetSent(true);
    } catch (err) {
      console.warn("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setResetError(lang === "en" ? "No account found with this email." : "Nta konti ibonetse kuri iyi imeli.");
      } else if (err.code === "auth/invalid-email") {
        setResetError(lang === "en" ? "Please enter a valid email." : "Imeli wanditse si yo.");
      } else {
        setResetError(err.message || "Could not send reset email.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  if (isResetMode) {
    return (
      <div className="welcome-page">
        <div className="welcome-card signup-card">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setIsResetMode(false);
              setResetError("");
              setResetSent(false);
            }}
            style={{ marginBottom: "16px" }}
          >
            ← {t.backToLogin || (lang === "en" ? "Back to Log In" : "Subira ku Kwinjira")}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                border: "1.5px solid var(--border)",
                boxShadow: "2px 2px 0px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src="/tugendane-car.png"
                alt="logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "var(--secondary)",
                  letterSpacing: "0.5px",
                }}
              >
                {t.groupName}
              </div>
              <h2 style={{ fontSize: "19px", fontWeight: "800" }}>
                {t.resetPasswordTitle}
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--dark-muted)" }}>
                {t.resetPasswordDesc}
              </p>
            </div>
          </div>

          {resetError && (
            <div className="auth-error-banner" style={{ marginBottom: "14px" }}>
              {resetError}
            </div>
          )}

          {resetSent ? (
            <div style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1.5px solid #a7f3d0",
              borderRadius: "var(--radius-sm)",
              padding: "14px",
              fontSize: "13.5px",
              lineHeight: 1.5,
              marginBottom: "16px",
            }}>
              {t.resetEmailSent}
            </div>
          ) : (
            <form onSubmit={handleSendResetEmail}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: "10px" }}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : t.sendResetLink}
              </button>
            </form>
          )}

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13.5px" }}>
            <strong
              style={{ color: "var(--primary)", cursor: "pointer" }}
              onClick={() => {
                setIsResetMode(false);
                setResetError("");
                setResetSent(false);
              }}
            >
              ← {t.backToLogin || "Back to Log In"}
            </strong>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="welcome-page">
      <div className="welcome-card signup-card">
        {visibleAuthMode === "signup" && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setAuthModalReason("");
              setAuthMode("login");
            }}
            style={{ marginBottom: "16px" }}
          >
            ← {lang === "en" ? "Back to Log In" : "Subira ku Kwinjira"}
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              border: "1.5px solid var(--border)",
              boxShadow: "2px 2px 0px rgba(0,0,0,0.1)",
            }}
          >
            <img
              src="/tugendane-car.png"
              alt="logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "var(--secondary)",
                letterSpacing: "0.5px",
              }}
            >
              {t.groupName}
            </div>
            <h2 style={{ fontSize: "19px", fontWeight: "800" }}>
              {visibleAuthMode === "signup" ? t.createAccount : t.login}
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--dark-muted)" }}>{t.tagline}</p>
          </div>
        </div>

        {visibleAuthMode === "login" && <ComplianceBanner t={t} />}

        {authModalReason && (
          <div
            style={{
              background: "var(--primary-light)",
              color: "var(--primary)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #bfdbfe",
              boxShadow: "2px 2px 0px rgba(11, 94, 215, 0.15)",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>Info:</span> {authModalReason}
          </div>
        )}

        {authError && (
          <div
            style={{
              background: "var(--danger-light)",
              color: "var(--danger)",
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #fecaca",
              boxShadow: "2px 2px 0px rgba(239, 68, 68, 0.2)",
              fontSize: "13px",
              marginBottom: "14px",
            }}
          >
            {authError}
          </div>
        )}

        {visibleAuthMode === "signup" && (
          <>
            {/* Role Selector: Passenger or Driver */}
            <div className="form-group">
              <label style={{ fontWeight: "700" }}>
                {lang === "en" ? "I am joining as:" : "Ninjiyemo nka:"}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  className={`btn btn-sm ${!authForm.isDriver ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setAuthForm({ ...authForm, isDriver: false })}
                  style={{ padding: "8px" }}
                >
                  {lang === "en" ? "Passenger" : "Umugenzi"}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${authForm.isDriver ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setAuthForm({ ...authForm, isDriver: true })}
                  style={{ padding: "8px" }}
                >
                  {lang === "en" ? "Driver" : "Umushoferi"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jean Damascene Hakizimana"
                value={authForm.fullName}
                onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number (MTN / Airtel)</label>
              <input
                type="tel"
                placeholder="0788123456"
                value={authForm.phone}
                onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>{t.nationalId}</label>
              <input
                type="text"
                placeholder="1 1998 8 0012345 0 12"
                value={authForm.nationalId}
                onChange={(e) => setAuthForm({ ...authForm, nationalId: e.target.value })}
              />
            </div>

            {authForm.isDriver && (
              <div
                style={{
                  background: "var(--light-bg)",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "700",
                    color: "var(--secondary)",
                    marginBottom: "8px",
                  }}
                >
                  {t.vehicleDetailsTitle}
                </div>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "12px" }}>{t.carModelLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota RAV4 (Silver)"
                    value={authForm.vehicle}
                    onChange={(e) => setAuthForm({ ...authForm, vehicle: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "0" }}>
                  <label style={{ fontSize: "12px" }}>{t.carPlateLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. RAF 782 C"
                    value={authForm.plate}
                    onChange={(e) => setAuthForm({ ...authForm, plate: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "0" }}>
                  <label style={{ fontSize: "12px" }}>{lang === "en" ? "Driving Licence Number" : "Nomero y'uruhushya rwo gutwara"}</label>
                  <input
                    type="text"
                    value={authForm.drivingLicense}
                    onChange={(e) => setAuthForm({ ...authForm, drivingLicense: e.target.value })}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {visibleAuthMode === "login" && (
          <div className="form-group">
            <label>{lang === "en" ? "Log in as:" : "Injira nka:"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                className={`btn btn-sm ${authForm.loginAs !== "driver" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setAuthForm({ ...authForm, loginAs: "passenger" })}
              >
                {lang === "en" ? "Passenger" : "Umugenzi"}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${authForm.loginAs === "driver" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setAuthForm({ ...authForm, loginAs: "driver" })}
              >
                {lang === "en" ? "Driver" : "Umushoferi"}
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ margin: 0 }}>Password</label>
            {visibleAuthMode === "login" && (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => {
                  setResetError("");
                  setResetSent(false);
                  setIsResetMode(true);
                }}
              >
                {t.forgotPassword || "Forgot password?"}
              </span>
            )}
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
          />
        </div>

        {/* Keep Me Logged In Checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0 14px 0", cursor: "pointer" }}>
          <input
            type="checkbox"
            id="keepMeLoggedIn"
            checked={authForm.keepLoggedIn !== false}
            onChange={(e) => setAuthForm({ ...authForm, keepLoggedIn: e.target.checked })}
            style={{ width: "17px", height: "17px", cursor: "pointer", accentColor: "var(--primary)" }}
          />
          <label htmlFor="keepMeLoggedIn" style={{ fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "var(--dark)", margin: 0 }}>
            {lang === "en" ? "Keep me logged in for 30 days" : "Kuguma winjiyemo iminsi 30"}
          </label>
        </div>

        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: "6px" }}
          onClick={() => handleAuthSubmit(visibleAuthMode)}
          disabled={authLoading}
        >
          {authLoading ? "Processing..." : visibleAuthMode === "signup" ? t.createAccount : t.login}
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>{lang === "en" ? "or continue with" : "cyangwa koresha"}</span>
        </div>

        {/* Google Sign-in / Sign-up Button */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={() => handleGoogleAuth && handleGoogleAuth(authForm.isDriver ? "driver" : "passenger")}
          disabled={authLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>
            {visibleAuthMode === "signup"
              ? (lang === "en" ? "Sign up with Google" : "Iyandikishe na Google")
              : (lang === "en" ? "Sign in with Google" : "Yinjira na Google")}
          </span>
        </button>

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13.5px" }}>
          {visibleAuthMode === "signup" ? (
            <span>
              Already registered?{" "}
              <strong
                style={{ color: "var(--primary)", cursor: "pointer" }}
                onClick={() => setAuthMode("login")}
              >
                Log in
              </strong>
            </span>
          ) : (
            <span>
              Don't have an account?{" "}
              <strong
                style={{ color: "var(--primary)", cursor: "pointer" }}
                onClick={() => setAuthMode("signup")}
              >
                Create account
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
