"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/purchase/TopNav";
import { RfqTable } from "@/components/purchase/requestForQuotation/RfqTable";
import { RfqCards } from "@/components/purchase/requestForQuotation/RfqCards";
import { RequestRow } from "@/components/purchase/types";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/purchase/requestForQuotation/ViewToggle";
import {
  useGetRequestForQuotationsQuery,
  RequestForQuotation,
} from "@/api/purchase/requestForQuotationApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { BreadcrumbItem } from "../../products/types";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";

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

// Status mapping for display
const getStatusInfo = (status: string) => {
  const statusMap = {
    draft: { label: "Draft", color: "text-[#3B7CED]", bgColor: "bg-[#3B7CED]" },
    approved: {
      label: "Approved",
      color: "text-[#2BA24D]",
      bgColor: "bg-[#2BA24D]",
    },
    pending: {
      label: "Pending",
      color: "text-[#F0B401]",
      bgColor: "bg-[#F0B401]",
    },
    rejected: {
      label: "Rejected",
      color: "text-[#E43D2B]",
      bgColor: "bg-[#E43D2B]",
    },
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.draft;
};

export default function RfqStatusPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as
    | "draft"
    | "approved"
    | "pending"
    | "rejected"
    | null;

  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    {
      label: "Request for Quotations",
      href: `/purchase/request_for_quotations`,
    },
    {
      label: `${
        status ? status.charAt(0).toUpperCase() + status.slice(1) : "All"
      } RFQs`,
      href: `/purchase/request_for_quotations/status?status=${status}`,
      current: true,
    },
  ];

  // Get logged-in user from Redux store
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  // Use the RFQ API query hook with status filter
  const {
    data: requestForQuotations = [],
    isLoading,
    isError,
    error,
  } = useGetRequestForQuotationsQuery({
    search: query || undefined,
    status: status || undefined, // Filter by status if provided
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

  // Get status info for display
  const statusInfo = status ? getStatusInfo(status) : null;

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
        <div className="text-center text-red-600">
          <p>Error loading request for quotations</p>
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
      <div className="bg-white p-6 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4 mr-4">
        <div className="flex items-center space-x-4">
          {statusInfo && (
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${statusInfo.bgColor}`}
              ></div>
              <h2 className="text-xl font-semibold">
                {statusInfo.label} Request for Quotations
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} bg-gray-100`}
              >
                {rows.length} {rows.length === 1 ? "RFQ" : "RFQs"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
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
          <ViewToggle
            currentView={currentView}
            onViewChange={handleViewChange}
          />
        </div>
      </div>

      {/* Content */}
      {currentView === "list" ? (
        <RfqTable rows={rows} query={query} />
      ) : (
        <RfqCards requestForQuotations={rows} />
      )}
    </main>
  );
}
