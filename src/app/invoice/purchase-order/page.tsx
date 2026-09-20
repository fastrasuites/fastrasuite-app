"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  RefreshCw,
  FileText,
  Filter,
  X,
  Loader2,
  FileEdit,
  Send,
  PackageOpen,
  PackageCheck,
  Receipt,
  Ban,
  type LucideIcon,
} from "lucide-react";
import { useGetPurchaseOrdersQuery } from "@/api/invoice/projectPurchaseOrdersApi";
import { PageGuard } from "@/components/auth/PageGuard";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatToSentenceCase = (text?: string | null) => {
  if (!text) return "—";
  return text
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

/** Human-readable WBS when backend sends details; otherwise null */
function resolveWbsLabel(order: any): string | null {
  const details =
    order.wbs_element_details ||
    order.wbs_details ||
    order.activity_details ||
    null;

  if (details && typeof details === "object") {
    const name = details.name || details.code || details.label;
    if (name) return String(name);
  }

  const raw = order.wbs_element;
  if (typeof raw === "string" && raw.trim()) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        raw.trim(),
      );
    if (!isUuid) return raw;
  }

  return null;
}

const getTypeColor = (type?: string | null) => {
  const t = (type || "").toLowerCase();
  if (t.includes("subcontractor")) return "bg-purple-50 text-purple-700";
  if (t.includes("plant") || t.includes("equipment"))
    return "bg-emerald-50 text-emerald-700";
  if (t.includes("purchase") || t.includes("material"))
    return "bg-blue-50 text-blue-700";
  return "bg-gray-50 text-gray-700";
};

