"use client";
import React, { useMemo, useState, useCallback } from "react";
import {
  useGetAccountLedgerQuery,
  useLazyGetAccountLedgerByIdQuery,
} from "@/api/invoice/accountLedgerApi";
import type {
  AccountLedgerSummary,
  AccountLedgerDetail,
  AccountLedgerListParams,
  AccountLedgerPeriod,
} from "@/api/invoice/accountLedgerApi";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  FileText,
  Download,
  X,
  Loader2,
  Calendar,
  Hash,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import jsPDF from "jspdf";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    <td className="px-6 py-4">
      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-6 py-4">
      <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-6 py-4">
      <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-6 py-4">
      <div className="ml-auto h-4 w-28 animate-pulse rounded bg-gray-200" />
    </td>
  </tr>
);

const SkeletonDetailRow = () => (
  <tr className="border-t border-gray-100">
    <td className="px-4 py-3">
      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 w-36 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-4 py-3">
      <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-4 py-3">
      <div className="ml-auto h-3 w-20 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-4 py-3">
      <div className="ml-auto h-3 w-20 animate-pulse rounded bg-gray-200" />
    </td>
    <td className="px-4 py-3">
      <div className="ml-auto h-3 w-24 animate-pulse rounded bg-gray-200" />
    </td>
  </tr>
);

const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const TransactionTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    vendor_bill: "bg-orange-100 text-orange-700",
    vendor_payment: "bg-blue-100 text-blue-700",
    customer_payment: "bg-green-100 text-green-700",
    disbursement: "bg-purple-100 text-purple-700",
    receipt: "bg-teal-100 text-teal-700",
    journal: "bg-gray-100 text-gray-700",
    inventory: "bg-yellow-100 text-yellow-700",
    expense: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    vendor_bill: "Vendor Bill",
    vendor_payment: "Vendor Payment",
    customer_payment: "Customer Payment",
    disbursement: "Disbursement",
    receipt: "Receipt",
    journal: "Journal",
    inventory: "Inventory",
    expense: "Expense",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        colors[type] || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[type] || type}
    </span>
  );
};

