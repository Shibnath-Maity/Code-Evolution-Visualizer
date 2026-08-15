import { useState } from "react";
import {
  Camera,
  Check,
  Mail,
  Save,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import API from "../services/api";

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400">
        {label}
      </label>

      <div className="relative mt-1">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-10 pr-11 py-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function Settings() {
  /*
   * User information comes from registration/login.
   *
   * Registration already stores:
   * localStorage.setItem("user", JSON.stringify(response.data.user))
   */

  const [registeredUser] = useState(() => {
    try {
      const user = localStorage.getItem("user");

      return user ? JSON.parse(user) : {};
    } catch (error) {
      console.error("Failed to load logged-in user:", error);
      return {};
    }
  });

  /*
   * Profile
   *
   * Name + Email:
   * Loaded from registration/login.
   *
   * Username + Bio:
   * Blank initially.
   */

  const [profile, setProfile] = useState(() => {
    try {
      const savedProfile = localStorage.getItem("repoiq_profile");

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);

        return {
          name: registeredUser?.name || parsed.name || "",
          email: registeredUser?.email || parsed.email || "",
          username: parsed.username || "",
          bio: parsed.bio || "",
          avatar: parsed.avatar || "",
        };
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }

    return {
      name: registeredUser?.name || "",
      email: registeredUser?.email || "",
      username: "",
      bio: "",
      avatar: "",
    };
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  /*
   * Password
   */

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /* =====================================================
     Profile Update
  ===================================================== */

  const updateProfile = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));

    setHasChanges(true);
    setSaved(false);
  };

  /* =====================================================
     Profile Photo
  ===================================================== */

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Profile image must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateProfile("avatar", reader.result);
    };

    reader.readAsDataURL(file);
  };

  /* =====================================================
     Save Profile
  ===================================================== */

  const handleSave = () => {
    try {
      localStorage.setItem(
        "repoiq_profile",
        JSON.stringify(profile)
      );

      /*
       * Keep the logged-in user information synchronized.
       * Email remains the registered email.
       */

      const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const updatedUser = {
        ...currentUser,
        name: profile.name,
        email: profile.email,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setHasChanges(false);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  /* =====================================================
     Password Update
  ===================================================== */

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwords;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      /*
       * Backend endpoint:
       *
       * PUT /auth/change-password
       *
       * Request:
       * {
       *   currentPassword,
       *   newPassword
       * }
       */

      await API.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setPasswordMessage(
        "Password changed successfully."
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      setPasswordError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to change password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  /* =====================================================
     Initials
  ===================================================== */

  const getInitials = () => {
    if (!profile.name?.trim()) {
      return <User className="h-7 w-7" />;
    }

    return profile.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors duration-300">

      {/* ==================================================
          Header
      ================================================== */}

      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold text-white">
              Settings
            </h1>

            <p className="text-slate-500 mt-2">
              Manage your RepoIQ account settings.
            </p>
          </div>

          {hasChanges && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-2 rounded-full border border-amber-500/20">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </div>
          )}

        </div>
      </div>

      {/* ==================================================
          Profile
      ================================================== */}

      <section className="bg-slate-900/70 rounded-2xl p-6 shadow-xl mb-6 border border-slate-800 transition-all duration-300 hover:border-slate-700">

        {/* Section Header */}

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            Profile
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Manage your personal information.
          </p>
        </div>

        {/* Profile Photo */}

        <div className="flex items-center gap-4 mb-6">

          <div className="relative">

            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name || "Profile"}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-indigo-500/10"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold ring-4 ring-indigo-500/10">
                {getInitials()}
              </div>
            )}

            <label
              className="
                absolute -bottom-1 -right-1
                h-7 w-7 rounded-full
                bg-indigo-600
                flex items-center justify-center
                border-2 border-slate-900
                cursor-pointer
                hover:bg-indigo-500
                hover:scale-110
                transition-all
              "
            >
              <Camera className="h-3.5 w-3.5 text-white" />

              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>

          </div>

          <div>

            <p className="text-sm font-semibold text-white">
              {profile.name || "Your Name"}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {profile.email || "No email"}
            </p>

            <label className="inline-block mt-2 text-xs text-indigo-400 font-medium cursor-pointer hover:text-indigo-300">

              Change profile photo

              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

            </label>

          </div>

        </div>

        {/* Profile Fields */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Full Name */}

          <div>
            <label className="text-xs font-medium text-slate-400">
              Full Name
            </label>

            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                updateProfile(
                  "name",
                  e.target.value
                )
              }
              placeholder="Enter your full name"
              className="
                mt-1 w-full px-3 py-2.5
                rounded-lg
                border border-slate-800
                bg-slate-950/60
                text-sm text-slate-200
                placeholder:text-slate-600
                outline-none
                transition-all
                focus:border-indigo-500/70
                focus:ring-2
                focus:ring-indigo-500/10
              "
            />
          </div>

          {/* Username */}

          <div>
            <label className="text-xs font-medium text-slate-400">
              Username
            </label>

            <input
              type="text"
              value={profile.username}
              onChange={(e) =>
                updateProfile(
                  "username",
                  e.target.value
                )
              }
              placeholder="Enter username"
              className="
                mt-1 w-full px-3 py-2.5
                rounded-lg
                border border-slate-800
                bg-slate-950/60
                text-sm text-slate-200
                placeholder:text-slate-600
                outline-none
                transition-all
                focus:border-indigo-500/70
                focus:ring-2
                focus:ring-indigo-500/10
              "
            />
          </div>

          {/* Email */}

          <div className="sm:col-span-2">

            <label className="text-xs font-medium text-slate-400">
              Email Address
            </label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />

              <input
                type="email"
                value={profile.email}
                readOnly
                className="
                  mt-1 w-full px-10 py-2.5
                  rounded-lg
                  border border-slate-800
                  bg-slate-900
                  text-sm text-slate-400
                  outline-none
                  cursor-not-allowed
                "
              />

            </div>

            <p className="text-[11px] text-slate-600 mt-1">
              This email comes from your registered account.
            </p>

          </div>

          {/* Bio */}

          <div className="sm:col-span-2">

            <label className="text-xs font-medium text-slate-400">
              Bio
            </label>

            <textarea
              value={profile.bio}
              onChange={(e) =>
                updateProfile(
                  "bio",
                  e.target.value
                )
              }
              rows={3}
              placeholder="Tell us a little about yourself..."
              className="
                mt-1 w-full px-3 py-2.5
                rounded-lg
                border border-slate-800
                bg-slate-950/60
                text-sm text-slate-200
                placeholder:text-slate-600
                outline-none
                transition-all
                focus:border-indigo-500/70
                focus:ring-2
                focus:ring-indigo-500/10
                resize-none
              "
            />

          </div>

        </div>

        {/* Save */}

        <div className="flex items-center justify-between mt-5 gap-4">

          <p className="text-xs text-slate-600">
            Save your profile changes when you're ready.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`
              flex items-center gap-2
              px-4 py-2.5
              rounded-lg
              text-sm font-medium
              transition-all
              ${
                saved
                  ? "bg-emerald-600 text-white"
                  : hasChanges
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }
            `}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>

        </div>

      </section>

      {/* ==================================================
          Security
      ================================================== */}

      <section className="bg-slate-900/70 rounded-2xl p-6 shadow-xl border border-slate-800 transition-all duration-300 hover:border-slate-700">

        {/* Security Header */}

        <div className="flex items-start gap-3 mb-6">

          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Security
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Keep your RepoIQ account secure.
            </p>
          </div>

        </div>

        {/* Password Error */}

        {passwordError && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm text-rose-300">

            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />

            <span>
              {passwordError}
            </span>

          </div>
        )}

        {/* Password Success */}

        {passwordMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">

            <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />

            <span>
              {passwordMessage}
            </span>

          </div>
        )}

        {/* Password Form */}

        <div className="max-w-xl space-y-4">

          <PasswordInput
            label="Current Password"
            value={passwords.currentPassword}
            onChange={(e) =>
              setPasswords((previous) => ({
                ...previous,
                currentPassword: e.target.value,
              }))
            }
            placeholder="Enter current password"
            show={showCurrent}
            onToggle={() =>
              setShowCurrent((value) => !value)
            }
          />

          <PasswordInput
            label="New Password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords((previous) => ({
                ...previous,
                newPassword: e.target.value,
              }))
            }
            placeholder="Enter new password"
            show={showNew}
            onToggle={() =>
              setShowNew((value) => !value)
            }
          />

          <PasswordInput
            label="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={(e) =>
              setPasswords((previous) => ({
                ...previous,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Confirm new password"
            show={showConfirm}
            onToggle={() =>
              setShowConfirm((value) => !value)
            }
          />

          <p className="text-xs text-slate-600">
            Your new password must contain at least 8 characters.
          </p>

          <button
            type="button"
            onClick={handlePasswordChange}
            disabled={passwordLoading}
            className="
              flex items-center gap-2
              px-4 py-2.5
              rounded-lg
              bg-indigo-600
              text-white
              text-sm
              font-medium
              hover:bg-indigo-500
              transition-all
              hover:shadow-lg
              hover:shadow-indigo-600/20
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {passwordLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Change Password
              </>
            )}
          </button>

        </div>

      </section>

      {/* ==================================================
          Saved Toast
      ================================================== */}

      <div
        className={`
          fixed bottom-6 right-6 z-50
          flex items-center gap-2
          px-4 py-3
          rounded-xl
          bg-slate-800
          border border-slate-700
          text-white text-sm
          shadow-2xl
          transition-all duration-500
          ${
            saved
              ? "translate-y-0 opacity-100"
              : "translate-y-5 opacity-0 pointer-events-none"
          }
        `}
      >
        <Check className="h-4 w-4 text-emerald-400" />
        Settings saved successfully
      </div>
    </div>
  );
}

export default Settings;