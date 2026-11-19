import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  LockKeyhole,
  Loader2,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101d32] px-4 py-3 text-white outline-none transition focus:border-[#f4c34e]";

export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users/profile");

      const userData = response.data.user || response.data;

      setProfile({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        role: userData.role || user?.role || "",
      });
    } catch (err) {
      console.error("Profile fetch error:", err);

      setError(err.response?.data?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }

  function updateProfileField(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await api.put("/users/profile", {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      });

      const updatedUser = response.data.user || response.data;

      setProfile((previous) => ({
        ...previous,
        name: updatedUser.name ?? previous.name,
        email: updatedUser.email ?? previous.email,
        phone: updatedUser.phone ?? previous.phone,
        role: updatedUser.role ?? previous.role,
      }));

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      setError(err.response?.data?.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (passwordForm.newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.patch("/users/profile/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setMessage(response.data.message || "Password changed successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password change error:", err);

      setError(err.response?.data?.message || "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  const roleLabel = profile.role ? profile.role.replaceAll("_", " ") : "User";

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <Loader2 className="animate-spin text-[#f4c34e]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">My Profile</h1>
        <p className="mt-2 text-sm text-[#a6b4c8]">
          Manage your personal information and account security.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* PERSONAL INFORMATION */}
          <form
            onSubmit={handleProfileUpdate}
            className="rounded-2xl border border-[#293b55] bg-[#0d192c] p-5 sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-[#293b55] pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4c34e]/10 text-[#f4c34e]">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">
                  Personal Information
                </h2>
                <p className="text-xs text-[#a6b4c8]">
                  Update your account details.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-[#c0ccdc]">
                Full Name
                <input
                  required
                  name="name"
                  value={profile.name}
                  onChange={updateProfileField}
                  className={inputClass}
                  placeholder="Your full name"
                />
              </label>

              <label className="block text-sm text-[#c0ccdc]">
                Email Address
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={updateProfileField}
                  className={inputClass}
                  placeholder="Your email address"
                />
              </label>

              <label className="block text-sm text-[#c0ccdc]">
                Phone Number
                <input
                  required
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={updateProfileField}
                  className={inputClass}
                  placeholder="Your phone number"
                  pattern="[+]?[0-9\s()-]{10,15}"
                />
              </label>

              <label className="block text-sm text-[#c0ccdc]">
                Account Role
                <input
                  value={roleLabel}
                  disabled
                  className={`${inputClass} cursor-not-allowed capitalize opacity-60`}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#f4c34e] px-5 py-3 font-bold text-[#101827] transition hover:bg-yellow-300 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* CHANGE PASSWORD */}
          <form
            onSubmit={handlePasswordChange}
            className="rounded-2xl border border-[#293b55] bg-[#0d192c] p-5 sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-[#293b55] pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4c34e]/10 text-[#f4c34e]">
                <LockKeyhole size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">
                  Change Password
                </h2>
                <p className="text-xs text-[#a6b4c8]">
                  Keep your account secure.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm text-[#c0ccdc]">
                Current Password
                <input
                  required
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={updatePasswordField}
                  className={inputClass}
                  placeholder="Enter current password"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-[#c0ccdc]">
                  New Password
                  <input
                    required
                    type="password"
                    name="newPassword"
                    minLength={8}
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={updatePasswordField}
                    className={inputClass}
                    placeholder="Minimum 8 characters"
                  />
                </label>

                <label className="block text-sm text-[#c0ccdc]">
                  Confirm New Password
                  <input
                    required
                    type="password"
                    name="confirmPassword"
                    minLength={8}
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={updatePasswordField}
                    className={inputClass}
                    placeholder="Confirm new password"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="flex items-center gap-2 rounded-xl border border-[#f4c34e]/30 bg-[#f4c34e]/10 px-5 py-3 font-bold text-[#f4c34e] transition hover:bg-[#f4c34e]/20 disabled:opacity-50"
              >
                {changingPassword ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <LockKeyhole size={17} />
                )}

                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* ACCOUNT SUMMARY */}
        <div className="h-fit rounded-2xl border border-[#293b55] bg-[#0d192c] p-6">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-[#f4c34e]/20 bg-[#1b2d45] text-[#f4c34e]">
              <UserRound size={42} />
            </div>

            <h2 className="mt-4 text-xl font-black text-white">
              {profile.name || "User"}
            </h2>

            <span className="mt-2 rounded-full border border-[#f4c34e]/20 bg-[#f4c34e]/10 px-3 py-1 text-xs font-bold capitalize text-[#f4c34e]">
              {roleLabel}
            </span>
          </div>

          <div className="mt-6 space-y-4 border-t border-[#293b55] pt-5">
            <div className="flex items-start gap-3">
              <Mail size={17} className="mt-0.5 text-[#f4c34e]" />
              <div className="min-w-0">
                <p className="text-xs text-[#a6b4c8]">Email</p>
                <p className="break-all text-sm text-white">
                  {profile.email || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={17} className="mt-0.5 text-[#f4c34e]" />
              <div>
                <p className="text-xs text-[#a6b4c8]">Phone</p>
                <p className="text-sm text-white">
                  {profile.phone || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck size={17} className="mt-0.5 text-[#f4c34e]" />
              <div>
                <p className="text-xs text-[#a6b4c8]">Account Status</p>
                <p className="text-sm font-semibold text-green-400">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
