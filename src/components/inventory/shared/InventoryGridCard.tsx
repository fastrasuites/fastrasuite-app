"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryStatusBadge } from "./InventoryStatusBadge";

export interface GridCardRow {
  label: string;
  value: React.ReactNode;
}

export interface InventoryGridItemProps<T> {
  item: T;
  index: number;
  title: string;
  status?: string;
  subtitle?: React.ReactNode;
  rows: GridCardRow[];
  onClick: (item: T) => void;
}

export function InventoryGridCard<T>({
  item,
  index,
  title,
  status,
  subtitle,
  rows,
  onClick,
}: InventoryGridItemProps<T>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={() => onClick(item)}
      className="cursor-pointer group"
    >
      <Card className="border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-blue-200/80 transition-all duration-200 rounded-xl overflow-hidden bg-white h-full flex flex-col justify-between">
        <CardHeader className="p-5 pb-3 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between gap-2">
            {status ? (
              <InventoryStatusBadge status={status} />
            ) : (
              <span />
            )}
            {subtitle && (
              <span className="text-xs text-gray-500">{subtitle}</span>
            )}
          </div>
          <CardTitle className="text-base font-semibold text-[#32325D] mt-2.5 line-clamp-1 group-hover:text-[#3B7CED] transition-colors">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 pt-3.5 text-xs space-y-2.5 flex-1">
          {rows.map((row, idx) => (
            <div key={idx} className="flex justify-between items-center gap-2">
              <span className="text-gray-500 font-medium shrink-0">
                {row.label}:
              </span>
              <div className="text-gray-700 font-medium truncate text-right">
                {row.value}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export interface InventoryGridContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}

export function InventoryGridContainer<T>({
  items,
  renderItem,
  emptyMessage = "No records found matching your query.",
}: InventoryGridContainerProps<T>) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-12 text-center text-[#8898AA] text-sm shadow-2xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-2">
      {items.map((item, idx) => renderItem(item, idx))}
    </div>
  );
}
