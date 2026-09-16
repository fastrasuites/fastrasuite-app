"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  TriangleAlert,
  CircleCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  useGetVendorBillsQuery,
  useGetPaymentQueueVendorBillsQuery,
  type VendorBill,
} from "@/api/invoice/vendorBillsApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

const getDaysUntilDue = (dueDate: string | null) => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-800",
  partial: "bg-indigo-100 text-indigo-800",
};

const paymentStatusStyles: Record<string, string> = {
  unpaid: "bg-orange-50 text-orange-700",
  partial: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
};

const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------- */
/*                               Skeleton                                     */
/* -------------------------------------------------------------------------- */

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "Bill Number",
                "Vendor",
                "Source",
                "Invoice Date",
                "Due Date",
                "Days Left",
                "Amount",
                "Status",
                "Payment",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 10 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Page                                         */
/* -------------------------------------------------------------------------- */

export default function PaymentQueuePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    payment_status: "",
    source_type: "",
    vendor: "",
  });

  const {
    data: invoices = [],
    isLoading,
    isFetching,
  } = useGetVendorBillsQuery();

  // const {
  //   data: invoices = [],
  //   isLoading,
  //   isFetching,
  // } = useGetPaymentQueueVendorBillsQuery();

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let list = [...invoices];

    // Default sort: ascending days until due (PRD)
    list.sort((a, b) => {
      const da = getDaysUntilDue(a.due_date) ?? 9999;
      const db = getDaysUntilDue(b.due_date) ?? 9999;
      return da - db;
    });

    return list.filter((inv) => {
      const matchesSearch =
        !term ||
        (inv.bill_number || "").toLowerCase().includes(term) ||
        (inv.vendor_name || "").toLowerCase().includes(term) ||
        String(inv.id).includes(term);

      const matchesStatus =
        !filters.status ||
        inv.status?.toLowerCase() === filters.status.toLowerCase();

      const matchesPayment =
        !filters.payment_status ||
        (inv.payment_status || "").toLowerCase() ===
          filters.payment_status.toLowerCase();

      const matchesSource =
        !filters.source_type ||
        (inv.source_type || "").toLowerCase() ===
          filters.source_type.toLowerCase();

      const matchesVendor =
        !filters.vendor ||
        (inv.vendor_name || "")
          .toLowerCase()
          .includes(filters.vendor.toLowerCase());

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesSource &&
        matchesVendor
      );
    });
  }, [invoices, searchTerm, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setFilters({ status: "", payment_status: "", source_type: "", vendor: "" });
    setSearchTerm("");
    setPage(1);
  };

  const isTableLoading = isLoading || isFetching;

  return (
    <PageGuard module="invoice" entitlement="view_invoices">
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5">
          <span>Home</span>
          <span className="text-gray-300">›</span>
          <span>Invoice</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-800 font-medium">Payment Queue</span>
        </nav>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Payment Queue
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              All vendor bills ready for review and payment
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bill number or vendor…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, status: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Payment Status
              </label>
              <select
                value={filters.payment_status}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, payment_status: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Source Type
              </label>
              <select
                value={filters.source_type}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, source_type: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="PROJECT_PO">Project PO</option>
                <option value="LABOUR">Labour</option>
                <option value="SUBCONTRACTOR">Subcontractor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Vendor
              </label>
              <input
                type="text"
                placeholder="Vendor name"
                value={filters.vendor}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, vendor: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        )}
        {/* Table */}
        {isTableLoading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table
                data-wizard="inv-payment-table"
                className="w-full min-w-[900px]"
              >
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill Number
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Date
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Left
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flag
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-5 py-16 text-center text-gray-500"
                      >
                        No vendor bills match your filters.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((inv) => {
                      const days = getDaysUntilDue(inv.due_date);
                      const isOverdue = days !== null && days < 0;
                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50/80 transition-colors"
                        >
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Link
                              href={`/invoice/payment-queue/${inv.id}`}
                              className="text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                            >
                              {inv.bill_number || `VB-${inv.id}`}
                            </Link>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">
                            {inv?.vendor_name ||
                              inv?.vendor_details?.vendor_name}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(inv as any).source_type_display ||
                              inv.source_type ||
                              "—"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                            {inv.invoice_date || "—"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                            {inv.due_date || "—"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm">
                            {days === null ? (
                              "—"
                            ) : (
                              <span
                                className={
                                  isOverdue
                                    ? "text-red-600 font-medium"
                                    : "text-gray-700"
                                }
                              >
                                {isOverdue
                                  ? `${Math.abs(days)}d overdue`
                                  : `${days}d`}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(inv.amount)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                statusStyles[inv.status?.toLowerCase()] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {(inv as any).status_display || inv.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                paymentStatusStyles[
                                  inv.payment_status?.toLowerCase()
                                ] || "bg-gray-50 text-gray-600"
                              }`}
                            >
                              {(inv as any).payment_status_display ||
                                inv.payment_status ||
                                "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {isOverdue ? (
                              <TriangleAlert className="w-5 h-5 text-red-500" />
                            ) : (
                              <CircleCheck className="w-5 h-5 text-gray-400" />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageGuard>
  );
}
