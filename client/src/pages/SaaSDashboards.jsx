import {
  Building2,
  Users,
  CreditCard,
  Wallet,
  Trophy,
  ShieldCheck,
  CalendarDays,
  UserCheck,
  TrendingUp,
  Plus,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import AddTournamentsModal from "../components/AddTournamentsModal";
import { api } from "../lib/api";

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

function LoadingState() {
  return (
    <div className="py-12 text-center text-sm text-emerald-100/50">
      Loading data...
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function DataTable({ columns, rows, emptyTitle, emptyDescription, renderRow }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-white/10 [&>table]:whitespace-nowrap">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase text-emerald-100/50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-5 py-4 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/10">
          {rows.map((row, index) => renderRow(row, index))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "unknown").toLowerCase();

  const styles = {
    active: "bg-lime/10 text-lime",
    approved: "bg-lime/10 text-lime",
    completed: "bg-blue-500/10 text-blue-300",
    suspended: "bg-red-500/10 text-red-300",
    rejected: "bg-red-500/10 text-red-300",
    pending: "bg-yellow-500/10 text-yellow-300",
    draft: "bg-white/10 text-white/60",
    live: "bg-red-500/10 text-red-300",
    upcoming: "bg-blue-500/10 text-blue-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[value] || "bg-white/10 text-white/60"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

const formatCurrency = (value) =>
  value == null ? "—" : `₹${Number(value).toLocaleString("en-IN")}`;

function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="break-words text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 break-words text-sm text-emerald-100/50">
          {description}
        </p>
      </div>

      {action && <div className="w-full min-w-0 sm:w-auto">{action}</div>}
    </div>
  );
}

function StatCard({ title, value = "—", icon: Icon, description }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0b211a] p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-emerald-100/50">{title}</p>
          <h2 className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">
            {value}
          </h2>
          {description && (
            <p className="mt-2 text-xs text-emerald-100/40">{description}</p>
          )}
        </div>

        <div className="shrink-0 rounded-xl bg-lime/10 p-2.5 text-lime sm:p-3">
          <Icon size={20} className="sm:h-[22px] sm:w-[22px]" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0b211a] p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center text-center">
      <div className="mb-3 rounded-full bg-white/5 p-4 text-emerald-100/40">
        <Trophy size={24} />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-emerald-100/40">{description}</p>
    </div>
  );
}

function SearchBar({ placeholder = "Search..." }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        size={17}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
      />
      <input
        placeholder={placeholder}
        className="w-full min-w-0 rounded-xl border border-white/10 bg-[#071b16] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-emerald-100/30 focus:border-lime/50 sm:py-2.5"
      />
    </div>
  );
}

function TableShell({ columns, emptyTitle, emptyDescription }) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-white/10">
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-emerald-100/50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-5 py-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      <EmptyState title={emptyTitle} description={emptyDescription} />
    </div>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-bold text-[#071b16] transition hover:bg-lime/90 sm:w-auto sm:py-2.5"
    >
      <Plus size={17} />
      {children}
    </button>
  );
}

// --------------------------------------------------
// SUPER ADMIN DASHBOARD
// --------------------------------------------------

