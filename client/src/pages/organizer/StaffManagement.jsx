import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Gavel,
  Radio,
  MoreVertical,
  X,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Ban,
  RefreshCw,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { api } from "../../lib/api";

const roles = [
  {
    value: "auctioneer",
    label: "Auctioneer",
    description: "Manage player auctions",
    icon: Gavel,
  },
  {
    value: "scorer",
    label: "Scorer",
    description: "Manage assigned live matches",
    icon: Radio,
  },
  {
    value: "org_admin",
    label: "Organization Admin",
    description: "Manage this organization",
    icon: ShieldCheck,
  },
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  role: "auctioneer",
};

function StatusBadge({ status }) {
  const styles = {
    active: "bg-lime/10 text-lime border-lime/20",
    invited: "bg-blue-400/10 text-blue-300 border-blue-400/20",
    inactive: "bg-red-400/10 text-red-300 border-red-400/20",
    pending: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || styles.pending}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d281f] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-emerald-100/50">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/organization/staff");
      setStaff(data.staff || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load staff.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const counts = useMemo(
    () => ({
      total: staff.length,
      auctioneers: staff.filter((x) => x.role === "auctioneer").length,
      scorers: staff.filter((x) => x.role === "scorer").length,
      admins: staff.filter((x) => x.role === "org_admin").length,
    }),
    [staff],
  );

  const filteredStaff = useMemo(() => {
    return staff.filter((person) => {
      const matchesSearch =
        `${person.name} ${person.email} ${person.phone || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || person.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const openInvite = () => {
    setForm(initialForm);
    setSelectedStaff(null);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const submitInvite = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);

      await api.post("/organization/staff/invite", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
      });

      setSuccess("Invitation created successfully.");
      setModalOpen(false);
      setForm(initialForm);
      await loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStaffStatus = async (person) => {
    const nextStatus = person.isActive === false;

    if (
      !window.confirm(
        `${nextStatus ? "Activate" : "Deactivate"} ${person.name}?`,
      )
    )
      return;

    try {
      await api.patch(`/organization/staff/${person._id}`, {
        isActive: nextStatus,
      });
      await loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update staff.");
    }
  };

  const getStatus = (person) => {
    if (person.isActive === false) return "inactive";
    if (person.invitationStatus === "pending") return "invited";
    return "active";
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime">
            <ShieldCheck size={15} /> Organization Management
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Staff Management
          </h1>
          <p className="mt-2 text-sm text-emerald-100/50">
            Manage your organization team, permissions and invitations.
          </p>
        </div>

        <button
          onClick={openInvite}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-[#071b16] shadow-lg shadow-lime/10 transition hover:-translate-y-0.5 hover:bg-lime/90"
        >
          <UserPlus size={18} />
          Invite Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Staff"
          value={counts.total}
          icon={Users}
          color="bg-lime/10 text-lime"
        />
        <StatCard
          label="Auctioneers"
          value={counts.auctioneers}
          icon={Gavel}
          color="bg-purple-400/10 text-purple-300"
        />
        <StatCard
          label="Scorers"
          value={counts.scorers}
          icon={Radio}
          color="bg-blue-400/10 text-blue-300"
        />
        <StatCard
          label="Organization Admins"
          value={counts.admins}
          icon={ShieldCheck}
          color="bg-amber-400/10 text-amber-300"
        />
      </div>

      {/* Staff table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050817]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-bold text-white">Organization Members</h2>
            <p className="mt-1 text-xs text-emerald-100/40">
              View and manage your staff members.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full rounded-xl border border-white/10 bg-[#050817] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-lime/50 sm:w-64"
              />
            </div>

            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-[#050817] px-4 py-2.5 pr-10 text-sm outline-none focus:border-lime/50"
              >
                <option value="all">All roles</option>
                <option value="auctioneer">Auctioneer</option>
                <option value="scorer">Scorer</option>
                <option value="org_admin">Organization Admin</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/50"
              />
            </div>

            <button
              onClick={loadStaff}
              className="rounded-xl border border-white/10 p-2.5 text-emerald-100/60 hover:bg-white/5"
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-emerald-100/40">
              <tr>
                <th className="px-5 py-4">Staff Member</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-16 text-center text-emerald-100/50"
                  >
                    <Loader2 className="mx-auto mb-3 animate-spin" />
                    Loading staff...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <Users
                      size={30}
                      className="mx-auto mb-3 text-emerald-100/30"
                    />
                    <p className="font-semibold">No staff members found</p>
                    <p className="mt-1 text-xs text-emerald-100/40">
                      Invite your first auctioneer or scorer.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((person) => {
                  const RoleIcon =
                    roles.find((r) => r.value === person.role)?.icon || Users;

                  return (
                    <tr
                      key={person._id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 font-bold text-lime">
                            {person.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {person.name}
                            </p>
                            <p className="mt-1 text-xs text-emerald-100/40">
                              {person.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-emerald-100/70">
                          <RoleIcon size={16} />
                          {roles.find((r) => r.value === person.role)?.label ||
                            person.role}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-emerald-100/50">
                        {person.phone || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={getStatus(person)} />
                      </td>

                      <td className="px-5 py-4 text-emerald-100/50">
                        {person.createdAt
                          ? new Date(person.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {person.role !== "org_admin" && (
                          <button
                            onClick={() => toggleStaffStatus(person)}
                            className="rounded-lg border border-white/10 p-2 text-emerald-100/60 hover:bg-white/5"
                            title={
                              person.isActive === false
                                ? "Activate"
                                : "Deactivate"
                            }
                          >
                            {person.isActive === false ? (
                              <CheckCircle2 size={17} />
                            ) : (
                              <Ban size={17} />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-emerald-100/40">
          Showing {filteredStaff.length} of {staff.length} members
        </div>
      </div>

      {/* Invite modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#050817] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-bold">Invite Staff Member</h2>
                <p className="mt-1 text-xs text-emerald-100/40">
                  Add a member to your organization.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-emerald-100/50 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitInvite} className="space-y-5 p-6">
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Full name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm outline-none focus:border-lime/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
                  />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="person@example.com"
                    className="w-full rounded-xl border border-white/10 bg-[#050817] py-3 pl-10 pr-4 text-sm outline-none focus:border-lime/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Phone number
                </label>
                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-white/10 bg-[#050817] py-3 pl-10 pr-4 text-sm outline-none focus:border-lime/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold">
                  Assign role
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles
                    .filter((r) => r.value !== "org_admin")
                    .map((role) => {
                      const Icon = role.icon;
                      const active = form.role === role.value;

                      return (
                        <button
                          type="button"
                          key={role.value}
                          onClick={() => setForm({ ...form, role: role.value })}
                          className={`rounded-xl border p-4 text-left transition ${
                            active
                              ? "border-lime bg-lime/[0.08]"
                              : "border-white/10 bg-[#050817] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon
                              size={20}
                              className={
                                active ? "text-lime" : "text-emerald-100/50"
                              }
                            />
                            {active && (
                              <CheckCircle2 size={17} className="text-lime" />
                            )}
                          </div>
                          <p className="mt-3 text-sm font-bold">{role.label}</p>
                          <p className="mt-1 text-xs text-emerald-100/40">
                            {role.description}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-[#071b16] disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Mail size={17} />
                  )}
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
