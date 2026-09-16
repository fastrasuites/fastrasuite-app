"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, CheckCircle } from "lucide-react";
import Link from "next/link";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useGetStockAdjustmentQuery, useValidateStockAdjustmentMutation } from "@/api/inventory/stockAdjustmentApi";
import StatusModal, { useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StockAdjustmentDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const { data: adjData, isLoading, error, refetch } = useGetStockAdjustmentQuery(id, { skip: !id });
  const [validateAdj, { isLoading: isValidating }] = useValidateStockAdjustmentMutation();
  const statusModal = useStatusModal();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const handleValidate = async () => {
    try {
      await validateAdj({ id }).unwrap();
      await refetch();
      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: "Stock adjustment validated & inventory ledger updated successfully.",
      });
    } catch (error: any) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message: extractErrorMessage(error, "Failed to validate stock adjustment."),
      });
    }
  };

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const record = adjData ? {
    id: adjData.id,
    adjustment_type: adjData.adjustment_type || "Stock Level Update",
    warehouse_location: adjData.warehouse_location_details?.location_name || adjData.warehouse_location,
    date: (adjData as any).date_created ? new Date((adjData as any).date_created).toLocaleDateString() : "N/A",
    status: (adjData.status || "DRAFT").toLowerCase(),
    notes: adjData.notes || adjData.reason || "—",
    created_by: (adjData as any).warehouse_location_details?.location_manager_details?.user?.first_name || (adjData as any).created_by || "System",
    items: adjData.stock_adjustment_items || [],
  } : null;

  return (
    <PageGuard module="inventory" entitlement="view_stockadjustment">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        {/* Clean Header Card */}
        {isLoading && <div className="p-6 text-center text-gray-500">Loading record details...</div>}
        {!isLoading && error && (
          <div className="p-6 text-center text-red-500">
            <h3 className="text-lg font-bold">Failed to load record</h3>
            <p className="mt-2 text-sm">{(error as any)?.data?.detail || JSON.stringify(error)}</p>
          </div>
        )}
        {!isLoading && !error && !record && (
          <div className="p-6 text-center text-gray-500">Record not found.</div>
        )}
        
        {!isLoading && !error && record && (
          <>
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href="/inventory/stocks/adjustment">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#32325D]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-semibold text-[#32325D]">Stock Adjustment: {record.id}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-md font-semibold ${record.status === "done" || record.status === "validated" ? "bg-green-50 text-green-700 border border-green-200/60" : "bg-blue-50 text-blue-700 border border-blue-200/60"}`}>
                  {record.status === "done" || record.status === "validated" ? "Validated" : "Draft"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
              {record.status === "draft" && (
                <>
                  <PermissionGuard module="inventory" entitlement="change_stockadjustment">
                    <Button 
                      onClick={handleValidate} 
                      disabled={isValidating}
                      className="bg-[#2BA24D] hover:bg-[#238a40] text-white text-sm font-semibold h-9 px-4 shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> {isValidating ? "Validating..." : "Validate"}
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard module="inventory" entitlement="change_stockadjustment">
                    <Link href={`/inventory/stocks/adjustment/edit/${id}`}>
                      <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white text-sm font-semibold h-9 px-4 shadow-2xs">
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Draft
                      </Button>
                    </Link>
                  </PermissionGuard>
                </>
              )}
          </div>
        </div>

        {/* Details Content */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          
          {/* White Container Card 1: General Information */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">General Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <span className="text-xs font-semibold text-[#8898AA] block mb-1">Adjustment ID</span>
                <span className="text-sm font-semibold text-[#32325D]">{record.id}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#8898AA] block mb-1">Adjustment Type</span>
                <span className="text-sm font-semibold text-[#32325D]">{record.adjustment_type}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#8898AA] block mb-1">Location</span>
                <span className="text-sm font-semibold text-[#32325D]">{record.warehouse_location}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#8898AA] block mb-1">Date</span>
                <span className="text-sm font-semibold text-[#32325D]">{record.date}</span>
              </div>
              <div className="md:col-span-4 border-t border-gray-100 pt-4 mt-2">
                <span className="text-xs font-semibold text-[#8898AA] block mb-1">Notes</span>
                <span className="text-sm text-[#525F7F]">{record.notes}</span>
              </div>
            </div>
          </div>

          {/* White Container Card 2: Adjusted Product Lines */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">Adjusted Product Lines</h2>
            </div>
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[900px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap w-64">Product Name</TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">Description</TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center w-24">Unit</TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center w-36">Previous Quantity</TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center w-36">New Quantity</TableHead>
                    <TableHead className="py-3.5 pr-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-right w-32">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.items.map((item: any, idx: number) => {
                    const currentQuantity = Number(item.current_quantity) || 0;
                    const adjustedQuantity = Number(item.new_quantity) || 0;
                    const variance = adjustedQuantity - currentQuantity;
                    
                    return (
                      <TableRow key={item.id || idx} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                        <TableCell className="px-6 py-3.5 font-semibold text-sm text-[#32325D]">{item.product_details?.product_name || `Product #${item.product}`}</TableCell>
                        <TableCell className="px-6 py-3.5 text-sm text-[#525F7F]">{item.product_details?.description || "-"}</TableCell>
                        <TableCell className="px-6 py-3.5 text-center text-sm font-medium text-[#525F7F]">{item.unit_of_measure?.unit_symbol || (typeof item.unit_of_measure === "string" ? item.unit_of_measure : null) || item.product_details?.unit_of_measure_details?.unit_symbol || "-"}</TableCell>
                        <TableCell className="px-6 py-3.5 text-center font-mono font-semibold text-sm text-[#32325D]">{currentQuantity}</TableCell>
                        <TableCell className="px-6 py-3.5 text-center font-mono font-bold text-sm text-[#3B7CED]">{adjustedQuantity}</TableCell>
                        <TableCell className={`pr-6 py-3.5 text-right font-mono font-bold text-sm ${variance < 0 ? "text-[#E43D2B]" : variance > 0 ? "text-[#2BA24D]" : "text-[#525F7F]"}`}>
                          {variance > 0 ? `+${variance}` : variance}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

        </main>
        </>
        )}

        <StatusModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          onAction={handleModalClose}
        />
      </div>
    </PageGuard>
  );
}
