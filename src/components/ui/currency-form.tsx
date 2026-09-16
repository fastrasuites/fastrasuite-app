"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCurrencySelect } from "@/components/ui/searchable-currency-select";
import { StatusModal } from "@/components/shared/StatusModal";
import {
  currencyCreateSchema,
  type CurrencyCreateInput,
} from "@/lib/validations/currency-validation";
import {
  validateCurrencyDuplicates,
  parseApiError,
  formatErrorMessage,
} from "@/lib/utils/error-handling";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CurrencyOption {
  country: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

interface CurrencyFormProps {
  currencyOptions: CurrencyOption[];
  existingCurrencies: Array<{
    currency_name: string;
    currency_code: string;
    currency_symbol: string;
  }>;
  onSubmit: (data: CurrencyCreateInput) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function CurrencyForm({
  currencyOptions,
  existingCurrencies,
  onSubmit,
  isLoading = false,
  className,
}: CurrencyFormProps) {
  const [serverErrors, setServerErrors] = React.useState<
    Record<string, string>
  >({});
  const [currencyNameCode, setCurrencyNameCode] = React.useState("");
  const [statusModal, setStatusModal] = React.useState<{
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<CurrencyCreateInput>({
    resolver: zodResolver(currencyCreateSchema),
    mode: "onChange",
    defaultValues: {
      currency_name: "",
      currency_code: "",
      currency_symbol: "",
    },
  });

  const watchedSymbol = watch("currency_symbol");

  // Handle currency selection from searchable dropdown
  const handleCurrencySelect = (selectedValue: string) => {
    setCurrencyNameCode(selectedValue);

    if (selectedValue) {
      const selectedOption = currencyOptions.find(
        (option) =>
          `${option.country} ${option.currencyName} (${option.currencyCode})` ===
          selectedValue
      );

      if (selectedOption) {
        setValue("currency_name", selectedOption.currencyName, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("currency_code", selectedOption.currencyCode, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("currency_symbol", selectedOption.currencySymbol, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } else {
      // Clear form when currency selection is cleared
      setValue("currency_name", "", { shouldValidate: true });
      setValue("currency_code", "", { shouldValidate: true });
      setValue("currency_symbol", "", { shouldValidate: true });
    }
  };

  const onFormSubmit = async (data: CurrencyCreateInput) => {
    setServerErrors({});

    try {
      // Validate for duplicates before submission
      const validation = validateCurrencyDuplicates(
        {
          name: data.currency_name,
          code: data.currency_code,
          symbol: data.currency_symbol,
        },
        existingCurrencies
      );

      if (!validation.isValid) {
        setServerErrors({ ...validation.errors });
        setStatusModal({
          isOpen: true,
          title: "Validation Error",
          description: Object.values(validation.errors).join(", "),
          status: "error",
        });
        return;
      }

      await onSubmit(data);

      // Show success and reset form
      setStatusModal({
        isOpen: true,
        title: "Success!",
        description: "Currency created successfully!",
        status: "success",
      });
      reset();
      setCurrencyNameCode("");
    } catch (error: unknown) {
      // Handle API errors
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status: number; data?: unknown };
        if (apiError.status === 400 || apiError.status === 409) {
          const parsedErrors = parseApiError(apiError as any);
          setServerErrors({ ...parsedErrors });
          setStatusModal({
            isOpen: true,
            title: "Error Creating Currency",
            description: Object.values(parsedErrors).join(", "),
            status: "error",
          });
        } else {
          setServerErrors({
            general: formatErrorMessage(apiError as any),
          });
          setStatusModal({
            isOpen: true,
            title: "Error",
            description: formatErrorMessage(apiError as any),
            status: "error",
          });
        }
      } else {
        setServerErrors({
          general: "An unexpected error occurred. Please try again.",
        });
        setStatusModal({
          isOpen: true,
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          status: "error",
        });
      }
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* General Error (non-modal) */}
        {serverErrors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{serverErrors.general}</p>
          </div>
        )}

        {/* Currency Search and Selection */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label
              htmlFor="currency-search"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Currency
            </Label>
            <SearchableCurrencySelect
              value={currencyNameCode}
              onValueChange={handleCurrencySelect}
              options={currencyOptions}
              placeholder="Search and select a currency"
              disabled={isLoading}
              className="w-full py-4 h-11 border border-gray-300 rounded-md shadow-none rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1">
            <Label
              htmlFor="currency_symbol"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Currency Symbol <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currency_symbol"
              {...register("currency_symbol")}
              placeholder="e.g., $"
              className={cn(
                "py-4 h-11 shadow-none rounded-sm",
                errors.currency_symbol &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              disabled={isLoading}
            />
            {errors.currency_symbol && (
              <p className="mt-1 text-sm text-red-600">
                {errors.currency_symbol.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">

          <Button
            type="submit"
            variant={"contained"}
            disabled={isLoading || !isValid}
          >
            {isLoading ? "Creating..." : "Create Currency"}
          </Button>
        </div>
      </form>

      {/* Status Modal */}
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
