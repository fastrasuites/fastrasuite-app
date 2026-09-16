"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { useGetIncomingProductReturnQuery, useConfirmIncomingProductReturnMutation } from "@/api/inventory/incomingProductReturns";
import { Loader2 } from "lucide-react";

export default function SupplierReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [confirmReturn, { isLoading: isValidating }] = useConfirmIncomingProductReturnMutation();
  const statusModal = useStatusModal();

  const decodedId = decodeURIComponent(id);
  const { data: returnData, isLoading, refetch } = useGetIncomingProductReturnQuery(decodedId);

  const isDraft = (returnData?.status || "draft").toLowerCase() === "draft";

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    { label: "Supplier Returns", href: "/inventory/operation/supplier_return" },
    { label: decodedId, href: "#", current: true },
  ];

  const handleValidate = async () => {
    try {
      await confirmReturn(decodedId).unwrap();
      refetch();
      statusModal.showSuccess(
        "Return Validated",
        "Supplier return validated and stock deducted successfully.",
        "Go to Supplier Returns",
        () => router.push("/inventory/operation/supplier_return")
      );
    } catch (error: any) {
      statusModal.showError(
        "Validation Failed",
        error?.data?.detail || error?.data?.message || "Failed to validate supplier return."
      );
    }
  };

  if (isLoading) {
    return (
      <PageGuard module="inventory" entitlement="view_returnincomingproduct">
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#F6F9FC]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B7CED]" />
        </div>
      </PageGuard>
    );
  }

  if (!returnData) {
    return (
      <PageGuard module="inventory" entitlement="view_returnincomingproduct">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#F6F9FC] gap-4">
          <p className="text-gray-500">Return record not found.</p>
          <Button onClick={() => router.push("/inventory/operation/supplier_return")} variant="outline">Back to List</Button>
        </div>
      </PageGuard>
    );
  }

  return (
    <PageGuard module="inventory" entitlement="view_returnincomingproduct">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Breadcrumbs items={breadcrumbsItem} />
            <div className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${isDraft ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#E2F2E9] text-[#2BA24D]'}`}>
              {isDraft ? 'Draft' : 'Validated'}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Return Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Return ID</label>
                  <div className="text-sm font-semibold text-gray-800">{returnData.unique_id || id}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Receipt ID</label>
                  <div className="text-sm font-semibold text-[#3B7CED]">{returnData.source_document || "N/A"}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Vendor</label>
                  <div className="text-sm font-semibold text-gray-800">{returnData.vendor || (returnData as any).source_document_details?.supplier_name || "N/A"}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Date</label>
                  <div className="text-sm text-gray-800">{returnData.returned_date ? new Date(returnData.returned_date).toLocaleDateString() : "N/A"}</div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-[#3B7CED] text-xl font-medium">Returned Lines</h2>
              </div>
              
              <div className="overflow-x-auto">
                <Table className="min-w-[1100px] table-fixed">
                  <TableHeader className="bg-[#F6F7F8]">
                    <TableRow>
                      <TableHead className="w-80 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Product Description
                      </TableHead>
                      <TableHead className="w-24 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Unit
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Return Qty
                      </TableHead>
                      <TableHead className="w-64 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Reason for Return
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {returnData.items && returnData.items.length > 0 ? (
                      returnData.items.map((item, index) => (
                        <TableRow key={item.id || index} className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150">
                          <TableCell className="border border-gray-200 px-4 align-middle">
                            <div className="text-sm text-gray-800 font-medium line-clamp-2">{item.product_details?.product_name || "Unknown Product"}</div>
                          </TableCell>
                          <TableCell className="border border-gray-200 px-4 align-middle text-center">
                            <div className="text-sm text-gray-700">{item.unit_of_measure_details?.unit_name || "Units"}</div>
                          </TableCell>
                          <TableCell className="border border-gray-200 align-middle text-center">
                            <div className="text-sm font-bold text-[#E43D2B]">{item.quantity_to_return || 0}</div>
                          </TableCell>
                          <TableCell className="border border-gray-200 px-4 align-middle">
                            <div className="text-sm text-gray-700">{returnData.reason_for_return || "N/A"}</div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                          No return lines found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-lg z-30">
          <Button variant="outline" type="button" onClick={() => router.back()} className="border-blue-400 text-blue-500 hover:bg-blue-50">
            {isDraft ? "Cancel" : "Back"}
          </Button>
          {isDraft && (
            <PermissionGuard module="inventory" entitlement="change_returnincomingproduct">
              <Button
                type="button"
                disabled={isValidating}
                onClick={handleValidate}
                className="bg-[#3B7CED] hover:bg-[#3065c3] text-white"
              >
                {isValidating ? "Validating..." : "Validate Return"}
              </Button>
            </PermissionGuard>
          )}
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
