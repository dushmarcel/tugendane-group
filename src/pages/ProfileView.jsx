import { useState } from "react";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

function defaultUsername(fullName = "") {
  return fullName.trim().split(/\s+/).filter(Boolean).at(-1) || "Traveler";
}

function compressProfileImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a supported image."));
      image.onload = () => {
        const size = 256;
        const scale = Math.min(size / image.width, size / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileView({
  currentUser,
  userProfile,
  role,
  onSaveProfile,
  onBack,
  handleLogout,
  lang = "en",
  t = {},
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(userProfile?.userName || "");
  const [profilePicture, setProfilePicture] = useState(userProfile?.profilePicture || "");
  const [prevProfile, setPrevProfile] = useState(userProfile);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (userProfile !== prevProfile) {
    setPrevProfile(userProfile);
    setUserName(userProfile?.userName || "");
    setProfilePicture(userProfile?.profilePicture || "");
  }

  const isDirty = userName.trim() !== (userProfile?.userName || "")
    || profilePicture !== (userProfile?.profilePicture || "");
  const displayName = userProfile?.userName?.trim() || defaultUsername(userProfile?.fullName);

  function handleBack() {
    if (isDirty && !window.confirm(lang === "en" ? "Discard unsaved changes?" : "Reka ibyo wahinduye utarabibika?")) {
      return;
    }
    onBack();
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(lang === "en" ? "Choose an image file." : "Hitamo ifoto iboneye.");
      return;
    }
    try {
      setProfilePicture(await compressProfileImage(file));
      setError("");
    } catch (imageError) {
      setError(imageError.message);
    }
  }

  async function saveAndReturnHome() {
    setSaving(true);
    setError("");
    const saved = await onSaveProfile({ userName, profilePicture });
    setSaving(false);
    if (saved) setIsEditing(false);
  }

  async function handleDeleteAccount() {
    if (!currentUser) return;
    const confirmed = window.confirm(
      t?.deleteAccountConfirm || "Are you sure you want to permanently delete your account and all associated profile data? This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      // 1. Delete user document from Firestore
      await deleteDoc(doc(db, "users", currentUser.uid));
      // 2. Delete the user from Firebase Auth
      await deleteUser(currentUser);
      alert(t?.accountDeletedSuccess || "Your account has been deleted.");
      await handleLogout();
    } catch (err) {
      console.error("Account deletion error:", err);
      if (err.code === "auth/requires-recent-login") {
        setError(lang === "en"
          ? "For security, please log out and log back in again before deleting your account."
          : "Kubera umutekano, banza usohoke muri konti wongere winjire mbere yo kuyisiba.");
      } else {
        setError(err.message || "Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="profile-page-card" aria-labelledby="profile-page-title">
      <div className="profile-page-heading">
        <button type="button" className="btn btn-secondary" onClick={handleBack}>
          ← {t?.back || (lang === "en" ? "Back" : "Subira")}
        </button>
        <h1 id="profile-page-title">{t?.profile || (lang === "en" ? "My profile" : "Umwirondoro")}</h1>
      </div>

      <div className="profile-page-identity">
        {profilePicture ? (
          <img className="profile-page-avatar" src={profilePicture} alt={`${displayName}'s profile`} />
        ) : (
          <div className="profile-page-avatar profile-page-avatar-fallback" aria-hidden="true">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h2>{displayName}</h2>
          <p>{role === "driver" ? (lang === "en" ? "Driver account" : "Konti y'umushoferi") : (lang === "en" ? "Passenger account" : "Konti y'umugenzi")}</p>
        </div>
      </div>

      {error && <p className="profile-form-error" role="alert">{error}</p>}

      {isEditing ? (
        <div className="profile-edit-fields">
          <label className="form-group">
            <span>{lang === "en" ? "Username" : "Izina ry'umukoresha"}</span>
            <input
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder={defaultUsername(userProfile?.fullName)}
              maxLength={40}
            />
            <small>{lang === "en" ? "Leave this blank to show your last name." : "Kureka bweru kugira ngo hagaragare izina ryawe rya nyuma."}</small>
          </label>
          <div className="form-group">
            <span>{lang === "en" ? "Profile picture" : "Ifoto y'umwirondoro"}</span>
            <label className="btn btn-secondary profile-image-picker">
              {lang === "en" ? "Choose image" : "Hitamo ifoto"}
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          {profilePicture && (
            <button type="button" className="profile-remove-picture" onClick={() => setProfilePicture("")}>
              {lang === "en" ? "Remove profile picture" : "Kura ifoto"}
            </button>
          )}
        </div>
      ) : (
        <dl className="profile-page-details">
          <div><dt>Email</dt><dd>{currentUser?.email || (lang === "en" ? "Not added" : "Ntiyashyizwemo")}</dd></div>
          <div><dt>{lang === "en" ? "Phone" : "Telefoni"}</dt><dd>{userProfile?.phone || (lang === "en" ? "Not added" : "Ntiyashyizwemo")}</dd></div>
          {role === "driver" && userProfile?.vehicle && <div><dt>{lang === "en" ? "Vehicle" : "Imodoka"}</dt><dd>{userProfile.vehicle} · {userProfile.plate}</dd></div>}
        </dl>
      )}

      <div className="profile-page-actions">
        {!isEditing ? (
          <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
            {lang === "en" ? "Edit profile" : "Hindura umwirondoro"}
          </button>
        ) : isDirty ? (
          <button type="button" className="btn btn-primary" onClick={saveAndReturnHome} disabled={saving}>
            {saving ? (lang === "en" ? "Saving…" : "Birabikwa…") : (lang === "en" ? "Save and return home" : "Bika usubire ahabanza")}
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={handleBack}>
            {lang === "en" ? "Return home" : "Subira ahabanza"}
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          {t?.logout || (lang === "en" ? "Log out" : "Sohoka")}
        </button>
      </div>

      <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "#b91c1c", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {t?.dangerZone || "Account Management"}
        </div>
        <p style={{ fontSize: "12.5px", color: "var(--dark-muted)", marginBottom: "12px", lineHeight: 1.4 }}>
          {lang === "en"
            ? "Permanently delete your profile and personal information in accordance with privacy laws and Google Play/App Store requirements."
            : "Siba burundu konti yawe n'amakuru yose akwerekeyeho bijyanye n'amategeko agenga umutekano w'amakuru."}
        </p>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={handleDeleteAccount}
          disabled={deleting}
          style={{ width: "100%" }}
        >
          {deleting ? (lang === "en" ? "Deleting account..." : "Konti irasibwa...") : (t?.deleteAccountBtn || "Delete Account & Personal Data")}
        </button>
      </div>
    </section>
  );
}