export function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/super-admin/dashboard");
      setStats(data?.stats || {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Platform Overview"
        description="Monitor your SACL platform and registered organizations."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDashboard} />
      ) : (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total Organizations"
              value={stats?.totalOrganizations ?? 0}
              icon={Building2}
              description="All registered organizations"
            />
            <StatCard
              title="Active Organizations"
              value={stats?.activeOrganizations ?? 0}
              icon={ShieldCheck}
              description="Currently active"
            />
            <StatCard
              title="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              description="Across the platform"
            />
          </div>

          <div className="mt-6">
            <Panel title="Platform Metrics">
              <p className="text-sm text-emerald-100/50">
                Revenue, payments, subscription breakdown, and monthly recurring
                revenue need additional backend reporting APIs.
              </p>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
// --------------------------------------------------
// SUPER ADMIN MANAGEMENT SCREENS
// --------------------------------------------------

// --------------------------------------------------
// ORGANIZER DASHBOARD
// --------------------------------------------------

export function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/super-admin/organizations");
      setOrganizations(data?.organizations || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const updateStatus = async (org) => {
    const nextStatus = org.status === "active" ? "suspended" : "active";

    if (
      !window.confirm(
        `Are you sure you want to ${nextStatus} this organization?`,
      )
    ) {
      return;
    }

    try {
      await api.patch(`/super-admin/organizations/${org._id}/status`, {
        status: nextStatus,
      });

      await fetchOrganizations();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name?.toLowerCase().includes(search.toLowerCase()) ||
      org.slug?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || org.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Organizations"
        description="Manage all cricket associations and tournament organizers."
      />

      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organization name or slug..."
          className="w-full min-w-0 rounded-xl border border-white/10 bg-[#071b16] px-4 py-3 text-sm outline-none sm:max-w-xs sm:py-2.5"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b211a] px-4 py-2.5 text-sm sm:w-auto"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <Panel title={`Organizations (${filteredOrganizations.length})`}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOrganizations} />
        ) : (
          <DataTable
            columns={[
              "Organization",
              "Slug",
              "Country",
              "Created",
              "Status",
              "Actions",
            ]}
            rows={filteredOrganizations}
            emptyTitle="No organizations found"
            emptyDescription="Registered organizations will appear here."
            renderRow={(org) => (
              <tr key={org._id}>
                <td className="px-5 py-4 font-semibold">{org.name}</td>

                <td className="px-5 py-4 text-emerald-100/60">
                  {org.slug || "—"}
                </td>

                <td className="px-5 py-4">{org.address?.country || "—"}</td>

                <td className="px-5 py-4">{formatDate(org.createdAt)}</td>

                <td className="px-5 py-4">
                  <StatusBadge status={org.status} />
                </td>

                <td className="px-5 py-4">
                  <button
                    onClick={() => updateStatus(org)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
                  >
                    {org.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            )}
          />
        )}
      </Panel>
    </div>
  );
}

export function PlatformUsers() {
  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Platform Users"
        description="View users across all SACL organizations."
      />

      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchBar placeholder="Search by name, email or phone..." />

        <select className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b211a] px-4 py-2.5 text-sm outline-none sm:w-auto">
          <option>All roles</option>
          <option>Organization Admin</option>
          <option>Auctioneer</option>
          <option>Scorer</option>
          <option>Team Owner</option>
          <option>Player</option>
        </select>
      </div>

      <Panel title="All Users">
        <TableShell
          columns={[
            "User",
            "Organization",
            "Role",
            "Email",
            "Status",
            "Joined",
            "Actions",
          ]}
          emptyTitle="No users loaded"
          emptyDescription="Organization users will appear here."
        />
      </Panel>
    </div>
  );
}

export function Payments() {
  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Payments"
        description="Track subscription payments and transaction history."
      />

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3">
        <StatCard title="Total Payments" icon={CreditCard} />
        <StatCard title="Successful Payments" icon={ShieldCheck} />
        <StatCard title="Failed Payments" icon={Wallet} />
      </div>

      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchBar placeholder="Search transaction or organization..." />

        <select className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b211a] px-4 py-2.5 text-sm outline-none sm:w-auto">
          <option>All payment statuses</option>
          <option>Success</option>
          <option>Pending</option>
          <option>Failed</option>
          <option>Refunded</option>
        </select>
      </div>

      <Panel title="Transaction History">
        <TableShell
          columns={[
            "Transaction ID",
            "Organization",
            "Plan",
            "Amount",
            "Payment Date",
            "Status",
            "Invoice",
          ]}
          emptyTitle="No payments loaded"
          emptyDescription="Payment transactions will appear here once connected to the payment API."
        />
      </Panel>
    </div>
  );
}