const getStatusBadge = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  let color = "bg-gray-100 text-gray-700";

  if (s === "draft") color = "bg-amber-100 text-amber-800";
  else if (s === "issued") color = "bg-blue-100 text-blue-800";
  else if (s === "partially_received") color = "bg-teal-100 text-teal-800";
  else if (s === "fully_received") color = "bg-green-100 text-green-800";
  else if (s === "partially_billed") color = "bg-indigo-100 text-indigo-800";
  else if (s === "fully_billed") color = "bg-violet-100 text-violet-800";
  else if (s === "closed") color = "bg-slate-100 text-slate-700";
  else if (s === "cancelled" || s === "canceled")
    color = "bg-red-100 text-red-800";

  const label = status
    ? status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Unknown";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${color}`}
    >
      {label}
    </span>
  );
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "partially_received", label: "Partially Received" },
  { value: "fully_received", label: "Fully Received" },
  { value: "partially_billed", label: "Partially Billed" },
  { value: "fully_billed", label: "Fully Billed" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

/* -------------------------------------------------------------------------- */
/*                         Summary cards config                               */
/* Status-focused — more useful than type for a PO list                       */
/* -------------------------------------------------------------------------- */

type SummaryCardConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  countClass: string;
  /** Status values this card aggregates (lowercased) */
  matchStatuses: string[];
};

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: "draft",
    label: "Draft",
    icon: FileEdit,
    iconClass: "text-amber-500",
    countClass: "text-amber-600",
    matchStatuses: ["draft"],
  },
  {
    key: "issued",
    label: "Issued",
    icon: Send,
    iconClass: "text-blue-600",
    countClass: "text-blue-600",
    matchStatuses: ["issued"],
  },
  {
    key: "partially_received",
    label: "Partially Received",
    icon: PackageOpen,
    iconClass: "text-teal-600",
    countClass: "text-teal-600",
    matchStatuses: ["partially_received"],
  },
  {
    key: "fully_received",
    label: "Fully Received",
    icon: PackageCheck,
    iconClass: "text-emerald-600",
    countClass: "text-emerald-600",
    matchStatuses: ["fully_received"],
  },
  {
    key: "billed",
    label: "Billed",
    icon: Receipt,
    iconClass: "text-violet-600",
    countClass: "text-violet-600",
    // Group partially + fully billed for a cleaner row
    matchStatuses: ["partially_billed", "fully_billed"],
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: Ban,
    iconClass: "text-red-500",
    countClass: "text-red-500",
    matchStatuses: ["cancelled", "canceled"],
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Skeleton                                   */
/* -------------------------------------------------------------------------- */

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="h-4 w-28 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-5 w-24 rounded-full bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-36 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-24 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-20 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-5 w-24 rounded-full bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="mx-auto h-8 w-16 rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function PurchaseOrderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: purchaseOrders = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetPurchaseOrdersQuery({});

  const orders = Array.isArray(purchaseOrders)
    ? purchaseOrders
    : (purchaseOrders as any)?.results || [];

  /** Distinct request types from data for filter dropdown */
  const requestTypes = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o: any) => {
      if (o.source_request_type) set.add(o.source_request_type);
    });
    return Array.from(set).sort();
  }, [orders]);

  /* ---------- Status summary counts (from full list) ---------- */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of SUMMARY_CARDS) {
      counts[card.key] = 0;
    }
    for (const order of orders) {
      const s = (order.status || "").toLowerCase();
      for (const card of SUMMARY_CARDS) {
        if (card.matchStatuses.includes(s)) {
          counts[card.key] = (counts[card.key] || 0) + 1;
          break;
        }
      }
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order: any) => {
      if (statusFilter && (order.status || "").toLowerCase() !== statusFilter) {
        return false;
      }
      if (
        typeFilter &&
        (order.source_request_type || "").toLowerCase() !==
          typeFilter.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;

      const wbsLabel = resolveWbsLabel(order) || "";
      const haystack = [
        order.po_number,
        order.vendor_name,
        order.source_request_type,
        order.status,
        wbsLabel,
        order.project_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, searchTerm, statusFilter, typeFilter]);

  const hasActiveFilters = Boolean(statusFilter || typeFilter || searchTerm);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
  };

  // Clicking a summary card applies that status filter (toggle off if same)
  const handleCardClick = (card: SummaryCardConfig) => {
    // For the "Billed" card which groups two statuses, set filter to first
    // or clear if already filtering one of them
    if (card.key === "billed") {
      if (
        statusFilter === "partially_billed" ||
        statusFilter === "fully_billed"
      ) {
        setStatusFilter("");
      } else {
        // Default to fully_billed when clicking the grouped card;
        // user can refine via Filters dropdown
        setStatusFilter("fully_billed");
      }
      return;
    }
    const target = card.matchStatuses[0];
    setStatusFilter((prev) => (prev === target ? "" : target));
  };

  // Show WBS column only if at least one row has a readable label
  const showWbsColumn = useMemo(
    () => filteredOrders.some((o: any) => resolveWbsLabel(o)),
    [filteredOrders],
  );

  const colCount = showWbsColumn ? 7 : 6;

  return (
    <PageGuard module="invoice" entitlement="view_purchase_orders">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>Invoice</span>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-gray-900">Purchase Orders</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Purchase Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Issued and draft POs converted from approved requests. Filter by
              vendor, status, or type.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ── Status summary cards ───────────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-gray-100">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              const count = statusCounts[card.key] ?? 0;
              const isActive =
                card.key === "billed"
                  ? statusFilter === "partially_billed" ||
                    statusFilter === "fully_billed"
                  : statusFilter === card.matchStatuses[0];

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className={`flex flex-col items-start gap-3 px-5 py-4 min-h-[96px] text-left transition-colors hover:bg-gray-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                    isActive ? "bg-blue-50/60" : ""
                  }`}
                  aria-pressed={isActive}
                  title={
                    isActive
                      ? "Click to clear status filter"
                      : `Filter by ${card.label}`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 shrink-0 ${card.iconClass}`} />
                    <span className="text-sm font-medium text-gray-600 leading-tight">
                      {card.label}
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-semibold tabular-nums ${card.countClass}`}
                  >
                    {isLoading ? (
                      <span className="inline-block h-7 w-8 rounded bg-gray-200 animate-pulse" />
                    ) : (
                      count
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + filters */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by PO number, vendor, type…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                showFilters || statusFilter || typeFilter
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(statusFilter || typeFilter) && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                  {(statusFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-end">
              <div className="min-w-[160px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Request type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All types</option>
                  {requestTypes.map((t) => (
                    <option key={t} value={t}>
                      {formatToSentenceCase(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Result count */}
        <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
          <span>
            {isLoading ? (
              "Loading…"
            ) : (
              <>
                <span className="font-medium text-gray-800">
                  {filteredOrders.length}
                </span>{" "}
                purchase order{filteredOrders.length === 1 ? "" : "s"}
                {hasActiveFilters ? " (filtered)" : ""}
              </>
            )}
          </span>
          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table data-wizard="inv-po-table" className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Request Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Vendor
                  </th>
                  {showWbsColumn && (
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      WBS Element
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : isError ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-12 text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">
                        Could not load purchase orders
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Check your connection and try again.
                      </p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                      </button>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-12 text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">
                        No purchase orders found
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {hasActiveFilters
                          ? "Try clearing filters or adjusting your search."
                          : "Approved requests converted to POs will appear here."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => {
                    const wbsLabel = resolveWbsLabel(order);
                    const needsWbsTruncate = wbsLabel
                      ? wbsLabel.length > 36
                      : false;
                    const displayWbs = needsWbsTruncate
                      ? `${wbsLabel!.slice(0, 36)}…`
                      : wbsLabel;

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        {/* PO Number */}
                        <td className="px-4 py-3.5 text-sm font-medium">
                          <Link
                            href={`/invoice/purchase-order/${order.id}`}
                            className="text-blue-600 underline underline-offset-4 hover:text-blue-800"
                          >
                            {order.po_number || `PO-${order.id}`}
                          </Link>
                          {order.issued_at && (
                            <p className="mt-0.5 text-xs font-normal text-gray-400">
                              Issued {formatDate(order.issued_at)}
                            </p>
                          )}
                        </td>

                        {/* Request Type */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getTypeColor(
                              order.source_request_type,
                            )}`}
                          >
                            {formatToSentenceCase(order.source_request_type)}
                          </span>
                        </td>

                        {/* Vendor */}
                        <td className="px-4 py-3.5 text-sm text-gray-800">
                          {order.vendor_name || "—"}
                        </td>

                        {/* WBS Element */}
                        {showWbsColumn && (
                          <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[200px]">
                            {wbsLabel ? (
                              <span
                                className="block truncate"
                                title={needsWbsTruncate ? wbsLabel : undefined}
                              >
                                {displayWbs}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        )}

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(order.total_amount || 0))}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/invoice/purchase-order/${order.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageGuard>
  );
}
