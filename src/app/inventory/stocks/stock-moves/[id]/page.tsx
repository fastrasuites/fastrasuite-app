"use client";

import React from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import Link from "next/link";
import { BreadcrumbItem } from "@/components/shared/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InventoryPageShell,
  InventoryDetailTopBar,
  InventorySummaryCard,
  SummaryCardItem,
} from "@/components/inventory/shared";
import { useGetStockMoveQuery } from "@/api/inventory/stockMoveApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockMoveDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const { data: moveData, isLoading, isError } = useGetStockMoveQuery(id, {
    skip: !id,
  });

  const qty = Number(moveData?.quantity) || 0;
  const isPositive = qty >= 0;

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },

    { label: "Inventory Ledger", href: "/inventory/stocks/stock-moves" },
    { label: `Move ${id}`, href: `/inventory/stocks/stock-moves/${id}`, current: true },
  ];

  const getSourceDocumentUrl = (move: any) => {
    const type = String(move.source_document_type || move.move_type || "").toLowerCase();
    const id = move.source_document_id || move.id;

    if (move.source_document_id) {
      if (type.includes("consumption")) {
        return `/inventory/operation/material-consumption/${move.source_document_id}`;
      }
      if (type.includes("receipt") || type.includes("incoming")) {
        return `/inventory/operation/incoming_product/${move.source_document_id}`;
      }
      if (type.includes("scrap")) {
        return `/inventory/operation/scrap/${move.source_document_id}`;
      }
      if (type.includes("adjustment")) {
        return `/inventory/stocks/adjustment/${move.source_document_id}`;
      }
      if (type.includes("return") || type.includes("supplier")) {
        return `/inventory/operation/supplier_return/${move.source_document_id}`;
      }
    }
    return null;
  };

  const summaryItems: SummaryCardItem[] = React.useMemo(() => {
    if (!moveData) return [];

    const sourceDocUrl = getSourceDocumentUrl(moveData);

    const items: SummaryCardItem[] = [
      { label: "Move ID", value: String(moveData.id) },
      { label: "Transaction Type", value: moveData.move_type || "Move" },
      {
        label: "Reference Document",
        value: sourceDocUrl ? (
          <Link href={sourceDocUrl} className="text-[#3B7CED] hover:underline font-semibold">
            {moveData.reference || "N/A"}
          </Link>
        ) : (
          <span className="text-[#3B7CED] font-semibold">{moveData.reference || "N/A"}</span>
        ),
      },
      { label: "Recorded By User", value: moveData.moved_by_details?.first_name ? `${moveData.moved_by_details.first_name} ${moveData.moved_by_details.last_name || ''}` : "System Admin" },
      { label: "Source Location", value: moveData.source_location_details?.location_name || "External/Unknown" },
      { label: "Destination Store", value: moveData.destination_location_details?.location_name || "External/Unknown" },
    ];

    if (moveData.move_type?.toUpperCase() === "CONSUMPTION" || moveData.wbs_phase || moveData.wbs_activity) {
      items.push(
        { label: "WBS Phase", value: typeof moveData.wbs_phase === "object" ? (moveData.wbs_phase as any)?.name || (moveData.wbs_phase as any)?.id || "—" : moveData.wbs_phase || "—" },
        { label: "WBS Activity", value: typeof moveData.wbs_activity === "object" ? (moveData.wbs_activity as any)?.name || (moveData.wbs_activity as any)?.id || "—" : moveData.wbs_activity || "—" }
      );
    }

    items.push({ label: "Notes", value: moveData.notes || "No notes available", fullWidth: true });
    return items;
  }, [moveData]);

  return (
    <InventoryPageShell
      application="inventory"
      module="stockmove"
      breadcrumbs={breadcrumbsItem}
    >
      {isLoading ? (
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !moveData ? (
        <div className="p-8 text-center text-red-500">
          Failed to load stock move details. Please try again.
        </div>
      ) : (
        <>
          <InventoryDetailTopBar
            title="Stock Move Details"
            id={String(moveData.id)}
            icon={<FileText className="w-6 h-6" />}
            status={moveData.move_type || "Move"}
            subtitle={
              <>
                Recorded on {moveData.date_moved ? (() => {
                  try {
                    const date = new Date(moveData.date_moved);
                    return isNaN(date.getTime()) 
                      ? moveData.date_moved 
                      : date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        });
                  } catch {
                    return moveData.date_moved;
                  }
                })() : "N/A"} • Source Document:{" "}
                <strong className="text-[#3B7CED]">{moveData.reference || "N/A"}</strong>
              </>
            }
          />

          <InventorySummaryCard
            title="Move Information"
            items={summaryItems}
          />

      <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden font-['Open_Sans',sans-serif]">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#32325D] font-['Open_Sans',sans-serif]">
            Transacted Product Line & Valuation
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full font-['Open_Sans',sans-serif]">
            <TableHeader>
              <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100 font-['Open_Sans',sans-serif]">
                <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap font-['Open_Sans',sans-serif]">
                  Product Name
                </TableHead>
                <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap font-['Open_Sans',sans-serif]">
                  Description
                </TableHead>
                <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap text-center font-['Open_Sans',sans-serif]">
                  Unit
                </TableHead>
                <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap text-center font-['Open_Sans',sans-serif]">
                  Quantity Moved
                </TableHead>
                <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap text-right font-['Open_Sans',sans-serif]">
                  Unit Cost (₦)
                </TableHead>
                <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap text-right font-['Open_Sans',sans-serif]">
                  Total Valuation (₦)
                </TableHead>
                <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap text-center font-['Open_Sans',sans-serif]">
                  Running Balance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-gray-50 border-b border-gray-100 transition-colors font-['Open_Sans',sans-serif]">
                <TableCell className="px-6 py-3.5 font-semibold text-sm text-[#32325D] whitespace-nowrap font-['Open_Sans',sans-serif]">
                  {moveData.product_details?.product_name || "Unknown Product"}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-[#525F7F] whitespace-nowrap font-['Open_Sans',sans-serif]">
                  {moveData.product_details?.description || "-"}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-center text-sm font-medium text-[#525F7F] whitespace-nowrap font-['Open_Sans',sans-serif]">
                  {moveData.unit_of_measure_details?.unit_symbol || "-"}
                </TableCell>
                <TableCell
                  className={`px-6 py-3.5 text-center tabular-nums font-bold text-sm whitespace-nowrap font-['Open_Sans',sans-serif] ${
                    isPositive ? "text-[#2BA24D]" : "text-[#E43D2B]"
                  }`}
                >
                  {isPositive ? `+${qty}` : qty}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-right tabular-nums text-sm text-[#525F7F] whitespace-nowrap font-['Open_Sans',sans-serif]">
                  ₦{moveData.unit_cost !== undefined && moveData.unit_cost !== null ? moveData.unit_cost.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-right tabular-nums font-bold text-sm text-[#32325D] whitespace-nowrap font-['Open_Sans',sans-serif]">
                  ₦{moveData.total_value !== undefined && moveData.total_value !== null ? moveData.total_value.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-center tabular-nums font-semibold text-sm text-[#3B7CED] whitespace-nowrap font-['Open_Sans',sans-serif]">
                  {moveData.running_balance !== undefined && moveData.running_balance !== null ? moveData.running_balance.toLocaleString() : "—"} {moveData.unit_of_measure_details?.unit_symbol || ""}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
        </>
      )}
    </InventoryPageShell>
  );
}
