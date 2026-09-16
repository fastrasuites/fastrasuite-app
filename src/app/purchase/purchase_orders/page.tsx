"use client";

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { PurchaseTable } from "@/components/purchase/purchaseOrder/PurchaseRequestTable";
import { PurchaseRequestCards } from "@/components/purchase/purchaseOrder/PurchaseRequestCards";
import { RequestRow } from "@/components/purchase/types";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/purchase/purchaseOrder/ViewToggle";
import {
  useGetPurchaseOrdersQuery,
  PurchaseOrder,
} from "@/api/purchase/purchaseOrderApi";
import type { RootState } from "@/lib/store/store";
import { StatusCards } from "@/components/purchase/purchaseOrder";
import { extractErrorMessage } from "@/lib/utils";

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

export default function PurchaseOrdersPage() {
  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");

  // Get logged-in user from Redux store
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  // Use the API query hook
  const {
    data: purchaseOrders = [],
    isLoading,
    isError,
    error,
  } = useGetPurchaseOrdersQuery({
    search: query || undefined,
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
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading purchase orders...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (isError) {
    return (
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center text-red-600 px-4">
          <p className="text-lg font-semibold">Error loading purchase orders</p>
          <p className="text-sm mt-2">{extractErrorMessage(error, "An unexpected error occurred while loading purchase orders.")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-gray-800 mr-4">
      <div className="bg-white rounded-md shadow hover:shadow-lg transition-shadow duration-300 p-6 pb-4 mt-4">
        <StatusCards rows={rows} />
      </div>

      <div className="bg-white p-6 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg text-nowrap">Purchase Orders</h2>

          <div className="relative w-xs">
            <Input
              type="text"
              className="w-full pl-10 pr-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search purchase orders"
            />
            <SearchIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <Link href="/purchase/purchase_orders/new">
            <Button variant="contained" className="px-4 py-2 cursor-pointer">
              New Purchase Order
            </Button>
          </Link>
          <ViewToggle
            currentView={currentView}
            onViewChange={handleViewChange}
          />
        </div>
      </div>

      {/* Conditional rendering based on current view */}
      {currentView === "list" ? (
        <PurchaseTable rows={rows} query={query} />
      ) : (
        <PurchaseRequestCards purchaseRequests={rows} />
      )}
    </main>
  );
}
