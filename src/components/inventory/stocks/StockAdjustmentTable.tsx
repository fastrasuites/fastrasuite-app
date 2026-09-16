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
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="min-w-[950px] w-full">
          <TableHeader>
            <TableRow className="bg-[#F6F7F8] border-b border-gray-100">
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap">
                Stock Adjustment ID
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap">
                Adjustment Type
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap">
                Location
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap">
                Product
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap text-right">
                Quantity Adjusted
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap">
                Adjusted Date
              </TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-600 text-sm whitespace-nowrap text-center">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-[#8898AA] text-sm">
                  Loading stock adjustments...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-[#8898AA] text-sm">
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

      <div className="px-6 py-4 flex items-center justify-between text-sm text-[#525F7F] bg-[#F6F9FC] border-t border-gray-100">
        <div>Showing {filtered.length} entries</div>
        <nav aria-label="Pagination">
          <ul className="inline-flex items-center gap-2">
            <li>
              <button disabled className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-400 cursor-not-allowed text-xs">
                Prev
              </button>
            </li>
            <li>
              <button disabled className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-400 cursor-not-allowed text-xs">
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
