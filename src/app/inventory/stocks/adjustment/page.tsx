"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StockAdjustmentRow, StockAdjustmentStatus } from "@/components/inventory/types";
import { Input } from "@/components/ui/input";
import { SearchIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/inventory/location/ViewToggle";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/components/shared/types";
import { StockAdjustmentTable } from "@/components/inventory/stocks/StockAdjustmentTable";
import { StockAdjustmentCards } from "@/components/inventory/stocks/StockAdjustmentCards";
import Link from "next/link";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

import { useGetStockAdjustmentsQuery } from "@/api/inventory/stockAdjustmentApi";

export default function StockAdjustmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStatus = searchParams.get("status") || "all";

  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    router.push(`/inventory/stocks/adjustment${val === "all" ? "" : `?status=${val}`}`);
  };

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    {
      label: "Stock Adjustment",
      href: "/inventory/stocks/adjustment",
      current: true,
    },
  ];

  const { data: adjustmentsData, isLoading } = useGetStockAdjustmentsQuery({
    search: query || undefined,
    status: selectedStatus === "all" ? undefined : (selectedStatus.toUpperCase() as any),
  });

  const rows = useMemo(() => {
    if (!adjustmentsData) return [];
    const list = Array.isArray(adjustmentsData)
      ? adjustmentsData
      : (adjustmentsData as any)?.results || (adjustmentsData as any)?.data || [];
    const mapped = list.map((adj: any) => {
      const normalizedStatus = (adj.status || "draft").toLowerCase();
      const statusValue = normalizedStatus === "validated" || normalizedStatus === "done" ? "done" : "draft";
      return {
        id: adj.id,
        adjustmentType: adj.adjustment_type || "Stock Level Update",
        location: adj.warehouse_location_details?.location_name || adj.warehouse_location || "N/A",
        adjustedDate: adj.date_created ? new Date(adj.date_created).toISOString().split("T")[0] : "N/A",
        status: statusValue as StockAdjustmentStatus,
        product: adj.stock_adjustment_items?.[0]?.product_details?.product_name || "Multiple Products",
        quantity: adj.stock_adjustment_items?.[0]?.new_quantity || 0,
      };
    });

    if (selectedStatus === "all") return mapped;
    return mapped.filter((r: any) => r.status === selectedStatus);
  }, [adjustmentsData, selectedStatus]);

  const handleViewChange = (view: "grid" | "list") => {
    setCurrentView(view);
  };

  return (
    <PageGuard module="inventory" entitlement="view_stockadjustment">
      {/* Two-tone: gray page canvas */}
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
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

          {/* White Section Card 1: Header + Controls + Filter Pills */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {/* Top Bar: title + search + actions */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h1 className="text-xl font-semibold text-[#32325D] shrink-0">
                  Stock Adjustments
                </h1>
                <div className="relative w-[260px] md:w-[320px]">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] text-[#32325D] w-full"
                    placeholder="Search adjustments by ID, location..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search stock adjustments"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <PermissionGuard module="inventory" entitlement="add_stockadjustment">
                  <Link href="/inventory/stocks/adjustment/new">
                    <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all">
                      <Plus className="w-4 h-4 mr-1.5" /> New Stock Adjustment
                    </Button>
                  </Link>
                </PermissionGuard>
                <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white gap-0.5 shadow-2xs">
                  <ViewToggle
                    currentView={currentView}
                    onViewChange={handleViewChange}
                  />
                </div>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              {[
                { label: "All Records", value: "all" },
                { label: "Validated", value: "done" },
                { label: "Draft", value: "draft" },
              ].map((tab) => {
                const isSelected = selectedStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleStatusChange(tab.value)}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#E8F0FE] text-[#1A73E8] font-semibold"
                        : "bg-[#E9ECEF] text-[#8898AA] font-normal hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* White Section Card 2: Table or Grid */}
          <div data-wizard="inventory-adjustments-table" className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {currentView === "list" ? (
              <StockAdjustmentTable rows={rows} query={query} isLoading={isLoading} />
            ) : (
              <div className="p-6">
                <StockAdjustmentCards stockAdjustments={rows} isLoading={isLoading} />
              </div>
            )}
          </div>
        </main>
      </div>
    </PageGuard>
  );
}
