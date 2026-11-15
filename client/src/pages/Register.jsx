import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "player",
  });

  const [error, setError] = useState("");
  const { register } = useAuth();
  const nav = useNavigate();

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      // Payload includes the selected role
      await register(form);
      nav("/registration");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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

        {/* Role dropdown */}
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
          className="mt-6 w-full rounded-xl bg-lime py-3 font-black text-pitch"
        >
          Create {form.role === "player" ? "player" : "team owner"} account
        </button>

        <p className="mt-4 text-center text-sm text-emerald-100/60">
          Already registered?{" "}
          <Link className="text-lime" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
