"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus } from "lucide-react";
import type { ChartOfAccountDetail } from "@/api/invoice/chartOfAccountsApi";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface Props {
  accounts: ChartOfAccountDetail[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onAddAccount: (parentId?: number) => void;
  onEditAccount: (accountId: number) => void;
  isLoading?: boolean;
}

const filters: { value: string; label: string; shortLabel: string }[] = [
  { value: "All", label: "All", shortLabel: "All" },
  { value: "ASSET", label: "Assets", shortLabel: "Assets" },
  { value: "LIABILITY", label: "Liabilities", shortLabel: "Liab." },
  { value: "EQUITY", label: "Equity", shortLabel: "Equity" },
  { value: "INCOME", label: "Revenue", shortLabel: "Rev." },
  { value: "EXPENSE", label: "Expenses", shortLabel: "Exp." },
];

const typeBadgeStyles: Record<string, string> = {
  ASSET: "bg-blue-100 text-blue-700",
  LIABILITY: "bg-red-100 text-red-700",
  EQUITY: "bg-amber-100 text-amber-700",
  INCOME: "bg-green-100 text-green-700",
  EXPENSE: "bg-orange-100 text-orange-700",
};

const typeDisplay: Record<string, string> = {
  ASSET: "Assets",
  LIABILITY: "Liabilities",
  EQUITY: "Equity",
  INCOME: "Revenue",
  EXPENSE: "Expenses",
};

const typeShort: Record<string, string> = {
  ASSET: "Assets",
  LIABILITY: "Liab.",
  EQUITY: "Equity",
  INCOME: "Rev.",
  EXPENSE: "Exp.",
};

const formatNaira = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

function TruncateWithTooltip({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text) return <span className={className}>—</span>;
  return (
    <span className={`block truncate ${className}`} title={text}>
      {text}
    </span>
  );
}

export function ChartOfAccountsTable({
  accounts,
  activeFilter,
  onFilterChange,
  onAddAccount,
  onEditAccount,
  isLoading,
}: Props) {
  const [expanded, setExpanded] = useState<number[]>([]);

  useEffect(() => {
    setExpanded(accounts.map((a) => a.id));
  }, [accounts]);

  const toggle = (id: number) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header + filters */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="shrink-0 text-base font-semibold text-gray-900 sm:text-lg">
            Accounts
          </h2>
        </div>

        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs transition-all sm:px-3 sm:text-sm ${
                activeFilter === f.value
                  ? "bg-blue-600 font-medium text-white shadow-sm sm:bg-white sm:text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 sm:bg-transparent sm:hover:bg-white/60"
              }`}
            >
              <span className="sm:hidden">{f.shortLabel}</span>
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile / tablet card list */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading accounts…
          </div>
        ) : accounts.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            No accounts found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {accounts.map((cat) => {
              const isExpanded = expanded.includes(cat.id);
              return (
                <li key={cat.id}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-3 sm:px-4">
                    <button
                      type="button"
                      onClick={() => toggle(cat.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-xs font-medium text-gray-500">
                            {cat.account_number}
                          </span>
                          <TruncateWithTooltip
                            text={cat.account_name}
                            className="text-sm font-semibold text-gray-900"
                          />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              typeBadgeStyles[cat.account_type] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {typeShort[cat.account_type] || cat.account_type}
                          </span>
                          <span className="text-xs font-medium tabular-nums text-gray-700">
                            {formatNaira(cat.balance)}
                          </span>
                        </div>
                      </div>
                    </button>
                    <PermissionGuard
                      module="invoice"
                      entitlement="configure_invoice"
                    >
                      <button
                        type="button"
                        onClick={() => onAddAccount(cat.id)}
                        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </PermissionGuard>
                  </div>

                  {/* Children as compact rows */}
                  {isExpanded &&
                    cat.children?.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 border-t border-gray-50 px-3 py-2.5 pl-8 sm:px-4 sm:pl-10"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-xs text-gray-500">
                              {child.account_number}
                            </span>
                            <TruncateWithTooltip
                              text={child.account_name}
                              className="text-sm text-gray-800"
                            />
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                typeBadgeStyles[
                                  child.account_type || cat.account_type
                                ] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {typeShort[
                                child.account_type || cat.account_type
                              ] ||
                                child.account_type ||
                                "—"}
                            </span>
                            <span className="text-xs font-medium tabular-nums text-gray-700">
                              {formatNaira(child.balance)}
                            </span>
                          </div>
                        </div>
                        <PermissionGuard
                          module="invoice"
                          entitlement="configure_invoice"
                        >
                          <button
                            type="button"
                            onClick={() => onEditAccount(child.id)}
                            className="shrink-0 whitespace-nowrap px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </button>
                        </PermissionGuard>
                      </div>
                    ))}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] table-fixed">
          <colgroup>
            <col className="w-[120px] lg:w-[140px]" />
            <col />
            <col className="w-[110px] lg:w-[140px]" />
            <col className="w-[120px] lg:w-[140px]" />
            <col className="w-[140px] lg:w-[180px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6 lg:py-3.5">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6 lg:py-3.5">
                Account Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6 lg:py-3.5">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6 lg:py-3.5">
                Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6 lg:py-3.5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-16 text-center text-gray-500"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading accounts…
                  </span>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No accounts found.
                </td>
              </tr>
            ) : (
              accounts.map((cat) => {
                const isExpanded = expanded.includes(cat.id);
                return (
                  <React.Fragment key={cat.id}>
                    <tr className="border-b border-gray-100 bg-gray-50/40 hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-4 py-3 lg:px-6 lg:py-3.5">
                        <button
                          type="button"
                          onClick={() => toggle(cat.id)}
                          className="inline-flex items-center gap-2 font-medium text-gray-900"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                          )}
                          <span className="whitespace-nowrap text-sm">
                            {cat.account_number}
                          </span>
                        </button>
                      </td>
                      <td className="max-w-0 px-4 py-3 lg:px-6 lg:py-3.5">
                        <TruncateWithTooltip
                          text={cat.account_name}
                          className="font-semibold text-gray-900"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 lg:px-6 lg:py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                            typeBadgeStyles[cat.account_type] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <span className="lg:hidden">
                            {typeShort[cat.account_type] || cat.account_type}
                          </span>
                          <span className="hidden lg:inline">
                            {typeDisplay[cat.account_type] || cat.account_type}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 lg:px-6 lg:py-3.5">
                        {formatNaira(cat.balance)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right lg:px-6 lg:py-3.5">
                        <PermissionGuard
                          module="invoice"
                          entitlement="configure_invoice"
                        >
                          <button
                            type="button"
                            onClick={() => onAddAccount(cat.id)}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 lg:px-3 lg:text-sm"
                          >
                            <Plus className="h-3.5 w-3.5 lg:hidden" />
                            <span className="lg:hidden">Add</span>
                            <span className="hidden lg:inline">
                              Add account
                            </span>
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>

                    {isExpanded &&
                      cat.children?.map((child) => (
                        <tr
                          key={child.id}
                          className="border-b border-gray-100 hover:bg-gray-50/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 pl-10 text-sm text-gray-600 lg:px-6 lg:py-3.5 lg:pl-14">
                            <span className="inline-flex items-center gap-2">
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                              {child.account_number}
                            </span>
                          </td>
                          <td className="max-w-0 px-4 py-3 lg:px-6 lg:py-3.5">
                            <TruncateWithTooltip
                              text={child.account_name}
                              className="text-sm text-gray-800"
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 lg:px-6 lg:py-3.5">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                                typeBadgeStyles[
                                  child.account_type || cat.account_type
                                ] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <span className="lg:hidden">
                                {typeShort[
                                  child.account_type || cat.account_type
                                ] ||
                                  child.account_type ||
                                  "—"}
                              </span>
                              <span className="hidden lg:inline">
                                {typeDisplay[
                                  child.account_type || cat.account_type
                                ] ||
                                  child.account_type ||
                                  "—"}
                              </span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-800 lg:px-6 lg:py-3.5">
                            {formatNaira(child.balance)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right lg:px-6 lg:py-3.5">
                            <PermissionGuard
                              module="invoice"
                              entitlement="configure_invoice"
                            >
                              <button
                                type="button"
                                onClick={() => onEditAccount(child.id)}
                                className="inline-flex whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-700 lg:text-sm"
                              >
                                Edit
                              </button>
                            </PermissionGuard>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
