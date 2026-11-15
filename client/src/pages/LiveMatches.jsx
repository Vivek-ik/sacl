import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio, RefreshCw, ChevronRight } from "lucide-react";
import { api } from "../lib/api";
export default function LiveMatches() {
  const [matches, setMatches] = useState([]),
    [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/public/matches");
      setMatches(data.matches || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load().catch(console.error);
  }, []);
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-lime">
            SACL 2.0
          </p>
          <h1 className="text-2xl font-black sm:text-3xl">Live Scores</h1>
          <p className="text-sm text-emerald-100/50">
            Follow tournament matches
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-white/10 p-2"
        >
          <RefreshCw size={17} />
        </button>
      </div>
      {loading ? (
        <div className="p-10 text-center">
          <RefreshCw className="mx-auto animate-spin text-lime" />
        </div>
      ) : matches.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((m) => (
            <Link
              key={m._id}
              to={`/live/${m._id}`}
              className="rounded-2xl border border-white/10 bg-panel p-5 hover:border-lime/30"
            >
              <div className="flex justify-between gap-2">
                <p className="text-xs text-emerald-100/50">{m.title}</p>
                <span className="text-xs uppercase text-lime">{m.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <b>{m.teamA?.name}</b>
                <span className="text-xs text-emerald-100/30">VS</span>
                <b className="text-right">{m.teamB?.name}</b>
              </div>
              <p className="mt-4 flex justify-between text-xs text-emerald-100/50">
                <span>{m.oversPerInnings} overs per innings</span>
                <span className="flex items-center text-lime">
                  Scorecard <ChevronRight size={14} />
                </span>
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 p-8 text-center text-sm text-emerald-100/50">
          No matches available.
        </p>
      )}
    </div>
  );
}
