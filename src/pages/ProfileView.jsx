import { useEffect, useState } from "react";

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

export default function ProfileView({ currentUser, userProfile, role, onSaveProfile, onBack, handleLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(userProfile?.userName || "");
  const [profilePicture, setProfilePicture] = useState(userProfile?.profilePicture || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDirty = userName.trim() !== (userProfile?.userName || "")
    || profilePicture !== (userProfile?.profilePicture || "");
  const displayName = userProfile?.userName?.trim() || defaultUsername(userProfile?.fullName);

  useEffect(() => {
    setUserName(userProfile?.userName || "");
    setProfilePicture(userProfile?.profilePicture || "");
  }, [userProfile?.userName, userProfile?.profilePicture]);

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
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

  return (
    <section className="profile-page-card" aria-labelledby="profile-page-title">
      <div className="profile-page-heading">
        {!isDirty && (
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        )}
        <h1 id="profile-page-title">My profile</h1>
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
          <p>{role === "driver" ? "Driver account" : "Passenger account"}</p>
        </div>
      </div>

      {error && <p className="profile-form-error" role="alert">{error}</p>}

      {isEditing ? (
        <div className="profile-edit-fields">
          <label className="form-group">
            <span>Username</span>
            <input
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder={defaultUsername(userProfile?.fullName)}
              maxLength={40}
            />
            <small>Leave this blank to show your last name.</small>
          </label>
          <div className="form-group">
            <span>Profile picture</span>
            <label className="btn btn-secondary profile-image-picker">
              Choose image
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          {profilePicture && (
            <button type="button" className="profile-remove-picture" onClick={() => setProfilePicture("")}>Remove profile picture</button>
          )}
        </div>
      ) : (
        <dl className="profile-page-details">
          <div><dt>Email</dt><dd>{currentUser?.email || "Not added"}</dd></div>
          <div><dt>Phone</dt><dd>{userProfile?.phone || "Not added"}</dd></div>
          {role === "driver" && userProfile?.vehicle && <div><dt>Vehicle</dt><dd>{userProfile.vehicle} · {userProfile.plate}</dd></div>}
        </dl>
      )}

      <div className="profile-page-actions">
        {!isEditing ? (
          <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit profile</button>
        ) : isDirty ? (
          <button type="button" className="btn btn-primary" onClick={saveAndReturnHome} disabled={saving}>
            {saving ? "Saving…" : "Save and return home"}
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onBack}>Return home</button>
        )}
        <button type="button" className="btn btn-danger" onClick={handleLogout}>Log out</button>
      </div>
    </section>
  );
}
