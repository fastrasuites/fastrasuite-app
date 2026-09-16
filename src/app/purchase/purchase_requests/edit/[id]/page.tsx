"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import {
  PurchaseRequestFormActions,
  EditPurchaseRequestFormFields,
  PurchaseRequestLoadingState,
  PurchaseRequestErrorState,
  PurchaseRequestInfoCard,
  PurchaseRequestItemsTable,
} from "@/components/purchase/purchaseRequest";
import { BreadcrumbItem } from "@/types/purchase";
import {
  useGetPurchaseRequestQuery,
  usePatchPurchaseRequestMutation,
} from "@/api/purchase/purchaseRequestApi";
import { useGetCurrenciesQuery } from "@/api/purchase/currencyApi";
import { useGetVendorsQuery } from "@/api/purchase/vendorsApi";
import { useGetProductsQuery } from "@/api/purchase/productsApi";
import { useGetActiveLocationsFilteredQuery } from "@/api/inventory/locationApi";
import { extractErrorMessage } from "@/lib/utils";
import { ToastNotification } from "@/components/shared/ToastNotification";
import {
  purchaseRequestSchema,
  type PurchaseRequestFormData,
  type LineItem,
} from "@/schemas/purchaseRequestSchema";
import type { Resolver } from "react-hook-form";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

type Option = { value: string; label: string };

