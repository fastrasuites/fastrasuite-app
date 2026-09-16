"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash, PackagePlus } from "lucide-react";

import StatusModal, { useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import { DiscrepancyDialog, type DiscrepancyType } from "@/components/shared/DiscrepancyDialog";
import { PageGuard } from "@/components/auth/PageGuard";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/types/purchase";
import { useGetInventoryProductsQuery } from "@/api/inventory/productsApi";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import { useGetVendorsQuery } from "@/api/invoice/vendorsApi";
import { useGetPurchaseOrdersQuery } from "@/api/invoice/projectPurchaseOrdersApi";
import {
  useCreateIncomingProductMutation,
  useValidateIncomingProductReceiptMutation,
  useCreateIncomingProductBackorderMutation,
} from "@/api/inventory/incomingProductApi";

import { Button } from "@/components/ui/button";
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

interface GRNLineItem {
  id: string;
  product: string;
  product_name: string;
  product_description: string;
  unit_symbol: string;
  unit_of_measure_id: number;
  expected_quantity: string;
  received_quantity: string;
  accepted_quantity: string;
  rejected_quantity: string;
  reject_reason: string;
}

const receiptTypes = ["vendor_receipt", "returns", "scrap"] as const;

const incomingProductSchema = z.object({
  receipt_type: z.enum(receiptTypes),
  related_po: z.string().optional(),
  supplier: z.string().min(1, "Vendor is required"),
  source_location: z.string().min(1, "Source location is required"),
  destination_location: z.string().min(1, "Destination location is required"),
  delivery_note: z.string().optional(),
  notes: z.string().optional(),
});

type IncomingProductFormData = z.infer<typeof incomingProductSchema>;

export default function NewIncomingProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poIdParam = searchParams.get("poId") || searchParams.get("ppoId");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: productsResponse = [] } = useGetInventoryProductsQuery({});
  const productsData = Array.isArray(productsResponse) ? productsResponse : (productsResponse as any)?.results || [];

  const { data: locationsResponse = [] } = useGetLocationsQuery({});
  const locationsData = Array.isArray(locationsResponse) ? locationsResponse : (locationsResponse as any)?.results || [];

  const { data: suppliersResponse = [] } = useGetVendorsQuery({ vendor_type: "supplier" });
  const suppliersData = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse as any)?.results || [];

  const { data: poResponse = [] } = useGetPurchaseOrdersQuery({});
  const purchaseOrdersData = Array.isArray(poResponse) ? poResponse : (poResponse as any)?.results || [];

  const [createIncomingProduct] = useCreateIncomingProductMutation();
  const [validateIncomingProduct] = useValidateIncomingProductReceiptMutation();
  const [createIncomingProductBackorder] = useCreateIncomingProductBackorderMutation();

  const [items, setItems] = useState<GRNLineItem[]>([
    {
      id: "1",
      product: "",
      product_name: "",
      product_description: "",
      unit_symbol: "",
      unit_of_measure_id: 0,
      expected_quantity: "0",
      received_quantity: "0",
      accepted_quantity: "0",
      rejected_quantity: "0",
      reject_reason: "",
    },
  ]);

  const [discrepancyState, setDiscrepancyState] = useState<{
    isOpen: boolean;
    type: DiscrepancyType | null;
    ipId: string | null;
  }>({
    isOpen: false,
    type: null,
    ipId: null,
  });

  const statusModal = useStatusModal();

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        product: "",
        product_name: "",
        product_description: "",
        unit_symbol: "",
        unit_of_measure_id: 0,
        expected_quantity: "0",
        received_quantity: "0",
        accepted_quantity: "0",
        rejected_quantity: "0",
        reject_reason: "",
      },
    ]);

  const removeRow = (itemId: string) =>
    setItems((prev) => prev.filter((p) => p.id !== itemId));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncomingProductFormData>({
    resolver: zodResolver(incomingProductSchema) as Resolver<IncomingProductFormData>,
    defaultValues: {
      receipt_type: "vendor_receipt",
      related_po: poIdParam || "",
      supplier: "",
      source_location: "",
      destination_location: "",
      delivery_note: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (poIdParam) {
      setValue("related_po", poIdParam);
    }
  }, [poIdParam, setValue]);

  const relatedPoValue = watch("related_po");
  
  React.useEffect(() => {
    if (relatedPoValue && purchaseOrdersData.length > 0) {
      const selectedPo = purchaseOrdersData.find((po: any) => po.id.toString() === relatedPoValue);
      if (selectedPo && selectedPo.lines && selectedPo.lines.length > 0) {
        const newItems: GRNLineItem[] = selectedPo.lines.map((line: any, index: number) => {
          const p = productsData.find((prod: any) => prod.id.toString() === line.product.toString());
          return {
            id: `po-line-${line.id}-${index}`,
            product: line.product.toString(),
            product_name: line.item_name || p?.product_name || "",
            product_description: line.description || p?.description || "",
            unit_symbol: p?.unit_of_measure_details?.unit_symbol || "",
            unit_of_measure_id: p?.unit_of_measure || 0,
            expected_quantity: line.qty || "0",
            received_quantity: "0",
            accepted_quantity: "0",
            rejected_quantity: "0",
            reject_reason: "",
          };
        });
        setItems(newItems);
        
        if (selectedPo.vendor) {
          setValue("supplier", selectedPo.vendor.toString());
        }
      }
    }
  }, [relatedPoValue, purchaseOrdersData, productsData, setValue]);

  const productOptions: Option[] = productsData.map((p: any) => ({
    value: p.id.toString(),
    label: p.product_name,
  }));

  const updateItemProduct = (itemId: string, productId: string) => {
    const p = productsData.find((item: any) => item.id.toString() === productId);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              product: productId,
              product_name: p?.product_name || "",
              product_description: p?.description || "",
              unit_symbol: p?.unit_of_measure_details?.unit_symbol || "",
              unit_of_measure_id: p?.unit_of_measure || 0,
            }
          : it
      )
    );
  };

  const updateItemQty = (
    itemId: string,
    field: "expected_quantity" | "received_quantity" | "accepted_quantity" | "rejected_quantity",
    val: string
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const updated = { ...it, [field]: val };
        if (field === "received_quantity") {
          // If expected_quantity is empty or 0 and not linked to PO lines, auto-sync expected
          if ((!it.expected_quantity || it.expected_quantity === "0") && !relatedPoValue) {
            updated.expected_quantity = val;
          }
        }
        const rec = Number(updated.received_quantity) || 0;
        if (field === "received_quantity" || field === "accepted_quantity") {
          const acc = Number(updated.accepted_quantity) || 0;
          updated.rejected_quantity = Math.max(0, rec - acc).toString();
        }
        return updated;
      })
    );
  };

  const updateReason = (itemId: string, val: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, reject_reason: val } : it)));
  };

  async function onSaveDraft(data: IncomingProductFormData) {
    const validItems = items.filter((it) => it.product && Number(it.received_quantity) > 0);
    if (validItems.length === 0) {
      statusModal.showError(
        "Validation Error",
        "Please enter at least one valid product line with received quantity > 0"
      );
      return;
    }

    for (const it of validItems) {
      const exp = Number(it.expected_quantity) || 0;
      const rec = Number(it.received_quantity) || 0;
      if (rec > exp) {
        statusModal.showError(
          "Validation Error",
          `Quantity received (${rec}) cannot exceed the expected quantity (${exp}) for "${it.product_name || 'selected item'}".`
        );
        return;
      }
    }

    setIsSubmitting(true);
    statusModal.showInfo("Saving Draft...", "Please wait while your draft is being saved.");
    try {
      const selectedPoId = data.related_po ? Number(data.related_po) : null;
      let selectedPo: any = null;
      if (selectedPoId) {
        selectedPo = purchaseOrdersData.find((po: any) => po.id === selectedPoId);
      }

      const payload: any = {
        receipt_type: data.receipt_type,
        supplier: Number(data.supplier),
        source_location: data.source_location, 
        destination_location: data.destination_location,
        notes: data.delivery_note || data.notes || "Direct site procurement delivery inspection.",
        status: "draft",
        incoming_product_items: validItems.map((it) => {
          let ppo_line: number | undefined = undefined;
          if (selectedPo && selectedPo.lines) {
            const matchedLine = selectedPo.lines.find((l: any) => l.product === Number(it.product));
            if (matchedLine) {
              ppo_line = matchedLine.id;
            } else {
              throw new Error(`Product ${it.product_name || it.product} is not part of the selected Project Purchase Order.`);
            }
          }
          return {
            product: Number(it.product),
            expected_quantity: it.expected_quantity,
            quantity_received: it.received_quantity,
            unit_of_measure: it.unit_of_measure_id,
            ...(ppo_line ? { ppo_line } : {})
          };
        }),
      };

      if (selectedPoId) {
        payload.related_ppo = selectedPoId;
      }

      await createIncomingProduct(payload).unwrap();

      statusModal.showSuccess(
        "Draft Saved",
        "Direct Goods Receipt Note (GRN) draft saved successfully!",
        "Go to Operations",
        () => router.push("/inventory/operation")
      );
    } catch (error: any) {
      statusModal.showError(
        "Failed to save draft",
        extractErrorMessage(error, "Failed to save draft.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onValidateGRN(data: IncomingProductFormData) {
    const validItems = items.filter((it) => it.product && Number(it.received_quantity) > 0);
    if (validItems.length === 0) {
      statusModal.showError(
        "Validation Error",
        "Please enter at least one valid product line with received quantity > 0"
      );
      return;
    }

    for (const it of validItems) {
      const exp = Number(it.expected_quantity) || 0;
      const rec = Number(it.received_quantity) || 0;
      if (rec > exp) {
        statusModal.showError(
          "Validation Error",
          `Quantity received (${rec}) cannot exceed the expected quantity (${exp}) for "${it.product_name || 'selected item'}".`
        );
        return;
      }
    }

    setIsSubmitting(true);
    statusModal.showInfo("Validating...", "Please wait while we validate the GRN.");
    let createdProductId: string | null = null;

    try {
      const selectedPoId = data.related_po ? Number(data.related_po) : null;
      let selectedPo: any = null;
      if (selectedPoId) {
        selectedPo = purchaseOrdersData.find((po: any) => po.id === selectedPoId);
      }

      const payload: any = {
        receipt_type: data.receipt_type,
        supplier: Number(data.supplier),
        source_location: data.source_location,
        destination_location: data.destination_location,
        notes: data.delivery_note || data.notes || "Direct site procurement delivery inspection.",
        status: "draft",
        incoming_product_items: validItems.map((it) => {
          let ppo_line: number | undefined = undefined;
          if (selectedPo && selectedPo.lines) {
            const matchedLine = selectedPo.lines.find((l: any) => l.product === Number(it.product));
            if (matchedLine) {
              ppo_line = matchedLine.id;
            } else {
              throw new Error(`Product ${it.product_name || it.product} is not part of the selected Project Purchase Order.`);
            }
          }
          return {
            product: Number(it.product),
            expected_quantity: it.expected_quantity,
            quantity_received: it.received_quantity,
            unit_of_measure: it.unit_of_measure_id,
            ...(ppo_line ? { ppo_line } : {})
          };
        }),
      };

      if (selectedPoId) {
        payload.related_ppo = selectedPoId;
      }

      const res = await createIncomingProduct(payload).unwrap();
      const productId = res?.incoming_product_id || res?.id;
      
      if (productId) {
        createdProductId = productId.toString();
        await validateIncomingProduct({ id: createdProductId }).unwrap();
        statusModal.showSuccess(
          "GRN Validated",
          "Accepted quantities added to active warehouse stock.",
          "Go to Operations",
          () => router.push("/inventory/operation")
        );
      } else {
        statusModal.showSuccess(
          "Draft Created",
          "GRN created successfully, but automatic validation could not proceed. Please validate it from the operations list.",
          "Go to Operations",
          () => router.push("/inventory/operation")
        );
      }
    } catch (error: any) {
      const isBackorderError = error?.data?.requires_backorder_confirmation || 
                               error?.data?.error?.[0]?.error === "Short quantity detected. Please confirm backorder creation." ||
                               error?.data?.error?.[0]?.requires_backorder_confirmation === true;

      if (isBackorderError && createdProductId) {
        statusModal.close();
        setDiscrepancyState({
          isOpen: true,
          type: "backorder",
          ipId: createdProductId,
        });
      } else {
        statusModal.showError(
          "Validation Failed",
          extractErrorMessage(error, "Failed to validate GRN.")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCreateBackorder = async () => {
    if (!discrepancyState.ipId) return;
    setIsSubmitting(true);
    statusModal.showInfo("Processing Backorder...", "Please wait while the backorder is created.");
    try {
      await validateIncomingProduct({ 
        id: discrepancyState.ipId,
        data: { create_backorder: true }
      }).unwrap();

      setDiscrepancyState({ isOpen: false, type: null, ipId: null });
      statusModal.showSuccess(
        "Backorder Created",
        "GRN Validated & Backorder created for remaining pending balance!",
        "Go to Operations",
        () => router.push("/inventory/operation")
      );
    } catch (error: any) {
      statusModal.showError(
        "Action Failed",
        extractErrorMessage(error, "Failed to create backorder.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseWithoutBackorder = async () => {
    if (!discrepancyState.ipId) return;
    setIsSubmitting(true);
    statusModal.showInfo("Closing Delivery...", "Please wait while we close the delivery.");
    try {
      await validateIncomingProduct({ 
        id: discrepancyState.ipId,
        data: { create_backorder: false }
      }).unwrap();

      setDiscrepancyState({ isOpen: false, type: null, ipId: null });
      statusModal.showSuccess(
        "Delivery Closed",
        "GRN Validated! Delivery closed without backorder.",
        "Go to Operations",
        () => router.push("/inventory/operation")
      );
    } catch (error: any) {
      statusModal.showError(
        "Action Failed",
        extractErrorMessage(error, "Failed to close delivery.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    { label: "New Receipt (GRN)", href: "/inventory/operation/incoming_product/new", current: true },
  ];

  return (
    <PageGuard application="inventory" module="incomingproduct">
      {/* Two-tone: gray page canvas */}
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-28">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs
            items={breadcrumbsItem}
            action={
              <Button
                variant="ghost"
                className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
              >
                Autosaved <AutoSaveIcon />
              </Button>
            }
          />

          {/* Top Bar Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#E8F0FE] text-[#1A73E8]">
                <PackagePlus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#32325D]">
                  Record Direct Goods Receipt Note (GRN)
                </h1>
                <p className="text-xs text-[#8898AA] mt-0.5">
                  Formalize site delivery inspections and post stock directly into warehouse inventory.
                </p>
              </div>
            </div>
            <Link href="/inventory/operation">
              <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 text-sm h-9 px-3">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Cancel
              </Button>
            </Link>
          </div>

          <form className="flex flex-col gap-6">
            {/* Delivery & Vendor Information Card */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
                Delivery & Vendor Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Purchase Order
                  </Label>
                  <Select
                    value={watch("related_po")}
                    onValueChange={(val) => setValue("related_po", val)}
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder="Select Purchase Order" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrdersData.length === 0 ? (
                        <SelectItem value="no-data" disabled>No purchase orders found</SelectItem>
                      ) : (
                        purchaseOrdersData.map((po: any) => (
                          <SelectItem key={po.id} value={po.id.toString()}>
                            {po.po_number || po.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Vendor <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Select
                    value={watch("supplier")}
                    onValueChange={(val) => setValue("supplier", val)}
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliersData.length === 0 ? (
                        <SelectItem value="no-data" disabled>No vendors found</SelectItem>
                      ) : (
                        suppliersData.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.vendor_name || s.company_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.supplier && <p className="text-[11px] text-[#E43D2B]">{errors.supplier.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Source Store/Vendor <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Select
                    value={watch("source_location")}
                    onValueChange={(val) => setValue("source_location", val)}
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsData.length === 0 ? (
                        <SelectItem value="no-data" disabled>No locations found</SelectItem>
                      ) : (
                        locationsData.map((loc: any) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>
                            {loc.location_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.source_location && <p className="text-[11px] text-[#E43D2B]">{errors.source_location.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Destination Store <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Select
                    value={watch("destination_location")}
                    onValueChange={(val) => setValue("destination_location", val)}
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder="Select Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsData.length === 0 ? (
                        <SelectItem value="no-data" disabled>No locations found</SelectItem>
                      ) : (
                        locationsData.map((loc: any) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>
                            {loc.location_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.destination_location && <p className="text-[11px] text-[#E43D2B]">{errors.destination_location.message}</p>}
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Delivery Note
                  </Label>
                  <Textarea
                    {...register("delivery_note")}
                    placeholder="Enter delivery note, reference, or remarks..."
                    className="bg-white border-gray-200 rounded-md text-sm text-[#32325D] focus:ring-[#3B7CED] min-h-[60px]"
                    rows={2}
                  />
                  {errors.delivery_note && <p className="text-[11px] text-[#E43D2B]">{errors.delivery_note.message}</p>}
                </div>
              </div>
            </div>

            {/* Quality Inspection Lines Card */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">
                  4-Tier Quality Inspection Lines
                </h2>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[1100px] table-fixed">
                  <TableHeader className="bg-[#F6F7F8]">
                    <TableRow>
                      <TableHead className="w-64 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Product
                      </TableHead>
                      <TableHead className="w-80 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Description
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Unit
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Expected Quantity
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Received Quantity
                      </TableHead>
                      <TableHead className="w-16 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {items.map((it) => (
                      <TableRow key={it.id} className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150">
                        <TableCell className="border border-gray-200 align-middle p-0">
                          <Select value={it.product} onValueChange={(v) => updateItemProduct(it.id, v)}>
                            <SelectTrigger className="h-11 w-full rounded-none border-0 focus:ring-0 focus:ring-offset-0 px-4">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {productOptions.length === 0 ? (
                                <SelectItem value="no-data" disabled>No products found</SelectItem>
                              ) : (
                                productOptions.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-200 px-4 align-middle">
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {it.product_description || "Select a product"}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 px-4 align-middle text-center">
                          <div className="text-sm text-gray-700">
                            {it.unit_symbol || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center p-0">
                          <Input
                            type="number"
                            value={it.expected_quantity}
                            onChange={(e) => updateItemQty(it.id, "expected_quantity", e.target.value)}
                            className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center p-0">
                          <Input
                            type="number"
                            value={it.received_quantity}
                            onChange={(e) => updateItemQty(it.id, "received_quantity", e.target.value)}
                            className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0 bg-blue-50/30 text-[#3B7CED] font-medium"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-200 px-4 align-middle text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(it.id)}
                            disabled={items.length === 1}
                            className="h-8 w-8 text-gray-400 hover:text-[#E43D2B] hover:bg-red-50 mx-auto"
                            title="Remove line"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-white border-t border-gray-200">
                    <TableRow>
                      <TableCell colSpan={6} className="py-3 px-4 border-b border-gray-200">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={addRow}
                          className="text-[#3B7CED] hover:bg-blue-50 text-sm font-medium h-9 px-4"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Product Line
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </form>
        </main>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-lg z-30">
          <Link href="/inventory/operation">
            <Button variant="outline" type="button" className="border-gray-200 text-gray-600 hover:bg-gray-50 h-9 px-4 text-sm font-medium">
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onValidateGRN)}
            className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-5 text-sm font-medium shadow-2xs transition-all"
          >
            {isSubmitting ? "Validating..." : "Validate"}
          </Button>
        </div>

        <DiscrepancyDialog
          isOpen={discrepancyState.isOpen}
          onClose={() => setDiscrepancyState({ isOpen: false, type: null, ipId: null })}
          type={discrepancyState.type || "backorder"}
          onConfirm={handleCreateBackorder}
          onDecline={handleCloseWithoutBackorder}
        />

        <StatusModal
          isOpen={statusModal.isOpen}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.actionText}
          onAction={statusModal.onAction}
          onClose={statusModal.close}
        />
      </div>
    </PageGuard>
  );
}
