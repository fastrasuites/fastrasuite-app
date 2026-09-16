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
} from "lucide-react";
import { useGetPurchaseOrdersQuery } from "@/api/invoice/projectPurchaseOrdersApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

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

  // Plain string that is not a UUID
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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${color}`}
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
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
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
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTypeColor(
                              order.source_request_type,
                            )}`}
                          >
                            {formatToSentenceCase(order.source_request_type)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-800">
                          {order.vendor_name || "—"}
                        </td>
                        {showWbsColumn && (
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {wbsLabel || (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(order.total_amount || 0))}
                        </td>
                        <td className="px-4 py-3.5">
                          {getStatusBadge(order.status)}
                        </td>
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
