"use client";

import React, { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetChartOfAccountByIdQuery } from "@/api/invoice/chartOfAccountsApi";
import { useStatusModal, StatusModal } from "@/components/shared/StatusModal";

const schema = z.object({
  account_type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  account_name: z.string().min(1, "Account name is required"),
  account_number: z.string().min(1, "Account number is required"),
  subtype: z.string().optional(),
  is_active: z.boolean(),
  is_control_account: z.boolean(),
  control_type: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  mode: "add" | "edit";
  accountId?: number | null;
  parentId?: number | null;
  onClose: () => void;
  onSave: (data: FormData, id?: number) => Promise<void>;
  onDeactivate?: () => void;
}

export function AccountFormModal({
  isOpen,
  mode,
  accountId,
  parentId,
  onClose,
  onSave,
  onDeactivate,
}: Props) {
  const { data: account, isLoading } = useGetChartOfAccountByIdQuery(accountId as number, {
    skip: mode !== "edit" || !accountId,
  });

  const { data: parentAccount, isLoading: isParentLoading } = useGetChartOfAccountByIdQuery(parentId as number, {
    skip: !parentId,
  });

  const statusModal = useStatusModal();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      account_number: "",
      account_type: "ASSET",
      account_name: "",
      subtype: "",
      is_active: true,
      is_control_account: false,
      control_type: "",
    },
  });

  const isControlAccount = watch("is_control_account");

  useEffect(() => {
    if (mode === "edit" && account) {
      reset({
        account_type: account.account_type,
        account_name: account.account_name,
        account_number: account.account_number,
        subtype: account.subtype || "",
        is_active: account.is_active,
        is_control_account: account.is_control_account,
        control_type: account.control_type || "",
      });
    } else if (mode === "add" && isOpen) {
      if (parentId && !parentAccount) return; // Wait for parent to load
      reset({
        account_number: "",
        account_type: parentAccount ? parentAccount.account_type : "ASSET",
        account_name: "",
        subtype: "",
        is_active: true,
        is_control_account: false,
        control_type: "",
      });
    }
  }, [mode, account, isOpen, reset, parentId, parentAccount]);

  const onSubmit = async (data: FormData) => {
    try {
      const submitData = { ...data };
      if (!submitData.is_control_account || !submitData.control_type) {
        delete submitData.control_type;
      }

      // Auto-assign subtype based on control_type so the user doesn't have to think about it
      if (submitData.control_type === "bank") {
        submitData.subtype = "bank";
      } else if (submitData.control_type === "inventory") {
        submitData.subtype = "inventory";
      } else {
        delete submitData.subtype;
      }

      await onSave(submitData, mode === "edit" ? (accountId as number) : undefined);
    } catch (error: any) {
      if (error?.data && typeof error.data === 'object') {
        let hasFieldErrors = false;
        const formFields = ["account_type", "account_name", "account_number", "subtype", "is_active", "is_control_account", "control_type"];
        
        // Handle {"error": [{"field": "message"}]} structure
        let errorObj = error.data;
        if (errorObj.error && Array.isArray(errorObj.error) && errorObj.error.length > 0) {
          if (typeof errorObj.error[0] === 'object') {
            errorObj = errorObj.error[0];
          } else {
            statusModal.showError("Validation Error", errorObj.error.join(", "));
            return;
          }
        }

        // Handle specific API error formats like Token Expiry or generic 'detail'
        if (errorObj.code === "token_not_valid") {
          statusModal.showError("Session Expired", "Your session has expired or your token is invalid. Please log in again.");
          return;
        }

        if (errorObj.detail && typeof errorObj.detail === "string") {
          statusModal.showError("Error", errorObj.detail);
          return;
        }

        Object.keys(errorObj).forEach((key) => {
          if (formFields.includes(key)) {
            hasFieldErrors = true;
            if (Array.isArray(errorObj[key])) {
              setError(key as any, { type: 'server', message: errorObj[key][0] });
            } else if (typeof errorObj[key] === 'string') {
              setError(key as any, { type: 'server', message: errorObj[key] });
            }
          } else if (key !== "code" && key !== "messages") {
            // It's a non-field error like "non_field_errors". We skip "code" and "messages" to avoid messy JSON strings.
            const msg = Array.isArray(errorObj[key]) ? errorObj[key][0] : errorObj[key];
            if (typeof msg !== 'object') {
              statusModal.showError("Error", String(msg));
            }
          }
        });
        
        if (!hasFieldErrors && !statusModal.isOpen) {
           statusModal.showError("Error", "An error occurred while saving. Please try again.");
        }
      } else {
        statusModal.showError("Error", "A network or server error occurred.");
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-8 w-full max-w-md shadow-xl z-50 max-h-[90vh] overflow-y-auto">
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
          <Dialog.Title className="text-xl font-semibold text-gray-900">
            {mode === "add" ? (parentId ? "Add Sub-Account" : "Add Account") : "Edit Account"}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mt-1">
            {mode === "add" ? "Create a new account" : "Modify an existing account"}
          </Dialog.Description>

          {(mode === "edit" && isLoading) || (mode === "add" && parentId && isParentLoading) ? (
            <div className="mt-6 text-center text-gray-500 py-8">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Type
                </label>
                <select
                  {...register("account_type")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  disabled={!!parentId}
                >
                  <option value="ASSET" disabled={!!parentId && parentAccount?.account_type !== "ASSET"}>Assets</option>
                  <option value="LIABILITY" disabled={!!parentId && parentAccount?.account_type !== "LIABILITY"}>Liabilities</option>
                  <option value="EQUITY" disabled={!!parentId && parentAccount?.account_type !== "EQUITY"}>Equity</option>
                  <option value="INCOME" disabled={!!parentId && parentAccount?.account_type !== "INCOME"}>Income/Revenue</option>
                  <option value="EXPENSE" disabled={!!parentId && parentAccount?.account_type !== "EXPENSE"}>Expenses</option>
                </select>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Name
                </label>
                <input
                  {...register("account_name")}
                  placeholder="Enter account name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.account_name && <p className="text-red-500 text-xs mt-1">{errors.account_name.message}</p>}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Number
                </label>
                <input
                  {...register("account_number")}
                  placeholder="Enter account number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number.message}</p>}
              </div>



              {/* Is Control Account */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is_control_account"
                  {...register("is_control_account")}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="is_control_account" className="text-sm font-medium text-gray-700">
                  Is Control Account
                </label>
              </div>

              {/* Control Type */}
              {isControlAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Control Type
                  </label>
                  <select
                    {...register("control_type")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Control Type</option>
                    <option value="accounts_payable">Accounts Payable</option>
                    <option value="accounts_receivable">Accounts Receivable</option>
                    <option value="bank">Bank</option>
                    <option value="inventory">Inventory</option>
                  </select>
                  {errors.control_type && <p className="text-red-500 text-xs mt-1">{errors.control_type.message}</p>}
                </div>
              )}

              {/* Is Active */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Is Active
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {mode === "edit" ? (
                  <>
                    <button
                      type="button"
                      onClick={onDeactivate}
                      className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Deactivate
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Add Account
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
