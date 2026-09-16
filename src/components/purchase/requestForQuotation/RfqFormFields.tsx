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
import { useGetActiveLocationsFilteredQuery } from "../../../api/inventory/locationApi";
import { RfqFormData } from "@/schemas/rfqSchema";

type Option = { value: string; label: string };

// Backward compatible props interface
interface ReactHookFormProps {
  register: (name: keyof RfqFormData) => UseFormRegisterReturn;
  errors: FieldErrors<RfqFormData>;
  setValue: UseFormSetValue<RfqFormData>;
  watch: UseFormWatch<RfqFormData>;
  currencyOptions: Option[];
  vendorOptions: Option[];
  isLoadingCurrencies?: boolean;
  isLoadingVendors?: boolean;
  locationOptions?: Option[];
  isLoadingLocations?: boolean;
  approvedPurchaseRequestOptions?: Option[];
  isLoadingApprovedPRs?: boolean;
  onPurchaseRequestSelection?: (value: string) => void;
  isReadOnly?: boolean;
  currency_details?: {
    currency_name: string;
    currency_code: string;
    currency_symbol: string;
  };
  vendor_details?: { company_name: string };
  requesting_location_details?: {
    location_name: string;
    location_code: string;
  };
}

interface SimpleProps {
  formData: {
    currency: string;
    vendor: string;
    purpose: string;
    requesting_location?: string;
    expiry_date?: string;
    purchase_request?: string;
  };
  onChange: (field: string, value: string | number | "") => void;
  currencyOptions: Option[];
  vendorOptions: Option[];
  isLoadingCurrencies?: boolean;
  isLoadingVendors?: boolean;
  locationOptions?: Option[];
  isLoadingLocations?: boolean;
  approvedPurchaseRequestOptions?: Option[];
  isLoadingApprovedPRs?: boolean;
  onPurchaseRequestSelection?: (value: string) => void;
  isReadOnly?: boolean;
  currency_details?: {
    currency_name: string;
    currency_code: string;
    currency_symbol: string;
  };
  vendor_details?: { company_name: string };
  requesting_location_details?: {
    location_name: string;
    location_code: string;
  };
}

type RfqFormFieldsProps = ReactHookFormProps | SimpleProps;

