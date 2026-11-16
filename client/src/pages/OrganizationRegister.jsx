import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function OrganizationRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organizationName: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters");
      return;
    }

    setBusy(true);

    try {
      const { data } = await api.post("/saas/organizations/register", form);

      localStorage.setItem("sacl_token", data.token);
      localStorage.setItem("sacl_user", JSON.stringify(data.user));

      window.location.href = "/";
    } catch (err) {
      setError(
        err.response?.data?.message || "Organization registration failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ["organizationName", "Organization name", "text"],
    ["adminName", "Administrator full name", "text"],
    ["email", "Administrator email", "email"],
    ["phone", "Contact number", "tel"],
    ["password", "Password", "password"],
  ];

  return (
    <div className="grid min-h-screen place-items-center bg-pitch p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-panel p-8"
      >
        <p className="font-bold text-lime">SACL 2.0</p>

        <h1 className="mt-2 text-3xl font-black">Register your organization</h1>

        <p className="mt-2 text-sm text-emerald-100/60">
          Create an organization account to manage tournaments, teams, players
          and live scoring.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {fields.map(([name, label, type]) => (
          <label key={name} className="mt-4 block text-sm">
            {label}

            <input
              required={name !== "phone"}
              name={name}
              type={type}
              minLength={name === "password" ? 8 : undefined}
              value={form[name]}
              onChange={change}
              className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 outline-none focus:border-lime"
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-lime py-3 font-black text-pitch disabled:opacity-60"
        >
          {busy ? "Registering..." : "Register Organization"}
        </button>

        <p className="mt-5 text-center text-sm text-emerald-100/60">
          Already registered?{" "}
          <Link to="/login" className="text-lime">
            Sign in
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-emerald-100/60">
          Register as an individual?{" "}
          <Link to="/register" className="text-lime">
            Individual registration
          </Link>
        </p>
      </form>
    </div>
  );
}
