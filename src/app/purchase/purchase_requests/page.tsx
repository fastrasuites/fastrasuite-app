"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { PageGuard } from "@/components/auth/PageGuard";
import { PurchaseTable } from "@/components/purchase/purchaseRequest/PurchaseRequestTable";
import { PurchaseRequestCards } from "@/components/purchase/purchaseRequest/PurchaseRequestCards";
import { RequestRow } from "@/components/purchase/types";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/purchase/purchaseRequest/ViewToggle";
import {
  useGetPurchaseRequestsQuery,
  PurchaseRequest,
} from "@/api/purchase/purchaseRequestApi";
import type { RootState } from "@/lib/store/store";
import { StatusCards } from "@/components/purchase/purchaseRequest";
import { extractErrorMessage } from "@/lib/utils";

// Helper function to transform API data to RequestRow format
const transformPurchaseRequestToRow = (
  purchaseRequest: PurchaseRequest,
  loggedInUserId?: number,
): RequestRow => {
  const totalItems =
    purchaseRequest.items?.reduce((sum: number, item) => sum + item.qty, 0) ||
    0;
  const totalPrice = parseFloat(purchaseRequest.pr_total_price || "0");

  // Check if the requester is the logged-in user
  const isOwnRequest =
    purchaseRequest.requester_details?.user?.id === loggedInUserId;

  const requesterName = isOwnRequest
    ? "YOU"
    : purchaseRequest.requester_details?.user?.first_name &&
        purchaseRequest.requester_details?.user?.last_name
      ? `${purchaseRequest.requester_details.user.first_name} ${purchaseRequest.requester_details.user.last_name}`
      : "Unknown Requester";

  return {
    id: purchaseRequest.id,
    product:
      purchaseRequest.items
        ?.map((item) => item.product_details?.product_name || "Unknown Product")
        .join(", ") || "No items",
    quantity: totalItems,
    amount: totalPrice.toLocaleString(),
    requester: requesterName,
    status: purchaseRequest.status,
  };
};

export default function PurchaseRequestsPage() {
  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");
  const router = useRouter();
  const { can } = usePermission();

  // Get logged-in user from Redux store
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  // Use the API query hook
  const {
    data: purchaseRequests = [],
    isLoading,
    isError,
    error,
  } = useGetPurchaseRequestsQuery({
    search: query || undefined,
  });

  // Transform API data to match component interface
  const rows: RequestRow[] = useMemo(() => {
    return purchaseRequests.map((purchaseRequest) =>
      transformPurchaseRequestToRow(purchaseRequest, loggedInUserId),
    );
  }, [purchaseRequests, loggedInUserId]);

  const handleViewChange = (view: "grid" | "list") => {
    setCurrentView(view);
  };

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading purchase requests...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (isError) {
    return (
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center text-red-600 px-4">
          <p className="text-lg font-semibold">Error loading purchase requests</p>
          <p className="text-sm mt-2">{extractErrorMessage(error, "An unexpected error occurred while loading purchase requests.")}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-6"
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <PageGuard application="purchase" module="purchaserequest">
      <main className="min-h-screen text-gray-800 mr-4">
        <div className="bg-white rounded-md shadow hover:shadow-lg transition-shadow duration-300 p-6 pb-4 mt-4">
          <StatusCards rows={rows} />
        </div>

        <div className="bg-white p-6 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg text-nowrap">Purchase Requests</h2>

            <div className="relative w-xs">
              <Input
                type="text"
                className="w-full pl-10 pr-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search purchase requests"
              />
              <SearchIcon
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>
          </div>
          <div className="flex space-x-4">
            {!can({
              application: "purchase",
              module: "purchaserequest",
              action: "create",
            }) ? null : (
              <Link href="/purchase/purchase_requests/new">
                <Button variant="contained" className="px-4 py-2 cursor-pointer">
                  New Purchase Request
                </Button>
              </Link>
            )}

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
    </PageGuard>
  );
}
