"use client";
import React, { useState } from "react";
import {
  useGetAccountLedgerQuery,
  useGetAccountLedgerByIdQuery,
  useLazyGetAccountLedgerByIdQuery,
} from "@/api/invoice/accountLedgerApi";
import type {
  AccountLedgerSummary,
  AccountLedgerDetail,
  AccountLedgerEntry,
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
  DollarSign,
} from "lucide-react";
import jsPDF from "jspdf";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

// Skeleton Components
const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    <td className="py-4 px-6">
      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
    </td>
    <td className="py-4 px-6">
      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
    </td>
    <td className="py-4 px-6">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse ml-auto" />
    </td>
    <td className="py-4 px-6">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse ml-auto" />
    </td>
    <td className="py-4 px-6">
      <div className="h-4 bg-gray-200 rounded w-28 animate-pulse ml-auto" />
    </td>
  </tr>
);

const SkeletonDetailRow = () => (
  <tr className="border-t border-gray-100">
    <td className="py-3 px-4">
      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
    </td>
    <td className="py-3 px-4">
      <div className="h-3 bg-gray-200 rounded w-36 animate-pulse" />
    </td>
    <td className="py-3 px-4">
      <div className="h-3 bg-gray-200 rounded w-28 animate-pulse" />
    </td>
    <td className="py-3 px-4">
      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse ml-auto" />
    </td>
    <td className="py-3 px-4">
      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse ml-auto" />
    </td>
    <td className="py-3 px-4">
      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse ml-auto" />
    </td>
  </tr>
);

// Utility Functions
const formatCurrency = (value: number | string | null) => {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";
  return `N${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const shortenWBS = (wbs: string | null) => {
  if (!wbs || wbs === "-") return "-";
  if (wbs.length > 25)
    return `${wbs.substring(0, 12)}...${wbs.substring(wbs.length - 10)}`;
  return wbs;
};

// Tooltip Component
const Tooltip = ({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 max-w-xs whitespace-normal shadow-lg">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

// Transaction Type Badge
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
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-700"}`}
    >
      {labels[type] || type}
    </span>
  );
};