const handleExportPDF = (
  accounts: AccountLedgerSummary[],
  selectedAccount: AccountLedgerDetail | null,
) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Account Ledger Report", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  let y = 40;

  if (selectedAccount) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${selectedAccount.account.account_code} - ${selectedAccount.account.account_name}`,
      14,
      y,
    );
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total Debit: ${formatCurrency(selectedAccount.debit)} | Total Credit: ${formatCurrency(selectedAccount.credit)} | Balance: ${formatCurrency(selectedAccount.balance)} | Opening: ${formatCurrency(selectedAccount.opening_balance)}`,
      14,
      y,
    );
    y += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Date", 14, y);
    doc.text("Description", 45, y);
    doc.text("Type", 110, y);
    doc.text("Debit", 140, y);
    doc.text("Credit", 165, y);
    doc.text("Balance", 190, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    selectedAccount.entries.forEach((tx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(formatDate(tx.transaction_date), 14, y);
      doc.text(tx.description.substring(0, 35), 45, y);
      doc.text(tx.transaction_type.replace("_", " "), 110, y);
      doc.text(formatCurrency(tx.debit), 140, y);
      doc.text(formatCurrency(tx.credit), 165, y);
      doc.text(formatCurrency(tx.running_balance), 190, y);
      y += 5;
    });
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Code", 14, y);
    doc.text("Account Name", 45, y);
    doc.text("Debits", 130, y);
    doc.text("Credits", 155, y);
    doc.text("Balance", 180, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    accounts.forEach((acc) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(acc.account_code, 14, y);
      doc.text(acc.account_name.substring(0, 35), 45, y);
      doc.text(formatCurrency(acc.debit), 130, y);
      doc.text(formatCurrency(acc.credit), 155, y);
      doc.text(formatCurrency(acc.balance), 180, y);
      y += 6;
    });
  }

  doc.save(`Account-Ledger-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const handleExportExcel = (
  accounts: AccountLedgerSummary[],
  selectedAccount: AccountLedgerDetail | null,
) => {
  let csvContent = "";
  if (selectedAccount) {
    csvContent =
      "Date,Description,Reference,Type,Debit,Credit,Running Balance\n";
    selectedAccount.entries.forEach((tx) => {
      csvContent += `${formatDate(tx.transaction_date)},"${tx.description}",${tx.reference_number},${tx.transaction_type},${tx.debit},${tx.credit},${tx.running_balance}\n`;
    });
  } else {
    csvContent = "Code,Account Name,Debits,Credits,Balance\n";
    accounts.forEach((acc) => {
      csvContent += `${acc.account_code},"${acc.account_name}",${acc.debit},${acc.credit},${acc.balance}\n`;
    });
  }
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Account-Ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
};

type SummaryCardConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  countClass: string;
  getValue: (rows: AccountLedgerSummary[]) => number | string;
  isCurrency?: boolean;
};

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: "accounts",
    label: "Total Accounts",
    icon: BookOpen,
    iconClass: "text-blue-500",
    countClass: "text-blue-600",
    getValue: (rows) => rows.length,
    isCurrency: false,
  },
  {
    key: "debits",
    label: "Total Debits",
    icon: ArrowDownLeft,
    iconClass: "text-red-500",
    countClass: "text-red-600",
    getValue: (rows) =>
      rows.reduce((sum, a) => sum + (parseFloat(String(a.debit)) || 0), 0),
    isCurrency: true,
  },
  {
    key: "credits",
    label: "Total Credits",
    icon: ArrowUpRight,
    iconClass: "text-emerald-500",
    countClass: "text-emerald-600",
    getValue: (rows) =>
      rows.reduce((sum, a) => sum + (parseFloat(String(a.credit)) || 0), 0),
    isCurrency: true,
  },
];

type FilterDraft = {
  dateFrom: string;
  dateTo: string;
  period: AccountLedgerPeriod | "";
};

const EMPTY_FILTERS: FilterDraft = {
  dateFrom: "",
  dateTo: "",
  period: "",
};

/** Build API params from applied filters + search */
function buildListParams(
  search: string,
  applied: FilterDraft,
): AccountLedgerListParams {
  const params: AccountLedgerListParams = {};

  if (search.trim()) params.search = search.trim();

  // Prefer period over custom range when both somehow set
  if (applied.period) {
    params.period = applied.period;
  } else {
    if (applied.dateFrom) params.date_from = applied.dateFrom;
    if (applied.dateTo) params.date_to = applied.dateTo;
  }

  return params;
}

export default function AccountLedgerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Draft (form) vs applied (what the API uses)
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterDraft>(EMPTY_FILTERS);

  const queryParams = useMemo(
    () => buildListParams(searchTerm, appliedFilters),
    [searchTerm, appliedFilters],
  );

  const hasActiveFilters = Boolean(
    appliedFilters.period || appliedFilters.dateFrom || appliedFilters.dateTo,
  );

  const {
    data: ledgers = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetAccountLedgerQuery(queryParams);

  const [
    fetchAccountById,
    { data: selectedAccount, isLoading: isLoadingDetail },
  ] = useLazyGetAccountLedgerByIdQuery();

  // Client-side refine still helps while typing search if API already filtered
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return ledgers;
    return ledgers.filter(
      (acc) =>
        acc.account_name.toLowerCase().includes(term) ||
        acc.account_code.toLowerCase().includes(term),
    );
  }, [ledgers, searchTerm]);

  const handleApplyFilters = () => {
    // Mutual exclusivity: period wins if chosen; else use date range
    const next: FilterDraft = { ...draftFilters };
    if (next.period) {
      next.dateFrom = "";
      next.dateTo = "";
    }
    setAppliedFilters(next);
    setDraftFilters(next);
    setExpandedRowId(null);
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setExpandedRowId(null);
  };

  const handlePeriodChange = (value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      period: value as AccountLedgerPeriod | "",
      // Clear custom range when picking a preset period
      dateFrom: value ? "" : prev.dateFrom,
      dateTo: value ? "" : prev.dateTo,
    }));
  };

  const handleDateFromChange = (value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      dateFrom: value,
      period: value || prev.dateTo ? "" : prev.period,
    }));
  };

  const handleDateToChange = (value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      dateTo: value,
      period: value || prev.dateFrom ? "" : prev.period,
    }));
  };

  const handleRowClick = useCallback(
    (id: number) => {
      if (expandedRowId === id) {
        setExpandedRowId(null);
        return;
      }
      setExpandedRowId(id);
      // Re-fetch detail with the same date/period filters so entries match the summary
      const filterParams = buildListParams("", appliedFilters);
      fetchAccountById({ id, ...filterParams });
    },
    [expandedRowId, appliedFilters, fetchAccountById],
  );

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
          <X className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <h2 className="text-lg font-semibold text-red-800">
            Failed to load account ledger
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {(error as any)?.data?.message || "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageGuard module="invoice" entitlement="view_cash_flow">
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Ledger</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage account balances and transactions
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <div className="relative flex-1 lg:w-72 lg:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code or name..."
                className="w-full rounded border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 rounded border px-4 py-2.5 text-sm font-medium transition-all ${
                showFilters || hasActiveFilters
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
              )}
            </button>
            <div className="relative">
              <PermissionGuard module="invoice" entitlement="view_cash_flow">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 rounded border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </PermissionGuard>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        handleExportPDF(
                          filtered,
                          expandedRowId ? (selectedAccount ?? null) : null,
                        );
                        setShowExportMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 text-red-500" />
                      Export as PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportExcel(
                          filtered,
                          expandedRowId ? (selectedAccount ?? null) : null,
                        );
                        setShowExportMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 text-green-500" />
                      Export as Excel/CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[160px]">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Calendar className="h-3.5 w-3.5" /> From
                </label>
                <input
                  type="date"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  value={draftFilters.dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  disabled={Boolean(draftFilters.period)}
                />
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Calendar className="h-3.5 w-3.5" /> To
                </label>
                <input
                  type="date"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  value={draftFilters.dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  disabled={Boolean(draftFilters.period)}
                />
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Hash className="h-3.5 w-3.5" /> Period
                </label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  value={draftFilters.period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  disabled={Boolean(
                    draftFilters.dateFrom || draftFilters.dateTo,
                  )}
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="last_year">Last Year</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                {(hasActiveFilters ||
                  draftFilters.period ||
                  draftFilters.dateFrom ||
                  draftFilters.dateTo) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Use either a preset <strong>Period</strong> or a custom{" "}
              <strong>From / To</strong> range — not both.
            </p>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">Active:</span>
            {appliedFilters.period && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Period: {appliedFilters.period.replace(/_/g, " ")}
                <button
                  type="button"
                  aria-label="Remove period filter"
                  onClick={() => {
                    const next = { ...appliedFilters, period: "" as const };
                    setAppliedFilters(next);
                    setDraftFilters(next);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(appliedFilters.dateFrom || appliedFilters.dateTo) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {appliedFilters.dateFrom || "…"} →{" "}
                {appliedFilters.dateTo || "…"}
                <button
                  type="button"
                  aria-label="Remove date range"
                  onClick={() => {
                    const next = {
                      ...appliedFilters,
                      dateFrom: "",
                      dateTo: "",
                    };
                    setAppliedFilters(next);
                    setDraftFilters(next);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Summary cards */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              const raw =
                isLoading || isFetching ? null : card.getValue(filtered);
              return (
                <div
                  key={card.key}
                  className="flex min-h-[84px] flex-col items-start gap-1.5 px-4 py-3 sm:min-h-[96px] sm:gap-2 sm:px-5 sm:py-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${card.iconClass}`} />
                    <span className="text-sm font-medium text-gray-600">
                      {card.label}
                    </span>
                  </div>
                  <span
                    className={`text-xl font-semibold tabular-nums sm:text-2xl ${card.countClass}`}
                  >
                    {raw === null ? (
                      <span className="inline-block h-7 w-16 animate-pulse rounded bg-gray-200" />
                    ) : card.isCurrency ? (
                      formatCurrency(raw as number)
                    ) : (
                      raw
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {isLoading && (
          <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-32 px-6 py-3.5 text-left text-sm font-medium text-gray-500">
                    Code
                  </th>
                  <th className="px-6 py-3.5 text-left text-sm font-medium text-gray-500">
                    Account Name
                  </th>
                  <th className="px-6 py-3.5 text-right text-sm font-medium text-gray-500">
                    Debits
                  </th>
                  <th className="px-6 py-3.5 text-right text-sm font-medium text-gray-500">
                    Credits
                  </th>
                  <th className="px-6 py-3.5 text-right text-sm font-medium text-gray-500">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Search className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">
              No accounts found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="w-32 px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Code
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Account Name
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Debits
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Credits
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => {
                    const isExpanded = expandedRowId === account.id;
                    return (
                      <React.Fragment key={account.id}>
                        <tr
                          className={`cursor-pointer border-b border-gray-100 transition-all ${
                            isExpanded ? "bg-blue-50/60" : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleRowClick(account.id)}
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`transition-colors ${
                                  isExpanded ? "text-blue-600" : "text-gray-400"
                                }`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </span>
                              <span className="font-mono text-sm font-medium text-gray-900">
                                {account.account_code}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">
                            <span
                              className="block max-w-[280px] truncate"
                              title={account.account_name}
                            >
                              {account.account_name}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold tabular-nums text-red-600">
                            {formatCurrency(account.debit)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold tabular-nums text-green-600">
                            {formatCurrency(account.credit)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold tabular-nums text-gray-900">
                            {formatCurrency(account.balance)}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <div className="border-b border-gray-200 bg-gradient-to-b from-blue-50/30 to-white">
                                <div className="p-4">
                                  {isLoadingDetail ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading transactions...
                                      </div>
                                      <div className="overflow-hidden rounded border border-gray-200">
                                        <table className="w-full text-sm">
                                          <tbody>
                                            <SkeletonDetailRow />
                                            <SkeletonDetailRow />
                                            <SkeletonDetailRow />
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ) : selectedAccount ? (
                                    <>
                                      <h4 className="mb-3 text-sm font-semibold text-gray-700">
                                        Ledger Entries (
                                        {selectedAccount.entries.length})
                                      </h4>
                                      {selectedAccount.entries.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-gray-500">
                                          No transactions found for this account
                                          {hasActiveFilters
                                            ? " in the selected period"
                                            : ""}
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto rounded border border-gray-200">
                                          <table className="w-full min-w-[560px] text-sm">
                                            <thead>
                                              <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                                                  Date
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                                                  Description
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                                                  Type
                                                </th>
                                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">
                                                  Debit
                                                </th>
                                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">
                                                  Credit
                                                </th>
                                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">
                                                  Balance
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {selectedAccount.entries.map(
                                                (tx) => (
                                                  <tr
                                                    key={tx.id}
                                                    className="border-t border-gray-100 transition-colors hover:bg-gray-50"
                                                  >
                                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                      {formatDate(
                                                        tx.transaction_date,
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                      <span
                                                        className="block max-w-[220px] truncate"
                                                        title={tx.description}
                                                      >
                                                        {tx.description}
                                                      </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <TransactionTypeBadge
                                                        type={
                                                          tx.transaction_type
                                                        }
                                                      />
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-red-600">
                                                      {formatCurrency(tx.debit)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-green-600">
                                                      {formatCurrency(
                                                        tx.credit,
                                                      )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-gray-900">
                                                      {formatCurrency(
                                                        tx.running_balance,
                                                      )}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="py-8 text-center text-sm text-gray-500">
                                      Failed to load account details
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageGuard>
  );
}
