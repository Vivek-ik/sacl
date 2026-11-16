import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date TBA";

export default function PublicTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/public/tournaments");

        setTournaments(Array.isArray(data) ? data : data.tournaments || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load tournaments.");
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  const filtered = tournaments.filter((t) =>
    [t.name, t.city, t.venue]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-pitch px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="font-bold text-lime">SACL 2.0</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Discover Cricket Tournaments
          </h1>
          <p className="mt-2 text-emerald-100/50">
            Find tournaments, register your team and compete.
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tournament, city or venue..."
          className="mb-8 w-full rounded-xl border border-white/10 bg-panel px-4 py-3 outline-none focus:border-lime sm:max-w-md"
        />

        {loading ? (
          <p className="py-12 text-center text-emerald-100/50">
            Loading tournaments...
          </p>
        ) : error ? (
          <p className="py-12 text-center text-red-300">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-panel p-10 text-center">
            <h2 className="text-xl font-bold">No tournaments found</h2>
            <p className="mt-2 text-sm text-emerald-100/50">
              Check back later for upcoming tournaments.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tournament) => (
              <article
                key={tournament._id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-panel"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-emerald-900 to-[#071b16]">
                  <span className="text-5xl">🏏</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold">{tournament.name}</h2>

                    <span className="rounded-full bg-lime/10 px-3 py-1 text-xs text-lime">
                      {tournament.registrationStatus || "Open"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-emerald-100/50">
                    {tournament.city || tournament.venue || "Venue TBA"}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-emerald-100/70">
                    <div className="flex justify-between">
                      <span>Start date</span>
                      <span>{formatDate(tournament.startDate)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>End date</span>
                      <span>{formatDate(tournament.endDate)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Team limit</span>
                      <span>{tournament.teamLimit ?? "—"}</span>
                    </div>
                  </div>

                  <Link
                    to={`/tournaments/${tournament._id}`}
                    className="mt-6 block rounded-xl bg-lime py-3 text-center font-bold text-pitch hover:bg-lime/90"
                  >
                    View Tournament
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
