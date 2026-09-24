"use client";

import React, { useMemo, useState } from "react";
import { ChartOfAccountsTable } from "@/components/invoice/chart-of-account/ChartOfAccountsTable";
import { AccountFormModal } from "@/components/invoice/chart-of-account/AccountFormModal";
import { DeactivateModals } from "@/components/invoice/chart-of-account/DeactivateModals";
import {
  Search,
  Plus,
  Landmark,
  Scale,
  PiggyBank,
  TrendingUp,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import {
  useStatusModal,
  StatusModal,
  extractErrorMessage,
} from "@/components/shared/StatusModal";
import {
  useGetChartOfAccountsGroupedQuery,
  useCreateChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useGetChartOfAccountsSummaryQuery,
  type ChartOfAccountDetail,
  type AccountType,
} from "@/api/invoice/chartOfAccountsApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const formatNaira = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

type SummaryCardConfig = {
  key: string;
  label: string;
  apiKey: AccountType;
  filterValue: string;
  icon: LucideIcon;
  iconClass: string;
  countClass: string;
};

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: "assets",
    label: "Assets",
    apiKey: "ASSET",
    filterValue: "ASSET",
    icon: Landmark,
    iconClass: "text-blue-500",
    countClass: "text-blue-600",
  },
  {
    key: "liabilities",
    label: "Liabilities",
    apiKey: "LIABILITY",
    filterValue: "LIABILITY",
    icon: Scale,
    iconClass: "text-red-500",
    countClass: "text-red-600",
  },
  {
    key: "equity",
    label: "Equity",
    apiKey: "EQUITY",
    filterValue: "EQUITY",
    icon: PiggyBank,
    iconClass: "text-amber-500",
    countClass: "text-amber-600",
  },
  {
    key: "revenue",
    label: "Revenue",
    apiKey: "INCOME",
    filterValue: "INCOME",
    icon: TrendingUp,
    iconClass: "text-emerald-500",
    countClass: "text-emerald-600",
  },
  {
    key: "expenses",
    label: "Expenses",
    apiKey: "EXPENSE",
    filterValue: "EXPENSE",
    icon: Receipt,
    iconClass: "text-orange-500",
    countClass: "text-orange-600",
  },
];

/** Synthetic parent row codes matching Figma (1000 / 2000 / …) */
const GROUP_META: Record<AccountType, { code: string; name: string }> = {
  ASSET: { code: "1000", name: "Assets" },
  LIABILITY: { code: "2000", name: "Liabilities" },
  EQUITY: { code: "3000", name: "Equity" },
  INCOME: { code: "4000", name: "Revenue" },
  EXPENSE: { code: "5000", name: "Expenses" },
};

const GROUP_ORDER: AccountType[] = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
];

