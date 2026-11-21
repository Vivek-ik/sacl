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
  Pencil,
  Trash2,
  X,
  Download,
  Columns3,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import AddTournamentsModal from "../components/AddTournamentsModal";
import { api } from "../lib/api";

import { Copy, Check } from "lucide-react";

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

function DataTable({
  columns = [],
  rows = [],
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display.",
  renderRow,

  // Display
  loading = false,
  stickyHeader = true,
  minWidth = "800px",
  density: initialDensity = "comfortable",

  // Features
  searchable = true,
  sortable = true,
  filterable = true,
  selectable = false,
  pagination = true,
  exportable = true,
  columnVisibility = true,
  refreshable = true,

  // Pagination
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],

  // Server-side pagination:
  // { page, pageSize, total, onPageChange, onPageSizeChange }
  serverPagination,

  // Actions
  onRefresh,
  onSelectionChange,
  bulkActions,
  toolbarActions,
  filters,

  // Selection
  getRowId = (row, index) => row?._id || row?.id || index,

  searchPlaceholder = "Search all records...",
  emptyAction,
}) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [density, setDensity] = useState(initialDensity);
  const [columnFilters, setColumnFilters] = useState({});

  const isServerSide = Boolean(serverPagination);

  const normalizedColumns = useMemo(
    () =>
      columns.map((column, index) => {
        if (typeof column === "string") {
          return {
            key: `column_${index}`,
            label: column,
            sortable: false,
            searchable: true,
            filterable: false,
            visible: true,
          };
        }

        return {
          ...column,
          key: column.key || column.accessor || `column_${index}`,
          label: column.label || column.header || column.key,
          sortable: column.sortable !== false,
          searchable: column.searchable !== false,
          filterable: Boolean(column.filterOptions),
          visible: column.hidden !== true,
        };
      }),
    [columns],
  );

  // Resolve nested object paths such as organization.name
  const getValue = (row, column) => {
    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }

    const path = column.accessor || column.key;

    if (!path || path.startsWith("column_")) return "";

    return path.split(".").reduce((value, key) => value?.[key], row);
  };

  const getRowKey = (row, index) => String(getRowId(row, index));

  const activeColumns = normalizedColumns.filter(
    (column) => visibleColumns[column.key] !== false,
  );

  const hasColumnFilters = normalizedColumns.some(
    (column) => column.filterOptions?.length,
  );

  // Search and column filtering
  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (search.trim()) {
      const query = search.toLowerCase().trim();

      result = result.filter((row) => {
        return normalizedColumns.some((column) => {
          if (!column.searchable) return false;

          const value = getValue(row, column);

          return String(value ?? "")
            .toLowerCase()
            .includes(query);
        });
      });
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value || value === "all") return;

      const column = normalizedColumns.find((item) => item.key === key);

      if (!column) return;

      result = result.filter(
        (row) => String(getValue(row, column)) === String(value),
      );
    });

    return result;
  }, [rows, search, columnFilters, normalizedColumns]);

  // Multi-column sorting
  const sortedRows = useMemo(() => {
    if (!sortConfig.length || isServerSide) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      for (const sort of sortConfig) {
        const column = normalizedColumns.find((item) => item.key === sort.key);

        if (!column) continue;

        const first = getValue(a, column);
        const second = getValue(b, column);

        if (first == null && second == null) continue;
        if (first == null) return 1;
        if (second == null) return -1;

        let comparison;

        if (typeof first === "number" && typeof second === "number") {
          comparison = first - second;
        } else {
          comparison = String(first).localeCompare(String(second), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }

        if (comparison !== 0) {
          return sort.direction === "asc" ? comparison : -comparison;
        }
      }

      return 0;
    });
  }, [filteredRows, sortConfig, normalizedColumns, isServerSide]);

  // Client/server pagination
  const currentPage = isServerSide ? serverPagination.page : page;

  const currentPageSize = isServerSide ? serverPagination.pageSize : pageSize;

  const totalRows = isServerSide ? serverPagination.total : sortedRows.length;

  const totalPages = Math.max(1, Math.ceil(totalRows / currentPageSize));

  const displayedRows = isServerSide
    ? rows
    : pagination
      ? sortedRows.slice(
          (currentPage - 1) * currentPageSize,
          currentPage * currentPageSize,
        )
      : sortedRows;

  const startRow =
    totalRows === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;

  const endRow = Math.min(currentPage * currentPageSize, totalRows);

  // Reset client page when filters change
  useEffect(() => {
    if (!isServerSide) setPage(1);
  }, [search, columnFilters, pageSize, isServerSide]);

  // Keep selection valid when data changes
  useEffect(() => {
    const validIds = new Set(rows.map((row, index) => getRowKey(row, index)));

    setSelectedRows((previous) => previous.filter((id) => validIds.has(id)));
  }, [rows]);

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [selectedRows, onSelectionChange]);

  const changePage = (nextPage) => {
    const safePage = Math.max(1, Math.min(totalPages, nextPage));

    if (isServerSide) {
      serverPagination.onPageChange?.(safePage);
    } else {
      setPage(safePage);
    }
  };

  const changePageSize = (size) => {
    if (isServerSide) {
      serverPagination.onPageSizeChange?.(size);
    } else {
      setPageSize(size);
    }

    changePage(1);
  };

  // Sorting
  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;

    setSortConfig((previous) => {
      const existing = previous.find((item) => item.key === column.key);

      if (existing) {
        if (existing.direction === "asc") {
          return previous.map((item) =>
            item.key === column.key ? { ...item, direction: "desc" } : item,
          );
        }

        return previous.filter((item) => item.key !== column.key);
      }

      return [...previous, { key: column.key, direction: "asc" }];
    });
  };

  const getSortIcon = (key) => {
    const sort = sortConfig.find((item) => item.key === key);

    if (!sort) {
      return <ArrowUpDown size={14} className="opacity-30" />;
    }

    return sort.direction === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  // Row selection
  const visibleIds = displayedRows.map((row, index) =>
    getRowKey(
      row,
      isServerSide
        ? (currentPage - 1) * currentPageSize + index
        : pagination
          ? (currentPage - 1) * currentPageSize + index
          : index,
    ),
  );

  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedRows.includes(id));

  const toggleAll = () => {
    setSelectedRows((previous) => {
      if (allSelected) {
        return previous.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...previous, ...visibleIds])];
    });
  };

  const toggleRow = (id) => {
    setSelectedRows((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const clearSelection = () => setSelectedRows([]);

  // CSV export
  const exportCSV = () => {
    const exportColumns = activeColumns.filter(
      (column) => column.exportable !== false,
    );

    const escapeCSV = (value) => {
      const text = String(value ?? "")
        .replace(/<[^>]*>/g, "")
        .replace(/"/g, '""');

      return `"${text}"`;
    };

    const header = exportColumns
      .map((column) => escapeCSV(column.label))
      .join(",");

    const body = sortedRows.map((row) =>
      exportColumns.map((column) => escapeCSV(getValue(row, column))).join(","),
    );

    const csv = [header, ...body].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `export-${new Date().toISOString().slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  };

  const cellPadding =
    density === "compact"
      ? "px-4 py-2.5"
      : density === "comfortable"
        ? "px-5 py-4"
        : "px-5 py-6";

  const inputClass =
    "rounded-lg border border-white/10 bg-[#050817] px-3 py-2 text-xs text-white outline-none focus:border-lime/50";

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {searchable && (
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-[#050817] py-2.5 pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/30 focus:border-lime/50"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {filters}

          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-lime">
              <Check size={14} />
              {selectedRows.length} selected
              <button
                type="button"
                onClick={clearSelection}
                className="text-white/40 underline hover:text-white"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bulkActions && selectedRows.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {bulkActions({
                selectedIds: selectedRows,
                clearSelection,
              })}
            </div>
          )}

          {toolbarActions}

          {refreshable && onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-40"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {exportable && (
            <button
              type="button"
              onClick={exportCSV}
              disabled={sortedRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-40"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {columnVisibility && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5"
              >
                <Columns3 size={15} />
                <span className="hidden sm:inline">Columns</span>
                <ChevronDown size={14} />
              </button>

              {showColumnMenu && (
                <div className="absolute right-0 z-30 mt-2 max-h-80 w-56 overflow-y-auto rounded-xl border border-white/10 bg-[#101a2b] p-3 shadow-2xl">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-white">
                      Visible columns
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowColumnMenu(false)}
                      className="text-white/40 hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {normalizedColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/70 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[column.key] !== false}
                        onChange={(e) =>
                          setVisibleColumns((previous) => ({
                            ...previous,
                            [column.key]: e.target.checked,
                          }))
                        }
                        className="accent-lime"
                      />

                      {column.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className={inputClass}
            title="Table density"
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>
      </div>

      {/* COLUMN FILTERS */}
      {filterable && hasColumnFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <SlidersHorizontal size={15} className="text-white/40" />

          {normalizedColumns
            .filter((column) => column.filterOptions?.length)
            .map((column) => (
              <select
                key={column.key}
                value={columnFilters[column.key] || "all"}
                onChange={(e) =>
                  setColumnFilters((previous) => ({
                    ...previous,
                    [column.key]: e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="all">All {column.label}</option>

                {column.filterOptions.map((option) => {
                  const value =
                    typeof option === "object" ? option.value : option;

                  const label =
                    typeof option === "object" ? option.label : option;

                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ))}

          {Object.values(columnFilters).some(
            (value) => value && value !== "all",
          ) && (
            <button
              type="button"
              onClick={() => setColumnFilters({})}
              className="text-xs text-red-300 hover:text-red-200"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-white/10">
        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full text-left text-sm" style={{ minWidth }}>
            <thead
              className={`bg-[#101a2b] text-xs uppercase tracking-wider text-emerald-100/50 ${
                stickyHeader ? "sticky top-0 z-10" : ""
              }`}
            >
              <tr>
                {selectable && (
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-lime"
                      aria-label="Select all rows on this page"
                    />
                  </th>
                )}

                {activeColumns.map((column) => {
                  const sortIndex = sortConfig.findIndex(
                    (item) => item.key === column.key,
                  );

                  return (
                    <th
                      key={column.key}
                      className={`${cellPadding} whitespace-nowrap font-semibold ${
                        column.headerClassName || ""
                      }`}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        textAlign: column.align || "left",
                      }}
                    >
                      {sortable && column.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column)}
                          className="inline-flex items-center gap-2 transition hover:text-lime"
                        >
                          {column.label}
                          {getSortIcon(column.key)}

                          {sortIndex >= 0 && sortConfig.length > 1 && (
                            <span className="text-[10px] text-lime">
                              {sortIndex + 1}
                            </span>
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.07]">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {selectable && (
                      <td className={cellPadding}>
                        <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
                      </td>
                    )}

                    {activeColumns.map((column) => (
                      <td key={column.key} className={cellPadding}>
                        <div className="h-4 max-w-32 animate-pulse rounded bg-white/10" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayedRows.length > 0 ? (
                displayedRows.map((row, index) => {
                  const absoluteIndex =
                    (currentPage - 1) * currentPageSize + index;
                  const rowId = getRowKey(row, absoluteIndex);

                  // renderRow supports either a complete <tr> or a fragment of <td>s.
                  // Never wrap custom row output in another <tr>.
                  if (renderRow) {
                    return (
                      <Fragment key={rowId}>
                        {renderRow(row, absoluteIndex)}
                      </Fragment>
                    );
                  }

                  return (
                    <tr
                      key={rowId}
                      className={`transition-colors hover:bg-white/[0.035] ${
                        selectedRows.includes(rowId) ? "bg-lime/[0.045]" : ""
                      }`}
                    >
                      {selectable && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(rowId)}
                            onChange={() => toggleRow(rowId)}
                            className="h-4 w-4 accent-lime"
                            aria-label="Select row"
                          />
                        </td>
                      )}
                      {activeColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`${cellPadding} text-white/75 ${
                            column.cellClassName || ""
                          }`}
                          style={{ textAlign: column.align || "left" }}
                        >
                          {column.render
                            ? column.render(row, absoluteIndex)
                            : (getValue(row, column) ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={activeColumns.length + (selectable ? 1 : 0)}
                    className="px-5 py-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-3 rounded-full bg-white/5 p-4 text-white/30">
                        <Search size={22} />
                      </div>

                      <p className="font-semibold text-white">
                        {search ||
                        Object.values(columnFilters).some(
                          (v) => v && v !== "all",
                        )
                          ? "No matching records"
                          : emptyTitle}
                      </p>

                      <p className="mt-1 max-w-sm text-xs text-white/40">
                        {emptyDescription}
                      </p>

                      {emptyAction}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      {pagination && (
        <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span>
              Showing{" "}
              <strong className="text-white">
                {startRow}-{endRow}
              </strong>{" "}
              of <strong className="text-white">{totalRows}</strong>
            </span>

            <select
              value={currentPageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className={inputClass}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => changePage(1)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
              title="First page"
            >
              <ChevronsLeft size={17} />
            </button>

            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => changePage(currentPage - 1)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
              title="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="min-w-24 text-center text-xs text-white/60">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => changePage(currentPage + 1)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
              title="Next page"
            >
              <ChevronRight size={17} />
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => changePage(totalPages)}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
              title="Last page"
            >
              <ChevronsRight size={17} />
            </button>
          </div>
        </div>
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
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#050817] p-4 sm:p-5">
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
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#050817] p-4 sm:p-5">
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
        className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050817] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-emerald-100/30 focus:border-lime/50 sm:py-2.5"
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

      const { data } = await api.get("/saas/admin/dashboard");
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
          <div className="grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Organizations"
              value={stats?.totalOrganizations ?? 0}
              icon={Building2}
            />

            <StatCard
              title="Active Organizations"
              value={stats?.activeOrganizations ?? 0}
              icon={ShieldCheck}
            />

            <StatCard
              title="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
            />

            <StatCard
              title="Total Subscriptions"
              value={stats?.totalSubscriptions ?? 0}
              icon={CreditCard}
            />

            <StatCard
              title="Active Subscriptions"
              value={stats?.activeSubscriptions ?? 0}
              icon={CheckCircle}
            />

            <StatCard
              title="Trial Subscriptions"
              value={stats?.trialSubscriptions ?? 0}
              icon={CalendarDays}
            />

            <StatCard
              title="Expired Subscriptions"
              value={stats?.expiredSubscriptions ?? 0}
              icon={Wallet}
            />

            <StatCard
              title="Suspended Organizations"
              value={stats?.suspendedOrganizations ?? 0}
              icon={ShieldCheck}
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

      const { data } = await api.get("/saas/admin/organizations");
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
      await api.patch(`/saas/admin/organizations/${org._id}/status`, {
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
          className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm outline-none sm:max-w-xs sm:py-2.5"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050817] px-4 py-2.5 text-sm sm:w-auto"
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
              {
                key: "name",
                label: "Organization",
                accessor: "name",
              },
              {
                key: "slug",
                label: "Slug",
                accessor: "slug",
              },
              {
                key: "country",
                label: "Country",
                accessor: "address.country",
              },
              {
                key: "createdAt",
                label: "Created",
                accessor: "createdAt",
                render: (org) => formatDate(org.createdAt),
              },
              {
                key: "status",
                label: "Status",
                accessor: "status",
                filterOptions: ["active", "suspended", "pending"],
                render: (org) => <StatusBadge status={org.status} />,
              },
              {
                key: "actions",
                label: "Actions",
                sortable: false,
                searchable: false,
                exportable: false,
              },
            ]}
            rows={organizations}
            loading={loading}
            searchable
            sortable
            filterable
            pagination
            exportable
            columnVisibility
            refreshable
            onRefresh={fetchOrganizations}
            emptyTitle="No organizations found"
            emptyDescription="Registered organizations will appear here."
            renderRow={(org) => (
              <>
                <td className="px-5 py-4 font-semibold">{org.name}</td>
                <td className="px-5 py-4 text-white/60">{org.slug || "—"}</td>
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
              </>
            )}
          />
        )}
      </Panel>
    </div>
  );
}

export function PlatformUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchUsers = async (page = pagination.page) => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/saas/admin/users", {
        params: {
          page,
          limit: pagination.limit,
          search: search.trim(),
          role,
          status,
        },
      });

      const userList = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setUsers(userList);

      setPagination((previous) => ({
        ...previous,
        ...(data?.pagination || {}),
        page: data?.pagination?.page || page,
      }));
    } catch (err) {
      setUsers([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search, role, status]);

  const handleStatusChange = async (user) => {
    const currentlyActive = user.isActive !== false;
    const nextStatus = !currentlyActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${user.name || user.email || "this user"}?`,
    );

    if (!confirmed) return;

    try {
      await api.patch(`/saas/admin/users/${user._id}/status`, {
        isActive: nextStatus,
      });

      await fetchUsers(pagination.page);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const changePage = (nextPage) => {
    if (nextPage < 1 || (pagination.pages && nextPage > pagination.pages)) {
      return;
    }

    fetchUsers(nextPage);
  };

  const getOrganizationName = (user) => {
    if (!user.organization) return "—";

    if (typeof user.organization === "string") {
      return user.organization;
    }

    return user.organization.name || user.organization.slug || "—";
  };

  const getUserName = (user) =>
    user.name || user.fullName || user.username || "Unnamed User";

  const getUserStatus = (user) =>
    user.isActive === false ? "Inactive" : "Active";

  const getRoleLabel = (value) => {
    const labels = {
      super_admin: "Super Admin",
      org_admin: "Organization Admin",
      admin: "Admin",
      auctioneer: "Auctioneer",
      team_owner: "Team Owner",
      scorer: "Scorer",
      player: "Player",
    };

    return labels[value] || value?.replaceAll("_", " ") || "—";
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Platform Users"
        description="View and manage users across all SACL organizations."
      />

      {/* Filters */}
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050817] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-emerald-100/30 focus:border-lime/50"
          />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm text-white outline-none sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="org_admin">Organization Admin</option>
          <option value="admin">Admin</option>
          <option value="auctioneer">Auctioneer</option>
          <option value="team_owner">Team Owner</option>
          <option value="scorer">Scorer</option>
          <option value="player">Player</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm text-white outline-none sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          type="button"
          onClick={() => fetchUsers(1)}
          disabled={loading}
          className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50 sm:py-2.5"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Users table */}
      <Panel title={`All Platform Users (${pagination.total || users.length})`}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => fetchUsers(pagination.page)}
          />
        ) : (
          <>
            <DataTable
              columns={[
                "User",
                "Organization",
                "Role",
                "Email",
                "Phone",
                "Status",
                "Joined",
                "Actions",
              ]}
              rows={users}
              pagination={false}
              searchable={false}
              sortable={false}
              filterable={false}
              emptyTitle="No users found"
              emptyDescription="Users from your registered organizations will appear here."
              renderRow={(user) => {
                const active = user.isActive !== false;

                return (
                  <tr
                    key={user._id}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">
                        {getUserName(user)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-100/40">
                        ID: {user._id || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-emerald-100/70">
                      {getOrganizationName(user)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold capitalize text-blue-300">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-emerald-100/70">
                      {user.email || "—"}
                    </td>

                    <td className="px-5 py-4 text-emerald-100/70">
                      {user.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={active ? "Active" : "Suspended"} />
                    </td>

                    <td className="px-5 py-4 text-emerald-100/60">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        disabled={user.role === "super_admin"}
                        onClick={() => handleStatusChange(user)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? "border-red-400/20 text-red-300 hover:bg-red-500/10"
                            : "border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/10"
                        }`}
                      >
                        {active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              }}
            />

            <Pagination
              pagination={pagination}
              setPage={(nextPage) => changePage(nextPage)}
              loading={loading}
              label="users"
            />
          </>
        )}
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

        <select className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050817] px-4 py-2.5 text-sm outline-none sm:w-auto">
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
              className="min-w-0 rounded-2xl border border-white/10 bg-[#050817] p-4 sm:p-6"
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
  const [selectedTournament, setSelectedTournament] = useState(null);

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [actionLoading, setActionLoading] = useState(null);

  const handleTournamentApproval = async (tournamentId, action) => {
    const actionLabel = action === "approved" ? "approve" : "reject";

    try {
      setActionLoading(tournamentId);

      await api.patch(`/tournaments/${tournamentId}/${action}`);

      await fetchTournaments();
    } catch (error) {
      alert(
        error.response?.data?.message || `Unable to ${actionLabel} tournament.`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTournament = async (updatedTournament) => {
    setTournaments((current) =>
      current.map((tournament) =>
        tournament._id === updatedTournament._id
          ? updatedTournament
          : tournament,
      ),
    );

    setSelectedTournament(null);
    setAddTournamentsModalOpen(false);

    await fetchTournaments();
  };

  const handleDeleteTournament = async (tournament) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tournament.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(tournament._id);

      await api.delete(`/tournaments/${tournament._id}`);

      setTournaments((current) =>
        current.filter((item) => item._id !== tournament._id),
      );

      alert("Tournament deleted successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete tournament.");
    } finally {
      setActionLoading(null);
    }
  };

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
          <PrimaryButton
            onClick={() => {
              setSelectedTournament(null);
              setAddTournamentsModalOpen(true);
            }}
          >
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
            className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050817] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-emerald-100/30 focus:border-lime/50 sm:py-2.5"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#050817] px-4 py-2.5 text-sm text-white outline-none"
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
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-emerald-100/50">
                <tr>
                  {[
                    "Tournament",
                    "Dates",
                    "Teams",
                    "Squad Size",
                    "Purse",
                    "Status",
                    "Approval",
                    "Actions",
                  ].map((column) => (
                    <th key={column} className="px-5 py-4 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredTournaments.map((tournament) => {
                  const isProcessing = actionLoading === tournament._id;
                  const approvalStatus = tournament.approvalStatus || "pending";

                  return (
                    <tr
                      key={tournament._id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      {/* Tournament */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">
                          {tournament.name}
                        </p>

                        <p className="mt-1 text-xs text-emerald-100/40">
                          {tournament.city || tournament.venue || "—"}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 text-emerald-100/60">
                        <div>{formatDate(tournament.startDate)}</div>
                        <div className="mt-1 text-xs text-emerald-100/40">
                          To {formatDate(tournament.endDate)}
                        </div>
                      </td>

                      {/* Teams */}
                      <td className="px-5 py-4 text-emerald-100/70">
                        {tournament.teamCount ?? tournament.teams?.length ?? 0}
                        {" / "}
                        {tournament.teamLimit ?? "—"}
                      </td>

                      {/* Squad Size */}
                      <td className="px-5 py-4 text-emerald-100/70">
                        {tournament.squadSize ?? "—"}
                      </td>

                      {/* Purse */}
                      <td className="px-5 py-4 text-emerald-100/70">
                        {tournament.purseTotal != null
                          ? `₹${Number(tournament.purseTotal).toLocaleString(
                              "en-IN",
                            )}`
                          : "—"}
                      </td>

                      {/* Tournament Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            tournament.status,
                          )}`}
                        >
                          {tournament.status?.replaceAll("_", " ") || "Unknown"}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            approvalStatus === "approved"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : approvalStatus === "rejected"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-yellow-500/15 text-yellow-400"
                          }`}
                        >
                          {approvalStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex min-w-[210px] flex-wrap items-center gap-2">
                          {/* Edit */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setSelectedTournament(tournament);
                              setAddTournamentsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-40"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDeleteTournament(tournament)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                          >
                            {isProcessing ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete
                          </button>

                          {/* Approve / Reject */}
                          {approvalStatus === "pending" && (
                            <>
                              <button
                                disabled={isProcessing}
                                onClick={() =>
                                  handleTournamentApproval(
                                    tournament._id,
                                    "approved",
                                  )
                                }
                                className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-40"
                              >
                                {isProcessing ? "Processing..." : "Approve"}
                              </button>

                              <button
                                disabled={isProcessing}
                                onClick={() =>
                                  handleTournamentApproval(
                                    tournament._id,
                                    "rejected",
                                  )
                                }
                                className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/25 disabled:opacity-40"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Create tournament modal */}
      {addTournamentsModalOpen && (
        <AddTournamentsModal
          tournament={selectedTournament}
          onClose={() => {
            setAddTournamentsModalOpen(false);
            setSelectedTournament(null);
          }}
          onCreated={() => {
            setAddTournamentsModalOpen(false);
            setSelectedTournament(null);
            fetchTournaments();
          }}
          onUpdate={handleEditTournament}
        />
      )}
    </div>
  );
}

function ManagementFilters({
  search,
  setSearch,
  status,
  setStatus,
  payment,
  setPayment,
  extra,
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm outline-none sm:max-w-xs"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm"
      >
        <option value="all">All approvals</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <select
        value={payment}
        onChange={(e) => setPayment(e.target.value)}
        className="rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm"
      >
        <option value="all">All payments</option>
        <option value="pending">Payment pending</option>
        <option value="paid">Paid</option>
        <option value="failed">Failed</option>
      </select>

      {extra}
    </div>
  );
}

import { Loader2, CheckCircle } from "lucide-react";
import MatchAdminForm from "../components/MatchAdminForm";

function DeleteApplicationButton({ item, entity, onDeleted }) {
  const [busy, setBusy] = useState(false);

  const entityLabel = entity === "player" ? "player" : "team";
  const displayName = entity === "player" ? item.fullName : item.name;

  async function handleDelete() {
    if (busy) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${entityLabel} "${displayName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setBusy(true);

      const { data } = await api.delete(
        `/admin/applications/${entity}/${item._id}`,
      );

      if (data.success) {
        alert(data.message || `${entityLabel} deleted successfully.`);
        await onDeleted();
      }
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleDelete}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}

function ReviewButtons({ item, type, onReviewed }) {
  const [busy, setBusy] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const isPaid = item.registrationFeeStatus === "paid";

  async function updatePaymentStatus() {
    if (busy || isPaid) return;

    if (!window.confirm("Mark this registration fee as paid?")) return;

    setBusy(true);
    setProcessingStatus("payment");

    try {
      await api.patch(`/admin/${type}s/${item._id}/payment-status`, {
        registrationFeeStatus: "paid",
      });

      await onReviewed();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setBusy(false);
      setProcessingStatus("");
    }
  }

  async function review(status) {
    const action = status === "rejected" ? "Reject" : "Approve";

    if (status === "approved" && !isPaid) {
      alert("Please mark the registration fee as paid first.");
      return;
    }

    if (!window.confirm(`${action} this ${type}?`)) return;

    setBusy(true);
    setProcessingStatus(status);

    try {
      await api.patch(`/admin/${type}s/${item._id}/review`, {
        status,
      });

      await onReviewed();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setBusy(false);
      setProcessingStatus("");
    }
  }

  if (item.approvalStatus !== "pending") {
    return <span className="text-xs text-white/40">Reviewed</span>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Payment status checkbox */}
      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
        <input
          type="checkbox"
          checked={isPaid}
          disabled={busy || isPaid}
          onChange={updatePaymentStatus}
          className="h-4 w-4 accent-emerald-500"
        />

        <span className={isPaid ? "text-emerald-400" : "text-yellow-400"}>
          {isPaid ? "Payment Paid" : "Mark as Paid"}
        </span>

        {processingStatus === "payment" && (
          <Loader2 size={14} className="animate-spin" />
        )}

        {isPaid && <CheckCircle size={14} className="text-emerald-400" />}
      </label>

      {/* Approval buttons */}
      <div className="flex gap-2">
        <button
          // disabled={busy || !isPaid}
          onClick={() => review("approved")}
          title={!isPaid ? "Mark payment as paid first" : "Approve application"}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {processingStatus === "approved" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Approving...
            </>
          ) : (
            "Approve"
          )}
        </button>

        <button
          disabled={busy}
          onClick={() => review("rejected")}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40"
        >
          {processingStatus === "rejected" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Rejecting...
            </>
          ) : (
            "Reject"
          )}
        </button>
      </div>
    </div>
  );
}

function Pagination({
  pagination,
  setPage,
  loading = false,
  label = "records",
}) {
  const currentPage = Math.max(1, Number(pagination?.page) || 1);
  const totalPages = Math.max(1, Number(pagination?.pages) || 1);
  const total = Math.max(0, Number(pagination?.total) || 0);
  const limit = Math.max(
    1,
    Number(pagination?.limit || pagination?.pageSize) || 20,
  );
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);
  const buttonClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/70 transition hover:border-lime/30 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

  if (total === 0) {
    return (
      <div className="mt-4 border-t border-white/[0.06] pt-4 text-xs text-white/45">
        No {label} to display
      </div>
    );
  }

  const goTo = (nextPage) => {
    const safePage = Math.max(1, Math.min(totalPages, nextPage));
    if (safePage !== currentPage && !loading) setPage(safePage);
  };

  const first = Math.max(1, currentPage - 2);
  const last = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from(
    { length: last - first + 1 },
    (_, index) => first + index,
  );

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-white/50">
        Showing <strong className="text-white">{start}-{end}</strong> of{" "}
        <strong className="text-white">{total}</strong> {label}
      </p>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className={buttonClass} disabled={currentPage <= 1 || loading}
            onClick={() => goTo(1)} aria-label="First page">
            <ChevronsLeft size={15} />
          </button>
          <button type="button" className={buttonClass} disabled={currentPage <= 1 || loading}
            onClick={() => goTo(currentPage - 1)} aria-label="Previous page">
            <ChevronLeft size={15} />
          </button>

          {first > 1 && (
            <>
              <button type="button" className={buttonClass} disabled={loading} onClick={() => goTo(1)}>1</button>
              {first > 2 && <span className="px-1 text-xs text-white/35">…</span>}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              type="button"
              disabled={loading}
              onClick={() => goTo(number)}
              aria-current={number === currentPage ? "page" : undefined}
              className={number === currentPage
                ? "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-lime/30 bg-lime/10 px-3 text-xs font-bold text-lime"
                : buttonClass}
            >
              {number}
            </button>
          ))}

          {last < totalPages && (
            <>
              {last < totalPages - 1 && <span className="px-1 text-xs text-white/35">…</span>}
              <button type="button" className={buttonClass} disabled={loading}
                onClick={() => goTo(totalPages)}>{totalPages}</button>
            </>
          )}

          <button type="button" className={buttonClass} disabled={currentPage >= totalPages || loading}
            onClick={() => goTo(currentPage + 1)} aria-label="Next page">
            <ChevronRight size={15} />
          </button>
          <button type="button" className={buttonClass} disabled={currentPage >= totalPages || loading}
            onClick={() => goTo(totalPages)} aria-label="Last page">
            <ChevronsRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export function TeamsManagement() {
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchTeams() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/admin/teams/management", {
        params: {
          page,
          limit: 20,
          search,
          status,
          payment,
        },
      });

      setTeams(data.teams || []);
      setStats(data.stats || {});
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchTeams, 300);
    return () => clearTimeout(timer);
  }, [page, search, status, payment]);

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Teams Management"
        description="Review team registrations and monitor participating teams."
      />

      <div className="mb-5 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Teams"
          value={stats.total ?? 0}
          icon={ShieldCheck}
        />
        <StatCard
          title="Approved"
          value={stats.approved ?? 0}
          icon={UserCheck}
        />
        <StatCard title="Pending" value={stats.pending ?? 0} icon={Users} />
        <StatCard
          title="Available Slots"
          value={stats.availableSlots ?? 0}
          icon={Trophy}
        />
      </div>

      <ManagementFilters
        search={search}
        setSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        setStatus={(v) => {
          setStatus(v);
          setPage(1);
        }}
        payment={payment}
        setPayment={(v) => {
          setPayment(v);
          setPage(1);
        }}
      />

      <Panel title="Team Applications">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTeams} />
        ) : (
          <>
            <DataTable
              columns={[
                "Team",
                "Owner",
                "Tournament",
                "Squad",
                "Purse",
                "Payment",
                "Approval",
                "Actions",
              ]}
              rows={teams}
              pagination={false}
              searchable={false}
              sortable={false}
              filterable={false}
              emptyTitle="No teams found"
              emptyDescription="Team applications will appear here."
              renderRow={(team) => (
                <tr key={team._id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-semibold">{team.name}</td>
                  <td className="px-5 py-4">
                    <p>{team.primaryOwner?.name || team.owner?.name || "—"}</p>
                    <p className="text-xs text-white/40">
                      {team.primaryOwner?.phone || team.owner?.phone || ""}
                    </p>
                  </td>
                  <td className="px-5 py-4">{team.tournament?.name || "—"}</td>
                  <td className="px-5 py-4">{team.squad?.length ?? 0}</td>
                  <td className="px-5 py-4">
                    {Number(team.purseRemaining ?? 0).toLocaleString("en-IN")}{" "}
                    pts
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={team.registrationFeeStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={team.approvalStatus} />
                  </td>
                  <td className="min-w-[260px] px-5 py-4">
                    <div className="flex flex-wrap items-start gap-2">
                    <ReviewButtons
                      item={team}
                      type="team"
                      onReviewed={fetchTeams}
                    />
                    <DeleteApplicationButton
                      item={team}
                      entity="team"
                      onDeleted={fetchTeams}
                    />
                    </div>
                  </td>
                </tr>
              )}
            />

            <Pagination pagination={pagination} setPage={setPage} loading={loading} label="teams" />
          </>
        )}
      </Panel>
    </div>
  );
}

function PaymentReviewModal({ player, onClose, onReviewed }) {
  const [busy, setBusy] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [utrCopied, setUtrCopied] = useState(false);

  const copyUtr = async () => {
    if (!player.paymentUtr) return;

    try {
      await navigator.clipboard.writeText(player.paymentUtr);
      setUtrCopied(true);
      setTimeout(() => setUtrCopied(false), 2000);
    } catch {
      alert("Unable to copy UTR");
    }
  };

  if (!player) return null;

  const paymentStatus = player.paymentVerificationStatus || "not_submitted";

  async function reviewPayment(status) {
    if (status === "rejected" && !rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${status} this payment?`,
    );

    if (!confirmed) return;

    try {
      setBusy(true);

      await api.patch(`/admin/payments/${player._id}/review`, {
        status,
        rejectionReason: status === "rejected" ? rejectionReason.trim() : "",
      });

      alert(
        status === "approved"
          ? "Payment verified successfully."
          : "Payment rejected successfully.",
      );

      await onReviewed();
      onClose();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d192c] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d192c] p-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              Payment Verification
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Verify the player's UTR and payment screenshot.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Player details */}
          <div className="grid gap-4 rounded-xl border border-white/10 bg-[#050817] p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-white/40">Player</p>
              <p className="mt-1 font-semibold text-white">{player.fullName}</p>
            </div>

            <div>
              <p className="text-xs text-white/40">Phone</p>
              <p className="mt-1 font-semibold text-white">
                {player.user?.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/40">Tournament</p>
              <p className="mt-1 font-semibold text-white">
                {player.tournament?.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/40">Payment Status</p>
              <div className="mt-1">
                <StatusBadge status={paymentStatus} />
              </div>
            </div>
          </div>

          {/* Transaction details */}
          <div>
            <h3 className="mb-3 font-bold text-white">Transaction Details</h3>

            <div className="rounded-xl border border-white/10 bg-[#050817] p-4">
              <p className="text-xs text-white/40">
                UTR / Transaction Reference
              </p>

              <div className="mt-2 flex items-center gap-3">
                <p className="break-all text-lg font-bold tracking-wide text-[#f4c34e]">
                  {player.paymentUtr || "Not submitted"}
                </p>

                {player.paymentUtr && (
                  <button
                    type="button"
                    onClick={copyUtr}
                    title="Copy UTR"
                    className="shrink-0 rounded-lg border border-white/10 p-2 text-white/60 transition hover:border-[#f4c34e]/40 hover:bg-[#f4c34e]/10 hover:text-[#f4c34e]"
                  >
                    {utrCopied ? (
                      <Check size={17} className="text-emerald-400" />
                    ) : (
                      <Copy size={17} />
                    )}
                  </button>
                )}
              </div>

              <p className="mt-4 text-xs text-white/40">Submitted At</p>

              <p className="mt-1 text-sm text-white">
                {player.paymentSubmittedAt
                  ? new Date(player.paymentSubmittedAt).toLocaleString("en-IN")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Screenshot */}
          <div>
            <h3 className="mb-3 font-bold text-white">Payment Screenshot</h3>

            {player.paymentScreenshot ? (
              <a
                href={player.paymentScreenshot}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-white/10 bg-[#050817]"
              >
                <img
                  src={player.paymentScreenshot}
                  alt="Player payment proof"
                  className="max-h-[450px] w-full object-contain"
                />

                <p className="border-t border-white/10 p-3 text-center text-sm text-[#f4c34e]">
                  Open full-size screenshot ↗
                </p>
              </a>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 p-10 text-center text-sm text-white/40">
                No payment screenshot uploaded.
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {paymentStatus === "submitted" && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">
                Rejection Reason (required when rejecting)
              </label>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Enter reason if payment is invalid..."
                className="w-full rounded-xl border border-white/10 bg-[#050817] p-3 text-sm text-white outline-none focus:border-[#f4c34e]"
              />
            </div>
          )}

          {/* Actions */}
          {paymentStatus === "submitted" ? (
            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={() => reviewPayment("approved")}
                className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {busy ? "Processing..." : "Approve Payment"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => reviewPayment("rejected")}
                className="flex-1 rounded-xl bg-red-600/20 px-5 py-3 font-bold text-red-300 hover:bg-red-600/30 disabled:opacity-50"
              >
                {busy ? "Processing..." : "Reject Payment"}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
              This payment has already been reviewed. Current status:{" "}
              <strong className="text-white">{paymentStatus}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditPlayerModal({ player, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: player.fullName || "",
    category: player.category || "A",
    role: player.role || "",
    battingStyle: player.battingStyle || "",
    bowlingStyle: player.bowlingStyle || "",
    preferredJerseyNumber: player.preferredJerseyNumber ?? "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPlayer = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      alert("Player name is required.");
      return;
    }

    if (
      form.preferredJerseyNumber === "" ||
      Number(form.preferredJerseyNumber) < 0
    ) {
      alert("Enter a valid jersey number.");
      return;
    }

    try {
      const { data } = await api.patch(`/admin/players/${player._id}`, {
        fullName: form.fullName,
        category: form.category,
        role: form.role,
        battingStyle: form.battingStyle,
        bowlingStyle: form.bowlingStyle,
        preferredJerseyNumber: Number(form.preferredJerseyNumber),
        preferredJerseySize: form.preferredJerseySize,
      });

      if (data.success) {
        alert("Player updated successfully");
        // await fetchPlayers();
      }
      await onSaved();
      onClose();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm text-white outline-none focus:border-lime/50";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d192c] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0d192c] p-5">
          <div>
            <h2 className="text-xl font-bold">Edit Player</h2>
            <p className="mt-1 text-sm text-white/50">
              Update player registration information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleEditPlayer} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Player Name
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                {["ICONIC", "A", "B", "C", "D"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Playing Role
              </label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. all_rounder"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Batting Style
              </label>
              <input
                name="battingStyle"
                value={form.battingStyle}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Bowling Style
              </label>
              <input
                name="bowlingStyle"
                value={form.bowlingStyle}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Jersey Number
              </label>
              <input
                type="number"
                min="0"
                name="preferredJerseyNumber"
                value={form.preferredJerseyNumber}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-lime px-5 py-3 text-sm font-bold text-[#071b16] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PlayersManagement() {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  async function fetchPlayers() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/admin/players/management", {
        params: {
          page,
          limit: 20,
          search,
          status,
          payment,
          category,
        },
      });

      setPlayers(data.players || []);
      setStats(data.stats || {});
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(timer);
  }, [page, search, status, payment, category]);

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Players Management"
        description="Manage auction registrations, payments and player approvals."
      />

      <div className="mb-5 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Registered Players"
          value={stats.total ?? 0}
          icon={Users}
        />
        <StatCard
          title="Approved Players"
          value={stats.approved ?? 0}
          icon={UserCheck}
        />
        <StatCard
          title="Pending Approval"
          value={stats.pending ?? 0}
          icon={ShieldCheck}
        />
        <StatCard
          title="Paid Registrations"
          value={stats.paid ?? 0}
          icon={CreditCard}
        />
      </div>

      <ManagementFilters
        search={search}
        setSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        setStatus={(v) => {
          setStatus(v);
          setPage(1);
        }}
        payment={payment}
        setPayment={(v) => {
          setPayment(v);
          setPage(1);
        }}
        extra={
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm"
          >
            <option value="all">All categories</option>
            {["ICONIC", "A", "B", "C", "D"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        }
      />

      <Panel title="Player Applications">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchPlayers} />
        ) : (
          <>
            <DataTable
              columns={[
                {
                  key: "fullName",
                  label: "Player",
                  accessor: "fullName",
                  render: (player) => (
                    <div>
                      <p className="font-semibold">{player.fullName}</p>
                      <p className="text-xs text-white/40">
                        {player.user?.phone || player.user?.email || "—"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "category",
                  label: "Category",
                  accessor: "category",
                  filterOptions: ["ICONIC", "A", "B", "C", "D"],
                },
                {
                  key: "role",
                  label: "Playing Role",
                  accessor: "role",
                  render: (player) => player.role?.replaceAll("_", " ") || "—",
                },
                {
                  key: "tournament",
                  label: "Tournament",
                  accessor: "tournament.name",
                },
                {
                  key: "payment",
                  label: "Payment",
                  accessor: "paymentVerificationStatus",
                  render: (player) => (
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(player)}
                      className="flex items-center gap-2 rounded-lg border border-[#f4c34e]/20 bg-[#f4c34e]/5 px-3 py-2 hover:bg-[#f4c34e]/10"
                    >
                      <StatusBadge
                        status={
                          player.paymentVerificationStatus || "not_submitted"
                        }
                      />
                      <span className="text-xs font-semibold text-[#f4c34e]">
                        View Proof
                      </span>
                    </button>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  searchable: false,
                  exportable: false,
                  render: (player) => (
                    <div className="flex min-w-[320px] flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPlayer(player)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:border-blue-400/40 hover:bg-blue-500/10"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <div className="rounded-lg border border-white/10 p-1">
                        <ReviewButtons
                          item={player}
                          type="player"
                          onReviewed={fetchPlayers}
                        />
                      </div>

                      <DeleteApplicationButton
                        item={player}
                        entity="player"
                        onDeleted={fetchPlayers}
                      />
                    </div>
                  ),
                },
              ]}
              rows={players}
              loading={loading}
              searchable={false}
              sortable={false}
              filterable={false}
              pagination={false}
              exportable
              columnVisibility
              refreshable
              onRefresh={fetchPlayers}
              emptyTitle="No players found"
              emptyDescription="Player applications will appear here."
            />

            <Pagination pagination={pagination} setPage={setPage} loading={loading} label="players" />
          </>
        )}
      </Panel>
      {selectedPayment && (
        <PaymentReviewModal
          player={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onReviewed={fetchPlayers}
        />
      )}
      {selectedPlayer && (
        <EditPlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onSaved={fetchPlayers}
        />
      )}
    </div>
  );
}

export function OrganizerMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    const title = match.title || "";

    return `${title} ${teamA} ${teamB} ${tournament}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const countByStatus = (status) =>
    matches.filter((match) => String(match.status).toLowerCase() === status)
      .length;

  const handleMatchCreated = async () => {
    setShowCreateModal(false);
    await fetchMatches();
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Matches"
        description="Create fixtures, assign scorers and manage tournament matches."
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-[#071b16] transition hover:bg-lime/90 sm:w-auto"
          >
            <Plus size={18} />
            Create Match
          </button>
        }
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
          placeholder="Search matches, teams or tournaments..."
          className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm outline-none focus:border-lime/50 sm:max-w-xs sm:py-2.5"
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
            emptyDescription="Create a match to add fixtures to your tournaments."
            renderRow={(match) => (
              <tr key={match._id}>
                <td className="px-5 py-4 font-semibold">
                  {match.title ||
                    `${match.teamA?.name || "Team A"} vs ${
                      match.teamB?.name || "Team B"
                    }`}
                  <p className="mt-1 text-xs font-normal text-emerald-100/40">
                    {match.teamA?.name || "Team A"} vs{" "}
                    {match.teamB?.name || "Team B"}
                  </p>
                </td>

                <td className="px-5 py-4">{match.tournament?.name || "—"}</td>

                <td className="px-5 py-4">
                  {match.oversPerInnings ?? match.overs ?? "—"}
                </td>

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

      {/* Create Match Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d192c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-xl font-bold">Create Tournament Match</h2>
                <p className="mt-1 text-xs text-emerald-100/50">
                  Configure teams, players and scorer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <MatchAdminForm
                onCreated={handleMatchCreated}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
