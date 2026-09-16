"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { StockMove } from "@/types/stockMove";
import Link from "next/link";

interface StockMoveRowProps {
  move: StockMove;
}

export function StockMoveRow({ move }: StockMoveRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/inventory/stocks/stock-moves/${move.id}`);
  };

  const qty = Number(move.quantity) || 0;
  const isOutgoing = 
    move.move_type === "CONSUMPTION" || 
    move.move_type === "Consumption" || 
    move.move_type === "SCRAP" || 
    move.move_type === "Scrap" || 
    move.move_type === "OUTGOING" ||
    qty < 0;

  return (
    <TableRow
      onClick={handleRowClick}
      className="hover:bg-blue-50/40 border-b border-gray-100 transition-colors cursor-pointer font-open-sans"
    >
      {/* 1. Date */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
        {move.date_moved ? (() => {
          try {
            const date = new Date(move.date_moved);
            return isNaN(date.getTime()) 
              ? move.date_moved 
              : date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                });
          } catch {
            return move.date_moved;
          }
        })() : "N/A"}
      </TableCell>

      {/* 2. Reference */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm font-medium">
        <Link
          href={`/inventory/stocks/stock-moves/${move.id}`}
          className="text-[#3B7CED] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {move.reference || `Move #${move.id}`}
        </Link>
      </TableCell>

      {/* 3. Type */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-center">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            move.move_type === "INCOMING" || move.move_type === "Receipt"
              ? "bg-[#E8F8EE] text-[#1E8E3E]"
              : move.move_type === "CONSUMPTION" || move.move_type === "Consumption"
              ? "bg-[#E8F0FE] text-[#1A73E8]"
              : move.move_type === "SCRAP" || move.move_type === "Scrap"
              ? "bg-[#FCE8E6] text-[#D93025]"
              : "bg-[#FEF7E6] text-[#B06000]"
          }`}
        >
          {move.move_type || "Move"}
        </span>
      </TableCell>

      {/* 4. Product */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
        {move.product_details?.product_name || "Unknown Product"}
      </TableCell>

      {/* 5. Qty In */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-right font-medium text-[#1E8E3E]">
        {!isOutgoing ? Math.abs(qty) : "—"}
      </TableCell>

      {/* 6. Qty Out */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-right font-medium text-[#D93025]">
        {isOutgoing ? Math.abs(qty) : "—"}
      </TableCell>

      {/* 7. Balance */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-right font-medium text-gray-900">
        {move.running_balance !== undefined && move.running_balance !== null ? move.running_balance : "—"}
      </TableCell>

      {/* 8. WBS Phase */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
        {typeof move.wbs_phase === "object" ? (move.wbs_phase as any)?.name || (move.wbs_phase as any)?.id || "—" : move.wbs_phase || "—"}
      </TableCell>

      {/* 9. WBS Activity */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
        {typeof move.wbs_activity === "object" ? (move.wbs_activity as any)?.name || (move.wbs_activity as any)?.id || "—" : move.wbs_activity || "—"}
      </TableCell>

      {/* 10. User */}
      <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
        {move.moved_by_details?.first_name 
          ? `${move.moved_by_details.first_name} ${move.moved_by_details.last_name || ""}`.trim() 
          : "System Admin"}
      </TableCell>
    </TableRow>
  );
}
