"use client";

import React, { useState } from "react";
import { ChartOfAccountsTable } from "@/components/invoice/chart-of-account/ChartOfAccountsTable";
import { AccountFormModal } from "@/components/invoice/chart-of-account/AccountFormModal";
import { DeactivateModals } from "@/components/invoice/chart-of-account/DeactivateModals";
import { Search, Plus } from "lucide-react";
import {
  useStatusModal,
  StatusModal,
  extractErrorMessage,
} from "@/components/shared/StatusModal";
import {
  useGetChartOfAccountsQuery,
  useCreateChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useGetChartOfAccountsSummaryQuery,
  usePatchChartOfAccountMutation,
  ChartOfAccountDetail,
} from "@/api/invoice/chartOfAccountsApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function ChartOfAccountsPage() {
  const { data: flatAccounts = [], isLoading: isTreeLoading } =
    useGetChartOfAccountsQuery();
  const [createAccount] = useCreateChartOfAccountMutation();
  const [updateAccount] = useUpdateChartOfAccountMutation();
  const [patchAccount] = usePatchChartOfAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] =
    useDeleteChartOfAccountMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"detailed" | "ledger">("detailed");

  // Modals state
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    accountId?: number | null;
    parentId?: number | null;
  }>({ isOpen: false, mode: "add" });

  const [deactivateState, setDeactivateState] = useState<{
    isOpen: boolean;
    accountId: number | null;
  }>({ isOpen: false, accountId: null });

  const statusModal = useStatusModal();

  // Build tree from flat accounts
  const accounts: ChartOfAccountDetail[] = React.useMemo(() => {
    const map = new Map<number, ChartOfAccountDetail>();

    flatAccounts.forEach((acc) => {
      map.set(acc.id, { ...acc, children: [], created_at: "" });
    });

    const tree: ChartOfAccountDetail[] = [];

    flatAccounts.forEach((acc) => {
      const node = map.get(acc.id)!;
      if (acc.parent_account) {
        const parent = map.get(acc.parent_account);
        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }, [flatAccounts]);

  const filteredAccounts = accounts
    .map((cat) => ({
      ...cat,
      children: cat.children?.filter(
        (child) =>
          child.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          child.account_number.includes(searchTerm),
      ),
    }))
    .filter((cat) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Revenue") return cat.account_type === "INCOME";
      if (activeFilter === "Expenses") return cat.account_type === "EXPENSE";
      if (activeFilter === "Assets") return cat.account_type === "ASSET";
      if (activeFilter === "Liabilities")
        return cat.account_type === "LIABILITY";
      if (activeFilter === "Equity") return cat.account_type === "EQUITY";
      return cat.account_type === activeFilter;
    });

  const { data: summaryApiResponse, isLoading: isSummaryLoading } =
    useGetChartOfAccountsSummaryQuery();

  // Helper to extract value from the summary API response shape
  const getSummaryValue = (type: string) => {
    if (!summaryApiResponse) return 0;

    const node = summaryApiResponse[type];
    if (node && typeof node === "object" && node.balance !== undefined) {
      return parseFloat(node.balance || "0");
    }

    return 0;
  };

  const summaryData = [
    {
      label: "Assets",
      value: getSummaryValue("ASSET"),
      color: "text-blue-600",
    },
    {
      label: "Liabilities",
      value: getSummaryValue("LIABILITY"),
      color: "text-red-600",
    },
    {
      label: "Equity",
      value: getSummaryValue("EQUITY"),
      color: "text-amber-500",
    },
    {
      label: "Revenue",
      value: getSummaryValue("INCOME"),
      color: "text-green-600",
    },
    {
      label: "Expenses",
      value: getSummaryValue("EXPENSE"),
      color: "text-red-600",
    },
  ];

  const handleAddAccount = (parentId?: number) => {
    setFormModal({ isOpen: true, mode: "add", parentId });
  };

  const handleEditAccount = (accountId: number) => {
    setFormModal({ isOpen: true, mode: "edit", accountId });
  };

  const handleSaveAccount = async (data: any, id?: number) => {
    try {
      const payload = { ...data, parent_account: formModal.parentId || null };

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
        throw err; // Let AccountFormModal handle field errors
      } else {
        statusModal.showError(
          "Failed to save account",
          extractErrorMessage(err, "Failed to save account"),
        );
      }
    }
  };

  const handleDeactivateClick = () => {
    // Open deactivate modal for the currently edited account
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
      statusModal.showSuccess("Deleted", "Account deleted successfully");
    } catch (err: any) {
      if (err?.status === 400) {
        statusModal.showWarning(
          "Cannot Delete",
          "This account is associated with existing transactions.",
          "Deactivate Instead",
          async () => {
            try {
              await patchAccount({ id, data: { is_active: false } }).unwrap();
              statusModal.showSuccess(
                "Deactivated",
                "Account has been deactivated successfully.",
              );
              setDeactivateState({ isOpen: false, accountId: null });
            } catch (patchErr) {
              statusModal.showError("Failed", "Could not deactivate account.");
            }
          },
          "Cancel",
          () => statusModal.close(),
        );
      } else {
        statusModal.showError(
          "Failed to delete account",
          extractErrorMessage(err, "Failed to delete account"),
        );
      }
    }
  };

  return (
    <PageGuard module="invoice" entitlement="configure_invoice">
      <div className="p-6 space-y-4">
        {/* Status Modal Component */}
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span className="text-gray-400">›</span>
          <span>Invoice</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-700 font-medium">Chart of Accounts</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Chart of Accounts
          </h1>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <PermissionGuard module="invoice" entitlement="configure_invoice">
              <button
                onClick={() => handleAddAccount()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Account
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {summaryData.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded border border-gray-100 p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${item.color}`}>
                N
                {item.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        {isTreeLoading ? (
          <div className="bg-white rounded border border-gray-100 p-12 text-center text-gray-500">
            Loading accounts...
          </div>
        ) : (
          <ChartOfAccountsTable
            accounts={filteredAccounts}
            viewMode={viewMode}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onAddAccount={handleAddAccount}
            onEditAccount={handleEditAccount}
          />
        )}

        {/* Modals */}
        <AccountFormModal
          isOpen={formModal.isOpen}
          mode={formModal.mode}
          accountId={formModal.accountId}
          parentId={formModal.parentId}
          onClose={() => setFormModal({ isOpen: false, mode: "add" })}
          onSave={handleSaveAccount}
          onDeactivate={handleDeactivateClick}
        />

        <DeactivateModals
          state={deactivateState}
          isDeactivating={isDeleting}
          onClose={() => setDeactivateState({ isOpen: false, accountId: null })}
          onDeactivateConfirm={handleDeactivateConfirm}
        />
      </div>
    </PageGuard>
  );
}