// Export Functions
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
    doc.text("WBS", 100, y);
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
      doc.text(tx.description.substring(0, 30), 45, y);
      doc.text(shortenWBS(tx.wbs), 100, y);
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
      "Date,Description,WBS,Reference,Type,Debit,Credit,Running Balance\n";
    selectedAccount.entries.forEach((tx) => {
      csvContent += `${formatDate(tx.transaction_date)},"${tx.description}",${tx.wbs || "-"},${tx.reference_number},${tx.transaction_type},${tx.debit},${tx.credit},${tx.running_balance}\n`;
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

export default function AccountLedgerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState("");

  const {
    data: ledgers = [],
    isLoading,
    isError,
    error,
  } = useGetAccountLedgerQuery({ search: searchTerm || undefined });
  const [
    fetchAccountById,
    { data: selectedAccount, isLoading: isLoadingDetail },
  ] = useLazyGetAccountLedgerByIdQuery();

  const filtered = ledgers.filter(
    (acc) =>
      acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRowClick = (id: number) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
      fetchAccountById(id);
    }
  };

  const handleCloseDetail = () => {
    setExpandedRowId(null);
  };

  const getSelectedAccountSummary = (): AccountLedgerSummary | null => {
    if (!expandedRowId) return null;
    return ledgers.find((l) => l.id === expandedRowId) || null;
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
          <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800">
            Failed to load account ledger
          </h2>
          <p className="text-red-600 mt-2 text-sm">
            {(error as any)?.data?.message || "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageGuard module="invoice" entitlement="view_cash_flow">
      <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Ledger</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage account balances and transactions
            </p>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <div className="relative flex-1 lg:flex-none lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by code or name..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border px-4 py-2.5 rounded text-sm font-medium transition-all ${showFilters ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <div className="relative">
              <PermissionGuard module="invoice" entitlement="view_cash_flow">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded text-sm font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </PermissionGuard>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        handleExportPDF(
                          filtered,
                          expandedRowId ? (selectedAccount ?? null) : null,
                        );
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      Export as PDF
                    </button>
                    <button
                      onClick={() => {
                        handleExportExcel(
                          filtered,
                          expandedRowId ? (selectedAccount ?? null) : null,
                        );
                        setShowExportMenu(false);
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 text-green-500" />
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
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[160px]">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> From
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="min-w-[160px]">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> To
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="min-w-[160px]">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                  <Hash className="w-3.5 h-3.5" /> Period
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
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
              <button className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        )}
        {/* Stats Cards */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Total Accounts
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filtered.length}
              </p>
            </div>
            <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">Total Debits</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(
                  filtered.reduce(
                    (sum, a) => sum + (parseFloat(a.debit) || 0),
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">Total Credits</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(
                  filtered.reduce(
                    (sum, a) => sum + (parseFloat(a.credit) || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        )}
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500 w-32">
                    Code
                  </th>
                  <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500">
                    Account Name
                  </th>
                  <th className="text-right py-3.5 px-6 text-sm font-medium text-gray-500">
                    Debits
                  </th>
                  <th className="text-right py-3.5 px-6 text-sm font-medium text-gray-500">
                    Credits
                  </th>
                  <th className="text-right py-3.5 px-6 text-sm font-medium text-gray-500">
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
        {/* Main Table */}
        {!isLoading && filtered.length === 0 && (
          <div className="bg-white rounded border border-gray-200 shadow-sm p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">
              No accounts found
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Code
                    </th>
                    <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="text-right py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Debits
                    </th>
                    <th className="text-right py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="text-right py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                          className={`border-b border-gray-100 cursor-pointer transition-all ${isExpanded ? "bg-blue-50/60" : "hover:bg-gray-50"}`}
                          onClick={() => handleRowClick(account.id)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                className={`transition-colors ${isExpanded ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <span className="font-mono text-sm font-medium text-gray-900">
                                {account.account_code}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-800 font-medium">
                            {account.account_name}
                          </td>
                          <td className="py-4 px-6 text-right text-sm font-semibold text-red-600">
                            {formatCurrency(account.debit)}
                          </td>
                          <td className="py-4 px-6 text-right text-sm font-semibold text-green-600">
                            {formatCurrency(account.credit)}
                          </td>
                          <td className="py-4 px-6 text-right text-sm font-bold text-gray-900">
                            {formatCurrency(account.balance)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <div className="bg-gradient-to-b from-blue-50/30 to-white border-b border-gray-200">
                                <div className="p-5">
                                  {isLoadingDetail ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
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
                                      <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-gray-900">
                                          {selectedAccount.account.account_code}{" "}
                                          -{" "}
                                          {selectedAccount.account.account_name}
                                        </h3>
                                        <button
                                          onClick={handleCloseDetail}
                                          className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                          <X className="w-5 h-5" />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                                        <div className="bg-white rounded border border-gray-200 p-3">
                                          <p className="text-xs text-gray-500">
                                            Opening Balance
                                          </p>
                                          <p className="text-sm font-bold text-gray-900 mt-0.5">
                                            {formatCurrency(
                                              selectedAccount.opening_balance,
                                            )}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded border border-red-100 p-3">
                                          <p className="text-xs text-gray-500">
                                            Total Debits
                                          </p>
                                          <p className="text-sm font-bold text-red-600 mt-0.5">
                                            {formatCurrency(
                                              selectedAccount.debit,
                                            )}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded border border-green-100 p-3">
                                          <p className="text-xs text-gray-500">
                                            Total Credits
                                          </p>
                                          <p className="text-sm font-bold text-green-600 mt-0.5">
                                            {formatCurrency(
                                              selectedAccount.credit,
                                            )}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded border border-blue-100 p-3">
                                          <p className="text-xs text-gray-500">
                                            Closing Balance
                                          </p>
                                          <p className="text-sm font-bold text-blue-600 mt-0.5">
                                            {formatCurrency(
                                              selectedAccount.balance,
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                        Ledger Entries (
                                        {selectedAccount.entries.length})
                                      </h4>
                                      {selectedAccount.entries.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                          No transactions found for this account
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto rounded border border-gray-200">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">
                                                  Date
                                                </th>
                                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">
                                                  Description
                                                </th>
                                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">
                                                  WBS
                                                </th>
                                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">
                                                  Type
                                                </th>
                                                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">
                                                  Debit
                                                </th>
                                                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">
                                                  Credit
                                                </th>
                                                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">
                                                  Balance
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {selectedAccount.entries.map(
                                                (tx) => (
                                                  <tr
                                                    key={tx.id}
                                                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                                                  >
                                                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                                                      {formatDate(
                                                        tx.transaction_date,
                                                      )}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-900 font-medium">
                                                      {tx.description}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600">
                                                      {tx.wbs ? (
                                                        <Tooltip
                                                          content={tx.wbs}
                                                        >
                                                          <span className="cursor-help text-blue-600 hover:text-blue-800">
                                                            {shortenWBS(tx.wbs)}
                                                          </span>
                                                        </Tooltip>
                                                      ) : (
                                                        <span className="text-gray-400">
                                                          -
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                      <TransactionTypeBadge
                                                        type={
                                                          tx.transaction_type
                                                        }
                                                      />
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                                                      {formatCurrency(tx.debit)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                                                      {formatCurrency(
                                                        tx.credit,
                                                      )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-gray-900">
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
                                    <div className="text-center py-8 text-gray-500 text-sm">
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
