"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import {
  useUpdateVendorBankAccountMutation,
  useAddVendorBankAccountMutation,
} from "@/api/invoice/vendorBankAccountsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";

interface BankData {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: BankData;
  vendorId: number;
  /** Called after a successful save so parent can refetch */
  onSuccess?: () => void;
}

export function UpdateBankDetailsModal({
  isOpen,
  onClose,
  initialData,
  vendorId,
  onSuccess,
}: Props) {
  const { register, handleSubmit, reset } = useForm<BankData>({
    defaultValues: initialData,
  });

  const [updateBank, { isLoading: isUpdating }] =
    useUpdateVendorBankAccountMutation();
  const [addBank, { isLoading: isAdding }] = useAddVendorBankAccountMutation();

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (isOpen) {
      reset(initialData);
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: BankData) => {
    try {
      const payload = {
        bank_account_name: data.accountName,
        bank_account_number: data.accountNumber,
        bank_name: data.bankName,
        branch_code: data.branch,
      };

      // If initial data had no account number, treat as add; otherwise update
      if (initialData.accountNumber) {
        await updateBank({ id: vendorId, data: payload as any }).unwrap();
      } else {
        await addBank({ id: vendorId, data: payload as any }).unwrap();
      }

      setToast({
        show: true,
        message: "Bank details saved successfully",
        type: "success",
      });

      onSuccess?.();

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setToast({
        show: true,
        message:
          err?.data?.message ||
          err?.data?.detail ||
          err?.message ||
          "Failed to save bank details",
        type: "error",
      });
    }
  };

  const isSubmitting = isUpdating || isAdding;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-xl focus:outline-none">
          <div className="p-6 sm:p-8">
            <ToastNotification
              show={toast.show}
              message={toast.message}
              type={toast.type}
              onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            />

            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {initialData.accountNumber
                ? "Update Bank Details"
                : "Add Bank Details"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Bank Account Name, Number and Bank Name are required before any
              payment can be processed to this vendor.
            </Dialog.Description>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Bank Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("accountName", { required: true })}
                    placeholder="Account holder name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Bank Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("accountNumber", { required: true })}
                    placeholder="Account number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("bankName", { required: true })}
                    placeholder="e.g. GTBank, Opay"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Branch / Sort Code
                  </label>
                  <input
                    {...register("branch")}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                After saving, the bank account may need to be explicitly
                confirmed before payments can be made.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