const initialItems: LineItem[] = [
  {
    id: "1",
    product: "",
    qty: 0,
    estimated_unit_price: "",
    product_description: "",
    unit_of_measure: "",
  },
];

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLFormElement>(null);

  // Get the purchase request ID from the URL params
  const purchaseRequestId = params.id as string;

  // API mutations and queries
  const { data: purchaseRequest, isLoading: isLoadingPurchaseRequest, error: purchaseRequestError } =
    useGetPurchaseRequestQuery(purchaseRequestId, {
      skip: !purchaseRequestId,
    });

  const [patchPurchaseRequest, { isLoading: isUpdating }] =
    usePatchPurchaseRequestMutation();

  const { data: currencies, isLoading: isLoadingCurrencies, error: currenciesError } =
    useGetCurrenciesQuery({});
  const { data: vendors, isLoading: isLoadingVendors, error: vendorsError } = useGetVendorsQuery({});
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useGetProductsQuery({});
  const { data: activeLocations, isLoading: isLoadingLocations, error: locationsError } =
    useGetActiveLocationsFilteredQuery();

  // Use purchase request data as primary source, fall back to API data when needed
  const currentCurrency = purchaseRequest?.currency_details;
  const currentVendor = purchaseRequest?.vendor_details;

  // Form state
  const [items, setItems] = useState<LineItem[]>(initialItems);

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        product: "",
        qty: 0,
        estimated_unit_price: "",
        product_description: "",
        unit_of_measure: "",
      },
    ]);

  const removeRow = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PurchaseRequestFormData>({
    resolver: zodResolver(
      purchaseRequestSchema
    ) as Resolver<PurchaseRequestFormData>,
  });

  // Initialize form with purchase request data and location data when both are loaded
  React.useEffect(() => {
    if (
      purchaseRequest &&
      !isLoadingPurchaseRequest &&
      activeLocations &&
      currencies &&
      vendors
    ) {
      // Small delay to ensure all data is ready
      const timeoutId = setTimeout(() => {
        // Reset form with purchase request data
        reset({
          currency: purchaseRequest.currency.toString(),
          vendor: purchaseRequest.vendor.toString(),
          purpose: purchaseRequest.purpose || "",
          requesting_location: purchaseRequest.requesting_location || "",
        });

        // Initialize items with existing purchase request items
        const existingItems = purchaseRequest.items.map((item, index) => ({
          id: (index + 1).toString(),
          product: item.product.toString(),
          qty: item.qty,
          estimated_unit_price: item.estimated_unit_price,
          product_description: item.product_details.product_description,
          unit_of_measure:
            item.product_details.unit_of_measure_details.unit_symbol,
        }));

        setItems(existingItems.length > 0 ? existingItems : initialItems);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    purchaseRequest,
    isLoadingPurchaseRequest,
    activeLocations,
    currencies,
    vendors,
    reset,
  ]);

  const loggedInUser = useSelector((state: RootState) => state.auth.user);

  // Notification state
  const [notification, setNotification] = React.useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({
    message: "",
    type: "success",
    show: false,
  });

  // Convert API data to option format, prioritizing purchase request data
  // This optimization uses the purchase request's currency_details, vendor_details,
  // and items.product_details as the primary source, reducing the need for separate
  // API calls and ensuring the current values are always available at the top of the dropdown lists
  const currencyOptions: Option[] = React.useMemo(() => {
    const options: Option[] = [];

    // Add current purchase request currency first (highest priority)
    if (currentCurrency) {
      options.push({
        value: purchaseRequest!.currency.toString(),
        label: `${currentCurrency.currency_name} (${currentCurrency.currency_symbol})`,
      });
    }

    // Add remaining currencies from API, excluding current one
    if (currencies) {
      const currentCurrencyId = purchaseRequest?.currency?.toString();
      currencies.forEach((currency) => {
        if (currency.id.toString() !== currentCurrencyId) {
          options.push({
            value: currency.id.toString(),
            label: `${currency.currency_name} (${currency.currency_symbol})`,
          });
        }
      });
    }

    return options;
  }, [currencies, currentCurrency, purchaseRequest]);

  const vendorOptions: Option[] = React.useMemo(() => {
    const options: Option[] = [];

    // Add current purchase request vendor first (highest priority)
    if (currentVendor) {
      options.push({
        value: purchaseRequest!.vendor.toString(),
        label: currentVendor.company_name,
      });
    }

    // Add remaining vendors from API, excluding current one
    if (vendors) {
      const currentVendorId = purchaseRequest?.vendor?.toString();
      vendors.forEach((vendor) => {
        if (vendor.id.toString() !== currentVendorId) {
          options.push({
            value: vendor.id.toString(),
            label: vendor.company_name,
          });
        }
      });
    }

    return options;
  }, [vendors, currentVendor, purchaseRequest]);

  // Enhanced options now just reference the optimized options above
  const enhancedCurrencyOptions = currencyOptions;
  const enhancedVendorOptions = vendorOptions;

  // Convert product data to option format, prioritizing purchase request product data
  const productOptions: Option[] = React.useMemo(() => {
    const options: Option[] = [];

    // Add current purchase request products first (highest priority)
    if (purchaseRequest?.items) {
      purchaseRequest.items.forEach((item) => {
        options.push({
          value: item.product.toString(),
          label: item.product_details.product_name,
        });
      });
    }

    // Add remaining products from API, excluding ones already in purchase request
    if (products) {
      const purchaseRequestProductIds = new Set(
        purchaseRequest?.items?.map((item) => item.product.toString()) || []
      );

      products.forEach((product) => {
        if (!purchaseRequestProductIds.has(product.id.toString())) {
          options.push({
            value: product.id.toString(),
            label: product.product_name,
          });
        }
      });
    }

    return options;
  }, [products, purchaseRequest]);

  // Enhanced product options now just reference the optimized options above
  const enhancedProductOptions = productOptions;

  // Location options - prioritize current purchase request location
  const locationOptions: Option[] = React.useMemo(() => {
    const options: Option[] = [];

    // Add current purchase request location first (highest priority)
    if (
      purchaseRequest?.requesting_location &&
      purchaseRequest.requesting_location_details
    ) {
      options.push({
        value: purchaseRequest.requesting_location,
        label: `${purchaseRequest.requesting_location_details.location_name} (${purchaseRequest.requesting_location_details.location_code})`,
      });
    }

    // Add remaining locations from API, excluding current one
    if (activeLocations) {
      const currentLocationId = purchaseRequest?.requesting_location;
      activeLocations.forEach((location) => {
        if (location.id !== currentLocationId) {
          options.push({
            value: location.id,
            label: `${location.location_name} (${location.location_code})`,
          });
        }
      });
    }

    return options;
  }, [activeLocations, purchaseRequest]);

  // Enhanced location options now just reference the optimized options above
  const enhancedLocationOptions = locationOptions;

  // Handle query errors
  React.useEffect(() => {
    if (purchaseRequestError) {
      setNotification({
        message: extractErrorMessage(purchaseRequestError, "Failed to load purchase request details."),
        type: "error",
        show: true,
      });
    }
  }, [purchaseRequestError]);

  React.useEffect(() => {
    if (productsError) {
      setNotification({
        message: extractErrorMessage(productsError, "Failed to load products."),
        type: "error",
        show: true,
      });
    }
  }, [productsError]);

  React.useEffect(() => {
    if (vendorsError) {
      setNotification({
        message: extractErrorMessage(vendorsError, "Failed to load vendors."),
        type: "error",
        show: true,
      });
    }
  }, [vendorsError]);

  React.useEffect(() => {
    if (currenciesError) {
      setNotification({
        message: extractErrorMessage(currenciesError, "Failed to load currencies."),
        type: "error",
        show: true,
      });
    }
  }, [currenciesError]);

  React.useEffect(() => {
    if (locationsError) {
      setNotification({
        message: extractErrorMessage(locationsError, "Failed to load locations."),
        type: "error",
        show: true,
      });
    }
  }, [locationsError]);

  // Show notification if purchase request fails to load
  React.useEffect(() => {
    if (!isLoadingPurchaseRequest && !purchaseRequest) {
      setNotification({
        message:
          "Failed to load purchase request. It may not exist or you may not have access to it.",
        type: "error",
        show: true,
      });
    }
  }, [purchaseRequest, isLoadingPurchaseRequest]);

  const breadcrumsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    {
      label: "Purchase Requests",
      href: "/purchase/purchase_requests",
      current: true,
    },
    {
      label: "Edit",
      href: `/purchase/purchase_requests/edit/${purchaseRequestId}`,
      current: true,
    },
  ];

  async function onSubmit(data: PurchaseRequestFormData): Promise<void> {
    console.log("Form submitted with data:", data);

    // Ensure purchase request is loaded
    if (!purchaseRequest) {
      setNotification({
        message: "Purchase request data not loaded. Please try again.",
        type: "error",
        show: true,
      });
      return;
    }

    // Validate items
    const validItems = items.filter(
      (item) => item.product && item.qty > 0 && item.estimated_unit_price
    );

    if (validItems.length === 0) {
      setNotification({
        message:
          "Please add at least one valid item with product, quantity, and price",
        type: "error",
        show: true,
      });
      return;
    }

    try {
      // Transform items to API format
      const items = validItems.map((item) => ({
        product: parseInt(item.product),
        qty: item.qty,
        estimated_unit_price: item.estimated_unit_price.toString(),
      }));

      // Update purchase request with all fields including items
      await patchPurchaseRequest({
        id: purchaseRequest.id,
        data: {
          currency: parseInt(data.currency),
          vendor: parseInt(data.vendor),
          purpose: data.purpose,
          requesting_location: data.requesting_location,
          status: "draft", // Always set status to draft when updating
          items: items, // Include all items (existing and new)
        },
      }).unwrap();

      // Show success notification
      setNotification({
        message: "Purchase request updated successfully!",
        type: "success",
        show: true,
      });

      // Navigate back to purchase requests page after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, "Failed to update purchase request. Please try again.");

      setNotification({
        message: errorMessage,
        type: "error",
        show: true,
      });
    }
  }

  // Close notification
  function closeNotification() {
    setNotification((prev) => ({ ...prev, show: false }));
  }

  // Handle send for approval
  async function onSendForApproval(): Promise<void> {
    // Ensure purchase request is loaded
    if (!purchaseRequest) {
      setNotification({
        message: "Purchase request data not loaded. Please try again.",
        type: "error",
        show: true,
      });
      return;
    }

    try {
      // Update purchase request status to pending
      await patchPurchaseRequest({
        id: purchaseRequest.id,
        data: { status: "pending" },
      }).unwrap();

      // Show success notification
      setNotification({
        message: "Purchase request sent for approval successfully!",
        type: "success",
        show: true,
      });

      // Navigate back to purchase requests page after a short delay
      setTimeout(() => {
        router.push("/purchase/purchase_requests");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, "Failed to send purchase request for approval. Please try again.");

      setNotification({
        message: errorMessage,
        type: "error",
        show: true,
      });
    }
  }

  // Get currently selected currency symbol (prioritizing purchase request data)
  const getCurrentCurrencySymbol = () => {
    const selectedCurrencyId = watch("currency");

    // First check if it's the current purchase request currency
    if (
      selectedCurrencyId === purchaseRequest?.currency?.toString() &&
      currentCurrency
    ) {
      return currentCurrency.currency_symbol;
    }

    // Then check the currencies API data
    if (!selectedCurrencyId || !currencies) return "₦"; // Default to Naira

    const selectedCurrency = currencies.find(
      (c) => c.id.toString() === selectedCurrencyId
    );
    return selectedCurrency?.currency_symbol || "₦";
  };

  const formatCurrency = (amount: number) => {
    const symbol = getCurrentCurrencySymbol();

    // Format number with proper locale formatting
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol} ${formattedAmount}`;
  };

  // Function to get product details when a product is selected (prioritizing purchase request data)
  const getProductDetails = (productId: string) => {
    // First check if it's a product from the current purchase request
    if (purchaseRequest?.items) {
      const purchaseRequestItem = purchaseRequest.items.find(
        (item) => item.product.toString() === productId
      );
      if (purchaseRequestItem) {
        return {
          description: purchaseRequestItem.product_details.product_description,
          unit: purchaseRequestItem.product_details.unit_of_measure_details
            .unit_symbol,
        };
      }
    }

    // Then check the products API data
    const product = products?.find((p) => p.id.toString() === productId);
    return {
      description: product?.product_description || "No description available",
      unit: product?.unit_of_measure_details?.unit_symbol || "N/A",
    };
  };

  // Enhanced updateItem function that also populates product details
  const updateItemWithProductDetails = (
    id: string,
    patch: Partial<LineItem>
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updatedItem = { ...it, ...patch };

          // If product is being updated, populate description and unit
          if (patch.product && patch.product !== it.product) {
            const productDetails = getProductDetails(patch.product);
            updatedItem.product_description = productDetails.description;
            updatedItem.unit_of_measure = productDetails.unit;
          }

          return updatedItem;
        }
        return it;
      })
    );
  };

  // Function to get display text for product selection (optimized)
  const getProductDisplayText = (item: LineItem) => {
    if (!item.product) return "Select product";

    // Try enhanced product options first (now optimized with purchase request priority)
    const option = enhancedProductOptions.find(
      (opt) => opt.value === item.product
    );
    if (option) return option.label;

    // Fallback to product description or product ID
    return item.product_description || `Product ID: ${item.product}`;
  };

  // Show loading state while fetching purchase request
  if (isLoadingPurchaseRequest) {
    return <PurchaseRequestLoadingState />;
  }

  // Show error state if purchase request not found
  if (!purchaseRequest) {
    return <PurchaseRequestErrorState />;
  }

  return (
    <motion.div
      className="h-full text-gray-900 font-sans antialiased"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <PageHeader items={breadcrumsItem} title="Edit Purchase Request" />
      </motion.div>

      {/* Main form area */}
      <motion.main
        className="h-full mx-auto px-6 py-8 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white"
        >
          <motion.h2
            className="text-lg font-medium text-blue-500 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            Basic Information
          </motion.h2>

          {/* Purchase Request Information Card */}
          <PurchaseRequestInfoCard
            status={purchaseRequest?.status || "draft"}
            loggedInUser={loggedInUser}
          />

          {/* Purchase request form fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
          >
            <EditPurchaseRequestFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              currencyOptions={enhancedCurrencyOptions}
              vendorOptions={enhancedVendorOptions}
              locationOptions={enhancedLocationOptions}
              isLoadingCurrencies={isLoadingCurrencies}
              isLoadingVendors={isLoadingVendors}
              isLoadingLocations={isLoadingLocations}
            />
          </motion.div>

          {/* Purchase Request Items Table */}
          <PurchaseRequestItemsTable
            items={items}
            productOptions={enhancedProductOptions}
            isLoadingProducts={isLoadingProducts}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            onUpdateItem={updateItem}
            onUpdateItemWithDetails={updateItemWithProductDetails}
            getProductDisplayText={getProductDisplayText}
            formatCurrency={formatCurrency}
          />

          {/* Form actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
          >
            <PurchaseRequestFormActions
              formRef={formRef}
              submitText={
                isUpdating ? "Updating..." : "Update Purchase Request"
              }
              isLoading={isUpdating}
              onSubmit={handleSubmit(onSubmit)}
              onSendForApproval={
                purchaseRequest?.status === "draft"
                  ? onSendForApproval
                  : undefined
              }
            />
          </motion.div>
        </form>
      </motion.main>

      {/* Notification */}
      <ToastNotification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={closeNotification}
      />
    </motion.div>
  );
}
