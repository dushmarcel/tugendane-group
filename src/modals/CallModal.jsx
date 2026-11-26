import { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const ZEGO_APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID) || 534311044;
const ZEGO_SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET || "a20ff4ffe43fd731b586b0fffd50d459";

export default function CallModal({ booking, currentUser, userProfile, onClose }) {
  const containerRef = useRef(null);
  const zegoRef = useRef(null);
  const [status, setStatus] = useState("connecting");
  const [errorMsg, setErrorMsg] = useState("");

  const isOpen = !!booking;

  useEffect(() => {
    if (!isOpen || !containerRef.current || !currentUser) return;

    const roomID = `ride-call-${booking.firestoreId || booking.id || "unknown"}`;
    const userID = currentUser.uid;
    const userName =
      userProfile?.userName?.trim() ||
      userProfile?.fullName?.trim() ||
      currentUser.email?.split("@")[0] ||
      "User";

    let cancelled = false;

    async function initCall() {
      try {
        let kitToken = null;

        // 1. Try secure Cloud Function first (if deployed)
        try {
          const getToken = httpsCallable(functions, "generateZegoKitToken");
          const result = await getToken({ roomID, userName });
          if (result?.data?.token) {
            kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
              result.data.appID || ZEGO_APP_ID,
              result.data.token,
              roomID,
              userID,
              userName
            );
          }
        } catch (cloudErr) {
          console.warn("Cloud function token generation failed, using local token generator fallback:", cloudErr?.message);
        }

        // 2. Fallback to direct client token generation if Cloud Function not yet deployed
        if (!kitToken) {
          kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            ZEGO_APP_ID,
            ZEGO_SERVER_SECRET,
            roomID,
            userID,
            userName
          );
        }

        if (cancelled || !containerRef.current) return;

        if (!kitToken) {
          throw new Error("Could not generate call security token.");
        }

        try {
          const zp = ZegoUIKitPrebuilt.create(kitToken);
          zegoRef.current = zp;

          zp.joinRoom({
            container: containerRef.current,
            sharedLinks: [],
            scenario: {
              mode: ZegoUIKitPrebuilt.OneONoneCall,
              config: { role: "Host" },
            },
            turnOnCameraWhenJoining: false,
            showMyCameraToggleButton: false,
            showCameraToggleButton: false,
            showScreenSharingButton: false,
            showLayoutButton: false,
            showUserList: false,
            showAudioVideoSettingsButton: false,
            turnOnMicrophoneWhenJoining: true,
            showMyMicrophoneToggleButton: true,
            showTextChat: false,
            maxUsers: 2,
            onJoinRoom: () => {
              if (!cancelled) setStatus("active");
            },
            onLeaveRoom: () => {
              if (!cancelled) {
                setStatus("ended");
                setTimeout(onClose, 600);
              }
            },
            onUserLeave: () => {
              if (!cancelled) {
                setStatus("ended");
                setTimeout(onClose, 1200);
              }
            },
          });
        } catch {
          if (!cancelled) {
            setStatus("error");
            setErrorMsg("Could not start call. Check your microphone permissions.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            err?.message || "Failed to initialize call. Please check your network and try again."
          );
        }
      }
    }

    initCall();

    return () => {
      cancelled = true;
      if (zegoRef.current) {
        try { zegoRef.current.destroy(); } catch { /* ignore */ }
        zegoRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleEndCall() {
    if (zegoRef.current) {
      try { zegoRef.current.destroy(); } catch { /* ignore */ }
      zegoRef.current = null;
    }
    setStatus("ended");
    setTimeout(onClose, 300);
  }

  if (!isOpen) return null;

  const otherName =
    booking.role === "driver"
      ? (booking.passengerName || "Passenger")
      : (booking.driverName || "Driver");

  const otherRoute = `${booking.from || ""} → ${booking.to || ""}`;

  return (
    <div className="call-modal-overlay" role="dialog" aria-modal="true" aria-label="In-app call">
      <div className="call-modal-window">

        {/* Header */}
        <div className="call-modal-header">
          <div className="call-avatar-ring">
            <div className="call-avatar-initials">
              {otherName.charAt(0).toUpperCase()}
            </div>
          </div>
          <h2 className="call-other-name">{otherName}</h2>
          <p className="call-route-label">{otherRoute}</p>
          <span className={`call-status-pill call-status--${status}`}>
            {status === "connecting" && "Connecting call…"}
            {status === "active" && "Call in progress"}
            {status === "ended" && "Call ended"}
            {status === "error" && "Connection failed"}
          </span>
        </div>

        {/* Loading spinner while fetching token */}
        {status === "connecting" && (
          <div className="call-loading-box" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px", gap: "12px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>Connecting call...</span>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="call-error-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        {/* ZegoCloud UI mounts here */}
        <div
          ref={containerRef}
          className="call-zego-container"
          style={{ display: status === "error" || status === "connecting" ? "none" : "block" }}
        />

        {/* End call button */}
        <div className="call-modal-footer">
          <button
            type="button"
            className="call-end-btn"
            onClick={handleEndCall}
            aria-label="End call"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
            </svg>
            End Call
          </button>
        </div>

      </div>
    </div>
  );
}
