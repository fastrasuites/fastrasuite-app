"use client";

import React, { useState } from "react";
import { 
  useGetCompanyBankAccountsQuery, 
  useCreateCompanyBankAccountMutation,
  useUpdateCompanyBankAccountMutation,
  useDeleteCompanyBankAccountMutation
} from "@/api/invoice/companyBankAccountsApi";
import { CompanyBankAccountModal } from "./CompanyBankAccountModal";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useStatusModal, StatusModal, extractErrorMessage } from "@/components/shared/StatusModal";

export function CompanyBankAccountsTab() {
  const { data: accounts = [], isLoading } = useGetCompanyBankAccountsQuery();
  const [createAccount] = useCreateCompanyBankAccountMutation();
  const [updateAccount] = useUpdateCompanyBankAccountMutation();
  const [deleteAccount] = useDeleteCompanyBankAccountMutation();
  const statusModal = useStatusModal();

  const [modalState, setModalState] = useState<{isOpen: boolean, data?: any}>({ isOpen: false });

  const handleSave = async (data: any) => {
    try {
      if (modalState.data?.id) {
        await updateAccount({ id: modalState.data.id, data }).unwrap();
        statusModal.showSuccess("Success", "Bank account updated successfully");
      } else {
        await createAccount(data).unwrap();
        statusModal.showSuccess("Success", "Bank account created successfully");
      }
    } catch (err: any) {
      if (err?.data && typeof err.data === 'object' && !err.data.detail) {
        throw err; // Let modal handle field errors
      }
      statusModal.showError("Error", extractErrorMessage(err, "Failed to save bank account"));
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    try {
      await deleteAccount(id).unwrap();
      statusModal.showSuccess("Deleted", "Bank account deleted successfully");
    } catch (err) {
      statusModal.showError("Error", extractErrorMessage(err, "Failed to delete bank account"));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading bank accounts...</div>;
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

      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold">Company Bank Accounts</h2>
        <button 
          onClick={() => setModalState({ isOpen: true })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Bank Account
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Bank Name</th>
              <th className="px-6 py-3 font-medium">Account Number</th>
              <th className="px-6 py-3 font-medium">Branch / Sort Code</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No bank accounts found. Create one to get started.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{acc.bank_name}</td>
                  <td className="px-6 py-4 text-gray-600">{acc.account_number}</td>
                  <td className="px-6 py-4 text-gray-600">{acc.branch_code || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      acc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {acc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setModalState({ isOpen: true, data: acc })}
                      className="text-blue-600 hover:text-blue-800 p-1 mr-2"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CompanyBankAccountModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ isOpen: false })} 
        onSave={handleSave}
        initialData={modalState.data}
      />
    </div>
  );
}
