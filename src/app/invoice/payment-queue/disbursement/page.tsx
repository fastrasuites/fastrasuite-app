"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import {
  useGetDisbursementsQuery,
  type Disbursement,
} from "@/api/invoice/disbursementApi";
import { PageGuard } from "@/components/auth/PageGuard";

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-CA"); // YYYY-MM-DD
  } catch {
    return "—";
  }
};

/** admin_lukudev → Admin Lukudev */
function formatPersonName(raw?: string | null): string {
  if (!raw) return "—";
  return String(raw)
    .split(/[_\s.-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-800",
};

function statusLabel(status?: string | null) {
  if (!status) return "—";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function MethodBadge({ method }: { method?: string | null }) {
  const m = (method || "").toUpperCase();
  if (m === "CASH") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          $
        </span>
        Cash
      </span>
    );
  }
  if (m === "BANK_TRANSFER") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <Landmark className="h-3.5 w-3.5" />
        Bank Transfer
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      {method || "—"}
    </span>
  );
}

const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------- */
/*                         Summary cards (by status)                          */
/* -------------------------------------------------------------------------- */

type SummaryCardConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  countClass: string;
  matchStatuses: string[];
};

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: "draft",
    label: "Draft",
    icon: Banknote,
    iconClass: "text-gray-500",
    countClass: "text-gray-700",
    matchStatuses: ["draft"],
  },
  {
    key: "submitted",
    label: "Submitted",
    icon: Banknote,
    iconClass: "text-amber-500",
    countClass: "text-amber-600",
    matchStatuses: ["submitted"],
  },
  {
    key: "approved",
    label: "Approved",
    icon: Banknote,
    iconClass: "text-blue-500",
    countClass: "text-blue-600",
    matchStatuses: ["approved"],
  },
  {
    key: "paid",
    label: "Paid",
    icon: Banknote,
    iconClass: "text-emerald-500",
    countClass: "text-emerald-600",
    matchStatuses: ["paid"],
  },
];

/* -------------------------------------------------------------------------- */
/*                               Skeleton                                     */
/* -------------------------------------------------------------------------- */

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                "Invoice ID",
                "Requester",
                "Amount",
                "Method",
                "Status",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 max-w-[120px] rounded bg-gray-100" />
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

export default function DisbursementsListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: disbursements = [],
    isLoading,
    isFetching,
  } = useGetDisbursementsQuery();

  const list = Array.isArray(disbursements) ? disbursements : [];

  const summaryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of SUMMARY_CARDS) counts[card.key] = 0;
    for (const d of list) {
      const s = (d.status || "").toLowerCase();
      for (const card of SUMMARY_CARDS) {
        if (card.matchStatuses.includes(s)) {
          counts[card.key] = (counts[card.key] || 0) + 1;
          break;
        }
      }
    }
    return counts;
  }, [list]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return list.filter((d) => {
      if (statusFilter && (d.status || "").toLowerCase() !== statusFilter) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        d.reference_number,
        d.created_by_name,
        d.disbursement_method,
        d.status,
        d.recipient_name,
        d.recipient_account_name,
        String(d.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [list, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCardClick = (card: SummaryCardConfig) => {
    setPage(1);
    const target = card.matchStatuses[0];
    setStatusFilter((prev) => (prev === target ? "" : target));
  };

  const isTableLoading = isLoading || isFetching;

  return (
    <PageGuard module="invoice" entitlement="view_accounts_payable_queue">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span className="text-gray-300">›</span>
          <span>Invoice</span>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-gray-800">Disbursements</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Disbursements
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Petty cash disbursements awaiting review and payment
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-4 sm:divide-y-0">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              const count = summaryCounts[card.key] ?? 0;
              const active = statusFilter === card.matchStatuses[0];
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className={`flex min-h-[88px] flex-col items-start gap-2 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                    active ? "bg-blue-50/60" : ""
                  }`}
                  aria-pressed={active}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${card.iconClass}`} />
                    <span className="text-sm font-medium text-gray-600">
                      {card.label}
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-semibold tabular-nums ${card.countClass}`}
                  >
                    {isLoading ? (
                      <span className="inline-block h-7 w-8 animate-pulse rounded bg-gray-200" />
                    ) : (
                      count
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {isTableLoading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Invoice ID
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Requester
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Amount
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Method
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-16 text-center text-sm text-gray-500"
                      >
                        No disbursements found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((d: Disbursement) => {
                      const s = (d.status || "").toLowerCase();
                      return (
                        <tr
                          key={d.id}
                          className="transition-colors hover:bg-gray-50/80"
                        >
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Link
                              href={`/invoice/payment-queue/disbursement/${d.id}`}
                              className="text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                            >
                              {d.reference_number || `DIS-${d.id}`}
                            </Link>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">
                            {formatPersonName(d.created_by_name)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(d.amount)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <MethodBadge method={d.disbursement_method} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                statusStyles[s] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {statusLabel(d.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <Link
                              href={`/invoice/payment-queue/disbursement/${d.id}`}
                              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                            >
                              Pay
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
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
                    className="rounded-md border border-gray-200 p-1.5 hover:bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="rounded-md border border-gray-200 p-1.5 hover:bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
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
