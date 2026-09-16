"use client";

import React, { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { 
  useGetChartOfAccountsQuery
} from "@/api/invoice/chartOfAccountsApi";
import { useGetActiveCurrenciesQuery } from "@/api/invoice/invoiceCurrencyApi";

interface FormData {
  bank_name: string;
  account_number: string;
  branch_code: string;
  is_active: boolean;
  account: number | "";
  currency: number | "";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export function CompanyBankAccountModal({ isOpen, onClose, onSave, initialData }: Props) {
  const { data: accounts = [] } = useGetChartOfAccountsQuery();
  const { data: currenciesData } = useGetActiveCurrenciesQuery();
  
  // Safely extract currencies in case the API returns paginated data { results: [...] } or a direct array
  const currencies = Array.isArray(currenciesData) 
    ? currenciesData 
    : (currenciesData as any)?.results || [];
  
  const bankAccounts = accounts.filter(a => a.subtype?.toLowerCase() === "bank");

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      bank_name: "",
      account_number: "",
      branch_code: "",
      is_active: true,
      account: "",
      currency: "",
    }
  });

  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        bank_name: initialData.bank_name || "",
        account_number: initialData.account_number || "",
        branch_code: initialData.branch_code || "",
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        account: initialData.account || "",
        currency: initialData.currency || "",
      });
    } else if (isOpen) {
      reset({
        bank_name: "",
        account_number: "",
        branch_code: "",
        is_active: true,
        account: "",
        currency: "",
      });
    }
  }, [initialData, isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await onSave({
        ...data,
        account: Number(data.account),
        currency: Number(data.currency),
      });
      onClose();
    } catch (error: any) {
      if (error?.data && typeof error.data === 'object') {
        Object.keys(error.data).forEach((key) => {
          if (Array.isArray(error.data[key])) {
            setError(key as any, { type: 'server', message: error.data[key][0] });
          }
        });
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-8 w-full max-w-md shadow-xl z-50 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-gray-900">
            {initialData ? "Edit Bank Account" : "Add Bank Account"}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
              <input 
                {...register("bank_name", { required: "Bank name is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="e.g. Zenith Bank"
              />
              {errors.bank_name && <p className="text-red-500 text-xs mt-1">{errors.bank_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
              <input 
                {...register("account_number", { required: "Account number is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Code / Sort Code</label>
              <input 
                {...register("branch_code")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {errors.branch_code && <p className="text-red-500 text-xs mt-1">{errors.branch_code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chart of Account Link</label>
              <select 
                {...register("account", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Ledger Account</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </select>
              {errors.account && <p className="text-red-500 text-xs mt-1">{errors.account.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select 
                {...register("currency", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Currency</option>
                {currencies.map((curr: any) => (
                  <option key={curr.id} value={curr.id}>{curr.currency_code} - {curr.currency_name}</option>
                ))}
              </select>
              {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
            </div>

            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" id="is_active" {...register("is_active")} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Is Active</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
