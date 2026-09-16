"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import { PurchaseRequestFormActions } from "@/components/purchase/purchaseOrder";
import { BreadcrumbItem } from "@/types/purchase";
import {
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrdersQuery,
} from "@/api/purchase/purchaseOrderApi";
import {
  useGetRequestForQuotationQuery,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Option = { value: string; label: string };

// Purchase Order specific schema
const purchaseOrderSchema = z.object({
  related_rfq: z.string().min(1, "RFQ reference is missing"),
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

export default function ConvertRfqPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.id as string;
  const formRef = useRef<HTMLFormElement>(null);

  // API mutations and queries
  const [createPurchaseOrder, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();
  const {
    data: rfq,
    isLoading: isLoadingRfq,
    error: rfqError,
  } = useGetRequestForQuotationQuery(rfqId);
  const { data: activeLocations, isLoading: isLoadingLocations } =
    useGetActiveLocationsFilteredQuery();
  const { data: existingPOs } = useGetPurchaseOrdersQuery({
    related_rfq: rfqId,
  });
  const { data: paymentTerms, isLoading: isLoadingPaymentTerms } =
    useGetPaymentTermsQuery();
  const { data: tenantUsers } = useGetTenantUsersQuery({});

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
      related_rfq: rfqId,
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

  // Populate form with RFQ data
  useEffect(() => {
    if (rfq) {
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
      setValue("related_rfq", rfq.id);
    }
  }, [rfq, setValue]);

  // Check for existing PO to prevent duplicates
  useEffect(() => {
    if (existingPOs && existingPOs.length > 0) {
      const alreadyConverted = existingPOs.some(
        (po) => po.related_rfq === rfqId,
      );
      if (alreadyConverted) {
        setNotification({
          message: "This RFQ has already been converted to a Purchase Order.",
          type: "error",
          show: true,
        });
        // Optionally redirect after a delay
        setTimeout(() => {
          router.push(`/purchase/request_for_quotations/${rfqId}`);
        }, 3000);
      }
    }
  }, [existingPOs, rfqId, router]);

  const locationOptions: Option[] =
    activeLocations?.map((location) => ({
      value: location.id,
      label: `${location.location_name} (${location.location_code})`,
    })) || [];

  // Calculate total from items
  const total = useMemo(() => {
    return items.reduce((acc, i) => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.estimated_unit_price) || 0;
      return acc + qty * price;
    }, 0);
  }, [items]);

  const breadcrumsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Purchase Orders", href: "/purchase/purchase_orders" },
    { label: "Convert RFQ", href: "#", current: true },
  ];

  async function onSubmit(data: PurchaseOrderFormData): Promise<void> {
    if (!rfq) return;

    try {
      const purchaseOrderData = {
        related_rfq: rfqId,
        currency: Number(rfq.currency),
        vendor: Number(rfq.vendor),
        destination_location: Number(data.destination_location),
        payment_terms: Number(data.payment_terms),
        delivery_terms: data.delivery_terms || "",
        purchase_policy: data.purchase_policy || "",
        created_by:
          Number(
            tenantUsers?.find((tu) => tu.user_id === loggedInUser?.id)?.id,
          ) ||
          Number(loggedInUser?.id) ||
          1,
        items: items.map((item) => ({
          product: Number(item.product),
          qty: Number(item.qty),
          estimated_unit_price: item.estimated_unit_price,
        })),
        status: "awaiting" as const,
        is_submitted: true,
      };

      const result = await createPurchaseOrder(purchaseOrderData).unwrap();

      setNotification({
        message: "Purchase order created successfully!",
        type: "success",
        show: true,
      });

      setTimeout(() => {
        router.push(`/purchase/purchase_orders/${result.id}`);
      }, 1500);
    } catch (error: unknown) {
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

  const formatCurrency = (amount: number) => {
    const symbol = rfq?.currency_details?.currency_symbol || "₦";
    return `${symbol} ${new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  if (isLoadingRfq) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (rfqError || !rfq) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">
          Error Loading RFQ
        </h2>
        <p className="mt-2 text-gray-600">
          Could not fetch details for RFQ-{rfqId}.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-500 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full text-gray-900 font-sans antialiased"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <PageHeader
        items={breadcrumsItem}
        title={`Convert RFQ-${rfqId} to Purchase Order`}
      />

      <motion.main
        className="h-full mx-auto px-6 py-8 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-lg font-medium text-blue-500 mb-6">
            Basic Information
          </h2>

          <div className="flex-1">
            <SlideUp delay={0.4}>
              <div className="py-2 mb-6 border-b border-gray-200">
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                  <FadeIn>
                    <div className="p-4 border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Related RFQ
                      </h3>
                      <p className="text-gray-700 font-medium">RFQ-{rfqId}</p>
                    </div>
                  </FadeIn>
                  <FadeIn>
                    <div className="p-4 border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Date
                      </h3>
                      <p className="text-gray-700">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </FadeIn>
                  <FadeIn>
                    <div className="p-4 border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Created By
                      </h3>
                      <p className="text-gray-700">
                        {loggedInUser?.username || "User"}
                      </p>
                    </div>
                  </FadeIn>
                  <FadeIn>
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Currency
                      </h3>
                      <p className="text-gray-700">
                        {rfq.currency_details.currency_name} (
                        {rfq.currency_details.currency_symbol})
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>

            <SlideUp delay={0.5}>
              <div className="py-4 mb-6 border-b border-gray-200">
                <h3 className="text-base font-semibold text-[#3B7CED] mb-4">
                  Vendor Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Company Name",
                      value: rfq.vendor_details.company_name,
                    },
                    { label: "Email", value: rfq.vendor_details.email },
                    { label: "Phone", value: rfq.vendor_details.phone_number },
                    { label: "Address", value: rfq.vendor_details.address },
                  ].map((info) => (
                    <div key={info.label} className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">{info.label}</p>
                      <p className="text-sm font-medium text-gray-800">
                        {info.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SlideUp>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label
                htmlFor="destination_location"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Destination Location *
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("destination_location", value)
                }
                disabled={isLoadingLocations}
              >
                <SelectTrigger className="w-full h-11 border border-gray-400 rounded bg-white">
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destination_location && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.destination_location.message}
                </p>
              )}
            </div>

            <div>
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
            </div>

            <div>
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
                className="h-11 bg-white border border-gray-400"
              />
            </div>

            <div className="lg:col-span-3">
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
                className="bg-white border border-gray-400"
                rows={3}
              />
            </div>
          </div>

          <section className="bg-white mt-8">
            <h3 className="text-base font-semibold text-[#3B7CED] mb-4">
              Order Items (Immutable)
            </h3>
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px] border">
                <TableHeader className="bg-[#F6F7F8]">
                  <TableRow>
                    <TableHead className="w-1/4">Product</TableHead>
                    <TableHead className="w-1/3">Description</TableHead>
                    <TableHead className="text-center">QTY</TableHead>
                    <TableHead className="text-center">UoM</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">
                        {it.product_name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {it.product_description}
                      </TableCell>
                      <TableCell className="text-center">{it.qty}</TableCell>
                      <TableCell className="text-center">
                        {it.unit_of_measure}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(it.estimated_unit_price))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(it.total_price))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell colSpan={5} className="text-right">
                      Grand Total
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          <div className="mt-8">
            <PurchaseRequestFormActions
              formRef={formRef}
              isLoading={isCreating}
              submitText={
                isCreating ? "Converting..." : "Convert to Purchase Order"
              }
            />
          </div>
        </form>
      </motion.main>

      <ToastNotification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </motion.div>
  );
}
