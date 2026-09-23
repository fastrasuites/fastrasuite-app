"use client";

import React, { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
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
  /** Pre-select type when adding from a group row (Assets, etc.) */
  defaultAccountType?:
    | "ASSET"
    | "LIABILITY"
    | "EQUITY"
    | "INCOME"
    | "EXPENSE"
    | null;
  onClose: () => void;
  onSave: (data: FormData, id?: number) => Promise<void>;
  onDeactivate?: () => void;
}

export function AccountFormModal({
  isOpen,
  mode,
  accountId,
  parentId,
  defaultAccountType,
  onClose,
  onSave,
  onDeactivate,
}: Props) {
  const { data: account, isLoading } = useGetChartOfAccountByIdQuery(
    accountId as number,
    { skip: mode !== "edit" || !accountId },
  );

  const { data: parentAccount, isLoading: isParentLoading } =
    useGetChartOfAccountByIdQuery(parentId as number, {
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
      if (parentId && !parentAccount) return;
      reset({
        account_number: "",
        account_type: parentAccount
          ? parentAccount.account_type
          : defaultAccountType || "ASSET",
        account_name: "",
        subtype: "",
        is_active: true,
        is_control_account: false,
        control_type: "",
      });
    }
  }, [
    mode,
    account,
    isOpen,
    reset,
    parentId,
    parentAccount,
    defaultAccountType,
  ]);

  const onSubmit = async (data: FormData) => {
    try {
      const submitData: any = { ...data };
      if (!submitData.is_control_account || !submitData.control_type) {
        delete submitData.control_type;
      }

      if (submitData.control_type === "bank") {
        submitData.subtype = "bank";
      } else if (submitData.control_type === "inventory") {
        submitData.subtype = "inventory";
      } else if (submitData.control_type === "cash") {
        submitData.subtype = "cash";
      } else {
        delete submitData.subtype;
      }

      await onSave(
        submitData,
        mode === "edit" ? (accountId as number) : undefined,
      );
    } catch (error: any) {
      if (error?.data && typeof error.data === "object") {
        let hasFieldErrors = false;
        const formFields = [
          "account_type",
          "account_name",
          "account_number",
          "subtype",
          "is_active",
          "is_control_account",
          "control_type",
        ];

        let errorObj = error.data;
        if (
          errorObj.error &&
          Array.isArray(errorObj.error) &&
          errorObj.error.length > 0
        ) {
          if (typeof errorObj.error[0] === "object") {
            errorObj = errorObj.error[0];
          } else {
            statusModal.showError(
              "Validation Error",
              errorObj.error.join(", "),
            );
            return;
          }
        }

        if (errorObj.code === "token_not_valid") {
          statusModal.showError(
            "Session Expired",
            "Your session has expired or your token is invalid. Please log in again.",
          );
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
              setError(key as any, {
                type: "server",
                message: errorObj[key][0],
              });
            } else if (typeof errorObj[key] === "string") {
              setError(key as any, {
                type: "server",
                message: errorObj[key],
              });
            }
          } else if (key !== "code" && key !== "messages") {
            const msg = Array.isArray(errorObj[key])
              ? errorObj[key][0]
              : errorObj[key];
            if (typeof msg !== "object") {
              statusModal.showError("Error", String(msg));
            }
          }
        });

        if (!hasFieldErrors && !statusModal.isOpen) {
          statusModal.showError(
            "Error",
            "An error occurred while saving. Please try again.",
          );
        }
      } else {
        statusModal.showError("Error", "A network or server error occurred.");
      }
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
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

          {/* Header with X close */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {mode === "add"
                  ? parentId
                    ? "Add Sub-Account"
                    : "Add Account"
                  : "Edit Account"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">
                {mode === "add"
                  ? "Create a new account"
                  : "Modify an existing account"}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={onClose}
                className="-mr-1 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {(mode === "edit" && isLoading) ||
          (mode === "add" && parentId && isParentLoading) ? (
            <div className="mt-6 py-8 text-center text-gray-500">
              Loading...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  {...register("account_type")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  disabled={!!parentId}
                >
                  <option
                    value="ASSET"
                    disabled={
                      !!parentId && parentAccount?.account_type !== "ASSET"
                    }
                  >
                    Assets
                  </option>
                  <option
                    value="LIABILITY"
                    disabled={
                      !!parentId && parentAccount?.account_type !== "LIABILITY"
                    }
                  >
                    Liabilities
                  </option>
                  <option
                    value="EQUITY"
                    disabled={
                      !!parentId && parentAccount?.account_type !== "EQUITY"
                    }
                  >
                    Equity
                  </option>
                  <option
                    value="INCOME"
                    disabled={
                      !!parentId && parentAccount?.account_type !== "INCOME"
                    }
                  >
                    Income/Revenue
                  </option>
                  <option
                    value="EXPENSE"
                    disabled={
                      !!parentId && parentAccount?.account_type !== "EXPENSE"
                    }
                  >
                    Expenses
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Account Name
                </label>
                <input
                  {...register("account_name")}
                  placeholder="Enter account name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.account_name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.account_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  {...register("account_number")}
                  placeholder="Enter account number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.account_number && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.account_number.message}
                  </p>
                )}
              </div>

              {/* Control Account (was "Is Control Account") */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is_control_account"
                  {...register("is_control_account")}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label
                  htmlFor="is_control_account"
                  className="text-sm font-medium text-gray-700"
                >
                  Control Account
                </label>
              </div>

              {isControlAccount && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Control Type
                  </label>
                  <select
                    {...register("control_type")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Control Type</option>
                    <option value="accounts_payable">Accounts Payable</option>
                    <option value="accounts_receivable">
                      Accounts Receivable
                    </option>
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                    <option value="inventory">Inventory</option>
                  </select>
                  {errors.control_type && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.control_type.message}
                    </p>
                  )}
                </div>
              )}

              {/* Active (was "Is Active") */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                {mode === "edit" ? (
                  <>
                    <button
                      type="button"
                      onClick={onDeactivate}
                      className="flex-1 rounded-lg border border-red-500 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Deactivate
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
