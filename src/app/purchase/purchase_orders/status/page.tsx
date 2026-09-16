"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PurchaseTable } from "@/components/purchase/purchaseOrder/PurchaseRequestTable";
import { PurchaseRequestCards } from "@/components/purchase/purchaseOrder/PurchaseRequestCards";
import {
  RequestRow,
  getStatusInfo,
  PurchaseOrderStatus,
} from "@/components/purchase/types";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/purchase/purchaseOrder/ViewToggle";
import {
  useGetPurchaseOrdersQuery,
  PurchaseOrder,
} from "@/api/purchase/purchaseOrderApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { BreadcrumbItem } from "../../products/types";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";

// Helper function to transform API data to RequestRow format
const transformPurchaseOrderToRow = (
  purchaseOrder: PurchaseOrder,
  loggedInUserId?: number
): RequestRow => {
  const totalItems =
    purchaseOrder.items?.reduce((sum: number, item) => sum + item.qty, 0) || 0;
  const totalPrice = parseFloat(purchaseOrder.po_total_price || "0");

  // Check if the creator is the logged-in user
  const isOwnOrder =
    purchaseOrder.created_by_details?.user?.id === loggedInUserId;

  const creatorName = isOwnOrder
    ? "YOU"
    : purchaseOrder.created_by_details?.user?.first_name &&
      purchaseOrder.created_by_details?.user?.last_name
    ? `${purchaseOrder.created_by_details.user.first_name} ${purchaseOrder.created_by_details.user.last_name}`
    : "Unknown Creator";

  return {
    id: purchaseOrder.id,
    product:
      purchaseOrder.items
        ?.map((item) => item.product_details?.product_name || "Unknown Product")
        .join(", ") || "No items",
    quantity: totalItems,
    amount: totalPrice.toLocaleString(),
    requester: creatorName,
    status: purchaseOrder.status,
  };
};

// Valid purchase order statuses
const VALID_STATUSES: PurchaseOrderStatus[] = [
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
    // Direct mappings (no change needed)
    draft: "draft",
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
  categoryStatus: PurchaseOrderStatus
): boolean => {
  const mappedStatus = mapLegacyStatus(rowStatus);
  return mappedStatus === categoryStatus;
};

export default function PurchaseOrderStatusPage() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status = VALID_STATUSES.includes(rawStatus as PurchaseOrderStatus)
    ? (rawStatus as PurchaseOrderStatus)
    : null;

  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");

  const statusInfo = getStatusInfo(status);

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Purchase Orders", href: `/purchase/purchase_orders` },
    {
      label: `${status ? statusInfo.description : "All"} Orders`,
      href: `/purchase/purchase_orders/status?status=${status}`,
      current: true,
    },
  ];

  // Get logged-in user from Redux store
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  // Use the API query hook with status filter
  const {
    data: purchaseOrders = [],
    isLoading,
    isError,
    error,
  } = useGetPurchaseOrdersQuery({
    search: query || undefined,
    status: status || undefined, // Filter by status if provided
  });

  // Transform API data to match component interface
  const rows: RequestRow[] = useMemo(() => {
    return purchaseOrders.map((purchaseOrder) =>
      transformPurchaseOrderToRow(purchaseOrder, loggedInUserId)
    );
  }, [purchaseOrders, loggedInUserId]);

  const handleViewChange = (view: "grid" | "list") => {
    setCurrentView(view);
  };

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen text-gray-800">
        <motion.div
          className="px-6 pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {/* Header skeleton */}
          <div className="bg-white p-6 rounded-md mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Quick filter skeleton */}
          <div className="bg-white p-4 rounded-md mb-6">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 rounded w-20 animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="bg-white p-6 rounded-md">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  // Show error state
  if (isError) {
    return (
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading purchase orders</p>
          <p className="text-sm mt-2">{error?.toString()}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      >
        <Breadcrumbs
          items={items}
          action={
            <Button
              variant="ghost"
              className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
            >
              Autosaved <AutoSaveIcon />
            </Button>
          }
        />
      </motion.div>
      {/* Header */}
      <div className="bg-white p-4 md:p-6 rounded-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mt-4 mx-4 lg:mr-4">
        <div className="flex items-start md:items-center space-x-4 w-full lg:w-auto">
          {statusInfo && (
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className={`w-4 h-4 rounded-full ${statusInfo.bgColor} flex-shrink-0`}
                aria-hidden="true"
              ></div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold truncate">
                  {statusInfo.label} Purchase Orders
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} bg-gray-100 flex-shrink-0`}
                    role="status"
                    aria-live="polite"
                  >
                    {rows.length} {rows.length === 1 ? "order" : "orders"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:w-xs">
            <Input
              type="text"
              className="w-full pl-10 pr-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search orders..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search purchase orders"
            />
            <SearchIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
              aria-hidden="true"
            />
          </div>
          <div className="flex-shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={handleViewChange}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {rows.length === 0 && !isLoading ? (
        <motion.div
          className="mx-6 mt-8 bg-white rounded-md p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No purchase orders found
          </h3>
          <p className="text-gray-500 mb-6">
            {status
              ? `No ${getStatusInfo(
                  status
                ).description.toLowerCase()} purchase orders match your search criteria.`
              : "No purchase orders match your search criteria."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setQuery("")}
              className="px-4 py-2"
            >
              Clear Search
            </Button>
            <Button
              variant="contained"
              onClick={() =>
                (window.location.href = "/purchase/purchase_orders/new")
              }
              className="px-4 py-2"
            >
              Create New Order
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Conditional rendering based on current view */}
          {currentView === "list" ? (
            <PurchaseTable rows={rows} query={query} />
          ) : (
            <PurchaseRequestCards purchaseRequests={rows} />
          )}
        </>
      )}
    </main>
  );
}
