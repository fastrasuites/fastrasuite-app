"use client";

import React from "react";

export interface SummaryCardItem {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

export interface InventorySummaryCardProps {
  title: string;
  items: SummaryCardItem[];
}

export function InventorySummaryCard({
  title,
  items,
}: InventorySummaryCardProps) {
  const normalItems = items.filter((it) => !it.fullWidth);
  const fullWidthItems = items.filter((it) => it.fullWidth);

  return (
    <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {normalItems.map((item, idx) => (
          <div key={idx}>
            <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
              {item.label}
            </span>
            <div className="text-[#32325D] font-semibold text-sm">
              {item.value || "—"}
            </div>
          </div>
        ))}

        {fullWidthItems.map((item, idx) => (
          <div
            key={`fw-${idx}`}
            className="sm:col-span-2 lg:col-span-4 border-t border-gray-100 pt-4"
          >
            <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
              {item.label}
            </span>
            <div className="text-[#525F7F] font-normal text-sm">
              {item.value || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
