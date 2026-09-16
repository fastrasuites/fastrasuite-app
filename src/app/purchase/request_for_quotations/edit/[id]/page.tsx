"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import {
  RfqFormFields,
  RfqFormActions,
  EditRfqFormFields,
} from "@/components/purchase/requestForQuotation";
import { BreadcrumbItem } from "@/types/purchase";
import {
  useGetRequestForQuotationQuery,
  usePatchRequestForQuotationMutation,
} from "@/api/purchase/requestForQuotationApi";
import { useGetCurrenciesQuery } from "@/api/purchase/currencyApi";
import { useGetVendorsQuery } from "@/api/purchase/vendorsApi";
import { useGetProductsQuery } from "@/api/purchase/productsApi";
import {
  useGetApprovedPurchaseRequestsQuery,
  useGetPurchaseRequestQuery,
  PurchaseRequest,
} from "@/api/purchase/purchaseRequestApi";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import { extractErrorMessage } from "@/lib/utils";
import { ToastNotification } from "@/components/shared/ToastNotification";
import {
  purchaseRequestSchema,
  type PurchaseRequestFormData,
  type LineItem,
} from "@/schemas/purchaseRequestSchema";
import type { Resolver } from "react-hook-form";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
} from "@/components/shared/AnimatedWrapper";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const rfqId = params.id as string;
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch existing RFQ data
  const {
    data: rfqData,
    isLoading: isLoadingRfq,
    error: rfqError,
  } = useGetRequestForQuotationQuery(rfqId);

  // Fetch purchase request details for purpose and requesting location
  const { data: purchaseRequestData, isLoading: isLoadingPurchaseRequest, error: purchaseRequestError } =
    useGetPurchaseRequestQuery(rfqData?.purchase_request || "", {
      skip: !rfqData?.purchase_request,
    });

  // Fetch locations for requesting location field
  const { data: locations, isLoading: isLoadingLocations, error: locationsError } =
    useGetLocationsQuery({});

  // API mutations and queries
  const [patchRequestForQuotation, { isLoading: isUpdating }] =
    usePatchRequestForQuotationMutation();
  const { data: currencies, isLoading: isLoadingCurrencies, error: currenciesError } =
    useGetCurrenciesQuery({});
  const { data: vendors, isLoading: isLoadingVendors, error: vendorsError } = useGetVendorsQuery({});
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useGetProductsQuery({});

  // Get approved purchase requests for RFQ creation
  const { data: approvedPurchaseRequests, isLoading: isLoadingApprovedPRs, error: approvedPRsError } =
    useGetApprovedPurchaseRequestsQuery();

  // Form state
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] =
    useState<PurchaseRequest | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

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

  const total = useMemo(() => {
    return items.reduce((acc, i) => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.estimated_unit_price) || 0;
      return acc + qty * price;
    }, 0);
  }, [items]);

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
    defaultValues: {
      currency: "",
      vendor: "",
      purpose: "",
      requesting_location: "",
      expiry_date: "",
      purchase_request: "",
    },
  });

  // Auto-populate form when RFQ data is loaded
  useEffect(() => {
    if (rfqData) {
      // Populate form fields
      setValue("currency", rfqData.currency.toString());
      setValue("vendor", rfqData.vendor.toString());
      setValue("expiry_date", rfqData.expiry_date);
      setValue("purchase_request", rfqData.purchase_request);

      // Populate purpose and requesting location from purchase request
      if (purchaseRequestData) {
        setValue("purpose", purchaseRequestData.purpose);
        setValue(
          "requesting_location",
          purchaseRequestData.requesting_location
        );
      }

      // Populate items from RFQ
      const rfqItems: LineItem[] = rfqData.items.map((item, index) => ({
        id: item.id.toString(),
        product: item.product.toString(),
        qty: item.qty,
        estimated_unit_price: item.estimated_unit_price,
        product_description: item.product_details.product_description,
        unit_of_measure:
          item.product_details.unit_of_measure_details.unit_symbol,
      }));

      setItems(rfqItems.length > 0 ? rfqItems : initialItems);
    }
  }, [rfqData, purchaseRequestData, setValue]);

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

  // Convert API data to option format
  const currencyOptions: Option[] =
    currencies?.map((currency) => ({
      value: currency.id.toString(),
      label: `${currency.currency_name} (${currency.currency_symbol})`,
    })) || [];

  const vendorOptions: Option[] =
    vendors?.map((vendor) => ({
      value: vendor.id.toString(),
      label: vendor.company_name,
    })) || [];

  const productOptions: Option[] =
    products?.map((product) => ({
      value: product.id.toString(),
      label: product.product_name,
    })) || [];

  const approvedPurchaseRequestOptions: Option[] =
    approvedPurchaseRequests?.map((pr) => ({
      value: pr.id,
      label: `PR-${pr.id} (${pr.purpose})`,
    })) || [];

  const locationOptions: Option[] =
    locations?.map((location) => ({
      value: location.id,
      label: location.location_name,
    })) || [];

  // Debug logging
  console.log("Products data:", products);
  console.log("Product options:", productOptions);
  console.log("Is loading products:", isLoadingProducts);
  console.log("Products error:", productsError);

  // Handle query errors
  React.useEffect(() => {
    if (rfqError) {
      setNotification({
        message: extractErrorMessage(rfqError, "Failed to load Request for Quotation."),
        type: "error",
        show: true,
      });
    }
  }, [rfqError]);

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
    if (approvedPRsError) {
      setNotification({
        message: extractErrorMessage(approvedPRsError, "Failed to load approved purchase requests."),
        type: "error",
        show: true,
      });
    }
  }, [approvedPRsError]);

  const breadcrumsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    {
      label: "Request for Quotations",
      href: "/purchase/request_for_quotations",
    },
    {
      label: "Edit",
      href: `/purchase/request_for_quotations/edit/${rfqId}`,
      current: true,
    },
  ];

  async function onSubmit(data: PurchaseRequestFormData): Promise<void> {
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
      // Transform form data to match RFQ API format for PATCH
      const rfqUpdateData = {
        currency: parseInt(data.currency),
        vendor: parseInt(data.vendor),
        expiry_date: data.expiry_date,
        items: validItems.map((item) => ({
          product: parseInt(item.product),
          qty: item.qty,
          estimated_unit_price: item.estimated_unit_price.toString(),
        })),
      };

      // Call the PATCH API mutation
      await patchRequestForQuotation({
        id: rfqId,
        data: rfqUpdateData,
      }).unwrap();

      // Show success notification
      setNotification({
        message: "Request for Quotation updated successfully!",
        type: "success",
        show: true,
      });

      // Navigate back after a short delay
      setTimeout(() => {
        router.push("/purchase/request_for_quotations");
      }, 1500);
    } catch (error: unknown) {
      setNotification({
        message: extractErrorMessage(error, "Failed to update request for quotation. Please try again."),
        type: "error",
        show: true,
      });
    }
  }

  // Handle send for approval
  const handleSendForApproval = async (): Promise<void> => {
    try {
      setIsLoadingStatus(true);

      // Call the PATCH API to update status to pending
      await patchRequestForQuotation({
        id: rfqId,
        data: { status: "pending" },
      }).unwrap();

      // Show success notification
      setNotification({
        message: "Request for Quotation sent for approval successfully!",
        type: "success",
        show: true,
      });

      // Navigate back after a short delay
      setTimeout(() => {
        router.push("/purchase/request_for_quotations");
      }, 1500);
    } catch (error: unknown) {
      setNotification({
        message: extractErrorMessage(error, "Failed to send request for quotation for approval. Please try again."),
        type: "error",
        show: true,
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Close notification
  function closeNotification() {
    setNotification((prev) => ({ ...prev, show: false }));
  }

  // Get currently selected currency symbol
  const getCurrentCurrencySymbol = () => {
    const selectedCurrencyId = watch("currency");
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

  // Function to get product details when a product is selected
  const getProductDetails = (productId: string) => {
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

  // Handle purchase request selection and auto-population
  const handlePurchaseRequestSelection = (purchaseRequestId: string) => {
    const selectedPR = approvedPurchaseRequests?.find(
      (pr) => pr.id === purchaseRequestId
    );
    if (selectedPR) {
      setSelectedPurchaseRequest(selectedPR);

      // Auto-populate form fields from the purchase request
      setValue("currency", selectedPR.currency.toString());
      setValue("vendor", selectedPR.vendor.toString());
      setValue("purpose", selectedPR.purpose);
      setValue("requesting_location", selectedPR.requesting_location);
      setValue("purchase_request", selectedPR.id);

      // Auto-populate items from the purchase request
      const rfqItems: LineItem[] = selectedPR.items.map((item, index) => ({
        id: (index + 1).toString(),
        product: item.product.toString(),
        qty: item.qty,
        estimated_unit_price: item.estimated_unit_price,
        product_description: item.product_details.product_description,
        unit_of_measure:
          item.product_details.unit_of_measure_details.unit_symbol,
      }));

      setItems(rfqItems.length > 0 ? rfqItems : initialItems);
    }
  };

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
        <PageHeader items={breadcrumsItem} title="Edit Request for Quotation" />
      </motion.div>

      {/* Loading state */}
      {isLoadingRfq && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading Request for Quotation...</div>
        </div>
      )}

      {/* Error state */}
      {rfqError && !isLoadingRfq && (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500 text-center px-4">
            <p className="font-semibold text-lg">Error Loading Request for Quotation</p>
            <p className="text-sm mt-1">{extractErrorMessage(rfqError)}</p>
          </div>
        </div>
      )}

      {/* Check if RFQ can be edited */}
      {rfqData && !rfqData.can_edit && (
        <div className="flex items-center justify-center h-64">
          <div className="text-orange-500">
            This Request for Quotation cannot be edited.
          </div>
        </div>
      )}

      {/* Main form area */}
      {rfqData &&
        rfqData.can_edit &&
        !isLoadingRfq &&
        !rfqError &&
        !isLoadingPurchaseRequest &&
        !isLoadingLocations && (
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

              {/* Content: rows with separators */}
              <div className="flex-1">
                {/* Row 1 (first 3 fields) */}
                <SlideUp delay={0.4}>
                  <div className="py-2 mb-6 border-b border-gray-200">
                    <StaggerContainer
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4"
                      staggerDelay={0.15}
                    >
                      {/* Date */}
                      <FadeIn>
                        <div className="p-4 transition-colors border-r border-gray-300">
                          <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                            Date
                          </h3>
                          <p className="text-gray-700">
                            {new Date().toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date().toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </FadeIn>

                      {/* Requester */}
                      <FadeIn>
                        <div className="p-4 transition-colors border-r border-gray-300">
                          <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                            Requester
                          </h3>
                          <p className="text-gray-700">
                            {loggedInUser?.username || "User"}
                          </p>
                        </div>
                      </FadeIn>
                    </StaggerContainer>
                  </div>
                </SlideUp>
              </div>

              {/* RFQ form fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
              >
                <EditRfqFormFields
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                  currencyOptions={currencyOptions}
                  vendorOptions={vendorOptions}
                  approvedPurchaseRequestOptions={
                    approvedPurchaseRequestOptions
                  }
                  locationOptions={locationOptions}
                  isLoadingCurrencies={isLoadingCurrencies}
                  isLoadingVendors={isLoadingVendors}
                  isLoadingApprovedPRs={isLoadingApprovedPRs}
                  isLoadingLocations={isLoadingLocations}
                  onPurchaseRequestChange={handlePurchaseRequestSelection}
                  disableFields={true}
                />
              </motion.div>

              <section className="bg-white  mt-8 border-none">
                <div className="mx-auto">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[1100px] table-fixed">
                      <TableHeader className="bg-[#F6F7F8]">
                        <TableRow>
                          <TableHead className="w-30 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                            Product
                          </TableHead>
                          <TableHead className="w-80 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                            Description
                          </TableHead>
                          <TableHead className="w-20 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                            QTY
                          </TableHead>
                          <TableHead className="w-24 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                            Unit of Measure
                          </TableHead>
                          <TableHead className="w-32 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                            Estimated Unit Price
                          </TableHead>
                          <TableHead className="w-28 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                            Total Price
                          </TableHead>
                          <TableHead className="w-16 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody className="bg-white">
                        {items.map((it) => {
                          const rowTotal =
                            it.qty * Number(it.estimated_unit_price || 0);
                          return (
                            <TableRow
                              key={it.id}
                              className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150"
                            >
                              <TableCell className="border border-gray-200 align-middle">
                                {selectedPurchaseRequest ? (
                                  <div className="text-sm text-gray-600 line-clamp-2">
                                    {productOptions.find(
                                      (p) => p.value === it.product
                                    )?.label || "N/A"}
                                  </div>
                                ) : (
                                  <Select
                                    value={it.product}
                                    onValueChange={(value) =>
                                      updateItemWithProductDetails(it.id, {
                                        product: value,
                                      })
                                    }
                                    disabled={isLoadingProducts}
                                  >
                                    <SelectTrigger className="h-11 w-full rounded-none border-0 focus:ring-0 focus:ring-offset-0">
                                      <SelectValue
                                        placeholder={
                                          isLoadingProducts
                                            ? "Loading products..."
                                            : "Select product"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {isLoadingProducts ? (
                                        <SelectItem
                                          value="__loading__"
                                          disabled
                                        >
                                          Loading products...
                                        </SelectItem>
                                      ) : productOptions.length === 0 ? (
                                        <SelectItem
                                          value="__no_products__"
                                          disabled
                                        >
                                          No products available
                                        </SelectItem>
                                      ) : (
                                        productOptions.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>

                              <TableCell className="border border-gray-200 px-4 align-middle">
                                <div className="text-sm text-gray-600 line-clamp-2">
                                  {it.product_description || "Select a product"}
                                </div>
                              </TableCell>

                              <TableCell className="border border-gray-200  align-middle text-center">
                                {selectedPurchaseRequest ? (
                                  <div className="text-sm text-gray-700">
                                    {it.qty}
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min={1}
                                    aria-label="Quantity"
                                    value={String(it.qty)}
                                    onChange={(e) =>
                                      updateItemWithProductDetails(it.id, {
                                        qty: Math.max(
                                          1,
                                          Number(e.target.value || 0)
                                        ),
                                      })
                                    }
                                    className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                                  />
                                )}
                              </TableCell>

                              <TableCell className="border border-gray-200 px-4 align-middle text-center">
                                <div className="text-sm text-gray-700">
                                  {it.unit_of_measure || "N/A"}
                                </div>
                              </TableCell>

                              <TableCell className="border border-gray-200 px-4  align-middle text-right">
                                {selectedPurchaseRequest ? (
                                  <div className="text-sm text-gray-700 tabular-nums">
                                    {formatCurrency(
                                      Number(it.estimated_unit_price) || 0
                                    )}
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    aria-label="Estimated unit price"
                                    value={String(it.estimated_unit_price)}
                                    onChange={(e) =>
                                      updateItemWithProductDetails(it.id, {
                                        estimated_unit_price: e.target.value,
                                      })
                                    }
                                    placeholder="0.00"
                                    className="h-11 w-28 text-right rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                                  />
                                )}
                              </TableCell>

                              <TableCell className="border border-gray-200 px-4 align-middle text-right">
                                <div className="text-sm font-medium text-gray-800 tabular-nums">
                                  {formatCurrency(rowTotal)}
                                </div>
                              </TableCell>

                              <TableCell className="border border-gray-200 px-4 align-middle text-center">
                                {!selectedPurchaseRequest && (
                                  <button
                                    onClick={() => removeRow(it.id)}
                                    aria-label="Remove row"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-2 rounded-md hover:bg-red-50"
                                    disabled={items.length === 1}
                                  >
                                    <Trash className="w-4 h-4 text-red-500" />
                                  </button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>

                      <TableFooter className="bg-[#FBFCFD] border border-gray-200">
                        <TableRow className="">
                          {/* Empty cells for alignment */}
                          <TableCell className="bg-white">
                            {!selectedPurchaseRequest && (
                              <Button
                                variant="ghost"
                                onClick={addRow}
                                className="flex items-center gap-2 px-3 py-0 text-sm m-auto rounded-md hover:bg-gray-50"
                                aria-label="Add row"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="bg-white" />
                          <TableCell className="bg-white" />
                          <TableCell className="bg-white" />
                          <TableCell className="bg-white" />
                          <TableCell className="bg-white" />
                          <TableCell className="bg-white" />

                          {/* <TableCell className="w-28 border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Total
                      </TableCell>
                      <TableCell className="w-16 border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-800 tabular-nums">
                        {formatCurrency(total)}
                      </TableCell> */}
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="ml-auto flex items-center gap-4 border-x border-b">
                    <div className="hidden sm:block text-sm text-slate-700 px-4 py-2 bg-white rounded-md">
                      <div className="flex items-center justify-between gap-6 min-w-[220px] ">
                        <span className="text-sm text-slate-600">Total</span>
                        <span className="font-medium">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Form actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
              >
                <RfqFormActions
                  formRef={formRef}
                  submitText={
                    isUpdating ? "Updating..." : "Update Request for Quotation"
                  }
                  isLoading={isUpdating}
                  onSendForApproval={handleSendForApproval}
                  isLoadingStatus={isLoadingStatus}
                />
              </motion.div>
            </form>
          </motion.main>
        )}

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
