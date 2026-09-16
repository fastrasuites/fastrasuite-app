"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import {
  RfqFormFields,
  RfqFormActions,
} from "@/components/purchase/requestForQuotation";
import { BreadcrumbItem } from "@/types/purchase";
import { useCreateRequestForQuotationMutation } from "@/api/purchase/requestForQuotationApi";
import { useGetCurrenciesQuery } from "@/api/purchase/currencyApi";
import { useGetVendorsQuery } from "@/api/purchase/vendorsApi";
import { useGetProductsQuery } from "@/api/purchase/productsApi";
import {
  useGetPurchaseRequestQuery,
  PurchaseRequest,
} from "@/api/purchase/purchaseRequestApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import {
  rfqSchema,
  type RfqFormData,
  type LineItem,
} from "@/schemas/rfqSchema";
import type { Resolver } from "react-hook-form";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
} from "@/components/shared/AnimatedWrapper";
import { extractErrorMessage } from "@/lib/utils";
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
  const searchParams = useSearchParams();
  const fromPr = searchParams.get("from_pr");
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch the PR from query parameter
  const {
    data: selectedPurchaseRequest,
    isLoading: isLoadingPR,
    error: prError,
  } = useGetPurchaseRequestQuery(fromPr || "", {
    skip: !fromPr,
  });

  // API mutations and queries
  const [createRequestForQuotation, { isLoading: isCreating }] =
    useCreateRequestForQuotationMutation();
  const { data: currencies, isLoading: isLoadingCurrencies } =
    useGetCurrenciesQuery({});
  const { data: vendors, isLoading: isLoadingVendors } = useGetVendorsQuery({});
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useGetProductsQuery({});

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
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
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
  } = useForm<RfqFormData>({
    resolver: zodResolver(rfqSchema) as Resolver<RfqFormData>,
    defaultValues: {
      currency: "",
      vendor: "",
      purpose: "",
      requesting_location: "",
      expiry_date: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 30); // 30 days from now
        return date.toISOString().split("T")[0]; // YYYY-MM-DD format
      })(),
      purchase_request: "", // Will be set from query param
    },
  });

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

  // For the PR select, since it's pre-selected, provide it as an option
  const prOptions: Option[] = selectedPurchaseRequest
    ? [
        {
          value: selectedPurchaseRequest.id,
          label: `PR-${selectedPurchaseRequest.id} - ${selectedPurchaseRequest.purpose}`,
        },
      ]
    : [];

  // Debug logging
  console.log("Products data:", products);
  console.log("Product options:", productOptions);
  console.log("Is loading products:", isLoadingProducts);
  console.log("Products error:", productsError);

  // Show notification if products fail to load
  React.useEffect(() => {
    if (productsError) {
      setNotification({
        message:
          "Failed to load products. Please check your connection and try again.",
        type: "error",
        show: true,
      });
    }
  }, [productsError]);

  // Handle PR loading and validation
  useEffect(() => {
    if (!fromPr) {
      setNotification({
        message: "No purchase request specified. Please provide a valid PR ID.",
        type: "error",
        show: true,
      });
      return;
    }

    if (prError) {
      setNotification({
        message:
          "Failed to load purchase request. Please check the PR ID and try again.",
        type: "error",
        show: true,
      });
      return;
    }

    if (selectedPurchaseRequest) {
      // Validate PR status - only approved PRs can be converted
      if (selectedPurchaseRequest.status !== "approved") {
        setNotification({
          message: "Only approved purchase requests can be converted to RFQ.",
          type: "error",
          show: true,
        });
        return;
      }

      // Auto-populate form fields from the purchase request
      setValue("currency", selectedPurchaseRequest.currency.toString());
      setValue("vendor", selectedPurchaseRequest.vendor.toString());
      setValue("purpose", selectedPurchaseRequest.purpose);
      setValue(
        "requesting_location",
        selectedPurchaseRequest.requesting_location,
      );
      setValue("purchase_request", selectedPurchaseRequest.id);

      // Auto-populate items from the purchase request
      const rfqItems: LineItem[] = selectedPurchaseRequest.items.map(
        (item, index) => ({
          id: (index + 1).toString(),
          product: item.product.toString(),
          qty: item.qty,
          estimated_unit_price: item.estimated_unit_price,
          product_description: item.product_details.product_description,
          unit_of_measure:
            item.product_details.unit_of_measure_details.unit_symbol,
        }),
      );

      setItems(rfqItems.length > 0 ? rfqItems : initialItems);
    }
  }, [selectedPurchaseRequest, prError, fromPr, setValue]);

  const breadcrumsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    {
      label: "Request for Quotations",
      href: "/purchase/request_for_quotations",
      current: true,
    },
    {
      label: "Convert to RFQ",
      href: "/purchase/request_for_quotations/convert_to_rfq",
      current: true,
    },
  ];

  async function onSubmit(data: RfqFormData): Promise<void> {
    // Validate purchase request is selected
    if (!data.purchase_request) {
      setNotification({
        message: "Please select a purchase request",
        type: "error",
        show: true,
      });
      return;
    }

    // Validate items
    const validItems = items.filter(
      (item) => item.product && item.qty > 0 && item.estimated_unit_price,
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
      // Transform form data to match RFQ API format
      const rfqData = {
        currency: parseInt(data.currency),
        vendor: parseInt(data.vendor),
        purchase_request: data.purchase_request,
        expiry_date: data.expiry_date,
        items: validItems.map((item) => ({
          product: parseInt(item.product),
          qty: item.qty,
          estimated_unit_price: item.estimated_unit_price.toString(),
        })),
        status: "draft" as const,
        is_submitted: false,
        can_edit: true,
      };

      // Call the RFQ API mutation
      await createRequestForQuotation(rfqData).unwrap();

      // Show success notification
      setNotification({
        message: "Request for Quotation created successfully!",
        type: "success",
        show: true,
      });

      // Reset form and navigate to RFQ page after a short delay
      setTimeout(() => {
        reset();
        setItems(initialItems);
        router.push("/purchase/request_for_quotations");
      }, 1500);
    } catch (error: unknown) {
      // Handle API errors
      const errorMessage = extractErrorMessage(
        error,
        "Failed to create request for quotation. Please try again.",
      );

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

  // Get currently selected currency symbol
  const getCurrentCurrencySymbol = () => {
    const selectedCurrencyId = watch("currency");
    if (!selectedCurrencyId || !currencies) return "₦"; // Default to Naira

    const selectedCurrency = currencies.find(
      (c) => c.id.toString() === selectedCurrencyId,
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
    patch: Partial<LineItem>,
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
      }),
    );
  };

  // Loading state while fetching PR
  if (isLoadingPR) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase request...</p>
        </div>
      </div>
    );
  }

  // Error state if PR is invalid or missing
  if (
    !fromPr ||
    prError ||
    (selectedPurchaseRequest && selectedPurchaseRequest.status !== "approved")
  ) {
    return (
      <motion.div
        className="h-full text-gray-900 font-sans antialiased"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <PageHeader items={breadcrumsItem} title="Convert to RFQ" />
        <motion.main
          className="h-full mx-auto px-6 py-8 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Invalid Purchase Request
            </h2>
            <p className="text-gray-600 mb-6">
              {!fromPr
                ? "No purchase request ID provided in the URL."
                : prError
                  ? "The specified purchase request could not be found."
                  : "Only approved purchase requests can be converted to RFQ."}
            </p>
            <Button
              onClick={() => router.push("/purchase/request_for_quotations")}
            >
              Back to RFQs
            </Button>
          </div>
        </motion.main>
        <ToastNotification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={closeNotification}
        />
      </motion.div>
    );
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
        <PageHeader items={breadcrumsItem} title="Convert to RFQ" />
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
            {selectedPurchaseRequest && (
              <RfqFormFields
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
                currencyOptions={currencyOptions}
                vendorOptions={vendorOptions}
                approvedPurchaseRequestOptions={prOptions}
                isLoadingCurrencies={isLoadingCurrencies}
                isLoadingVendors={isLoadingVendors}
                isLoadingApprovedPRs={false} // Not loading since PR is pre-selected
                onPurchaseRequestSelection={() => {}} // Not needed since PR is pre-selected
                isReadOnly={true} // Make all fields read-only since PR is pre-selected
                currency_details={selectedPurchaseRequest.currency_details}
                vendor_details={selectedPurchaseRequest.vendor_details}
                requesting_location_details={
                  selectedPurchaseRequest.requesting_location_details
                }
              />
            )}
          </motion.div>

          {/* Display selected PR info */}
          <motion.div
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
          >
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Selected Purchase Request
            </h3>
            <div className="text-sm text-blue-800">
              <p>
                <strong>ID:</strong> PR-{selectedPurchaseRequest!.id}
              </p>
              <p>
                <strong>Purpose:</strong> {selectedPurchaseRequest!.purpose}
              </p>
              <p>
                <strong>Status:</strong> {selectedPurchaseRequest!.status}
              </p>
            </div>
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
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {productOptions.find(
                                (p) => p.value === it.product,
                              )?.label || "N/A"}
                            </div>
                          </TableCell>

                          <TableCell className="border border-gray-200 px-4 align-middle">
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {it.product_description || "Select a product"}
                            </div>
                          </TableCell>

                          <TableCell className="border border-gray-200  align-middle text-center">
                            <div className="text-sm text-gray-700">
                              {it.qty}
                            </div>
                          </TableCell>

                          <TableCell className="border border-gray-200 px-4 align-middle text-center">
                            <div className="text-sm text-gray-700">
                              {it.unit_of_measure || "N/A"}
                            </div>
                          </TableCell>

                          <TableCell className="border border-gray-200 px-4  align-middle text-right">
                            <div className="text-sm text-gray-700 tabular-nums">
                              {formatCurrency(
                                Number(it.estimated_unit_price) || 0,
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="border border-gray-200 px-4 align-middle text-right">
                            <div className="text-sm font-medium text-gray-800 tabular-nums">
                              {formatCurrency(rowTotal)}
                            </div>
                          </TableCell>

                          <TableCell className="border border-gray-200 px-4 align-middle text-center">
                            {/* No actions since items are read-only */}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>

                  <TableFooter className="bg-[#FBFCFD] border border-gray-200">
                    <TableRow className="">
                      {/* Empty cells for alignment */}
                      <TableCell className="bg-white">
                        {/* No add button since items are read-only */}
                      </TableCell>
                      <TableCell className="bg-white" />
                      <TableCell className="bg-white" />
                      <TableCell className="bg-white" />
                      <TableCell className="bg-white" />
                      <TableCell className="bg-white" />
                      <TableCell className="bg-white" />
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
                    <span className="font-medium">{formatCurrency(total)}</span>
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
                isCreating ? "Creating..." : "Create Request for Quotation"
              }
              isLoading={isCreating}
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
