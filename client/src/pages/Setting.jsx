import { useState } from "react";
import { GitBranch, Camera, Check, Moon, Bell, Mail, Layout } from "lucide-react";

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
        checked ? "bg-indigo-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function PreferenceRow({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Settings() {
  const [profile, setProfile] = useState({
    name: "Shibnath Maity",
    username: "Shibnath-Maity",
    email: "shibnath@example.com",
    bio: "Full-stack developer exploring code evolution and repository analytics.",
  });

  const [prefs, setPrefs] = useState({
    darkMode: false,
    emailNotifications: true,
    weeklyDigest: false,
    compactView: false,
  });

  const [saved, setSaved] = useState(false);

  const updateProfile = (field, value) =>
    setProfile((p) => ({ ...p, [field]: value }));

  const updatePref = (field, value) =>
    setPrefs((p) => ({ ...p, [field]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Manage your application preferences.
      </p>

      {/* Profile */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img
              src="https://i.pravatar.cc/72?img=12"
              alt={profile.name}
              className="h-16 w-16 rounded-full"
            />
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-white">
              <Camera className="h-3 w-3 text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{profile.name}</p>
            <p className="text-xs text-slate-400">@{profile.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile("name", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Username</label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => updateProfile("username", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile("email", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile("bio", e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
        <h2 className="text-xl font-semibold mb-2">Preferences</h2>
        <PreferenceRow
          icon={Moon}
          title="Dark Mode"
          description="Switch the interface to a darker color scheme."
          checked={prefs.darkMode}
          onChange={(v) => updatePref("darkMode", v)}
        />
        <PreferenceRow
          icon={Bell}
          title="Email Notifications"
          description="Get notified when new commits are analyzed."
          checked={prefs.emailNotifications}
          onChange={(v) => updatePref("emailNotifications", v)}
        />
        <PreferenceRow
          icon={Mail}
          title="Weekly Digest"
          description="Receive a weekly summary of repository activity."
          checked={prefs.weeklyDigest}
          onChange={(v) => updatePref("weeklyDigest", v)}
        />
        <PreferenceRow
          icon={Layout}
          title="Compact View"
          description="Show denser layouts across dashboard and lists."
          checked={prefs.compactView}
          onChange={(v) => updatePref("compactView", v)}
        />
      </div>

      {/* GitHub */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">GitHub Connection</h2>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Connected as @{profile.username}
              </p>
              <p className="text-xs text-slate-400">
                Access granted to public repositories
              </p>
            </div>
          </div>
          <button className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
            Disconnect
          </button>
        </div>

        <div className="mt-5">
          <label className="text-xs font-medium text-slate-500">
            Personal Access Token
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="password"
              placeholder="ghp_••••••••••••••••••••"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
            <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
              Update
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Used to analyze private repositories and increase API rate limits.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;