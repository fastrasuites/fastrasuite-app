"use client";

import React from "react";
import { Status, getStatusInfo } from "../types";

// Extract Tailwind classes from getStatusInfo color format
const getStatusStyles = (
  status: Status
): { bg: string; text: string; label: string } => {
  console.log("status", status);
  const info = getStatusInfo(status);
  // console.log("info", info);

  // Map the color classes to pill-appropriate styles
  const colorMap: Record<string, { bg: string; text: string }> = {
    "text-[#3B7CED]": { bg: "bg-[#DBEAFE]", text: "text-[#2563EB]" },
    "text-[#F0B401]": { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
    "text-[#2BA24D]": { bg: "bg-[#D4F4DD]", text: "text-[#0D894F]" },
    "text-[#E43D2B]": { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
    "text-gray-500": { bg: "bg-gray-200", text: "text-gray-700" },
  };

  const styles = colorMap[info.color] || {
    bg: "bg-gray-200",
    text: "text-gray-700",
  };

  return {
    ...styles,
    label: info.label,
  };
};

export function StatusPill({ status }: { status: Status }) {
  const styles = getStatusStyles(status);

  return (
    <span
      role="status"
      aria-label={`Status ${styles.label}`}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles.bg} ${styles.text}`}
    >
      {styles.label}
    </span>
  );
}
