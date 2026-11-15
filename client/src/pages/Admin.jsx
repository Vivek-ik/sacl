import { useEffect, useState } from "react";
import { api } from "../lib/api";
export default function Admin() {
  const [data, setData] = useState({ players: [], teams: [] });
  const [error, setError] = useState("");
  async function load() {
    try {
      const r = await api.get("/admin/applications");
      setData(r.data);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load applications");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function review(entity, id, status) {
    try {
      await api.patch(`/admin/applications/${entity}/${id}`, { status });
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Review failed");
    }
  }
  const Section = ({ title, entity, items, name }) => (
    <section className="mt-6 rounded-2xl border border-white/10 bg-panel p-5">
      <h2 className="text-xl font-bold">
        {title}{" "}
        <span className="text-sm text-emerald-100/40">({items.length})</span>
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((x) => (
          <div
            key={x._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-pitch p-4"
          >
            <div>
              <p className="font-semibold">{name(x)}</p>
              <p className="text-xs text-emerald-100/50">
                {x.user?.email || x.primaryOwner?.email || "—"} ·{" "}
                {x.approvalStatus}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => review(entity, x._id, "approved")}
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300"
              >
                Approve
              </button>
              <button
                onClick={() => review(entity, x._id, "rejected")}
                className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="text-sm text-emerald-100/40">No applications yet.</p>
        )}
      </div>
    </section>
  );
  return (
    <div>
      <h1 className="text-3xl font-black">Admin approvals</h1>
      <p className="mt-2 text-sm text-emerald-100/50">
        Review player and team applications.
      </p>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <Section
        title="Player applications"
        entity="players"
        items={data.players}
        name={(x) => `${x.fullName} · ${x.category} · ${x.role}`}
      />
      <Section
        title="Team applications"
        entity="teams"
        items={data.teams}
        name={(x) => x.name}
      />
    </div>
  );
}
