import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../lib/authRedirect";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await login(identifier.trim(), password);

      const loggedInUser = JSON.parse(localStorage.getItem("sacl_user"));

      const requestedPath = location.state?.from;

      const redirectPath =
        loggedInUser?.role === "team_owner" &&
        requestedPath?.startsWith("/tournaments/")
          ? requestedPath
          : getDashboardPath(loggedInUser);

      nav(redirectPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-pitch p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-8 shadow-2xl"
      >
        <p className="text-sm font-bold text-lime">SACL 2.0</p>

        <h1 className="mt-2 text-3xl font-black">Welcome back</h1>

        <p className="mt-2 text-sm text-emerald-100/60">
          Sign in to your tournament account.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <label className="mt-6 block text-sm">
          Phone Number
          <input
            required
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter phone number"
            className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 outline-none focus:border-lime"
          />
        </label>

        <label className="mt-4 block text-sm">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 outline-none focus:border-lime"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-lime py-3 font-black text-pitch disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-5 text-center text-sm text-emerald-100/60">
          New here?{" "}
          <Link className="text-lime" to="/register">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