export function RfqFormFields(props: RfqFormFieldsProps) {
  // Check if we're using react-hook-form props or simple props
  const isReactHookForm = "register" in props;

  // Type guards
  const reactHookFormProps = props as ReactHookFormProps;
  const simpleProps = props as SimpleProps;
  console.log("RfqFormFields props:", props);

  // Fetch active locations
  const { data: activeLocations, isLoading: isLoadingLocations } =
    useGetActiveLocationsFilteredQuery();

  // Convert locations to option format
  const locationOptions: Option[] =
    activeLocations?.map((location) => ({
      value: location.id,
      label: `${location.location_name} (${location.location_code})`,
    })) || [];

  // Helper function to get field value
  const getFieldValue = (field: string): string | number | "" | undefined => {
    if (isReactHookForm) {
      // For react-hook-form, use the watch function
      return reactHookFormProps.watch(field as keyof RfqFormData);
    }
    return simpleProps.formData[field as keyof typeof simpleProps.formData];
  };

  // Helper function to handle field changes
  const handleFieldChange = (field: string, value: string | number | "") => {
    if (isReactHookForm) {
      reactHookFormProps.setValue(field as keyof RfqFormData, value as string);
    } else {
      simpleProps.onChange(field, value);
    }
  };

  // Helper function to handle select changes
  const handleSelectChange = (field: string, value: string) => {
    if (isReactHookForm) {
      reactHookFormProps.setValue(field as keyof RfqFormData, value);
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
          {/* Purchase Request Selection */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          >
            <Label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Select Purchase Request *
            </Label>

            {(isReactHookForm
              ? reactHookFormProps.isReadOnly ?? false
              : simpleProps.isReadOnly ?? false) &&
            getFieldValue("purchase_request") ? (
              <div className="h-11 flex items-center px-3 border border-gray-400 rounded bg-gray-50 text-gray-700">
                PR-{getFieldValue("purchase_request")}
              </div>
            ) : (
              <div className="max-w-md">
                <Select
                  value={(getFieldValue("purchase_request") as string) || ""}
                  onValueChange={(value) => {
                    handleSelectChange("purchase_request", value);
                    if (
                      isReactHookForm
                        ? reactHookFormProps.onPurchaseRequestSelection
                        : simpleProps.onPurchaseRequestSelection
                    ) {
                      (isReactHookForm
                        ? reactHookFormProps.onPurchaseRequestSelection
                        : simpleProps.onPurchaseRequestSelection)!(value);
                    }
                  }}
                  disabled={
                    isReactHookForm
                      ? reactHookFormProps.isLoadingApprovedPRs ||
                        (reactHookFormProps.isReadOnly ?? false)
                      : simpleProps.isLoadingApprovedPRs ||
                        (simpleProps.isReadOnly ?? false)
                  }
                >
                  <SelectTrigger
                    className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    size="md"
                  >
                    <SelectValue
                      placeholder={
                        (
                          isReactHookForm
                            ? reactHookFormProps.isLoadingApprovedPRs
                            : simpleProps.isLoadingApprovedPRs
                        )
                          ? "Loading purchase requests..."
                          : "Select purchase request"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      isReactHookForm
                        ? reactHookFormProps.isLoadingApprovedPRs
                        : simpleProps.isLoadingApprovedPRs
                    ) ? (
                      <SelectItem value="__loading__" disabled>
                        Loading purchase requests...
                      </SelectItem>
                    ) : (isReactHookForm
                        ? reactHookFormProps.approvedPurchaseRequestOptions
                        : simpleProps.approvedPurchaseRequestOptions
                      )?.length === 0 ? (
                      <SelectItem value="__no_prs__" disabled>
                        No approved purchase requests available
                      </SelectItem>
                    ) : (
                      (isReactHookForm
                        ? reactHookFormProps.approvedPurchaseRequestOptions
                        : simpleProps.approvedPurchaseRequestOptions
                      )?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {isReactHookForm &&
                  reactHookFormProps.errors.purchase_request && (
                    <p className="text-sm text-red-600 mt-1">
                      {reactHookFormProps.errors.purchase_request.message}
                    </p>
                  )}
              </div>
            )}
          </motion.div>
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
            {(isReactHookForm
              ? reactHookFormProps.isReadOnly ?? false
              : simpleProps.isReadOnly ?? false) &&
            (isReactHookForm
              ? reactHookFormProps.currency_details
              : simpleProps.currency_details) ? (
              <div className="h-11 flex items-center px-3 border border-gray-400 rounded bg-gray-50 text-gray-700">
                {
                  (isReactHookForm
                    ? reactHookFormProps.currency_details
                    : simpleProps.currency_details
                  )?.currency_name
                }{" "}
                (
                {
                  (isReactHookForm
                    ? reactHookFormProps.currency_details
                    : simpleProps.currency_details
                  )?.currency_code
                }
                ){" "}
                {
                  (isReactHookForm
                    ? reactHookFormProps.currency_details
                    : simpleProps.currency_details
                  )?.currency_symbol
                }
              </div>
            ) : (
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  value={(getFieldValue("currency") as string) || ""}
                  onValueChange={(value) =>
                    handleSelectChange("currency", value)
                  }
                  disabled={
                    isReactHookForm
                      ? reactHookFormProps.isLoadingCurrencies ||
                        (reactHookFormProps.isReadOnly ?? false)
                      : simpleProps.isLoadingCurrencies ||
                        (simpleProps.isReadOnly ?? false)
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
            )}
          </motion.div>

          {/* Purpose */}
          {/* <motion.div
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
                  placeholder="Enter purpose of RFQ"
                  readOnly={
                    isReactHookForm
                      ? reactHookFormProps.isReadOnly ?? false
                      : simpleProps.isReadOnly ?? false
                  }
                  {...(isReactHookForm
                    ? reactHookFormProps.register("purpose")
                    : {
                        value: getFieldValue("purpose"),
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFieldChange("purpose", e.target.value),
                      })}
                  className={`h-11 pr-10 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                    (
                      isReactHookForm
                        ? reactHookFormProps.isReadOnly ?? false
                        : simpleProps.isReadOnly ?? false
                    )
                      ? "bg-gray-50 cursor-not-allowed"
                      : ""
                  }`}
                />
                {isReactHookForm && reactHookFormProps.errors.purpose && (
                  <p className="text-sm text-red-600 mt-1">
                    {reactHookFormProps.errors.purpose.message}
                  </p>
                )}
              </motion.div>
            </div>
          </motion.div> */}

          {/* Expiry Date */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.25 }}
          >
            <Label
              htmlFor="expiry_date"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Expiry Date *
            </Label>
            <div className="relative">
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="expiry_date"
                  type="date"
                  {...(isReactHookForm
                    ? reactHookFormProps.register("expiry_date")
                    : {
                        value: getFieldValue("expiry_date"),
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFieldChange("expiry_date", e.target.value),
                      })}
                  className="h-11 pr-10 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
                {isReactHookForm && reactHookFormProps.errors.expiry_date && (
                  <p className="text-sm text-red-600 mt-1">
                    {reactHookFormProps.errors.expiry_date.message}
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
            {(isReactHookForm
              ? reactHookFormProps.isReadOnly ?? false
              : simpleProps.isReadOnly ?? false) &&
            (isReactHookForm
              ? reactHookFormProps.vendor_details
              : simpleProps.vendor_details) ? (
              <div className="h-11 flex items-center px-3 border border-gray-400 rounded bg-gray-50 text-gray-700">
                {
                  (isReactHookForm
                    ? reactHookFormProps.vendor_details
                    : simpleProps.vendor_details
                  )?.company_name
                }
              </div>
            ) : (
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  value={(getFieldValue("vendor") as string) || ""}
                  onValueChange={(value) => handleSelectChange("vendor", value)}
                  disabled={
                    isReactHookForm
                      ? reactHookFormProps.isLoadingVendors ||
                        (reactHookFormProps.isReadOnly ?? false)
                      : simpleProps.isLoadingVendors ||
                        (simpleProps.isReadOnly ?? false)
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
            )}
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
            {(isReactHookForm
              ? reactHookFormProps.isReadOnly ?? false
              : simpleProps.isReadOnly ?? false) &&
            (isReactHookForm
              ? reactHookFormProps.requesting_location_details
              : simpleProps.requesting_location_details) ? (
              <div className="h-11 flex items-center px-3 border border-gray-400 rounded bg-gray-50 text-gray-700">
                {
                  (isReactHookForm
                    ? reactHookFormProps.requesting_location_details
                    : simpleProps.requesting_location_details
                  )?.location_name
                }{" "}
                (
                {
                  (isReactHookForm
                    ? reactHookFormProps.requesting_location_details
                    : simpleProps.requesting_location_details
                  )?.location_code
                }
                )
              </div>
            ) : (
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  value={(getFieldValue("requesting_location") as string) || ""}
                  onValueChange={(value) =>
                    handleSelectChange("requesting_location", value)
                  }
                  disabled={
                    isLoadingLocations ||
                    (isReactHookForm
                      ? reactHookFormProps.isReadOnly ?? false
                      : simpleProps.isReadOnly ?? false)
                  }
                >
                  <SelectTrigger
                    className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    size="md"
                  >
                    <SelectValue placeholder="Select requesting location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isReactHookForm &&
                  reactHookFormProps.errors.requesting_location && (
                    <p className="text-sm text-red-600 mt-1">
                      {reactHookFormProps.errors.requesting_location.message}
                    </p>
                  )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
