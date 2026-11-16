import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../lib/authRedirect";
// import { getDashboardPath } from "../utils/authRedirect";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "player",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { register } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  function change(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await register(form);

      const user = JSON.parse(localStorage.getItem("sacl_user"));
      const requestedPath = location.state?.from;

      const redirectPath =
        user?.role === "team_owner" &&
        requestedPath?.startsWith("/tournaments/")
          ? requestedPath
          : getDashboardPath(user);

      nav(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-pitch p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-8"
      >
        <p className="font-bold text-lime">SACL 2.0</p>

        <h1 className="mt-2 text-3xl font-black">Create account</h1>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        {[
          ["name", "Full name", "text"],
          ["email", "Email", "email"],
          ["phone", "Phone number", "tel"],
          ["password", "Password (8+ characters)", "password"],
        ].map(([name, label, type]) => (
          <label key={name} className="mt-4 block text-sm">
            {label}
            <input
              required
              name={name}
              type={type}
              minLength={name === "password" ? 8 : undefined}
              value={form[name]}
              onChange={change}
              className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 outline-none focus:border-lime"
            />
          </label>
        ))}

        <label className="mt-4 block text-sm">
          Register as
          <select
            name="role"
            value={form.role}
            onChange={change}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 text-white outline-none focus:border-lime"
          >
            <option value="player">Player</option>
            <option value="team_owner">Team Owner</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-lime py-3 font-black text-pitch disabled:opacity-60"
        >
          {busy
            ? "Creating account..."
            : `Create ${form.role === "player" ? "player" : "team owner"} account`}
        </button>

        <p className="mt-4 text-center text-sm text-emerald-100/60">
          Already registered?{" "}
          <Link className="text-lime" to="/login">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-emerald-100/60">
          Registering a cricket association?{" "}
          <Link className="font-semibold text-lime" to="/organization/register">
            Register your organization
          </Link>
        </p>
      </form>
    </div>
  );
}
