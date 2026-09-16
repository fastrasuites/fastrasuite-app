"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TableColumn {
  header: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface InventoryTableContainerProps {
  title?: string;
  columns: TableColumn[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function InventoryTableContainer({
  title,
  columns,
  children,
  emptyMessage = "No records found matching your query.",
  isEmpty = false,
}: InventoryTableContainerProps) {
  return (
    <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden w-full">
      {title && (
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#32325D]">{title}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
              {columns.map((col, idx) => {
                const alignClass =
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left";
                return (
                  <TableHead
                    key={idx}
                    className={`py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap ${alignClass} ${col.className || ""}`}
                  >
                    {col.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </div>

      {isEmpty && (
        <div className="p-12 text-center text-[#8898AA] text-sm">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