export function Subscriptions() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/saas/subscription");
      setSubscription(data?.subscription || data?.data || data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="My Subscription"
        description="View your organization's current subscription."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSubscription} />
      ) : !subscription ? (
        <EmptyState
          title="No subscription found"
          description="Your organization's subscription details will appear here."
        />
      ) : (
        <Panel title="Current Subscription">
          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-emerald-100/40">Plan</p>
              <p className="mt-1 text-xl font-bold">
                {subscription.plan?.name || subscription.planName || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-emerald-100/40">Status</p>
              <div className="mt-2">
                <StatusBadge status={subscription.status} />
              </div>
            </div>

            <div>
              <p className="text-xs text-emerald-100/40">Start date</p>
              <p className="mt-1 font-semibold">
                {formatDate(subscription.startDate)}
              </p>
            </div>

            <div>
              <p className="text-xs text-emerald-100/40">End date</p>
              <p className="mt-1 font-semibold">
                {formatDate(subscription.endDate)}
              </p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/saas/plans");
      setPlans(data?.plans || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const formatPrice = (paise) =>
    `₹${(Number(paise || 0) / 100).toLocaleString("en-IN")}`;

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Plans & Pricing"
        description="View subscription plans offered to SACL organizations."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPlans} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No plans available"
          description="No subscription plans have been configured yet."
        />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="min-w-0 rounded-2xl border border-white/10 bg-[#0b211a] p-4 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <p className="mt-1 text-xs text-emerald-100/40">
                    {plan.code}
                  </p>
                </div>

                <StatusBadge status={plan.isActive ? "Active" : "Inactive"} />
              </div>

              <div className="my-6 space-y-2">
                <p className="text-3xl font-black">
                  {formatPrice(plan.priceMonthlyPaise)}
                  <span className="text-sm font-normal text-emerald-100/40">
                    {" "}
                    / month
                  </span>
                </p>

                <p className="text-sm text-emerald-100/50">
                  {formatPrice(plan.priceYearlyPaise)} / year
                </p>

                {plan.trialDays > 0 && (
                  <p className="text-sm font-semibold text-lime">
                    {plan.trialDays}-day free trial
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 pt-5">
                <h3 className="mb-4 text-sm font-bold">Plan Limits</h3>

                <div className="space-y-3 text-sm text-emerald-100/60">
                  <div className="flex justify-between">
                    <span>Tournaments</span>
                    <strong>{plan.limits?.tournaments ?? "—"}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Teams</span>
                    <strong>{plan.limits?.teams ?? "—"}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Players per team</span>
                    <strong>{plan.limits?.playersPerTeam ?? "—"}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Users</span>
                    <strong>{plan.limits?.users ?? "—"}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <h3 className="mb-4 text-sm font-bold">Features</h3>

                <div className="space-y-3 text-sm">
                  {Object.entries(plan.features || {}).map(
                    ([feature, enabled]) => (
                      <div
                        key={feature}
                        className="flex min-w-0 items-center justify-between gap-3"
                      >
                        <span className="min-w-0 break-words capitalize text-emerald-100/60">
                          {feature.replace(/([A-Z])/g, " $1")}
                        </span>

                        <span
                          className={enabled ? "text-lime" : "text-red-400"}
                        >
                          {enabled ? "Included" : "Not included"}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// ORGANIZER MANAGEMENT SCREENS
// --------------------------------------------------

export function Tournaments() {
  const [addTournamentsModalOpen, setAddTournamentsModalOpen] = useState(false);

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // GET: Fetch tournaments
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/tournaments");

      const data = response.data;

      // Supports either { tournaments: [] } or a direct array response
      const tournamentList = Array.isArray(data)
        ? data
        : data?.tournaments || data?.data || [];

      setTournaments(tournamentList);
    } catch (err) {
      console.error("Fetch tournaments error:", err);

      setError(err.response?.data?.message || "Failed to load tournaments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name?.toLowerCase().includes(search.toLowerCase()) ||
      tournament.city?.toLowerCase().includes(search.toLowerCase()) ||
      tournament.venue?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      tournament.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-400";

      case "completed":
        return "bg-blue-500/10 text-blue-400";

      case "registration_open":
      case "registration open":
        return "bg-lime/10 text-lime";

      case "draft":
        return "bg-yellow-500/10 text-yellow-400";

      default:
        return "bg-white/10 text-emerald-100/60";
    }
  };

  const totalTournaments = tournaments.length;

  const activeTournaments = tournaments.filter(
    (t) => t.status?.toLowerCase() === "active",
  ).length;

  const completedTournaments = tournaments.filter(
    (t) => t.status?.toLowerCase() === "completed",
  ).length;

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Tournaments"
        description="Create and manage your cricket tournaments."
        action={
          <PrimaryButton onClick={() => setAddTournamentsModalOpen(true)}>
            Create Tournament
          </PrimaryButton>
        }
      />

      {/* Stats */}
      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3">
        <StatCard
          title="Total Tournaments"
          value={totalTournaments}
          icon={Trophy}
        />

        <StatCard
          title="Active Tournaments"
          value={activeTournaments}
          icon={TrendingUp}
        />

        <StatCard
          title="Completed Tournaments"
          value={completedTournaments}
          icon={ShieldCheck}
        />
      </div>

      {/* Search and filter */}
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments..."
            className="w-full min-w-0 rounded-xl border border-white/10 bg-[#071b16] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-emerald-100/30 focus:border-lime/50 sm:py-2.5"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0b211a] px-4 py-2.5 text-sm text-white outline-none"
        >
          <option value="all">All tournaments</option>
          <option value="draft">Draft</option>
          <option value="registration_open">Registration Open</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

        <button
          onClick={fetchTournaments}
          className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5 sm:w-auto"
        >
          Refresh
        </button>
      </div>

      {/* Tournament table */}
      <Panel title="Tournament List">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center text-sm text-emerald-100/50">
            Loading tournaments...
          </div>
        ) : error ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-red-400">{error}</p>

            <button
              onClick={fetchTournaments}
              className="rounded-lg bg-lime px-4 py-2 text-sm font-bold text-[#071b16]"
            >
              Try Again
            </button>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <EmptyState
            title={
              search || statusFilter !== "all"
                ? "No matching tournaments"
                : "No tournaments yet"
            }
            description="Create your first tournament to start managing teams, players and matches."
          />
        ) : (
          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-white/10">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-emerald-100/50">
                <tr>
                  {[
                    "Tournament",
                    "Dates",
                    "Teams",
                    "Squad Size",
                    "Purse",
                    "Status",
                  ].map((column) => (
                    <th key={column} className="px-5 py-4 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredTournaments.map((tournament) => (
                  <tr
                    key={tournament._id}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">
                        {tournament.name}
                      </p>

                      <p className="mt-1 text-xs text-emerald-100/40">
                        {tournament.city || tournament.venue || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-emerald-100/60">
                      <div>{formatDate(tournament.startDate)}</div>
                      <div className="mt-1 text-xs text-emerald-100/40">
                        To {formatDate(tournament.endDate)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-emerald-100/70">
                      {tournament.teamCount ?? tournament.teams?.length ?? 0}
                      {" / "}
                      {tournament.teamLimit ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-emerald-100/70">
                      {tournament.squadSize ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-emerald-100/70">
                      {tournament.purseTotal != null
                        ? `₹${Number(tournament.purseTotal).toLocaleString(
                            "en-IN",
                          )}`
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                          tournament.status,
                        )}`}
                      >
                        {tournament.status?.replaceAll("_", " ") || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Create tournament modal */}
      {addTournamentsModalOpen && (
        <AddTournamentsModal
          onClose={() => setAddTournamentsModalOpen(false)}
          onCreated={() => {
            setAddTournamentsModalOpen(false);
            fetchTournaments();
          }}
        />
      )}
    </div>
  );
}

export function TeamsManagement() {
  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Teams"
        description="Manage participating teams across your tournaments."
      />

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Teams" icon={ShieldCheck} />
        <StatCard title="Approved Teams" icon={UserCheck} />
        <StatCard title="Pending Approval" icon={Users} />
        <StatCard title="Available Slots" icon={Trophy} />
      </div>

      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchBar placeholder="Search team name or owner..." />

        <select className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b211a] px-4 py-2.5 text-sm outline-none sm:w-auto">
          <option>All tournaments</option>
        </select>

        <select className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b211a] px-4 py-2.5 text-sm outline-none sm:w-auto">
          <option>All statuses</option>
          <option>Approved</option>
          <option>Pending</option>
          <option>Rejected</option>
        </select>
      </div>

      <Panel title="Participating Teams">
        <TableShell
          columns={[
            "Team",
            "Owner",
            "Tournament",
            "Players",
            "Squad",
            "Purse Remaining",
            "Status",
            "Actions",
          ]}
          emptyTitle="No teams loaded"
          emptyDescription="Teams registered for your tournaments will appear here."
        />
      </Panel>
    </div>
  );
}

export function PlayersManagement() {
  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Players"
        description="Manage player registrations, approvals and auction eligibility."
      />

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Registered Players" icon={Users} />
        <StatCard title="Approved Players" icon={UserCheck} />
        <StatCard title="Pending Approval" icon={ShieldCheck} />
        <StatCard title="Auctioned Players" icon={Trophy} />
      </div>

      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchBar placeholder="Search player name..." />

        <select className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0b211a] px-4 py-2.5 text-sm outline-none sm:w-auto">
          <option>All categories</option>
          <option>ICONIC</option>
          <option>A</option>
          <option>B</option>
          <option>C</option>
          <option>D</option>
        </select>
      </div>

      <Panel title="Player Registrations">
        <TableShell
          columns={[
            "Player",
            "Category",
            "Playing Role",
            "Team",
            "Registration",
            "Approval",
            "Actions",
          ]}
          emptyTitle="No players loaded"
          emptyDescription="Player registrations will appear here."
        />
      </Panel>
    </div>
  );
}

export function OrganizerMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/matches");
      setMatches(getList(data, ["matches"]));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const filteredMatches = matches.filter((match) => {
    const teamA = match.teamA?.name || "";
    const teamB = match.teamB?.name || "";
    const tournament = match.tournament?.name || "";

    return `${teamA} ${teamB} ${tournament}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const countByStatus = (status) =>
    matches.filter((match) => String(match.status).toLowerCase() === status)
      .length;

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Matches"
        description="View fixtures and manage tournament matches."
      />

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Matches"
          value={matches.length}
          icon={CalendarDays}
        />
        <StatCard
          title="Upcoming"
          value={countByStatus("upcoming")}
          icon={Trophy}
        />
        <StatCard
          title="Live Matches"
          value={countByStatus("live")}
          icon={TrendingUp}
        />
        <StatCard
          title="Completed"
          value={countByStatus("completed")}
          icon={ShieldCheck}
        />
      </div>

      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search matches or teams..."
          className="w-full min-w-0 rounded-xl border border-white/10 bg-[#071b16] px-4 py-3 text-sm outline-none sm:max-w-xs sm:py-2.5"
        />
      </div>

      <Panel title={`Tournament Fixtures (${filteredMatches.length})`}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchMatches} />
        ) : (
          <DataTable
            columns={["Match", "Tournament", "Overs", "Scorer", "Status"]}
            rows={filteredMatches}
            emptyTitle="No matches found"
            emptyDescription="Matches created for your tournaments will appear here."
            renderRow={(match) => (
              <tr key={match._id}>
                <td className="px-5 py-4 font-semibold">
                  {match.teamA?.name || "Team A"} vs{" "}
                  {match.teamB?.name || "Team B"}
                </td>
                <td className="px-5 py-4">{match.tournament?.name || "—"}</td>
                <td className="px-5 py-4">{match.overs ?? "—"}</td>
                <td className="px-5 py-4">
                  {match.scorer?.name || "Not assigned"}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={match.status} />
                </td>
              </tr>
            )}
          />
        )}
      </Panel>
    </div>
  );
}
