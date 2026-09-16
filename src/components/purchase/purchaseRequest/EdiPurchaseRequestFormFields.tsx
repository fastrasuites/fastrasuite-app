import React from "react";
import { motion } from "framer-motion";
import {
  UseFormRegisterReturn,
  UseFormSetValue,
  FieldErrors,
  UseFormWatch,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PurchaseRequestFormData } from "@/schemas/purchaseRequestSchema";

type Option = { value: string; label: string };

// Backward compatible props interface
interface ReactHookFormProps {
  register: (name: keyof PurchaseRequestFormData) => UseFormRegisterReturn;
  errors: FieldErrors<PurchaseRequestFormData>;
  setValue: UseFormSetValue<PurchaseRequestFormData>;
  watch: UseFormWatch<PurchaseRequestFormData>;
  currencyOptions: Option[];
  vendorOptions: Option[];
  isLoadingCurrencies?: boolean;
  isLoadingVendors?: boolean;
  locationOptions?: Option[];
  isLoadingLocations?: boolean;
}

interface SimpleProps {
  formData: {
    currency: string;
    vendor: string;
    purpose: string;
    requesting_location?: string;
  };
  onChange: (field: string, value: string | number | "") => void;
  currencyOptions: Option[];
  vendorOptions: Option[];
  isLoadingCurrencies?: boolean;
  isLoadingVendors?: boolean;
  locationOptions?: Option[];
  isLoadingLocations?: boolean;
}

type EditPurchaseRequestFormFieldsProps = ReactHookFormProps | SimpleProps;

export function EditPurchaseRequestFormFields(
  props: EditPurchaseRequestFormFieldsProps
) {
  // Check if we're using react-hook-form props or simple props
  const isReactHookForm = "register" in props;

  // Type guards
  const reactHookFormProps = props as ReactHookFormProps;
  const simpleProps = props as SimpleProps;

  // Helper function to get field value with specific field watching
  const getFieldValue = (field: string): string | number | "" | undefined => {
    if (isReactHookForm) {
      // For react-hook-form, use the watch function with specific field
      return reactHookFormProps.watch(field as keyof PurchaseRequestFormData);
    }
    return simpleProps.formData[field as keyof typeof simpleProps.formData];
  };

  // Explicitly watch form fields to ensure re-renders when values change
  const watchedCurrency = isReactHookForm
    ? reactHookFormProps.watch("currency")
    : simpleProps.formData.currency;
  const watchedVendor = isReactHookForm
    ? reactHookFormProps.watch("vendor")
    : simpleProps.formData.vendor;
  const watchedLocation = isReactHookForm
    ? reactHookFormProps.watch("requesting_location")
    : simpleProps.formData.requesting_location;
  const watchedPurpose = isReactHookForm
    ? reactHookFormProps.watch("purpose")
    : simpleProps.formData.purpose;

  // Helper function to handle field changes
  const handleFieldChange = (field: string, value: string | number | "") => {
    if (isReactHookForm) {
      reactHookFormProps.setValue(
        field as keyof PurchaseRequestFormData,
        value as string
      );
    } else {
      simpleProps.onChange(field, value);
    }
  };

  // Helper function to handle select changes
  const handleSelectChange = (field: string, value: string) => {
    if (isReactHookForm) {
      reactHookFormProps.setValue(
        field as keyof PurchaseRequestFormData,
        value
      );
    } else {
      simpleProps.onChange(field, value);
    }
  };

  return (
    <motion.div
      className="md:flex md:items-start md:gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Grid inputs */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Currency */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          >
            <Label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Currency *
            </Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Select
                value={(watchedCurrency as string) || ""}
                onValueChange={(value) => handleSelectChange("currency", value)}
                disabled={
                  isReactHookForm
                    ? reactHookFormProps.isLoadingCurrencies
                    : simpleProps.isLoadingCurrencies
                }
              >
                <SelectTrigger
                  className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  size="md"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {(isReactHookForm
                    ? reactHookFormProps.currencyOptions
                    : simpleProps.currencyOptions
                  ).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isReactHookForm && reactHookFormProps.errors.currency && (
                <p className="text-sm text-red-600 mt-1">
                  {reactHookFormProps.errors.currency.message}
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Purpose */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          >
            <Label
              htmlFor="purpose"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Purpose *
            </Label>
            <div className="relative">
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="purpose"
                  placeholder="Enter purpose of purchase request"
                  {...(isReactHookForm
                    ? reactHookFormProps.register("purpose")
                    : {
                        value: watchedPurpose || "",
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFieldChange("purpose", e.target.value),
                      })}
                  className="h-11 pr-10 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
                {isReactHookForm && reactHookFormProps.errors.purpose && (
                  <p className="text-sm text-red-600 mt-1">
                    {reactHookFormProps.errors.purpose.message}
                  </p>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Vendor */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            <Label
              htmlFor="vendor"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Vendor *
            </Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Select
                value={(watchedVendor as string) || ""}
                onValueChange={(value) => handleSelectChange("vendor", value)}
                disabled={
                  isReactHookForm
                    ? reactHookFormProps.isLoadingVendors
                    : simpleProps.isLoadingVendors
                }
              >
                <SelectTrigger
                  className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  size="md"
                >
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {(isReactHookForm
                    ? reactHookFormProps.vendorOptions
                    : simpleProps.vendorOptions
                  ).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isReactHookForm && reactHookFormProps.errors.vendor && (
                <p className="text-sm text-red-600 mt-1">
                  {reactHookFormProps.errors.vendor.message}
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Requesting Location */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
          >
            <Label
              htmlFor="requesting_location"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Requesting Location *
            </Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Select
                value={(watchedLocation as string) || ""}
                onValueChange={(value) =>
                  handleSelectChange("requesting_location", value)
                }
                disabled={
                  isReactHookForm
                    ? reactHookFormProps.isLoadingLocations
                    : simpleProps.isLoadingLocations
                }
              >
                <SelectTrigger
                  className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  size="md"
                >
                  <SelectValue placeholder="Select requesting location" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const options = isReactHookForm
                      ? reactHookFormProps.locationOptions
                      : simpleProps.locationOptions;
                    return (options || []).map((option: Option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
              {isReactHookForm &&
                reactHookFormProps.errors.requesting_location && (
                  <p className="text-sm text-red-600 mt-1">
                    {reactHookFormProps.errors.requesting_location.message}
                  </p>
                )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
