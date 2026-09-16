"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import { PurchaseRequestFormActions } from "@/components/purchase/purchaseOrder";
import { BreadcrumbItem } from "@/types/purchase";
import { useCreatePurchaseOrderMutation } from "@/api/purchase/purchaseOrderApi";
import {
  useGetApprovedRfqListQuery,
  RequestForQuotation,
  RfqItem,
} from "@/api/purchase/requestForQuotationApi";
import { useGetActiveLocationsFilteredQuery } from "@/api/inventory/locationApi";
import { useGetPaymentTermsQuery } from "@/api/invoice/paymentTermsApi";
import { useGetTenantUsersQuery } from "@/api/settings/tenantUserApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// Purchase Order specific schema
const purchaseOrderSchema = z.object({
  related_rfq: z.string().min(1, "Please select an approved RFQ"),
  destination_location: z.string().min(1, "Destination location is required"),
  payment_terms: z.string().min(1, "Payment terms are required"),
  delivery_terms: z.string().optional(),
  purchase_policy: z.string().optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface LineItem {
  id: string;
  product: number;
  product_name: string;
  qty: number;
  estimated_unit_price: string;
  product_description: string;
  unit_of_measure: string;
  total_price: string;
}

export default function Page() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // API mutations and queries
  const [createPurchaseOrder, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();
  const {
    data: approvedRfqs,
    isLoading: isLoadingRfqs,
    error: rfqsError,
  } = useGetApprovedRfqListQuery();
  const { data: activeLocations, isLoading: isLoadingLocations, error: locationsError } =
    useGetActiveLocationsFilteredQuery();
  const { data: tenantUsers, error: usersError } = useGetTenantUsersQuery({});
  const { data: paymentTerms, isLoading: isLoadingPaymentTerms, error: paymentTermsError } =
    useGetPaymentTermsQuery();

  // Selected RFQ state
  const [selectedRfq, setSelectedRfq] = useState<RequestForQuotation | null>(
    null,
  );

  // Form state for items (populated from RFQ)
  const [items, setItems] = useState<LineItem[]>([]);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(
      purchaseOrderSchema,
    ) as Resolver<PurchaseOrderFormData>,
    defaultValues: {
      related_rfq: "",
      destination_location: "",
      payment_terms: "",
      delivery_terms: "",
      purchase_policy: "",
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

  // Convert RFQs to option format
  const rfqOptions: Option[] =
    approvedRfqs?.map((rfq) => ({
      value: rfq.id,
      label: `RFQ-${rfq.id} (Expires: ${new Date(
        rfq.expiry_date,
      ).toLocaleDateString()})`,
    })) || [];

  const locationOptions: Option[] =
    activeLocations?.map((location) => ({
      value: location.id,
      label: `${location.location_name} (${location.location_code})`,
    })) || [];

  // Handle RFQ selection
  const handleRfqSelection = (rfqId: string) => {
    setValue("related_rfq", rfqId);

    const rfq = approvedRfqs?.find((r) => r.id === rfqId);
    if (rfq) {
      setSelectedRfq(rfq);

      // Map RFQ items to line items
      const mappedItems: LineItem[] = rfq.items.map((item: RfqItem) => ({
        id: item.id.toString(),
        product: item.product,
        product_name: item.product_details.product_name,
        qty: item.qty,
        estimated_unit_price: item.estimated_unit_price,
        product_description: item.product_details.product_description,
        unit_of_measure:
          item.product_details.unit_of_measure_details?.unit_symbol || "N/A",
        total_price: item.total_price,
      }));
      setItems(mappedItems);
    } else {
      setSelectedRfq(null);
      setItems([]);
    }
  };

  // Calculate total from items
  const total = useMemo(() => {
    return items.reduce((acc, i) => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.estimated_unit_price) || 0;
      return acc + qty * price;
    }, 0);
  }, [items]);

  // Handle query errors
  useEffect(() => {
    if (rfqsError) {
      setNotification({
        message: extractErrorMessage(rfqsError, "Failed to load approved RFQs."),
        type: "error",
        show: true,
      });
    }
  }, [rfqsError]);

  useEffect(() => {
    if (locationsError) {
      setNotification({
        message: extractErrorMessage(locationsError, "Failed to load locations."),
        type: "error",
        show: true,
      });
    }
  }, [locationsError]);

  useEffect(() => {
    if (paymentTermsError) {
      setNotification({
        message: extractErrorMessage(paymentTermsError, "Failed to load payment terms."),
        type: "error",
        show: true,
      });
    }
  }, [paymentTermsError]);

  useEffect(() => {
    if (usersError) {
      setNotification({
        message: extractErrorMessage(usersError, "Failed to load user profiles."),
        type: "error",
        show: true,
      });
    }
  }, [usersError]);

  const breadcrumsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    {
      label: "Purchase Orders",
      href: "/purchase/purchase_orders",
      current: true,
    },
    { label: "New", href: "/purchase/purchase_orders/new", current: true },
  ];

  async function onSubmit(data: PurchaseOrderFormData): Promise<void> {
    // If no RFQ is selected, require it for submission
    if (!selectedRfq) {
      setNotification({
        message: "Please select an approved RFQ first",
        type: "error",
        show: true,
      });
      return;
    }

    // If RFQ is selected but has no items, handle that case
    if (items.length === 0) {
      setNotification({
        message: "No items found in the selected RFQ",
        type: "error",
        show: true,
      });
      return;
    }

    try {
      // Transform form data to match API format using RFQ data
      const purchaseOrderData = {
        related_rfq: data.related_rfq,
        currency: selectedRfq.currency,
        vendor: selectedRfq.vendor,
        destination_location: data.destination_location,
        payment_terms: data.payment_terms,
        delivery_terms: data.delivery_terms || "",
        purchase_policy: data.purchase_policy || "",
        created_by:
          tenantUsers?.find((tu) => tu.user_id === loggedInUser?.id)?.id ||
          loggedInUser?.id ||
          1,
        items: items.map((item) => ({
          product: item.product,
          qty: item.qty,
          estimated_unit_price: item.estimated_unit_price,
        })),
        status: "draft" as const,
        is_submitted: false,
      };

      // Call the API mutation
      await createPurchaseOrder(purchaseOrderData).unwrap();

      // Show success notification
      setNotification({
        message: "Purchase order created successfully!",
        type: "success",
        show: true,
      });

      // Reset form and navigate to purchase orders page after a short delay
      setTimeout(() => {
        reset();
        setSelectedRfq(null);
        setItems([]);
        router.push("/purchase/purchase_orders");
      }, 1500);
    } catch (error: unknown) {
      // Handle API errors
      const errorMessage = extractErrorMessage(
        error,
        "Failed to create purchase order. Please try again.",
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

  // Get currency symbol from selected RFQ
  const getCurrentCurrencySymbol = () => {
    if (!selectedRfq?.currency_details) return "₦";
    return selectedRfq.currency_details.currency_symbol || "₦";
  };

  const formatCurrency = (amount: number) => {
    const symbol = getCurrentCurrencySymbol();

    const formattedAmount = new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol} ${formattedAmount}`;
  };

  // Update item quantity
  const updateItemQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const newQty = Math.max(1, qty);
          const unitPrice = Number(it.estimated_unit_price) || 0;
          return {
            ...it,
            qty: newQty,
            total_price: (newQty * unitPrice).toFixed(2),
          };
        }
        return it;
      }),
    );
  };

  // Update item price
  const updateItemPrice = (id: string, price: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const unitPrice = Number(price) || 0;
          return {
            ...it,
            estimated_unit_price: price,
            total_price: (it.qty * unitPrice).toFixed(2),
          };
        }
        return it;
      }),
    );
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
        <PageHeader items={breadcrumsItem} title="New Purchase Order" />
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
            <SlideUp delay={0.4}>
              <div className="py-2 mb-6 border-b border-gray-200">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4"
                  staggerDelay={0.15}
                >
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Approved RFQ
                      </h3>
                      <Select
                        value={watch("related_rfq") || ""}
                        onValueChange={handleRfqSelection}
                        disabled={isLoadingRfqs}
                      >
                        <SelectTrigger
                          className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          size="md"
                        >
                          <SelectValue
                            placeholder={
                              isLoadingRfqs
                                ? "Loading approved RFQs..."
                                : "Select an approved RFQ"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingRfqs ? (
                            <SelectItem value="__loading__" disabled>
                              Loading approved RFQs...
                            </SelectItem>
                          ) : rfqOptions.length === 0 ? (
                            <SelectItem value="__no_rfqs__" disabled>
                              No approved RFQs available
                            </SelectItem>
                          ) : (
                            rfqOptions.map((option) => (
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
                      {errors.related_rfq && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.related_rfq.message}
                        </p>
                      )}
                    </div>
                  </FadeIn>
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

                  {/* Created By */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Created By
                      </h3>
                      <p className="text-gray-700">
                        {loggedInUser?.username || "User"}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Currency */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Currency
                      </h3>
                      <p className="text-gray-700">
                        {selectedRfq?.currency_details?.currency_name || "N/A"}{" "}
                        (
                        {selectedRfq?.currency_details?.currency_symbol ||
                          "N/A"}
                        )
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>

            {/* Vendor Information */}
            <SlideUp delay={0.5}>
              <div className="py-4 mb-6 border-b border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Company Name</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedRfq?.vendor_details?.company_name ||
                        "Select RFQ to populate"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedRfq?.vendor_details?.email ||
                        "Select RFQ to populate"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedRfq?.vendor_details?.phone_number ||
                        "Select RFQ to populate"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedRfq?.vendor_details?.address ||
                        "Select RFQ to populate"}
                    </p>
                  </div>
                </div>
              </div>
            </SlideUp>
          </div>

          <motion.div
            className="md:flex md:items-start md:gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
          >
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Destination Location */}
                <motion.div
                  className="col-span-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: 0.1,
                  }}
                >
                  <Label
                    htmlFor="destination_location"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Destination Location *
                  </Label>
                  <Select
                    value={watch("destination_location") || ""}
                    onValueChange={(value) =>
                      setValue("destination_location", value)
                    }
                    disabled={isLoadingLocations}
                  >
                    <SelectTrigger
                      className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      size="md"
                    >
                      <SelectValue placeholder="Select destination location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destination_location && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.destination_location.message}
                    </p>
                  )}
                </motion.div>

                {/* Payment Terms */}
                <motion.div
                  className="col-span-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: 0.2,
                  }}
                >
                  <Label
                    htmlFor="payment_terms"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Payment Terms *
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("payment_terms", value)}
                    disabled={isLoadingPaymentTerms}
                  >
                    <SelectTrigger className="w-full h-11 border border-gray-400 rounded bg-white">
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTerms?.map((term) => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                          {term.name} ({term.days_until_due} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.payment_terms && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.payment_terms.message}
                    </p>
                  )}
                </motion.div>

                {/* Delivery Terms */}
                <motion.div
                  className="col-span-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: 0.3,
                  }}
                >
                  <Label
                    htmlFor="delivery_terms"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Delivery Terms
                  </Label>
                  <Input
                    id="delivery_terms"
                    placeholder="Enter delivery terms"
                    {...register("delivery_terms")}
                    className="h-11 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </motion.div>

                {/* Purchase Policy */}
                <motion.div
                  className="col-span-1 lg:col-span-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: 0.4,
                  }}
                >
                  <Label
                    htmlFor="purchase_policy"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Purchase Policy
                  </Label>
                  <Textarea
                    id="purchase_policy"
                    placeholder="Enter purchase policy"
                    {...register("purchase_policy")}
                    className="bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    rows={3}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Items Table (from RFQ) */}
          <section className="bg-white mt-8 border-none">
            <h3 className="text-base font-semibold text-[#3B7CED] mb-4">
              Order Items{" "}
              {selectedRfq ? "(from RFQ)" : "(Select RFQ to populate)"}
            </h3>
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
                    </TableRow>
                  </TableHeader>

                  <TableBody className="bg-white">
                    {items.length > 0 ? (
                      items.map((it) => {
                        const rowTotal =
                          it.qty * Number(it.estimated_unit_price || 0);
                        return (
                          <TableRow
                            key={it.id}
                            className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150"
                          >
                            <TableCell className="border border-gray-200 px-4 align-middle">
                              <div className="text-sm font-medium text-gray-800">
                                {it.product_name}
                              </div>
                            </TableCell>

                            <TableCell className="border border-gray-200 px-4 align-middle">
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {it.product_description || "No description"}
                              </div>
                            </TableCell>

                            <TableCell className="border border-gray-200 align-middle text-center">
                              <Input
                                type="number"
                                min={1}
                                aria-label="Quantity"
                                value={String(it.qty)}
                                onChange={(e) =>
                                  updateItemQty(
                                    it.id,
                                    Number(e.target.value || 0),
                                  )
                                }
                                className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                              />
                            </TableCell>

                            <TableCell className="border border-gray-200 px-4 align-middle text-center">
                              <div className="text-sm text-gray-700">
                                {it.unit_of_measure || "N/A"}
                              </div>
                            </TableCell>

                            <TableCell className="border border-gray-200 px-4 align-middle text-right">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                aria-label="Estimated unit price"
                                value={String(it.estimated_unit_price)}
                                onChange={(e) =>
                                  updateItemPrice(it.id, e.target.value)
                                }
                                placeholder="0.00"
                                className="h-11 w-28 text-right rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                              />
                            </TableCell>

                            <TableCell className="border border-gray-200 px-4 align-middle text-right">
                              <div className="text-sm font-medium text-gray-800 tabular-nums">
                                {formatCurrency(rowTotal)}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="border border-gray-200 px-4 py-8 text-center text-gray-500"
                        >
                          {selectedRfq
                            ? "No items found in the selected RFQ"
                            : "Select an approved RFQ to view items"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {items.length > 0 && (
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
            )}
          </section>

          {/* Form actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
          >
            <PurchaseRequestFormActions
              formRef={formRef}
              submitText={isCreating ? "Creating..." : "Create Purchase Order"}
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
