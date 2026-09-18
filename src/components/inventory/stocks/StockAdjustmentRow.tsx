"use client";

import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusPill } from "./StatusPill";
import { StockAdjustmentRow as StockAdjustmentRowType } from "../types";

interface StockAdjustmentRowProps {
  request: StockAdjustmentRowType;
}

export function StockAdjustmentRow({
  request,
}: StockAdjustmentRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/inventory/stocks/adjustment/${request.id}`);
  };



  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50/50 border-b border-[#E9ECEF] transition-colors font-['Open_Sans',sans-serif]"
      onClick={handleRowClick}
    >
      <TableCell className="py-3.5 px-4 whitespace-nowrap text-sm font-medium text-[#3B7CED] hover:underline font-['Open_Sans',sans-serif]">
        {request.id}
      </TableCell>

      <TableCell className="py-3.5 px-4 whitespace-nowrap text-sm text-[#525F7F] font-['Open_Sans',sans-serif]">
        {request.adjustmentType}
      </TableCell>

      <TableCell className="py-3.5 px-4 whitespace-nowrap text-sm text-[#525F7F] font-['Open_Sans',sans-serif]">
        {request.location}
      </TableCell>

      <TableCell className="py-3.5 px-4 whitespace-nowrap text-sm font-medium text-[#32325D] font-['Open_Sans',sans-serif]">
        {request.product || "—"}
      </TableCell>

      <TableCell className="py-3.5 px-4 whitespace-nowrap text-sm font-medium text-right font-['Open_Sans',sans-serif]">
        {request.quantity !== undefined ? (
          <span className={request.quantity < 0 ? "text-[#E43D2B]" : "text-[#2BA24D]"}>
            {request.quantity > 0 ? `+${request.quantity}` : request.quantity}
          </span>
        ) : (
          "—"
        )}
      </TableCell>

      <TableCell className="py-3.5 px-4 whitespace-nowrap text-sm text-[#525F7F] font-['Open_Sans',sans-serif]">
        {request.adjustedDate}
      </TableCell>

      <TableCell className="py-3.5 px-4 whitespace-nowrap text-center font-['Open_Sans',sans-serif]">
        <StatusPill status={request.status} />
      </TableCell>
    </TableRow>
  );
}
