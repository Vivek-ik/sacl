import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../lib/authRedirect";
// import { getDashboardPath } from "../utils/authRedirect";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await login(email, password);

      const user = JSON.parse(localStorage.getItem("sacl_user"));

      const requestedPath = location.state?.from;

      // Only preserve public tournament destinations here.
      const redirectPath =
        user?.role === "team_owner" &&
        requestedPath?.startsWith("/tournaments/")
          ? requestedPath
          : getDashboardPath(user);

      nav(redirectPath, { replace: true });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to dashboard", user);
      return nav("/");
    }
  }, [user]);
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
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 outline-none focus:border-lime"
          />
        </label>

        <label className="mt-4 block text-sm">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 outline-none focus:border-lime"
          />
        </label>

        <button
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-lime py-3 font-black text-pitch disabled:opacity-60"
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
