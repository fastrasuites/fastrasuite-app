"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Loader2, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/components/shared/types";
import { useStatusModal, StatusModal } from "@/components/shared/StatusModal";
import { useGetIncomingProductQuery } from "@/api/inventory/incomingProductApi";
import { useCreateIncomingProductReturnMutation } from "@/api/inventory/incomingProductReturns";
import Link from "next/link";

type ReturnLine = {
  id: string;
  incoming_product_item: number; // ID of the specific line item
  product: number; // The actual product ID
  product_description: string;
  unit_of_measure: string;
  received_quantity: number;
  return_quantity: number;
};

export default function NewSupplierReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiptId = searchParams?.get("receiptId");

  const [items, setItems] = useState<ReturnLine[]>([]);
  const [reasonForReturn, setReasonForReturn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusModal = useStatusModal();

  const { data: receiptData, isLoading: isReceiptLoading } = useGetIncomingProductQuery(receiptId as string, { skip: !receiptId });
  const [createReturn] = useCreateIncomingProductReturnMutation();

  useEffect(() => {
    if (receiptData?.incoming_product_items) {
      setItems(
        receiptData.incoming_product_items.map((it: any) => ({
          id: it.id.toString(),
          incoming_product_item: it.id,
          product: it.product,
          product_description: it.product_details?.product_name || `Product ${it.product}`,
          unit_of_measure: it.product_details?.unit_of_measure_details?.unit_symbol || "Units",
          received_quantity: it.quantity_received,
          return_quantity: 0,
        }))
      );
    }
  }, [receiptData]);

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    { label: "Supplier Returns", href: "/inventory/operation/supplier_return" },
    { label: "New Return", href: "#", current: true },
  ];

  const updateItem = (id: string, field: keyof ReturnLine, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      statusModal.showError("Validation Error", "You must include at least one product to return.");
      return;
    }

    if (!reasonForReturn.trim()) {
      statusModal.showError("Validation Error", "A reason for return is required.");
      return;
    }

    const linesToReturn = items.filter(it => it.return_quantity > 0);

    if (linesToReturn.length === 0) {
      statusModal.showError("Validation Error", "You must specify a return quantity greater than 0 for at least one product.");
      return;
    }

    const invalidLines = linesToReturn.filter(it => it.return_quantity > it.received_quantity);
    if (invalidLines.length > 0) {
      statusModal.showError("Validation Error", "Return quantity cannot exceed received quantity.");
      return;
    }

    if (!receiptData?.incoming_product_id) {
      statusModal.showError("Validation Error", "Original receipt data is missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const returnItems = linesToReturn.map((it) => ({
        product: it.product,
        quantity_to_return: it.return_quantity.toString(),
      }));
      
      const payload = {
        source_document: receiptData.incoming_product_id,
        reason_for_return: reasonForReturn,
        items: returnItems,
      };

      await createReturn(payload).unwrap();
      
      statusModal.showSuccess(
        "Return Generated",
        "Supplier return document generated successfully.",
        "Go to Supplier Returns",
        () => router.push("/inventory/operation/supplier_return")
      );
    } catch (err: any) {
      statusModal.showError(
        "Return Generation Failed",
        err?.data?.error?.[0]?.cause || "Failed to create return document."
      );
      setIsSubmitting(false);
    }
  };

  if (!receiptId) {
    return (
      <PageGuard module="inventory" entitlement="add_returnincomingproduct">
        <div className="flex flex-col h-screen items-center justify-center bg-[#F6F9FC] gap-4">
          <p className="text-[#525F7F]">No original receipt specified for return.</p>
          <Button variant="outline" onClick={() => router.back()} className="border-gray-200 text-gray-600">Go Back</Button>
        </div>
      </PageGuard>
    );
  }

  if (isReceiptLoading) {
    return (
      <PageGuard module="inventory" entitlement="add_returnincomingproduct">
        <div className="flex h-screen items-center justify-center bg-[#F6F9FC]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B7CED]" />
        </div>
      </PageGuard>
    );
  }

  return (
    <PageGuard module="inventory" entitlement="add_returnincomingproduct">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs items={breadcrumbsItem} />

          <div className="flex items-center">
            <Link href={`/inventory/operation/incoming_product/${encodeURIComponent(receiptId)}`}>
              <Button variant="ghost" size="icon" className="mr-2 hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-[#32325D]">Initiate Supplier Return</h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Original Receipt Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Receipt ID</label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                    {receiptData?.incoming_product_id || "N/A"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Vendor</label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                    {receiptData?.supplier_details?.vendor_name || receiptData?.supplier_details?.company_name || "Unknown"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Related PO</label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                    {receiptData?.related_po || receiptData?.related_ppo_details?.po_number || "N/A"}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-[#3B7CED] text-xl font-medium">Return Lines</h2>
                <p className="text-sm text-gray-500 mt-1">Remove any lines you do not wish to return. Specify the quantity you wish to return.</p>
              </div>
              
              <div className="p-6 pb-2 border-b border-gray-100">
                <label className="text-gray-700 font-medium text-sm block mb-2">Reason for Return (Mandatory) <span className="text-red-500">*</span></label>
                <textarea 
                  value={reasonForReturn}
                  onChange={(e) => setReasonForReturn(e.target.value)}
                  className="w-full min-h-[80px] p-3 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#3B7CED] focus:border-[#3B7CED] outline-none transition-all"
                  placeholder="Provide a detailed reason for returning these items..."
                />
              </div>

              <div className="overflow-x-auto">
                <Table className="min-w-[800px] table-fixed">
                  <TableHeader className="bg-[#F6F7F8]">
                    <TableRow>
                      <TableHead className="w-80 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Product Description
                      </TableHead>
                      <TableHead className="w-24 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Unit
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Received Qty
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Return Qty
                      </TableHead>
                      <TableHead className="w-16 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {items.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center py-8 text-gray-500">No products selected for return.</TableCell>
                       </TableRow>
                    ) : items.map((it) => (
                      <TableRow key={it.id} className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150">
                        <TableCell className="border border-gray-200 px-4 align-middle">
                          <div className="text-sm text-gray-600 line-clamp-2">{it.product_description}</div>
                        </TableCell>
                        <TableCell className="border border-gray-200 px-4 align-middle text-center">
                          <div className="text-sm text-gray-700">{it.unit_of_measure}</div>
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center">
                          <div className="text-sm font-semibold text-gray-700">{it.received_quantity}</div>
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center p-0">
                          <Input
                            type="number"
                            min={0}
                            max={it.received_quantity}
                            value={it.return_quantity || ""}
                            onChange={(e) => updateItem(it.id, "return_quantity", Number(e.target.value))}
                            className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0 bg-red-50/30 text-[#E43D2B] font-medium"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-200 px-4 align-middle text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(it.id)}
                            className="h-8 w-8 text-gray-400 hover:text-[#E43D2B] hover:bg-red-50 mx-auto"
                            title="Remove line from return"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </form>
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-lg z-30">
          <Button variant="outline" type="button" onClick={() => router.back()} className="border-blue-400 text-blue-500 hover:bg-blue-50">
            Cancel
          </Button>
          <PermissionGuard module="inventory" entitlement="add_returnincomingproduct">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white"
            >
              {isSubmitting ? "Validating..." : "Confirm Return"}
            </Button>
          </PermissionGuard>
        </div>

        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.actionText}
          onAction={statusModal.onAction}
          secondaryText={statusModal.secondaryText}
          onSecondary={statusModal.onSecondary}
        />
      </div>
    </PageGuard>
  );
}
