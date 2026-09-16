"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StatusModal, { useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import { DiscrepancyDialog, type DiscrepancyType } from "@/components/shared/DiscrepancyDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { z } from "zod";
import { PageGuard } from "@/components/auth/PageGuard";
import {
  useGetIncomingProductQuery,
  useUpdateIncomingProductMutation,
  useValidateIncomingProductReceiptMutation,
  useCreateIncomingProductBackorderMutation,
} from "@/api/inventory/incomingProductApi";

interface GRNLineItem {
  id: string;
  product: string;
  product_description: string;
  unit_of_measure: string;
  expected_quantity: string;
  received_quantity: string;
}

const grnSchema = z.object({
  notes: z.string().optional(),
});

type GRNFormData = z.infer<typeof grnSchema>;

const DUMMY_PRODUCTS = [
  { id: "1", product_name: "Iron Rods 12mm", unit_symbol: "Tonnes" },
];

export default function EditIncomingProductPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: incomingProduct, isLoading, error } = useGetIncomingProductQuery(id, { skip: !id });
  const [updateIncomingProduct] = useUpdateIncomingProductMutation();
  const [validateIncomingProduct] = useValidateIncomingProductReceiptMutation();
  const [createIncomingProductBackorder] = useCreateIncomingProductBackorderMutation();

  const [items, setItems] = useState<GRNLineItem[]>([]);

  React.useEffect(() => {
    if (incomingProduct && incomingProduct.incoming_product_items) {
      setItems(
        incomingProduct.incoming_product_items.map((it: any) => ({
          id: it.id?.toString() || "",
          product: it.product?.toString(),
          product_description: it.product_details?.product_name || `Product ${it.product}`,
          unit_of_measure: it.product_details?.unit_of_measure_details?.unit_symbol || "Units",
          expected_quantity: it.expected_quantity,
          received_quantity: it.quantity_received,
        }))
      );
    }
  }, [incomingProduct]);

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema) as Resolver<GRNFormData>,
    defaultValues: {
      notes: "Delivery note details...",
    },
  });

  const updateItemQty = (itemId: string, val: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return { ...it, received_quantity: val };
      })
    );
  };

  async function onSave(data: GRNFormData): Promise<void> {
    if (!incomingProduct) return;
    setIsSubmitting(true);
    try {
      await updateIncomingProduct({
        id,
        data: {
          incoming_product_items: items.map((it) => ({
            id: it.id,
            product: Number(it.product),
            expected_quantity: it.expected_quantity,
            quantity_received: it.received_quantity,
          })),
        },
      }).unwrap();
      
      statusModal.showSuccess(
        "Draft Updated",
        "GRN Draft updated successfully!",
        "Go to Operations",
        () => router.push("/inventory/operation")
      );
    } catch (err: any) {
      statusModal.showError(
        "Update Failed",
        extractErrorMessage(err, "Failed to update draft.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onValidate(data: GRNFormData): Promise<void> {
    if (!incomingProduct) return;
    setIsSubmitting(true);
    try {
      await updateIncomingProduct({
        id,
        data: {
          incoming_product_items: items.map((it) => ({
            id: it.id,
            product: Number(it.product),
            expected_quantity: it.expected_quantity,
            quantity_received: it.received_quantity,
          })),
        },
      }).unwrap();

      await validateIncomingProduct({ id }).unwrap();
      statusModal.showSuccess(
        "GRN Validated",
        "Stock received into Inventory Ledger.",
        "View GRN",
        () => router.push(`/inventory/operation/incoming_product/${encodeURIComponent(decodeURIComponent(id))}`)
      );
    } catch (err: any) {
      const isBackorderError = err?.data?.requires_backorder_confirmation || 
                               err?.data?.error?.[0]?.error === "Short quantity detected. Please confirm backorder creation." ||
                               err?.data?.error?.[0]?.requires_backorder_confirmation === true;
      
      if (isBackorderError) {
        statusModal.close();
        setDiscrepancyState({ isOpen: true, type: "backorder", ipId: id });
      } else {
        statusModal.showError(
          "Validation Failed",
          extractErrorMessage(err, "Failed to validate GRN.")
        );
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
        "GRN Validated & Backorder created for remaining pending balance!",
        "View GRN",
        () => router.push(`/inventory/operation/incoming_product/${encodeURIComponent(decodeURIComponent(id))}`)
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
    try {
      await validateIncomingProduct({ id: discrepancyState.ipId, data: { create_backorder: false } }).unwrap();
      setDiscrepancyState({ isOpen: false, type: null, ipId: null });
      statusModal.showSuccess(
        "Delivery Closed",
        "GRN Validated! Delivery closed without backorder.",
        "View GRN",
        () => router.push(`/inventory/operation/incoming_product/${encodeURIComponent(decodeURIComponent(id))}`)
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

  if (isLoading) {
    return (
      <PageGuard application="inventory" module="incomingproduct">
        <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B7CED]" />
        </div>
      </PageGuard>
    );
  }

  if (error || !incomingProduct) {
    return (
      <PageGuard application="inventory" module="incomingproduct">
        <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white items-center justify-center gap-4">
          <p className="text-[#525F7F]">Failed to load GRN or it was not found.</p>
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
          <Link href={`/inventory/operation/incoming_product/${encodeURIComponent(decodeURIComponent(id))}`}>
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <h1 className="text-lg font-medium text-gray-800">Confirm Quantities for Draft: {id}</h1>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-10">
          <form className="flex flex-col gap-10">
            <section>
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Receipt Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Related PO</Label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    {incomingProduct?.related_po || incomingProduct?.related_ppo_details?.po_number || "N/A"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Vendor</Label>
                  {/* Pre-filled from PO - not editable */}
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    {incomingProduct?.supplier_details?.vendor_name || incomingProduct?.supplier_details?.company_name || "N/A"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Destination Location</Label>
                  {/* Auto-filled with stockkeeper's assigned location - not editable */}
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    {incomingProduct?.destination_location_details?.location_name || incomingProduct?.destination_location || "N/A"}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Product Lines</h2>
              <div className="overflow-x-auto">
                <Table className="min-w-[1100px] table-fixed">
                  <TableHeader className="bg-[#F6F7F8]">
                    <TableRow>
                      <TableHead className="w-80 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Product
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
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {items.map((it) => (
                      <TableRow key={it.id} className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150">
                        <TableCell className="border border-gray-200 px-4 align-middle">
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {it.product_description}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 px-4 align-middle text-center">
                          <div className="text-sm text-gray-700">
                            {it.unit_of_measure}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center">
                          <div className="text-sm font-semibold text-gray-700">
                            {it.expected_quantity}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center p-0">
                          <Input
                            type="number"
                            value={it.received_quantity}
                            onChange={(e) => updateItemQty(it.id, e.target.value)}
                            className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0 bg-blue-50/30 text-[#3B7CED] font-medium"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </form>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <Link href={`/inventory/operation/incoming_product/${id}`}>
            <Button variant="outline" type="button" className="border-blue-400 text-blue-500 hover:bg-blue-50">Cancel</Button>
          </Link>
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit(onValidate)} className="bg-[#3B7CED] hover:bg-[#3065c3] text-white">Validate</Button>
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
