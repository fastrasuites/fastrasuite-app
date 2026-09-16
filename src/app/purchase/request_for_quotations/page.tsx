"use client";

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  useGetRequestForQuotationsQuery,
  RequestForQuotation,
} from "@/api/purchase/requestForQuotationApi";
import type { RootState } from "@/lib/store/store";
import {
  RequestRow,
  StatusCards,
} from "@/components/purchase/requestForQuotation";
import { extractErrorMessage } from "@/lib/utils";
import { ViewToggle } from "@/components/purchase/requestForQuotation/ViewToggle";
import { RfqTable } from "@/components/purchase/requestForQuotation";
import { RfqCards } from "@/components/purchase/requestForQuotation/RfqCards";

// Helper function to transform RFQ API data to RequestRow format
const transformRfqToRow = (
  rfq: RequestForQuotation,
  loggedInUserId?: number
): RequestRow => {
  const totalItems =
    rfq.items?.reduce((sum: number, item) => sum + item.qty, 0) || 0;
  const totalPrice = parseFloat(rfq.rfq_total_price || "0");

  // Check if the vendor is the logged-in user's company (if applicable)
  const vendorName = rfq.vendor_details?.company_name || "Unknown Vendor";

  return {
    id: rfq.id,
    product:
      rfq.items
        ?.map((item) => item.product_details?.product_name || "Unknown Product")
        .join(", ") || "No items",
    quantity: totalItems,
    amount: totalPrice.toLocaleString(),
    requester: vendorName,
    status: rfq.status,
  };
};

export default function RequestForQuotationsPage() {
  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");

  // Get logged-in user from Redux store
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  // Use the RFQ API query hook
  const {
    data: requestForQuotations = [],
    isLoading,
    isError,
    error,
  } = useGetRequestForQuotationsQuery({
    search: query || undefined,
  });

  // Transform API data to match component interface
  const rows: RequestRow[] = useMemo(() => {
    return requestForQuotations.map((rfq) =>
      transformRfqToRow(rfq, loggedInUserId)
    );
  }, [requestForQuotations, loggedInUserId]);

  const handleViewChange = (view: "grid" | "list") => {
    setCurrentView(view);
  };

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading request for quotations...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (isError) {
    return (
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center text-red-600 px-4">
          <p className="text-lg font-semibold">Error loading request for quotations</p>
          <p className="text-sm mt-2">{extractErrorMessage(error, "An unexpected error occurred while loading request for quotations.")}</p>
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
          <h2 className="text-lg text-nowrap">Request for Quotations</h2>

          <div className="relative w-xs">
            <Input
              type="text"
              className="w-full pl-10 pr-4 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search request for quotations"
            />
            <SearchIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <Link href="/purchase/request_for_quotations/new">
            <Button variant="contained" className="px-4 py-2 cursor-pointer">
              New RFQ
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
        <RfqTable rows={rows} query={query} />
      ) : (
        <RfqCards requestForQuotations={rows} />
      )}
    </main>
  );
}
