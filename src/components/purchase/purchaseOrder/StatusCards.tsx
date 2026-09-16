"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { RequestRow, getStatusInfo, PurchaseOrderStatus } from "../types";
import {
  ApprovedIcon,
  DraftIcon,
  PenddingIcon,
  RejectedIcon,
} from "../../shared/icons";

// Define the status categories for display
const STATUS_CATEGORIES: PurchaseOrderStatus[] = [
  "draft",
  "awaiting",
  "approved",
  "rejected",
  "active",
  "completed",
  "cancelled",
  "partially_received",
];

// Map old API statuses to new standardized statuses
const mapLegacyStatus = (status: string): PurchaseOrderStatus => {
  const statusMapping: Record<string, PurchaseOrderStatus> = {
    // Legacy purchase order statuses -> new purchase order statuses
    awaiting: "awaiting",
    pending_approval: "awaiting",
    approved: "approved",
    rejected: "rejected",
    active: "active",
    completed: "completed",
    cancelled: "cancelled",
    partially_received: "partially_received",
  };

  return statusMapping[status] || "draft";
};

// Check if a row's status matches a category status
const statusMatchesCategory = (
  rowStatus: string,
  categoryStatus: PurchaseOrderStatus,
): boolean => {
  const mappedStatus = mapLegacyStatus(rowStatus);
  return mappedStatus === categoryStatus;
};

// Map status to icon component
const getStatusIcon = (status: PurchaseOrderStatus, color: string) => {
  switch (status) {
    case "draft":
      return <DraftIcon color={color} />;
    case "approved":
    case "completed":
    case "active":
      return <ApprovedIcon color={color} />;
    case "awaiting":
    case "partially_received":
      return <PenddingIcon color={color} />;
    case "rejected":
    case "cancelled":
      return <RejectedIcon color={color} />;
    default:
      return <DraftIcon color={color} />;
  }
};

// Extract hex color from Tailwind class
const extractHexColor = (colorClass: string): string => {
  const match = colorClass.match(/#[A-Fa-f0-9]{6}/);
  return match ? match[0] : "#6B7280";
};

export function StatusCards({ rows }: { rows: RequestRow[] }) {
  const router = useRouter();

  const counts = useMemo(() => {
    const countMap: Record<string, number> = {};
    STATUS_CATEGORIES.forEach((status) => {
      countMap[status] = rows.filter((r) =>
        statusMatchesCategory(r.status, status),
      ).length;
    });
    return countMap;
  }, [rows]);

  const handleCardClick = (status: string) => {
    router.push(`/purchase/purchase_orders/status?status=${status}`);
  };

  const renderCard = (
    status: PurchaseOrderStatus,
    showBorder: boolean = true,
  ) => {
    const statusInfo = getStatusInfo(status);
    const hexColor = extractHexColor(statusInfo.color);
    const count = counts[status] || 0;

    return (
      <Card
        key={status}
        className={`${
          showBorder
            ? "border-r border-l-transparent border-y-transparent"
            : "border-transparent"
        } p-4 shadow-none rounded-none cursor-pointer hover:bg-gray-50 transition-colors`}
        onClick={() => handleCardClick(status)}
        role="button"
        aria-label={`View ${statusInfo.label} purchase orders. Count: ${count}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick(status);
          }
        }}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-lg" aria-hidden="true">
              {getStatusIcon(status, hexColor)}
            </div>
            <div className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </div>
          </div>
          <div className={`text-[2rem] font-bold ${statusInfo.color}`}>
            {count}
          </div>
        </div>
      </Card>
    );
  };

  // Display primary statuses (draft, pending_approval, approved, rejected)
  const primaryStatuses: PurchaseOrderStatus[] = [
    "draft",
    "awaiting",
    "completed",
    "cancelled",
  ];

  return (
    <section
      className="max-w-[1440px] mx-auto"
      aria-label="Purchase order status summary"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryStatuses.map((status, index) =>
          renderCard(status, index < primaryStatuses.length - 1),
        )}
      </div>
    </section>
  );
}
