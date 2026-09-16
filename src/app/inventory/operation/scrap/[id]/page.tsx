"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/types/purchase";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetScrapQuery, useGetScrapEditableQuery, useValidateScrapMutation } from "@/api/inventory/scrapApi";
import StatusModal, { extractErrorMessage, useStatusModal } from "@/components/shared/StatusModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ScrapDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const statusModal = useStatusModal();

  const { data: scrapData, isLoading, refetch } = useGetScrapQuery(id, { skip: !id });
  const { data: editableData } = useGetScrapEditableQuery(id, { skip: !id });
  const [validateScrap, { isLoading: isValidating }] = useValidateScrapMutation();

  const handleValidate = async () => {
    try {
      await validateScrap({ id }).unwrap();
      statusModal.showSuccess("Validated", "Scrap record has been validated and inventory updated.");
      refetch();
    } catch (error) {
      statusModal.showError("Validation Failed", extractErrorMessage(error, "Failed to validate scrap."));
    }
  };

  const record = scrapData ? {
    id: scrapData.id,
    cause: (scrapData as any).cause || scrapData.adjustment_type || "N/A",
    project: (scrapData as any).project_details?.name || (scrapData as any).project || "N/A",
    warehouse_location: scrapData.warehouse_location_details?.location_name || scrapData.warehouse_location,
    date: (scrapData as any).date_created ? new Date((scrapData as any).date_created).toLocaleDateString() : "N/A",
    status: scrapData.status?.toLowerCase(),
    notes: scrapData.notes || "—",
    recorded_by: (scrapData as any).recorded_by_details?.user?.first_name || (scrapData as any).created_by || "System",
    items: (scrapData as any).items || scrapData.scrap_items || [],
  } : null;

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    { label: "Scrap Recording", href: "/inventory/operation/scrap" },
    { label: `Scrap ${id}`, href: `/inventory/operation/scrap/${id}`, current: true },
  ];

  return (
    <PageGuard module="inventory" entitlement="view_scrap">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20"
      >
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

          {isLoading && (
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-7 bg-gray-200 rounded w-64 animate-pulse" />
                <Skeleton className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                    <Skeleton className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && record && (
            <>
          {/* Top Bar Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#FCE8E6] text-[#E43D2B]">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-[#32325D]">
                    Scrap Record Details: {record.id}
                  </h1>
                  <span
                    className={`inline-block px-3 py-1 text-xs rounded-full font-semibold capitalize ${
                      record.status === "done" || record.status === "validated"
                        ? "bg-[#E2F2E9] text-[#2BA24D]"
                        : "bg-[#E8F0FE] text-[#1A73E8]"
                    }`}
                  >
                    {record.status === "done" || record.status === "validated" ? "Validated" : record.status}
                  </span>
                </div>
                <p className="text-xs text-[#8898AA] mt-1">
                  Recorded on {record.date} by <strong className="text-[#32325D]">{record.recorded_by}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {record.status === "draft" && (
                <>
                  <PermissionGuard module="inventory" entitlement="change_scrap">
                    <Button 
                      onClick={handleValidate} 
                      disabled={isValidating}
                      className="bg-[#2BA24D] hover:bg-[#238a40] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all"
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> {isValidating ? "Validating..." : "Validate"}
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard module="inventory" entitlement="change_scrap">
                    <Link href={`/inventory/operation/scrap/edit/${id}`}>
                      <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all">
                        <Edit className="w-4 h-4 mr-1.5" /> Edit Draft
                      </Button>
                    </Link>
                  </PermissionGuard>
                </>
              )}
            </div>
          </div>

          {/* Summary Metadata Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
              Scrap Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                  Record ID
                </span>
                <span className="text-[#32325D] font-semibold text-sm">
                  {record.id}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                  Cause of Loss
                </span>
                <span className="text-[#E43D2B] font-semibold text-sm">
                  {record.cause}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                  Project
                </span>
                <span className="text-[#32325D] font-semibold text-sm">
                  {record.project}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                  Location
                </span>
                <span className="text-[#32325D] font-semibold text-sm">
                  {record.warehouse_location}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                  Date Recorded
                </span>
                <span className="text-[#32325D] font-semibold text-sm">
                  {record.date}
                </span>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 border-t border-gray-100 pt-4">
                <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                  Notes
                </span>
                <span className="text-[#525F7F] font-normal text-sm">{record.notes}</span>
              </div>
            </div>
          </div>

          {/* Scrapped Product Lines Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">
                Scrapped Product Lines
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                    <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                      Product Name
                    </TableHead>
                    <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap text-center">
                      Unit
                    </TableHead>
                    <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap text-right">
                      Scrapped Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.items.map((item: any, idx: number) => (
                    <TableRow
                      key={item.id || idx}
                      className="hover:bg-gray-50/50 border-b border-[#E9ECEF] transition-colors"
                    >
                      <TableCell className="text-[#32325D] font-semibold text-sm py-3.5 px-6 whitespace-nowrap">
                        {item.product_name || item.product_details?.product_name || `Product #${item.product}`}
                      </TableCell>
                      <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                        {item.product_description || item.product_details?.description || "-"}
                      </TableCell>
                      <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap text-center">
                        {item.unit_symbol || item.unit_of_measure || item.product_details?.unit_of_measure_details?.unit_symbol || "-"}
                      </TableCell>
                      <TableCell className="text-[#E43D2B] font-mono font-bold text-sm py-3.5 px-6 whitespace-nowrap text-right">
                        -{item.quantity || item.scrap_quantity || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          </>
          )}
        </main>

        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onAction={statusModal.close}
        />
      </motion.div>
    </PageGuard>
  );
}
