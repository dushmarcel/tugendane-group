import { useEffect, useState } from "react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function EmailVerificationScreen({
  currentUser,
  lang = "en",
  onVerified,
}) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const email = currentUser?.email || "your email";

  // Check verification status
  async function checkVerification(silent = false) {
    if (!auth.currentUser) return;
    if (!silent) setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setStatusMsg({
          type: "success",
          text: lang === "en" ? "Email verified successfully! Welcome to Tugendane." : "Imeli yawe yemejwe neza! Ikaze muri Tugendane.",
        });
        // Call onVerified immediately — no delay so user enters app right away
        if (onVerified) onVerified();
      } else if (!silent) {
        setStatusMsg({
          type: "info",
          text: lang === "en"
            ? "Verification link not clicked yet. Please check your inbox (including Spam/Junk folder) and tap the link."
            : "Ntura kanda ku murongo wo kwemeza. Reba muri imeli yawe (no muri Spam) maze ukandeho.",
        });
      }
    } catch (err) {
      if (!silent) {
        setStatusMsg({
          type: "error",
          text: err.message || "Failed to check status. Try again.",
        });
      }
    } finally {
      if (!silent) setChecking(false);
    }
  }

  // Resend verification email
  async function handleResendEmail() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setStatusMsg({ type: "", text: "" });
    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/?verified=true`,
        handleCodeInApp: true,
      });
      setStatusMsg({
        type: "success",
        text: lang === "en"
          ? "New verification link sent! Please check your inbox."
          : "Umurongo mushya wo kwemeza woherejwe! Reba muri imeli yawe.",
      });
      setResendCooldown(60);
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        setStatusMsg({
          type: "error",
          text: lang === "en"
            ? "Too many requests. Please wait a moment before trying again."
            : "Wagerageje kenshi. Tegereza gato mbere yo kongera kugerageza.",
        });
        setResendCooldown(60);
      } else {
        setStatusMsg({
          type: "error",
          text: err.message || "Failed to resend email. Try again later.",
        });
      }
    } finally {
      setResending(false);
    }
  }

  // Handle countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-check when user switches back to this tab/window (e.g. after tapping email link)
  useEffect(() => {
    const handleFocus = () => {
      checkVerification(true);
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);

    // Also poll gently every 5 seconds
    const interval = setInterval(() => {
      checkVerification(true);
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {
      window.location.reload();
    }
  }

  return (
    <div className="welcome-page">
      <div className="welcome-card verify-email-card" style={{ maxWidth: "480px", textAlign: "center" }}>
        
        {/* Animated Email Icon */}
        <div className="verify-email-icon-wrapper">
          <div className="verify-email-icon-bubble">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>

        <span className="verify-badge">
          {lang === "en" ? "ONE STEP TO GO" : "INTAMBWE ISIGAYE"}
        </span>

        <h2 style={{ fontSize: "22px", fontWeight: "800", marginTop: "12px", marginBottom: "8px" }}>
          {lang === "en" ? "Verify Your Email" : "Emeza Imeli Yawe"}
        </h2>

        <p style={{ fontSize: "14px", color: "var(--dark-muted)", lineHeight: "1.5", marginBottom: "16px" }}>
          {lang === "en"
            ? "We sent a secure verification link to:"
            : "Twohereje umurongo wo kwemeza kuri:"}
          <br />
          <strong style={{ color: "var(--dark)", fontSize: "15px", wordBreak: "break-all" }}>
            {email}
          </strong>
        </p>

        <div style={{
          background: "var(--light-bg, #f8fafc)",
          border: "1px dashed var(--border, #cbd5e1)",
          borderRadius: "var(--radius-md, 12px)",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "var(--dark-muted)",
          textAlign: "left",
          lineHeight: "1.4"
        }}>
          💡 <strong>{lang === "en" ? "Quick tip:" : "Inama:"}</strong>{" "}
          {lang === "en"
            ? "Open your email app, tap the link, then come back here. It will verify automatically!"
            : "Fungura imeli yawe, ukande kuri uwo murongo, hanyuma ugaruke hano. Bizihita byemeza ubwabyo!"}
        </div>

        {/* Status Messages */}
        {statusMsg.text && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "16px",
              background:
                statusMsg.type === "success"
                  ? "var(--success-light, #dcfce7)"
                  : statusMsg.type === "error"
                  ? "var(--danger-light, #fee2e2)"
                  : "#eff6ff",
              color:
                statusMsg.type === "success"
                  ? "var(--success, #16a34a)"
                  : statusMsg.type === "error"
                  ? "var(--danger, #dc2626)"
                  : "var(--primary, #2563eb)",
              border: `1px solid ${
                statusMsg.type === "success"
                  ? "#bbf7d0"
                  : statusMsg.type === "error"
                  ? "#fecaca"
                  : "#bfdbfe"
              }`,
            }}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-primary btn-full"
            style={{ padding: "13px", fontSize: "15px", fontWeight: "800" }}
            onClick={async () => {
              setChecking(true);
              try {
                if (auth.currentUser) {
                  await auth.currentUser.reload();
                  if (auth.currentUser.emailVerified) {
                    if (onVerified) onVerified();
                    return;
                  }
                }
                await checkVerification(false);
              } catch (e) {
                console.warn("Continue check:", e);
                await checkVerification(false);
              } finally {
                setChecking(false);
              }
            }}
            disabled={checking}
          >
            {checking
              ? (lang === "en" ? "Checking verification…" : "Turimo gusuzuma…")
              : (lang === "en" ? "Continue to App →" : "Komeza muri App →")}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-full"
            style={{ padding: "11px", fontSize: "14px", fontWeight: "600" }}
            onClick={() => checkVerification(false)}
            disabled={checking}
          >
            {lang === "en" ? "I Have Verified My Email" : "Naze kwemeza imeli yanjye"}
          </button>
        </div>

        {/* Resend Link */}
        <div style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="btn btn-outline btn-full"
            style={{ padding: "10px", fontSize: "13px", border: "1px solid var(--border, #cbd5e1)" }}
            onClick={handleResendEmail}
            disabled={resending || resendCooldown > 0}
          >
            {resending
              ? (lang === "en" ? "Sending link…" : "Turimo kohereza…")
              : resendCooldown > 0
              ? `${lang === "en" ? "Resend available in" : "Ongera wohereze muri"} ${resendCooldown}s`
              : (lang === "en" ? "Resend Verification Email" : "Ongera wohereze imeli yo kwemeza")}
          </button>
        </div>

        {/* Switch Account / Logout */}
        <div style={{ marginTop: "20px", borderTop: "1px solid var(--border, #e2e8f0)", paddingTop: "14px" }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "var(--dark-muted)",
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {lang === "en" ? "Wrong email? Sign out or switch account" : "Wibeshye kuri imeli? Sohoka cyangwa uhindure konti"}
          </button>
        </div>

      </div>
    </div>
  );
}
