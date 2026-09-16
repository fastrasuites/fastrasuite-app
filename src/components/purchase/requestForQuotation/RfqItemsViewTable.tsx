"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface RfqItem {
  id: number;
  product_details?: {
    product_name?: string;
    product_description?: string;
  };
  qty: number;
  estimated_unit_price?: string;
  total_price?: string;
}

export interface RfqItemsViewTableProps {
  items: RfqItem[];
  totalPrice?: string;
  className?: string;
}

export function RfqItemsViewTable({
  items,
  totalPrice,
  className = "",
}: RfqItemsViewTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items found in this RFQ.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table className="min-w-[800px] w-full">
        <TableHeader className="bg-[#F6F7F8]">
          <TableRow>
            <TableHead className="border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
              Product
            </TableHead>
            <TableHead className="border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
              Description
            </TableHead>
            <TableHead className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
              QTY
            </TableHead>
            <TableHead className="border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
              Estimated Unit Price
            </TableHead>
            <TableHead className="border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
              Total Price
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-[#FBFBFB]">
              <TableCell className="border border-gray-200 px-4 py-3 text-sm text-gray-800">
                {item.product_details?.product_name || "N/A"}
              </TableCell>
              <TableCell className="border border-gray-200 px-4 py-3 text-sm text-gray-600 max-w-2xl truncate h-xl">
                {item.product_details?.product_description || "N/A"}
              </TableCell>
              <TableCell className="border border-gray-200 px-4 py-3 text-sm text-gray-800 text-center">
                {item.qty}
              </TableCell>
              <TableCell className="border border-gray-200 px-4 py-3 text-sm text-gray-800 text-right">
                {item.estimated_unit_price || "0.00"}
              </TableCell>
              <TableCell className="border border-gray-200 px-4 py-3 text-sm text-gray-800 text-right font-medium">
                {item.total_price || "0.00"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableRow className="bg-[#FBFCFD]  border-none">
          <TableCell
            colSpan={3}
            className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
          />
          <TableCell className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-700">
            Total:
          </TableCell>
          <TableCell className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-800">
            {totalPrice || "0.00"}
          </TableCell>
        </TableRow>
      </Table>
    </div>
  );
}
