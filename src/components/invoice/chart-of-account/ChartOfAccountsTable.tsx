"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ChartOfAccountDetail } from "@/api/invoice/chartOfAccountsApi";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface Props {
  accounts: ChartOfAccountDetail[];
  viewMode: "detailed" | "ledger";
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onAddAccount: (parentId?: number) => void;
  onEditAccount: (accountId: number) => void;
}

const filters = ["All", "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const typeBadgeStyles: Record<string, string> = {
  ASSET: "bg-blue-100 text-blue-700",
  LIABILITY: "bg-red-100 text-red-700",
  EQUITY: "bg-amber-100 text-amber-700",
  INCOME: "bg-green-100 text-green-700",
  EXPENSE: "bg-orange-100 text-orange-700",
};

export function ChartOfAccountsTable({
  accounts,
  viewMode,
  activeFilter,
  onFilterChange,
  onAddAccount,
  onEditAccount,
}: Props) {
  const [expanded, setExpanded] = useState<number[]>([]);

  const toggle = (id: number) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
      {/* Header + Filters */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {viewMode === "detailed" ? "Accounts" : "Account Ledger"}
        </h2>

        <div className="flex gap-1 bg-gray-100 p-1 rounded overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                activeFilter === f
                  ? "bg-white shadow-sm text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-white/60"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500 w-32">
                Code
              </th>
              <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500">
                Account Name
              </th>
              <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500">
                Type
              </th>
              <th className="text-right py-3.5 px-6 text-sm font-medium text-gray-500">
                Balance
              </th>
              <th className=""></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((cat) => (
              <React.Fragment key={cat.id}>
                {/* Category Row */}
                <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggle(cat.id)}
                      className="flex items-center gap-2 font-medium text-gray-900"
                    >
                      {expanded.includes(cat.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      {cat.account_number}
                    </button>
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-900">
                    {cat.account_name}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        typeBadgeStyles[cat.account_type] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {cat.account_type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-gray-900">
                    N
                    {parseFloat(cat.balance || "0").toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-3">
                      <PermissionGuard
                        module="invoice"
                        entitlement="configure_invoice"
                      >
                        <button
                          onClick={() => onEditAccount(cat.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </PermissionGuard>

                      <PermissionGuard
                        module="invoice"
                        entitlement="configure_invoice"
                      >
                        <button
                          onClick={() => onAddAccount(cat.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
                        >
                          Add Sub-account
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>

                {/* Children (only in detailed view) */}
                {viewMode === "detailed" &&
                  expanded.includes(cat.id) &&
                  cat.children?.map((child) => (
                    <tr
                      key={child.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="py-3.5 px-6 pl-14 text-gray-600">
                        {child.account_number}
                      </td>
                      <td className="py-3.5 px-6 text-gray-800">
                        {child.account_name}
                      </td>
                      <td className="py-3.5 px-6">
                        {/* Sub accounts have the same type logically, but API doesn't return it in child array. We can infer or just leave blank */}
                        <span className="text-gray-400 text-xs">-</span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-medium text-gray-800">
                        N
                        {parseFloat(child.balance || "0").toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <PermissionGuard
                          module="invoice"
                          entitlement="configure_invoice"
                        >
                          <button
                            onClick={() => onEditAccount(child.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
