"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Edit2, Plus, Search, Trash2 } from "lucide-react";
import {
  useCreateRequestAccountMappingMutation,
  useDeleteRequestAccountMappingMutation,
  useGetRequestAccountMappingsQuery,
  usePatchRequestAccountMappingMutation,
  type RequestMappingType,
} from "@/api/invoice/requestAccountMappingsApi";
import { useGetChartOfAccountsQuery } from "@/api/invoice/chartOfAccountsApi";
import { useStatusModal, StatusModal } from "@/components/shared/StatusModal";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  labour: "Labour",
  material: "Material",
  petty_cash: "Petty Cash",
  plant_equipment: "Plant & Equipment",
  purchase: "Purchase",
};

const REQUEST_TYPE_OPTIONS = Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

type MappingDraft = {
  request_type: string;
  expense_account: string;
};

export function RequestAccountMappingsTab() {
  const statusModal = useStatusModal();
  const { data: mappings = [], isLoading } = useGetRequestAccountMappingsQuery();
  const { data: chartAccounts = [] } = useGetChartOfAccountsQuery();
  const [createMapping] = useCreateRequestAccountMappingMutation();
  const [updateMapping] = usePatchRequestAccountMappingMutation();
  const [deleteMapping] = useDeleteRequestAccountMappingMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState<MappingDraft>({
    request_type: "",
    expense_account: "",
  });

  const expenseAccounts = useMemo(
    () =>
      chartAccounts.filter(
        (account) =>
          account.account_type === "EXPENSE" ||
          account.account_name.toLowerCase().includes("expense") ||
          account.account_name.toLowerCase().includes("cost")
      ),
    [chartAccounts]
  );

  const enrichedMappings = useMemo(
    () =>
      mappings.map((mapping) => {
        const expenseAccount = chartAccounts.find((account) => account.id === mapping.expense_account);
        const isAccountValid = !!expenseAccount && expenseAccount.is_active;
        return {
          ...mapping,
          expenseAccount,
          isAccountValid,
          needsAttention: !mapping.is_active || !isAccountValid,
        };
      }),
    [chartAccounts, mappings]
  );

  const filteredMappings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return enrichedMappings;

    return enrichedMappings.filter((mapping) => {
      const requestTypeLabel = REQUEST_TYPE_LABELS[mapping.request_type] || mapping.request_type;
      const accountName = mapping.expenseAccount?.account_name || mapping.expense_account_name || "";
      return (
        requestTypeLabel.toLowerCase().includes(term) ||
        accountName.toLowerCase().includes(term) ||
        mapping.request_type.toLowerCase().includes(term)
      );
    });
  }, [enrichedMappings, searchTerm]);

  const openCreateForm = () => {
    setEditingId(null);
    setDraft({ request_type: "", expense_account: "" });
    setIsFormOpen(true);
  };

  const openEditForm = (mapping: (typeof enrichedMappings)[number]) => {
    setEditingId(mapping.id);
    setDraft({
      request_type: mapping.request_type,
      expense_account: String(mapping.expense_account),
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDraft({ request_type: "", expense_account: "" });
  };

  const isDuplicateRequestType = (requestType: string, currentId?: number | null) => {
    return enrichedMappings.some(
      (mapping) =>
        mapping.request_type === requestType &&
        mapping.is_active &&
        mapping.id !== currentId
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!draft.request_type) {
      statusModal.showError("Validation error", "Please select a request type.");
      return;
    }

    if (!draft.expense_account) {
      statusModal.showError("Validation error", "Please select an expense account.");
      return;
    }

    const selectedAccount = chartAccounts.find((account) => account.id === Number(draft.expense_account));

    if (!selectedAccount) {
      statusModal.showError("Validation error", "The selected account could not be found.");
      return;
    }

    if (!selectedAccount.is_active) {
      statusModal.showError(
        "Inactive account",
        "This expense account is inactive. Reactivate it in Chart of Accounts before mapping it to a request type."
      );
      return;
    }

    if (isDuplicateRequestType(draft.request_type, editingId)) {
      statusModal.showError(
        "Duplicate mapping",
        "Only one active expense account can be assigned to a request type at a time."
      );
      return;
    }

    try {
      const payload = {
        request_type: draft.request_type as RequestMappingType,
        expense_account: Number(draft.expense_account),
        is_active: true,
      };

      if (editingId) {
        await updateMapping({ id: editingId, data: payload }).unwrap();
        statusModal.showSuccess("Mapping updated", "The account mapping has been saved successfully.");
      } else {
        await createMapping(payload).unwrap();
        statusModal.showSuccess("Mapping created", "The request type has been mapped to the selected expense account.");
      }

      closeForm();
    } catch (error: any) {
      const message =
        error?.data?.detail ||
        error?.data?.error ||
        "Failed to save this request account mapping.";
      statusModal.showError("Save failed", message);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await updateMapping({
        id,
        data: { is_active: false },
      }).unwrap();
      statusModal.showSuccess("Mapping deactivated", "This request type is no longer available for automatic account posting.");
    } catch (error: any) {
      const message =
        error?.data?.detail ||
        error?.data?.error ||
        "Failed to deactivate the mapping.";
      statusModal.showError("Deactivate failed", message);
    }
  };

  const handleHardDelete = async (id: number) => {
    try {
      await deleteMapping(id).unwrap();
      statusModal.showSuccess("Mapping removed", "The mapping was deleted successfully.");
    } catch (error: any) {
      const message =
        error?.data?.detail ||
        error?.data?.error ||
        "This mapping is still in use and cannot be deleted. Please deactivate it instead.";
      statusModal.showError("Delete blocked", message);
    }
  };

  if (isLoading) {
    return <div className="bg-white rounded border border-gray-100 p-8 text-center text-gray-500">Loading account mappings...</div>;
  }

  return (
    <div className="bg-white rounded border border-gray-100 overflow-hidden">
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        actionText={statusModal.actionText}
        onAction={statusModal.onAction}
      />

      <div className="flex flex-col gap-4 p-6 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Account Mapping</h2>
          <p className="text-sm text-gray-500 mt-1">
            Prevents vendor submissions and future payments from being approved without a valid expense account mapping.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      {isFormOpen && (
        <div className="border-b border-gray-100 bg-gray-50 p-6">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Request Type</label>
              <select
                value={draft.request_type}
                onChange={(event) => setDraft((previous) => ({ ...previous, request_type: event.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select request type</option>
                {REQUEST_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expense Account</label>
              <select
                value={draft.expense_account}
                onChange={(event) => setDraft((previous) => ({ ...previous, expense_account: event.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select expense account</option>
                {expenseAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {editingId ? "Save Changes" : "Create Mapping"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-6">
        <div className="mb-4 flex items-center gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search request type or account"
            className="w-full border-0 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="grid gap-3 mb-4 md:grid-cols-3">
          <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Total mappings</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{enrichedMappings.length}</div>
          </div>
          <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Active</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-600">
              {enrichedMappings.filter((mapping) => mapping.is_active && mapping.isAccountValid).length}
            </div>
          </div>
          <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Needs attention</div>
            <div className="mt-2 text-2xl font-semibold text-amber-600">
              {enrichedMappings.filter((mapping) => mapping.needsAttention).length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Request Type</th>
                <th className="px-4 py-3 font-medium">Expense Account</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No account mappings found. Create one to enable validation for vendor approvals and payments.
                  </td>
                </tr>
              ) : (
                filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {REQUEST_TYPE_LABELS[mapping.request_type] || mapping.request_type}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {mapping.expenseAccount ? (
                        <div>
                          <div className="font-medium">{mapping.expenseAccount.account_name}</div>
                          <div className="text-xs text-gray-500">{mapping.expenseAccount.account_number}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">{mapping.expense_account_name || "Unknown account"}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {!mapping.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          Inactive
                        </span>
                      ) : mapping.isAccountValid ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                          Needs review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{mapping.created_at ? new Date(mapping.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(mapping)}
                          className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(mapping.id)}
                          className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Deactivate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHardDelete(mapping.id)}
                          className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
