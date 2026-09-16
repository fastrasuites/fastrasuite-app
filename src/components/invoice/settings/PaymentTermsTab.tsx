"use client";

import React, { useState } from "react";
import { 
  useGetPaymentTermsQuery, 
  useCreatePaymentTermMutation,
  useUpdatePaymentTermMutation,
  useDeletePaymentTermMutation
} from "@/api/invoice/paymentTermsApi";
import { PaymentTermModal } from "./PaymentTermModal";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useStatusModal, StatusModal, extractErrorMessage } from "@/components/shared/StatusModal";

export function PaymentTermsTab() {
  const { data: termsResponse, isLoading } = useGetPaymentTermsQuery({});
  const terms = Array.isArray(termsResponse) ? termsResponse : (termsResponse as any)?.results || [];
  
  const [createTerm] = useCreatePaymentTermMutation();
  const [updateTerm] = useUpdatePaymentTermMutation();
  const [deleteTerm] = useDeletePaymentTermMutation();
  const statusModal = useStatusModal();

  const [modalState, setModalState] = useState<{isOpen: boolean, data?: any}>({ isOpen: false });

  const handleSave = async (data: any) => {
    try {
      if (modalState.data?.id) {
        await updateTerm({ id: modalState.data.id, data }).unwrap();
        statusModal.showSuccess("Success", "Payment term updated successfully");
      } else {
        await createTerm(data).unwrap();
        statusModal.showSuccess("Success", "Payment term created successfully");
      }
    } catch (err: any) {
      if (err?.data && typeof err.data === 'object' && !err.data.detail) {
        throw err; // Let modal handle field errors
      }
      statusModal.showError("Error", extractErrorMessage(err, "Failed to save payment term"));
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment term?")) return;
    try {
      await deleteTerm(id).unwrap();
      statusModal.showSuccess("Deleted", "Payment term deleted successfully");
    } catch (err) {
      statusModal.showError("Error", extractErrorMessage(err, "Failed to delete payment term"));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading payment terms...</div>;
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
        <h2 className="text-xl font-semibold">Payment Terms</h2>
        <button 
          onClick={() => setModalState({ isOpen: true })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Payment Term
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Days Until Due</th>
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {terms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No payment terms found. Create one to get started.
                </td>
              </tr>
            ) : (
              terms.map((term: any) => (
                <tr key={term.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{term.name}</td>
                  <td className="px-6 py-4 text-gray-600">{term.days_until_due}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{term.description || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${term.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {term.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setModalState({ isOpen: true, data: term })}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(term.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaymentTermModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        onSave={handleSave}
        initialData={modalState.data}
      />
    </div>
  );
}
