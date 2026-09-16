"use client";

import React from "react";

export interface InventoryFormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  gridCols?: 1 | 2 | 3 | 4;
}

export function InventoryFormSection({
  title,
  children,
  className = "",
  gridCols = 4,
}: InventoryFormSectionProps) {
  const gridClass =
    gridCols === 1
      ? "grid-cols-1"
      : gridCols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : gridCols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={`bg-white rounded-lg shadow-2xs border border-gray-100 p-6 ${className}`}
    >
      <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
        {title}
      </h2>
      <div className={`grid ${gridClass} gap-6`}>{children}</div>
    </div>
  );
}
