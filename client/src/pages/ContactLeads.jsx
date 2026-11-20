import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Trash2,
  Eye,
  X,
  Loader2,
  Users,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Save,
} from "lucide-react";
import { api } from "../lib/api";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const EMPTY_STATS = {
  total: 0,
  new: 0,
  contacted: 0,
  converted: 0,
  closed: 0,
};

export default function ContactLeads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [selectedLead, setSelectedLead] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------
  // GET LEADS API
  // ----------------------------------
  const fetchLeads = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/contact", {
          params: {
            page,
            limit: 10,
            search,
            status,
          },
        });

        if (response.data.success) {
          setLeads(response.data.data || []);
          setPagination(
            response.data.pagination || {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            },
          );
        }
      } catch (err) {
        console.error("Fetch leads error:", err);

        setError(
          err.response?.data?.message || "Failed to fetch contact leads.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status],
  );

  // ----------------------------------
  // GET LEAD STATISTICS API
  // ----------------------------------
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/contact/stats");

      if (response.data.success) {
        setStats({
          ...EMPTY_STATS,
          ...response.data.data,
        });
      }
    } catch (err) {
      console.error("Fetch lead statistics error:", err);
    }
  }, []);

  // ----------------------------------
  // INITIAL FETCH / FILTER CHANGES
  // ----------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchLeads]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ----------------------------------
  // REFRESH
  // ----------------------------------
  const handleRefresh = async () => {
    await Promise.all([fetchLeads(true), fetchStats()]);
  };

  // ----------------------------------
  // PATCH LEAD STATUS API
  // ----------------------------------
  const handleStatusChange = async (lead, newStatus) => {
    if (lead.status === newStatus) return;

    try {
      setUpdatingId(lead._id);
      setError("");
      setSuccess("");

      const response = await api.patch(`/contact/${lead._id}`, {
        status: newStatus,
      });

      if (response.data.success) {
        setLeads((previous) =>
          previous.map((item) =>
            item._id === lead._id ? { ...item, ...response.data.lead } : item,
          ),
        );

        if (selectedLead?._id === lead._id) {
          setSelectedLead(response.data.lead);
        }

        await fetchStats();

        setSuccess("Lead status updated successfully.");
      }
    } catch (err) {
      console.error("Update lead status error:", err);

      setError(err.response?.data?.message || "Failed to update lead status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ----------------------------------
  // PATCH ADMIN NOTES API
  // ----------------------------------
  const handleSaveNotes = async () => {
    if (!selectedLead) return;

    try {
      setUpdatingId(selectedLead._id);
      setError("");
      setSuccess("");

      const response = await api.patch(`/contact/${selectedLead._id}`, {
        adminNotes,
      });

      if (response.data.success) {
        const updatedLead = response.data.lead;

        setSelectedLead(updatedLead);

        setLeads((previous) =>
          previous.map((item) =>
            item._id === updatedLead._id ? { ...item, ...updatedLead } : item,
          ),
        );

        setSuccess("Admin notes saved successfully.");
      }
    } catch (err) {
      console.error("Save notes error:", err);

      setError(err.response?.data?.message || "Failed to save admin notes.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ----------------------------------
  // DELETE LEAD API
  // ----------------------------------
  const handleDeleteLead = async (lead) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the enquiry from ${lead.name}?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(lead._id);
      setError("");
      setSuccess("");

      const response = await api.delete(`/contact/${lead._id}`);

      if (response.data.success) {
        setLeads((previous) =>
          previous.filter((item) => item._id !== lead._id),
        );

        if (selectedLead?._id === lead._id) {
          setSelectedLead(null);
        }

        await fetchStats();

        // If the current page becomes empty, go to the previous page.
        if (leads.length === 1 && page > 1) {
          setPage((previous) => previous - 1);
        } else {
          await fetchLeads(true);
        }

        setSuccess("Lead deleted successfully.");
      }
    } catch (err) {
      console.error("Delete lead error:", err);

      setError(err.response?.data?.message || "Failed to delete lead.");
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------------------------
  // OPEN LEAD DETAILS
  // ----------------------------------
  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setAdminNotes(lead.adminNotes || "");
    setError("");
    setSuccess("");
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statCards = [
    {
      label: "Total Leads",
      value: stats.total,
      icon: Users,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "New Leads",
      value: stats.new,
      icon: UserPlus,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Contacted",
      value: stats.contacted,
      icon: Phone,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Converted",
      value: stats.converted,
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Closed",
      value: stats.closed,
      icon: XCircle,
      color: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8 bg-[#0d192c]">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contact Leads</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and track all enquiries received through WeKhiladi.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {item.value ?? 0}
                  </h2>
                </div>

                <div className={`rounded-lg p-3 ${item.color}`}>
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            placeholder="Search name, email, phone or subject..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Leads</option>
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* LEADS TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Enquiries</h2>

          <span className="text-sm text-slate-500">
            {pagination.total || 0} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <Loader2
                      className="mx-auto animate-spin text-blue-600"
                      size={28}
                    />
                    <p className="mt-3 text-slate-500">Loading enquiries...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <MessageSquare
                      size={35}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 font-medium text-slate-700">
                      No leads found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      New contact enquiries will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {lead.name}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {lead.email && (
                          <p className="flex items-center gap-2 text-slate-600">
                            <Mail size={13} />
                            {lead.email}
                          </p>
                        )}

                        {lead.phone && (
                          <p className="flex items-center gap-2 text-slate-600">
                            <Phone size={13} />
                            {lead.phone}
                          </p>
                        )}

                        {!lead.email && !lead.phone && "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {lead.subject || "General Enquiry"}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={lead.status || "new"}
                        disabled={updatingId === lead._id}
                        onChange={(e) =>
                          handleStatusChange(lead, e.target.value)
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none disabled:opacity-50 ${
                          STATUS_STYLES[lead.status] || STATUS_STYLES.new
                        }`}
                      >
                        {STATUS_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      {updatingId === lead._id && (
                        <Loader2
                          size={13}
                          className="ml-2 inline animate-spin"
                        />
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                      {formatDate(lead.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewLead(lead)}
                          title="View details"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteLead(lead)}
                          disabled={deletingId === lead._id}
                          title="Delete lead"
                          className="rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === lead._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Showing {leads.length ? (page - 1) * 10 + 1 : 0} to{" "}
            {(page - 1) * 10 + leads.length} of {pagination.total || 0}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((previous) => previous - 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm text-slate-600">
              {page} / {pagination.totalPages || 1}
            </span>

            <button
              disabled={page >= (pagination.totalPages || 1) || loading}
              onClick={() => setPage((previous) => previous + 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* LEAD DETAILS MODAL */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Lead Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enquiry information and follow-up notes
                </p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Name
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedLead.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Subject
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedLead.subject || "General Enquiry"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 break-all text-slate-700">
                    {selectedLead.email || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1 text-slate-700">
                    {selectedLead.phone || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Submitted
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDate(selectedLead.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Current Status
                  </p>

                  <select
                    value={selectedLead.status || "new"}
                    disabled={updatingId === selectedLead._id}
                    onChange={(e) =>
                      handleStatusChange(selectedLead, e.target.value)
                    }
                    className={`mt-1 rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${
                      STATUS_STYLES[selectedLead.status] || STATUS_STYLES.new
                    }`}
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase text-slate-400">
                  Message
                </p>

                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {selectedLead.message}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Admin Follow-up Notes
                </label>

                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  maxLength={3000}
                  placeholder="Add follow-up details, call updates or internal notes..."
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {adminNotes.length}/3000
                </p>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  onClick={handleSaveNotes}
                  disabled={updatingId === selectedLead._id}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingId === selectedLead._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
