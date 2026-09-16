"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import { InvoiceCards } from "@/components/invoice/InvoiceCards";
import { InvoiceRow } from "@/components/invoice/types";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/invoice/ViewToggle";
import { useGetInvoicesQuery, Invoice } from "@/api/invoice/invoicesApi";
import { BreadcrumbItem } from "../../purchase/products/types";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";

// Helper function to format date to "DD MMM YYYY - HH:mm AM/PM" format
const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours.toString().padStart(2, "0");

  return `${day} ${month} ${year} - ${formattedHours}:${minutes} ${ampm}`;
};

// Helper function to format date to "DD MMM YYYY" format
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

// Helper function to transform API data to InvoiceRow format
const transformInvoiceToRow = (invoice: Invoice): InvoiceRow => {
  const totalAmount = parseFloat(invoice.total_amount || "0");
  const amountPaid = parseFloat(invoice.amount_paid || "0");
  const balance = parseFloat(invoice.balance || "0");

  // Map API status to our 3 status types
  const mapStatus = (status: string): "paid" | "partial" | "unpaid" => {
    const statusMapping: Record<string, "paid" | "partial" | "unpaid"> = {
      paid: "paid",
      partial: "partial",
      unpaid: "unpaid",
      overdue: "unpaid",
      cancelled: "unpaid",
    };
    return statusMapping[status] || "unpaid";
  };

  const vendor =
    (invoice.vendor_details as any)?.company_name ||
    (invoice.vendor_details as any)?.companyName ||
    (invoice.vendor_details as any)?.name ||
    "Unknown Vendor";

  return {
    id: invoice.id,
    vendor,
    dateCreated: formatDateTime(invoice.date_created),
    dueDate: formatDate(invoice.due_date),
    amount: amountPaid.toLocaleString(),
    due: balance.toLocaleString(),
    totalAmount: totalAmount.toLocaleString(),
    status: mapStatus(invoice.status),
  };
};

// Status mapping for display
const getStatusInfo = (status: string) => {
  const statusMap = {
    paid: { label: "Paid", color: "text-[#2BA24D]", bgColor: "bg-[#2BA24D]" },
    partial: {
      label: "Partially Paid",
      color: "text-[#F0B401]",
      bgColor: "bg-[#F0B401]",
    },
    unpaid: {
      label: "Unpaid",
      color: "text-[#E43D2B]",
      bgColor: "bg-[#E43D2B]",
    },
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.unpaid;
};

export default function InvoiceStatusPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as
    | "paid"
    | "partial"
    | "unpaid"
    | null;

  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Invoice", href: "/invoice" },
    {
      label: `${
        status ? status.charAt(0).toUpperCase() + status.slice(1) : "All"
      } Invoices`,
      href: `/invoice/status?status=${status}`,
      current: true,
    },
  ];

  // Use the API query hook
  const {
    data: invoices = [],
    isLoading,
    isError,
    error,
  } = useGetInvoicesQuery({
    search: query || undefined,
  });

  // Transform API data to match component interface and filter by status
  const rows: InvoiceRow[] = useMemo(() => {
    const transformed = invoices.map((invoice) =>
      transformInvoiceToRow(invoice),
    );
    return status
      ? transformed.filter((row) => row.status === status)
      : transformed;
  }, [invoices, status]);

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
          <p>Loading invoices...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (isError) {
    return (
      <main className="min-h-screen text-gray-800 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading invoices</p>
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
                {statusInfo.label} Invoices
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} bg-gray-100`}
              >
                {rows.length} {rows.length === 1 ? "invoice" : "invoices"}
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
              aria-label="Search invoices"
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
        <InvoiceTable rows={rows} query={query} />
      ) : (
        <InvoiceCards Invoices={rows} />
      )}
    </main>
  );
}
