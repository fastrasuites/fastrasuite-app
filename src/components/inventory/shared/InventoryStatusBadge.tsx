"use client";

import React from "react";

interface InventoryStatusBadgeProps {
  status: string;
  className?: string;
}

export function InventoryStatusBadge({
  status,
  className = "",
}: InventoryStatusBadgeProps) {
  const s = status ? status.toLowerCase() : "";

  let badgeColorClass = "bg-[#E9ECEF] text-[#8898AA]";

  if (
    s === "validated" ||
    s === "done" ||
    s === "active" ||
    s === "receipt" ||
    s === "completed"
  ) {
    badgeColorClass = "bg-[#E2F2E9] text-[#2BA24D]";
  } else if (
    s === "draft" ||
    s === "pending" ||
    s === "consumption" ||
    s === "return"
  ) {
    badgeColorClass = "bg-[#E8F0FE] text-[#1A73E8]";
  } else if (
    s === "canceled" ||
    s === "cancelled" ||
    s === "scrap" ||
    s === "inactive" ||
    s === "rejected"
  ) {
    badgeColorClass = "bg-[#FCE8E6] text-[#E43D2B]";
  }

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize min-w-[80px] text-center ${badgeColorClass} ${className}`}
    >
      {status === "validated" ? "Validated" : status}
    </span>
  );
}
