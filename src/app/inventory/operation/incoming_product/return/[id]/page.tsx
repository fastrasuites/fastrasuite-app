"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StatusModal, { useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
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
import { useGetIncomingProductQuery, useCreateIncomingProductMutation } from "@/api/inventory/incomingProductApi";

const returnSchema = z.object({
  reason_for_return: z.string().min(1, "Reason for return is required"),
  notes: z.string().optional(),
});

type ReturnFormData = z.infer<typeof returnSchema>;

interface ReturnItem {
  id: string;
  product_name: string;
  unit: string;
  received_qty: number;
  return_qty: string;
}

export default function ProcessReturnPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: incomingProduct, isLoading, error } = useGetIncomingProductQuery(id, { skip: !id });
  const [createIncomingProduct] = useCreateIncomingProductMutation();

  const [items, setItems] = useState<ReturnItem[]>([]);

  React.useEffect(() => {
    if (incomingProduct && incomingProduct.incoming_product_items) {
      setItems(
        incomingProduct.incoming_product_items.map((it: any) => ({
          id: it.id?.toString() || Date.now().toString() + Math.random(),
          product_name: it.product_details?.product_name || `Product ${it.product}`,
          product: it.product,
          unit: it.product_details?.unit_of_measure_details?.unit_symbol || "Units",
          received_qty: Number(it.quantity_received) || 0,
          return_qty: "0",
        }))
      );
    }
  }, [incomingProduct]);

  const statusModal = useStatusModal();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema) as Resolver<ReturnFormData>,
    defaultValues: {
      reason_for_return: "Damaged packaging discovered during offloading",
      notes: "Please arrange credit note or replacement delivery.",
    },
  });

  const updateReturnQty = (itemId: string, qty: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, return_qty: qty } : it)));
  };

  async function onSubmit(data: ReturnFormData) {
    if (!incomingProduct) return;

    const valid = items.filter((it) => Number(it.return_qty) > 0);
    if (valid.length === 0) {
      statusModal.showError("Validation Error", "Please enter a return quantity greater than 0");
      return;
    }

    for (const item of valid) {
      if (Number(item.return_qty) > item.received_qty) {
        statusModal.showError("Validation Error", `Cannot return more than received quantity (${item.received_qty})`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        receipt_type: "returns",
        supplier: incomingProduct.supplier,
        related_po: incomingProduct.related_po || "",
        source_location: incomingProduct.destination_location,
        destination_location: "",
        notes: data.notes || data.reason_for_return,
        status: "draft", // Assume it goes through validation again
        incoming_product_items: valid.map((it: any) => ({
          product: it.product,
          expected_quantity: it.return_qty,
          quantity_received: it.return_qty,
        })),
      };

      await createIncomingProduct(payload).unwrap();
      
      statusModal.showSuccess(
        "Return Processed",
        "Return processed! Supplier debit note generated and stock deducted.",
        "View GRN",
        () => router.push(`/inventory/operation/incoming_product/${id}`)
      );
    } catch (err: any) {
      statusModal.showError("Failed to Process Return", extractErrorMessage(err, "Failed to process return."));
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <Link href={`/inventory/operation/incoming_product/${id}`}>
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <h1 className="text-lg font-medium text-gray-800">Process Supplier Return for GRN: {id}</h1>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-10">
          <form className="flex flex-col gap-10">
            <section>
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Return Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Reason for Return <span className="text-red-500">*</span></Label>
                  <Input {...register("reason_for_return")} placeholder="Reason..." className="bg-white border-gray-300 rounded" />
                  {errors.reason_for_return && <p className="text-xs text-red-500">{errors.reason_for_return.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 font-medium">Additional Notes / Instructions</Label>
                  <Input {...register("notes")} placeholder="Notes for supplier..." className="bg-white border-gray-300 rounded" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Products to Return</h2>
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <Table className="min-w-[800px] w-full">
                  <TableHeader>
                    <TableRow className="bg-[#F8F9FA] border-b-gray-100">
                      <TableHead className="pl-4">Product Name</TableHead>
                      <TableHead className="text-center">Unit</TableHead>
                      <TableHead className="text-center">Received QTY</TableHead>
                      <TableHead className="text-center pr-4">Return QTY</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id} className="border-b-gray-100 hover:bg-gray-50">
                        <TableCell className="pl-4 font-medium text-gray-800">{it.product_name}</TableCell>
                        <TableCell className="text-center text-xs">{it.unit}</TableCell>
                        <TableCell className="text-center font-medium">{it.received_qty}</TableCell>
                        <TableCell className="text-center pr-4">
                          <Input type="number" value={it.return_qty} onChange={(e) => updateReturnQty(it.id, e.target.value)} className="w-24 mx-auto text-center h-8 text-xs font-bold text-red-600" />
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
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit(onSubmit)} className="bg-[#3B7CED] hover:bg-[#3065c3] text-white">Confirm Supplier Return</Button>
        </div>

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