export default function ChartOfAccountsPage() {
  const { data: grouped, isLoading: isGroupedLoading } =
    useGetChartOfAccountsGroupedQuery();
  const [createAccount] = useCreateChartOfAccountMutation();
  const [updateAccount] = useUpdateChartOfAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] =
    useDeleteChartOfAccountMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    accountId?: number | null;
    parentId?: number | null;
    /** When adding under a type group (no real parent id) */
    defaultType?: AccountType | null;
  }>({ isOpen: false, mode: "add" });

  const [deactivateState, setDeactivateState] = useState<{
    isOpen: boolean;
    accountId: number | null;
  }>({ isOpen: false, accountId: null });

  const statusModal = useStatusModal();

  /**
   * Build Figma-style tree:
   * - Parent row per account type (synthetic id, expand/collapse)
   * - Children = accounts from grouped endpoint
   */
  const accounts: ChartOfAccountDetail[] = useMemo(() => {
    if (!grouped) return [];

    const term = searchTerm.toLowerCase().trim();

    return GROUP_ORDER.filter((type) => {
      if (activeFilter !== "All" && activeFilter !== type) return false;
      return true;
    })
      .map((type, index) => {
        const meta = GROUP_META[type];
        const children = (grouped[type] || []).filter((acc) => {
          if (!term) return true;
          return (
            acc.account_name.toLowerCase().includes(term) ||
            acc.account_number.includes(searchTerm)
          );
        });

        // Sum of child balances for parent row display
        const balance = children
          .reduce((sum, c) => sum + Number(c.balance || 0), 0)
          .toFixed(2);

        const parent: ChartOfAccountDetail = {
          id: -(index + 1), // synthetic negative id (not a real account)
          account_number: meta.code,
          account_name: meta.name,
          account_type: type,
          subtype: "normal",
          is_active: true,
          is_control_account: false,
          control_type: null as any,
          parent_account: null,
          balance,
          children: children as ChartOfAccountDetail[],
        };
        return parent;
      })
      .filter((parent) => {
        // Hide empty groups when searching
        if (searchTerm && !parent.children?.length) return false;
        return true;
      });
  }, [grouped, searchTerm, activeFilter]);

  const { data: summaryApiResponse, isLoading: isSummaryLoading } =
    useGetChartOfAccountsSummaryQuery();

  const getSummaryValue = (type: string) => {
    if (!summaryApiResponse) return 0;
    const node = (summaryApiResponse as any)[type];
    if (node && typeof node === "object" && node.balance !== undefined) {
      return parseFloat(String(node.balance || "0"));
    }
    return 0;
  };

  const handleCardClick = (card: SummaryCardConfig) => {
    setActiveFilter((prev) =>
      prev === card.filterValue ? "All" : card.filterValue,
    );
  };

  const handleAddAccount = (parentId?: number, defaultType?: AccountType) => {
    // Synthetic parents have negative ids – treat as type-only add
    if (parentId != null && parentId < 0) {
      const idx = Math.abs(parentId) - 1;
      const type = GROUP_ORDER[idx];
      setFormModal({
        isOpen: true,
        mode: "add",
        parentId: null,
        defaultType: type,
      });
      return;
    }
    setFormModal({
      isOpen: true,
      mode: "add",
      parentId: parentId ?? null,
      defaultType: defaultType ?? null,
    });
  };

  const handleEditAccount = (accountId: number) => {
    if (accountId < 0) return; // never edit synthetic group rows
    setFormModal({ isOpen: true, mode: "edit", accountId });
  };

  const handleSaveAccount = async (data: any, id?: number) => {
    try {
      const payload = {
        ...data,
        parent_account: formModal.parentId || null,
        account_type: data.account_type || formModal.defaultType || "ASSET",
      };

      if (formModal.mode === "add") {
        await createAccount(payload).unwrap();
        setFormModal({ isOpen: false, mode: "add" });
        statusModal.showSuccess(
          "Success",
          "Account has successfully been added",
        );
      } else if (formModal.mode === "edit" && id) {
        await updateAccount({ id, data: payload }).unwrap();
        setFormModal({ isOpen: false, mode: "add" });
        statusModal.showSuccess("Success", "Account updated successfully");
      }
    } catch (err: any) {
      if (
        err?.status === 400 &&
        err?.data &&
        typeof err.data === "object" &&
        !err.data.detail
      ) {
        throw err;
      } else {
        statusModal.showError(
          "Failed to save account",
          extractErrorMessage(err, "Failed to save account"),
        );
      }
    }
  };

  const handleDeactivateClick = () => {
    if (formModal.accountId) {
      const id = formModal.accountId;
      setFormModal({ isOpen: false, mode: "add" });
      setDeactivateState({ isOpen: true, accountId: id });
    }
  };

  const handleDeactivateConfirm = async (id: number) => {
    try {
      await deleteAccount(id).unwrap();
      setDeactivateState({ isOpen: false, accountId: null });
      statusModal.showSuccess(
        "Account deactivated",
        "The account has been deactivated and is no longer available for new postings.",
      );
    } catch (err: any) {
      statusModal.showError(
        "Failed to deactivate",
        extractErrorMessage(err, "Failed to deactivate account"),
      );
    }
  };

  return (
    <PageGuard module="invoice" entitlement="view_chart_of_accounts">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.actionText}
          onAction={statusModal.onAction}
          secondaryText={statusModal.secondaryText}
          onSecondary={statusModal.onSecondary}
          actionVariant={statusModal.actionVariant}
        />

        <nav className="mb-5 flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span className="text-gray-300">›</span>
          <span>Invoice</span>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-gray-800">Chart of Accounts</span>
        </nav>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <h1 className="shrink-0 text-2xl font-semibold text-gray-900">
              Chart of Accounts
            </h1>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <PermissionGuard module="invoice" entitlement="configure_invoice">
            <button
              type="button"
              onClick={() => handleAddAccount()}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:gap-2 sm:px-4 sm:py-2.5"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">New Account</span>
            </button>
          </PermissionGuard>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              const value = getSummaryValue(card.apiKey);
              const active = activeFilter === card.filterValue;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className={`flex min-h-[84px] flex-col items-start gap-1.5 px-3 py-3 text-left sm:min-h-[96px] sm:gap-2 sm:px-5 sm:py-4 transition-colors hover:bg-gray-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
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
                    className={`text-lg font-semibold tabular-nums sm:text-xl lg:text-2xl ${card.countClass}`}
                  >
                    {isSummaryLoading ? (
                      <span className="inline-block h-7 w-16 animate-pulse rounded bg-gray-200" />
                    ) : (
                      formatNaira(value)
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ChartOfAccountsTable
          accounts={accounts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onAddAccount={handleAddAccount}
          onEditAccount={handleEditAccount}
          isLoading={isGroupedLoading}
        />

        <AccountFormModal
          isOpen={formModal.isOpen}
          mode={formModal.mode}
          accountId={formModal.accountId}
          parentId={formModal.parentId}
          defaultAccountType={formModal.defaultType}
          onClose={() => setFormModal({ isOpen: false, mode: "add" })}
          onSave={handleSaveAccount}
          onDeactivate={handleDeactivateClick}
        />

        <DeactivateModals
          state={deactivateState}
          onClose={() => setDeactivateState({ isOpen: false, accountId: null })}
          onDeactivateConfirm={handleDeactivateConfirm}
          isDeactivating={isDeleting}
        />
      </div>
    </PageGuard>
  );
}
