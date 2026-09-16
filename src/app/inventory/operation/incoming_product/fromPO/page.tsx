"use client";

import React, { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StatusModal, { useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import { DiscrepancyDialog, type DiscrepancyType } from "@/components/shared/DiscrepancyDialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { z } from "zod";
import { PageGuard } from "@/components/auth/PageGuard";
import { useGetPurchaseOrderQuery } from "@/api/purchase/purchaseOrderApi";
import {
  useCreateIncomingProductMutation,
  useValidateIncomingProductReceiptMutation,
  useCreateIncomingProductBackorderMutation,
} from "@/api/inventory/incomingProductApi";

type Option = { value: string; label: string };

interface GRNLineItem {
  id: string;
  product: string;
  product_name: string;
  product_description: string;
  unit_symbol: string;
  po_quantity: string;
  received_quantity: string;
  accepted_quantity: string;
  rejected_quantity: string;
  reject_reason: string;
}

const grnSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  destination_location: z.string().min(1, "Destination location is required"),
  delivery_note: z.string().min(1, "Delivery note / reference is required"),
  notes: z.string().optional(),
});

type GRNFormData = z.infer<typeof grnSchema>;

const DUMMY_LOCATIONS: Option[] = [
  { value: "WH-MAIN", label: "Main Warehouse - Site A (WH-MAIN)" },
  { value: "WH-SEC", label: "Secondary Store - Site B (WH-SEC)" },
];

const DUMMY_SUPPLIERS: Option[] = [
  { value: "SUP-1", label: "Dangote Cement Plc" },
  { value: "SUP-2", label: "Julius Berger Steel Co." },
];

const DUMMY_PRODUCTS = [
  { id: "1", product_name: "Cement (50kg Bag)", product_description: "Portland Cement Grade 42.5", unit_symbol: "Bags" },
  { id: "2", product_name: "Reinforcement Steel 16mm", product_description: "High Yield Deformed Steel Bars", unit_symbol: "Tonnes" },
  { id: "3", product_name: "Sharp Sand", product_description: "Clean river sharp sand for plastering", unit_symbol: "m³" },
];

export default function CreateIncomingProductFromPOPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poId = searchParams.get("poId") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: purchaseOrder, isLoading, error } = useGetPurchaseOrderQuery(poId, { skip: !poId });
  const [createIncomingProduct] = useCreateIncomingProductMutation();
  const [validateIncomingProduct] = useValidateIncomingProductReceiptMutation();
  const [createIncomingProductBackorder] = useCreateIncomingProductBackorderMutation();

  const [items, setItems] = useState<GRNLineItem[]>([]);

  React.useEffect(() => {
    if (purchaseOrder && purchaseOrder.items) {
      setItems(
        purchaseOrder.items.map((it: any) => ({
          id: it.id?.toString() || Date.now().toString() + Math.random(),
          product: it.product?.toString(),
          product_name: it.product_details?.product_name || `Product ${it.product}`,
          product_description: it.product_details?.product_description || "",
          unit_symbol: it.product_details?.unit_of_measure_details?.unit_symbol || "Units",
          po_quantity: it.qty?.toString() || "0",
          received_quantity: it.qty?.toString() || "0",
          accepted_quantity: it.qty?.toString() || "0",
          rejected_quantity: "0",
          reject_reason: "",
        }))
      );
    }
  }, [purchaseOrder]);

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
        po_quantity: "0",
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
  } = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema) as Resolver<GRNFormData>,
    defaultValues: {
      supplier: "",
      destination_location: "",
      delivery_note: "",
      notes: `Received against Purchase Order ${poId}`,
    },
  });

  React.useEffect(() => {
    if (purchaseOrder) {
      if (purchaseOrder.vendor) setValue("supplier", purchaseOrder.vendor.toString());
      if (purchaseOrder.destination_location) setValue("destination_location", purchaseOrder.destination_location.toString());
    }
  }, [purchaseOrder, setValue]);

  const productOptions: Option[] = DUMMY_PRODUCTS.map((p) => ({
    value: p.id,
    label: p.product_name,
  }));

  const updateItemProduct = (itemId: string, productId: string) => {
    const p = DUMMY_PRODUCTS.find((item) => item.id === productId);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              product: productId,
              product_name: p?.product_name || "",
              product_description: p?.product_description || "",
              unit_symbol: p?.unit_symbol || "",
            }
          : it
      )
    );
  };

  const updateItemQty = (
    itemId: string,
    field: "received_quantity" | "accepted_quantity" | "rejected_quantity",
    val: string
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const updated = { ...it, [field]: val };
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

  async function onSaveDraft(data: GRNFormData) {
    const validItems = items.filter((it) => it.product && Number(it.received_quantity) > 0);
    if (validItems.length === 0) {
      statusModal.showError("Validation Error", "Please enter at least one valid product line with received quantity > 0");
      return;
    }

    for (const it of validItems) {
      const exp = Number(it.po_quantity) || 0;
      const rec = Number(it.received_quantity) || 0;
      if (exp > 0 && rec > exp) {
        statusModal.showError(
          "Validation Error",
          `Quantity received (${rec}) cannot exceed the expected quantity (${exp}) for "${it.product_name || 'selected item'}".`
        );
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        receipt_type: "vendor_receipt",
        supplier: Number(data.supplier),
        related_po: poId,
        source_location: "",
        destination_location: data.destination_location,
        notes: data.notes || data.delivery_note,
        status: "draft",
        incoming_product_items: validItems.map((it) => ({
          product: Number(it.product),
          expected_quantity: it.po_quantity,
          quantity_received: it.received_quantity,
        })),
      };

      await createIncomingProduct(payload).unwrap();
      
      statusModal.showSuccess(
        "Draft Saved",
        "Goods Receipt Note (GRN) draft saved successfully!",
        "Go to Operations",
        () => router.push("/inventory/operation")
      );
    } catch (err: any) {
      statusModal.showError("Failed to Save Draft", extractErrorMessage(err, "Failed to save draft."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onValidateGRN(data: GRNFormData) {
    let createdProductId: string | null = null;
    const validItems = items.filter((it) => it.product && Number(it.received_quantity) > 0);
    if (validItems.length === 0) {
      statusModal.showError("Validation Error", "Please enter at least one valid product line with received quantity > 0");
      return;
    }

    for (const it of validItems) {
      const exp = Number(it.po_quantity) || 0;
      const rec = Number(it.received_quantity) || 0;
      if (exp > 0 && rec > exp) {
        statusModal.showError(
          "Validation Error",
          `Quantity received (${rec}) cannot exceed the expected quantity (${exp}) for "${it.product_name || 'selected item'}".`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        receipt_type: "vendor_receipt",
        supplier: Number(data.supplier),
        related_po: poId,
        source_location: "",
        destination_location: data.destination_location,
        notes: data.notes || data.delivery_note,
        status: "draft",
        incoming_product_items: validItems.map((it) => ({
          product: Number(it.product),
          expected_quantity: it.po_quantity,
          quantity_received: it.received_quantity,
        })),
      };

      const res = await createIncomingProduct(payload).unwrap();
      const productId = res?.incoming_product_id || res?.id;
      
      if (productId) {
        createdProductId = productId.toString();
        await validateIncomingProduct({ id: createdProductId }).unwrap();
        statusModal.showSuccess(
          "GRN Validated",
          "Warehouse inventory stock and project costing ledger updated.",
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
        statusModal.showError("Validation Failed", extractErrorMessage(error, "Failed to validate GRN."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCreateBackorder = async () => {
    if (!discrepancyState.ipId) return;
    setIsSubmitting(true);
    try {
      await validateIncomingProduct({ id: discrepancyState.ipId, data: { create_backorder: true } }).unwrap();
      setDiscrepancyState({ isOpen: false, type: null, ipId: null });
      statusModal.showSuccess(
        "Backorder Created",
        "GRN Validated & Backorder created for remaining balance!",
        "Go to Operations",
        () => router.push("/inventory/operation")
      );
    } catch (error: any) {
      statusModal.showError("Action Failed", extractErrorMessage(error, "Failed to create backorder."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseWithoutBackorder = async () => {
    if (!discrepancyState.ipId) return;
    setIsSubmitting(true);
    try {
      await validateIncomingProduct({ id: discrepancyState.ipId, data: { create_backorder: false } }).unwrap();
      setDiscrepancyState({ isOpen: false, type: null, ipId: null });
      statusModal.showSuccess(
        "Delivery Closed",
        "GRN Validated! PO closed without backorder.",
        "Go to Operations",
        () => router.push("/inventory/operation")
      );
    } catch (error: any) {
      statusModal.showError("Action Failed", extractErrorMessage(error, "Failed to close delivery."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageGuard application="inventory" module="incomingproduct">
        <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B7CED]" />
        </div>
      </PageGuard>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <PageGuard application="inventory" module="incomingproduct">
        <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white items-center justify-center gap-4">
          <p className="text-[#525F7F]">Failed to load Purchase Order or it was not found.</p>
          <Link href="/inventory/operation">
            <Button variant="outline" className="border-gray-200 text-gray-600">Back to Operations</Button>
          </Link>
        </div>
      </PageGuard>
    );
  }

  return (
    <PageGuard application="inventory" module="incomingproduct">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white relative pb-20">
        <div className="flex items-center px-6 py-4 border-b border-gray-100">
          <Link href="/inventory/operation">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium text-gray-800">Record Goods Receipt Note (GRN) from PO: {poId}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Inspect arriving deliveries against PO quantities and record accepted stock.</p>
          </div>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-10">
          <form className="flex flex-col gap-10">
            <section>
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Delivery Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Related PO</Label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    {poId}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Vendor</Label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    {purchaseOrder?.vendor_details?.company_name || "N/A"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Destination Store</Label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    {purchaseOrder?.destination_location_details?.location_name || purchaseOrder?.destination_location || "N/A"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Delivery Note / Ref <span className="text-red-500">*</span></Label>
                  <Input {...register("delivery_note")} placeholder="e.g. DN-89201" className="bg-white border-gray-300 rounded" />
                  {errors.delivery_note && <p className="text-xs text-red-500">{errors.delivery_note.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Inspection Notes</Label>
                  <Input {...register("notes")} placeholder="Condition of goods, driver info..." className="bg-white border-gray-300 rounded" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Product Quality Inspection & Quantity Tracking</h2>
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
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
                        Expected Quantity (PO)
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
                              {productOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
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
                        <TableCell className="border border-gray-200 align-middle text-center">
                          <div className="text-sm font-semibold text-gray-700">
                            {it.po_quantity}
                          </div>
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
            </section>
          </form>
        </div>

        {/* Sticky Footer Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <Link href="/inventory/operation">
            <Button variant="outline" type="button" className="border-blue-400 text-blue-500 hover:bg-blue-50">
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onValidateGRN)}
            className="bg-[#3B7CED] hover:bg-[#3065c3] text-white"
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
