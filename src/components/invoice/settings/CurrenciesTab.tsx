"use client";

import React, { useState, useEffect } from "react";
import { CurrencyForm } from "@/components/ui/currency-form";
import { StatusModal } from "@/components/shared/StatusModal";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { GLOBAL_CURRENCIES, type CurrencyOption } from "@/lib/constants/currencies";
import {
  useGetCurrenciesQuery,
  useCreateCurrencyMutation,
  usePatchCurrencyMutation,
  useDeleteCurrencyMutation,
  type Currency,
} from "@/api/invoice/invoiceCurrencyApi";
import {
  formatErrorMessage,
  parseApiError,
  type ApiError,
  validateCurrencyDuplicates,
} from "@/lib/utils/error-handling";

interface EditingCurrency {
  id: number;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
}

export function CurrenciesTab() {
  // --- Creation State ---
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>(GLOBAL_CURRENCIES);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [countryFetchError, setCountryFetchError] = useState<string | null>(null);

  // --- List State ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<EditingCurrency | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    description: "",
    status: "success",
  });

  // --- API Hooks ---
  const { data: currenciesData, isLoading: isCurrenciesLoading, error: queryError, refetch } = useGetCurrenciesQuery({});
  
  // Safely extract currencies in case of pagination object { results: [...] }
  const currencies = Array.isArray(currenciesData) 
    ? currenciesData 
    : (currenciesData as any)?.results || [];

  const [createCurrency, { isLoading: isCreatingCurrency }] = useCreateCurrencyMutation();
  const [patchCurrency, { isLoading: isUpdating }] = usePatchCurrencyMutation();
  const [deleteCurrency, { isLoading: isDeleting }] = useDeleteCurrencyMutation();

  // --- Fetch REST Countries ---
  // (Removed due to API unreliability, now using local constants)
  useEffect(() => {
    // Local state already initialized with GLOBAL_CURRENCIES
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // --- List Handlers ---
  const handleEdit = (currency: Currency) => {
    setEditingId(currency.id);
    setEditingCurrency({
      id: currency.id,
      currency_name: currency.currency_name,
      currency_code: currency.currency_code,
      currency_symbol: currency.currency_symbol,
    });
    setServerErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingCurrency(null);
    setServerErrors({});
  };

  const handleSave = async (id: number) => {
    if (!editingCurrency) return;

    try {
      setServerErrors({});
      const validation = validateCurrencyDuplicates(
        {
          name: editingCurrency.currency_name,
          code: editingCurrency.currency_code,
          symbol: editingCurrency.currency_symbol,
        },
        currencies.filter((c: any) => c.id !== id)
      );

      if (!validation.isValid) {
        setServerErrors({ ...validation.errors });
        return;
      }

      await patchCurrency({
        id,
        data: {
          currency_name: editingCurrency.currency_name,
          currency_code: editingCurrency.currency_code,
          currency_symbol: editingCurrency.currency_symbol,
        },
      }).unwrap();

      setEditingId(null);
      setEditingCurrency(null);
      setStatusModal({
        isOpen: true,
        title: "Success!",
        description: "Currency updated successfully!",
        status: "success",
      });
      refetch();
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status: number; data?: any };
        if (apiError.status === 400 || apiError.status === 409) {
          const parsedErrors = parseApiError(apiError as any);
          setServerErrors({ ...parsedErrors });
        } else {
          setServerErrors({ general: formatErrorMessage(apiError as ApiError) });
        }
      } else {
        setServerErrors({ general: "An unexpected error occurred. Please try again." });
      }
    }
  };

  const handleDelete = async (id: number) => {
    const currency = currencies.find((c: any) => c.id === id);
    if (!currency) return;

    if (!window.confirm(`Are you sure you want to delete "${currency.currency_name}"?`)) return;

    try {
      await deleteCurrency(id).unwrap();
      setStatusModal({
        isOpen: true,
        title: "Success!",
        description: "Currency deleted successfully!",
        status: "success",
      });
      refetch();
    } catch (error: unknown) {
      setStatusModal({
        isOpen: true,
        title: "Error",
        description: formatErrorMessage(error as ApiError),
        status: "error",
      });
    }
  };

  return (
    <div className="bg-white rounded border border-gray-100 overflow-hidden">
      {/* Create Section */}
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-xl font-semibold mb-6">Add New Currency</h2>
        
        {countryFetchError && (
          <div className="mb-4">
            <Alert variant="destructive">{countryFetchError}</Alert>
          </div>
        )}

        <div className="max-w-4xl">
          <CurrencyForm
            currencyOptions={currencyOptions}
            existingCurrencies={currencies}
            onSubmit={async (data) => {
              await createCurrency({
                ...data,
                is_hidden: false
              }).unwrap();
              refetch();
            }}
            isLoading={isCreatingCurrency || isLoadingCountries}
          />
        </div>
      </div>

      {/* List Section */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Existing Currencies</h2>
        
        {isCurrenciesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : queryError ? (
          <Alert variant="destructive">
            <p className="font-medium">Error loading currencies</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-3" size="sm">Retry</Button>
          </Alert>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="col-span-3 text-sm font-medium text-gray-600">Currency Name</div>
              <div className="col-span-2 text-sm font-medium text-gray-600">Code</div>
              <div className="col-span-2 text-sm font-medium text-gray-600">Symbol</div>
              <div className="col-span-3 text-sm font-medium text-gray-600">Date Created</div>
              <div className="col-span-2"></div>
            </div>

            <div className="divide-y divide-gray-200">
              {currencies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No currencies found</div>
              ) : (
                currencies.map((currency: any, index: number) => (
                  <AnimatedWrapper
                    key={currency.id}
                    animation="slideUp"
                    delay={index * 0.05}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors ${
                      editingId === currency.id ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="col-span-3">
                      {editingId === currency.id ? (
                        <Input
                          value={editingCurrency?.currency_name || ""}
                          onChange={(e) => setEditingCurrency(prev => prev ? {...prev, currency_name: e.target.value} : null)}
                          className="h-10 border-gray-300 bg-white"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-medium">{currency.currency_name}</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {editingId === currency.id ? (
                        <Input
                          value={editingCurrency?.currency_code || ""}
                          onChange={(e) => setEditingCurrency(prev => prev ? {...prev, currency_code: e.target.value.toUpperCase()} : null)}
                          className="h-10 border-gray-300 bg-white"
                        />
                      ) : (
                        <span className="text-sm text-gray-700 font-mono">{currency.currency_code}</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {editingId === currency.id ? (
                        <Input
                          value={editingCurrency?.currency_symbol || ""}
                          onChange={(e) => setEditingCurrency(prev => prev ? {...prev, currency_symbol: e.target.value} : null)}
                          className="h-10 border-gray-300 bg-white"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{currency.currency_symbol}</span>
                      )}
                    </div>

                    <div className="col-span-3 text-sm text-gray-700">
                      {formatDate(currency.created_on)}
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {editingId === currency.id ? (
                        <>
                          <Button onClick={() => handleSave(currency.id)} disabled={isUpdating} size="sm">
                            {isUpdating ? "Saving..." : "Save"}
                          </Button>
                          <button onClick={handleCancel} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleEdit(currency)} variant="outline" size="sm">Edit</Button>
                          <button onClick={() => handleDelete(currency.id)} disabled={isDeleting} className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded transition-colors hover:bg-red-50">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    
                    {editingId === currency.id && serverErrors.general && (
                       <div className="col-span-12 mt-2">
                          <p className="text-sm text-red-600">{serverErrors.general}</p>
                       </div>
                    )}
                  </AnimatedWrapper>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.status}
        title={statusModal.title}
        message={statusModal.description}
        actionText="Continue"
      />
    </div>
  );
}
