"use client";

import React, { useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockAdjustmentRow as StockAdjustmentRowType } from "../types";
import { StockAdjustmentRow } from "./StockAdjustmentRow";

export function StockAdjustmentTable({
  rows,
  query,
  isLoading,
}: {
  rows: StockAdjustmentRowType[];
  query: string;
  isLoading?: boolean;
}) {
  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.adjustmentType.toLowerCase().includes(query.toLowerCase()) ||
        r.location.toLowerCase().includes(query.toLowerCase()) ||
        r.adjustedDate.toLowerCase().includes(query.toLowerCase()) ||
        (r.product && r.product.toLowerCase().includes(query.toLowerCase()))
    );
  }, [rows, query]);

  return (
    <div className="w-full font-['Open_Sans',sans-serif]">
      <div className="overflow-x-auto">
        <Table className="min-w-[950px] w-full font-['Open_Sans',sans-serif]">
          <TableHeader>
            <TableRow className="bg-[#F6F7F8] border-b border-gray-100 font-['Open_Sans',sans-serif]">
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap font-['Open_Sans',sans-serif]">
                Stock Adjustment ID
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap font-['Open_Sans',sans-serif]">
                Adjustment Type
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap font-['Open_Sans',sans-serif]">
                Location
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap font-['Open_Sans',sans-serif]">
                Product
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap text-right font-['Open_Sans',sans-serif]">
                Quantity Adjusted
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap font-['Open_Sans',sans-serif]">
                Adjusted Date
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap text-center font-['Open_Sans',sans-serif]">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-['Open_Sans',sans-serif]">
            {isLoading ? (
              <TableRow className="font-['Open_Sans',sans-serif]">
                <TableCell colSpan={7} className="py-12 text-center text-[#8898AA] text-sm font-['Open_Sans',sans-serif]">
                  Loading stock adjustments...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="font-['Open_Sans',sans-serif]">
                <TableCell colSpan={7} className="py-12 text-center text-[#8898AA] text-sm font-['Open_Sans',sans-serif]">
                  No stock adjustments found matching your query.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <StockAdjustmentRow
                  key={v.id}
                  request={v}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-6 py-4 flex items-center justify-between text-sm text-[#525F7F] bg-[#F6F9FC] border-t border-gray-100 font-['Open_Sans',sans-serif]">
        <div>Showing {filtered.length} entries</div>
        <nav aria-label="Pagination">
          <ul className="inline-flex items-center gap-2 font-['Open_Sans',sans-serif]">
            <li>
              <button disabled className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-400 cursor-not-allowed text-xs font-['Open_Sans',sans-serif]">
                Prev
              </button>
            </li>
            <li>
              <button disabled className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-400 cursor-not-allowed text-xs font-['Open_Sans',sans-serif]">
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
