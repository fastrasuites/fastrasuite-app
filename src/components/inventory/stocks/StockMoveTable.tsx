"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockMove } from "@/types/stockMove";
import { StockMoveRow } from "./StockMoveRow";

interface StockMoveTableProps {
  moves: StockMove[];
  query?: string;
}

export function StockMoveTable({ moves, query = "" }: StockMoveTableProps) {
  const filtered = React.useMemo(() => {
    if (!query.trim()) return moves;
    const q = query.toLowerCase();
    return moves.filter((move) => {
      const idStr = String(move.id).toLowerCase();
      const prodStr = move.product_details?.product_name
        ? move.product_details.product_name.toLowerCase()
        : "";
      const refStr = move.reference
        ? move.reference.toLowerCase()
        : "";
      return idStr.includes(q) || prodStr.includes(q) || refStr.includes(q);
    });
  }, [moves, query]);

  return (
    <div className="w-full font-open-sans">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px] w-full font-open-sans">
          <TableHeader>
            <TableRow className="bg-[#F8FAFC] border-b border-gray-100 hover:bg-[#F8FAFC]">
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Reference
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">
                Type
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Product
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                In
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                Out
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                Balance
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                WBS Phase
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                WBS Activity
              </TableHead>
              <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                User
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((move) => (
              <StockMoveRow key={move.id} move={move} />
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-500 text-sm font-open-sans">
          No stock move records found matching your query.
        </div>
      )}
    </div>
  );
}
