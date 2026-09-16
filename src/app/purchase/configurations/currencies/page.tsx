"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoveLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BreadcrumbItem } from "@/components/shared/types";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { StatusModal } from "@/components/shared/StatusModal";
import { Alert } from "@/components/ui/alert";
import {
  useGetCurrenciesQuery,
  useDeleteCurrencyMutation,
  usePatchCurrencyMutation,
  type Currency,
} from "@/api/purchase/currencyApi";
import {
  formatErrorMessage,
  parseApiError,
  type ApiError,
} from "@/lib/utils/error-handling";
import { validateCurrencyDuplicates } from "@/lib/utils/error-handling";
import { motion } from "framer-motion";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/ProtectedComponent";

interface EditingCurrency {
  id: number;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
}

export default function CurrencyListPage() {
  const router = useRouter();

  // API hooks for currency operations
  const {
    data: currencies = [],
    isLoading: queryLoading,
    error,
    refetch,
  } = useGetCurrenciesQuery({});

  const [deleteCurrency, { isLoading: isDeleting }] =
    useDeleteCurrencyMutation();
  const [patchCurrency, { isLoading: isUpdating }] = usePatchCurrencyMutation();

  // Local state for editing and UI
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCurrency, setEditingCurrency] =
    useState<EditingCurrency | null>(null);
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

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Configurations", href: "/purchase/configurations" },
    {
      label: "Currencies",
      href: "/purchase/configurations/currencies",
      current: true,
    },
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

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
        currencies.filter((c) => c.id !== id),
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
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status: number; data?: any };
        if (apiError.status === 400 || apiError.status === 409) {
          const parsedErrors = parseApiError(apiError as any);
          setServerErrors({ ...parsedErrors });
        } else {
          setServerErrors({
            general: formatErrorMessage(apiError as ApiError),
          });
        }
      } else {
        setServerErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  const handleDelete = async (id: number) => {
    const currency = currencies.find((c) => c.id === id);
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
    <PageGuard application="purchase" module="currencies" action="view">
      <div className="min-h-screen mr-4">
        <Breadcrumbs
          items={items}
          action={
            <Button
              variant="ghost"
              className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
            >
              Autosaved <AutoSaveIcon />
            </Button>
          }
        />
        
        <div className=" bg-white h-16 border-b border-gray-200 flex justify-between items-center px-6 rounded-lg">
          <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
            <Button
              aria-label="Go back"
              onClick={() => router.back()}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded cursor-pointer border-none hover:border-none hover:bg-transparent transition-all duration-200"
            >
              <MoveLeft size={20} />
              <span className="text-base font-medium">Currencies</span>
            </Button>
          </motion.div>
        </div>

        <div className=" mx-auto pb-6">
          <AnimatedWrapper
            animation="fadeIn"
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {queryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B7CED]"></div>
              </div>
            ) : null}

            {error && (
              <div className="p-6">
                <Alert variant="destructive">
                  <p className="font-medium">Error loading currencies</p>
                  <Button onClick={() => refetch()} variant="outline" className="mt-3" size="sm">
                    Retry
                  </Button>
                </Alert>
              </div>
            )}

            {!queryLoading && !error && (
              <>
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
                    currencies.map((currency, index) => (
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
                              className="h-10 border-gray-300"
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
                              className="h-10 border-gray-300"
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
                              className="h-10 border-gray-300"
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
                              <PermissionGuard application="purchase" module="currencies" action="edit">
                                <Button onClick={() => handleSave(currency.id)} disabled={isUpdating} size="sm">
                                  {isUpdating ? "Saving..." : "Save"}
                                </Button>
                              </PermissionGuard>
                              <button onClick={handleCancel} className="p-2 text-gray-500"><X className="w-4 h-4" /></button>
                            </>
                          ) : (
                            <>
                              <PermissionGuard application="purchase" module="currencies" action="edit">
                                <Button onClick={() => handleEdit(currency)} variant="outline" size="sm">Edit</Button>
                              </PermissionGuard>
                              <PermissionGuard application="purchase" module="currencies" action="delete">
                                <button onClick={() => handleDelete(currency.id)} disabled={isDeleting} className="text-red-600 text-sm font-medium">
                                  Delete
                                </button>
                              </PermissionGuard>
                            </>
                          )}
                        </div>
                      </AnimatedWrapper>
                    ))
                  )}
                </div>
              </>
            )}
          </AnimatedWrapper>
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
    </PageGuard>
  );
}
