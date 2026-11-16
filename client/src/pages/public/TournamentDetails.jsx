import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 text-white outline-none focus:border-lime";

export default function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    coOwnerName: "",
    coOwnerPhone: "",
  });

  useEffect(() => {
    const loadTournament = async () => {
      try {
        const { data } = await api.get(`/public/tournaments/${id}`);
        setTournament(data.tournament || data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load tournament details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [id]);

  const change = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const registerTeam = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!user) {
      navigate("/login", {
        state: { from: `/tournaments/${id}` },
      });
      return;
    }

    if (user.role !== "team_owner") {
      setError("Please sign in with a Team Owner account to register.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/registrations/team", {
        name: form.name,
        coOwnerName: form.coOwnerName,
        coOwnerPhone: form.coOwnerPhone,
        tournamentId: id,
      });

      setMessage("Team application submitted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Team registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pitch p-10 text-white">Loading...</div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-pitch p-10 text-white">
        {error || "Tournament not found"}
        <Link to="/tournaments" className="ml-3 text-lime">
          Back to tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pitch px-5 py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-white/10 bg-panel p-6">
          <Link to="/tournaments" className="text-sm text-lime">
            ← All tournaments
          </Link>

          <p className="mt-8 text-5xl">🏏</p>

          <h1 className="mt-5 text-3xl font-black">{tournament.name}</h1>

          <p className="mt-2 text-emerald-100/50">
            {tournament.city || tournament.venue || "Venue to be announced"}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              ["Start date", tournament.startDate],
              ["End date", tournament.endDate],
              ["Team limit", tournament.teamLimit],
              ["Squad size", tournament.squadSize],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-pitch p-4">
                <p className="text-xs text-emerald-100/40">{label}</p>
                <p className="mt-2 font-bold">
                  {label.toLowerCase().includes("date") && value
                    ? new Date(value).toLocaleDateString("en-IN")
                    : (value ?? "—")}
                </p>
              </div>
            ))}
          </div>

          {tournament.description && (
            <div className="mt-8">
              <h2 className="text-lg font-bold">About this tournament</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-emerald-100/60">
                {tournament.description}
              </p>
            </div>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-white/10 bg-panel p-6">
          <h2 className="text-xl font-black">Register Your Team</h2>
          <p className="mt-2 text-sm text-emerald-100/50">
            Submit your team application for this tournament.
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-lg bg-lime/10 p-3 text-sm text-lime">
              {message}
            </p>
          )}

          {!user ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-emerald-100/60">
                Sign in with your Team Owner account to register.
              </p>
              <button
                onClick={() =>
                  navigate("/login", {
                    state: { from: `/tournaments/${id}` },
                  })
                }
                className="w-full rounded-xl bg-lime py-3 font-bold text-pitch"
              >
                Sign in to continue
              </button>
              <Link
                to="/register"
                className="block text-center text-sm text-lime"
              >
                Create a Team Owner account
              </Link>
            </div>
          ) : user.role !== "team_owner" ? (
            <p className="mt-5 text-sm text-yellow-300">
              You are signed in as {user.role}. Please use a Team Owner account.
            </p>
          ) : (
            <form onSubmit={registerTeam} className="mt-5">
              <label className="block text-sm">
                Team name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={change}
                  className={inputClass}
                  placeholder="Enter team name"
                />
              </label>

              <label className="mt-4 block text-sm">
                Primary owner
                <input
                  value={user.name || ""}
                  disabled
                  className={`${inputClass} opacity-60`}
                />
              </label>

              <label className="mt-4 block text-sm">
                Co-owner name
                <input
                  name="coOwnerName"
                  value={form.coOwnerName}
                  onChange={change}
                  className={inputClass}
                  placeholder="Optional"
                />
              </label>

              <label className="mt-4 block text-sm">
                Co-owner phone
                <input
                  name="coOwnerPhone"
                  type="tel"
                  value={form.coOwnerPhone}
                  onChange={change}
                  className={inputClass}
                  placeholder="Optional"
                />
              </label>

              <button
                disabled={submitting || !!message}
                className="mt-6 w-full rounded-xl bg-lime py-3 font-black text-pitch disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Team Application"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
