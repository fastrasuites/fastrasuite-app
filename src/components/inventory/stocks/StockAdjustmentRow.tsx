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
      className="cursor-pointer hover:bg-gray-50/50 border-b border-[#E9ECEF] transition-colors"
      onClick={handleRowClick}
    >


      <TableCell className="py-3.5 px-6 whitespace-nowrap text-sm font-semibold text-[#3B7CED] hover:underline">
        {request.id}
      </TableCell>

      <TableCell className="py-3.5 px-6 whitespace-nowrap text-sm text-[#525F7F]">
        {request.adjustmentType}
      </TableCell>

      <TableCell className="py-3.5 px-6 whitespace-nowrap text-sm text-[#525F7F]">
        {request.location}
      </TableCell>

      <TableCell className="py-3.5 px-6 whitespace-nowrap text-sm font-medium text-[#32325D]">
        {request.product || "—"}
      </TableCell>

      <TableCell className="py-3.5 px-6 whitespace-nowrap text-sm font-mono font-bold text-right">
        {request.quantity !== undefined ? (
          <span className={request.quantity < 0 ? "text-[#E43D2B]" : "text-[#2BA24D]"}>
            {request.quantity > 0 ? `+${request.quantity}` : request.quantity}
          </span>
        ) : (
          "—"
        )}
      </TableCell>

      <TableCell className="py-3.5 px-6 whitespace-nowrap text-sm text-[#525F7F]">
        {request.adjustedDate}
      </TableCell>

      <TableCell className="py-3.5 px-6 whitespace-nowrap text-center">
        <StatusPill status={request.status} />
      </TableCell>
    </TableRow>
  );
}
