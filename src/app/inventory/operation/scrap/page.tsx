"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Trash2, LayoutGrid, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/components/shared/types";
import { StockAdjustmentCards } from "@/components/inventory/scrap/StockAdjustmentCards";
import Link from "next/link";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetScrapsQuery } from "@/api/inventory/scrapApi";
import { ScrapStatus } from "@/types/scrap";


const STATUS_TABS = [
  { label: "All Records", value: "all" },
  { label: "Validated", value: "done" },
  { label: "Draft", value: "draft" },
];

const ITEMS_PER_PAGE = 10;

export default function ScrapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    {
      label: "Scrap Recording",
      href: "/inventory/operation/scrap",
      current: true,
    },
  ];

  const { data: scrapsResponse, isLoading } = useGetScrapsQuery({
    search: query || undefined,
    status: selectedStatus === "all" ? undefined : (selectedStatus as ScrapStatus),
  });

  const filteredScraps = useMemo(() => {
    if (!scrapsResponse) return [];
    const list = Array.isArray(scrapsResponse)
      ? scrapsResponse
      : (scrapsResponse as any)?.results || (scrapsResponse as any)?.data || [];
    const mapped = list.map((scrap: any) => {
      const rawStatus = (scrap.status || "draft").toLowerCase();
      const statusValue = rawStatus === "validated" || rawStatus === "done" ? "done" : "draft";
      return {
        id: scrap.id,
        adjustmentType: scrap.cause || scrap.adjustment_type || "N/A",
        location: scrap.warehouse_location_details?.location_name || scrap.warehouse_location || "N/A",
        adjustedDate: scrap.date_created ? new Date(scrap.date_created).toISOString().split("T")[0] : "N/A",
        status: statusValue,
        product: scrap.items?.[0]?.product_details?.product_name || scrap.scrap_items?.[0]?.product_details?.product_name || "Multiple Products",
        quantity: scrap.items?.[0]?.scrap_quantity || scrap.scrap_items?.[0]?.scrap_quantity || 0,
      };
    });

    if (selectedStatus === "all") return mapped;
    return mapped.filter((r: any) => r.status === selectedStatus);
  }, [scrapsResponse, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredScraps.length / ITEMS_PER_PAGE));
  const paginatedScraps = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredScraps.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredScraps, currentPage]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setCurrentPage(1);
  };

  return (
    <PageGuard module="inventory" entitlement="view_scrap">
      {/* Two-tone: gray page canvas */}
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs
            items={breadcrumbsItem}
            action={
              <Button
                variant="ghost"
                className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
              >
                Autosaved <AutoSaveIcon />
              </Button>
            }
          />

          {/* White section 1: top bar + search + status tabs */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {/* Top Bar: title + search + actions */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-[#32325D] shrink-0">
                  Scrap Records
                </h2>
                <div className="relative w-[240px] md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search scrap ID, product, or location..."
                    className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] text-[#32325D]"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    aria-label="Search scrap records"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <PermissionGuard module="inventory" entitlement="add_scrap">
                  <Link href="/inventory/operation/scrap/new">
                    <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all">
                      Record New Scrap
                    </Button>
                  </Link>
                </PermissionGuard>
                <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white gap-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCurrentView("grid")}
                    className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                      currentView === "grid"
                        ? "bg-blue-50 text-[#3B7CED]"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView("list")}
                    className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                      currentView === "list"
                        ? "bg-blue-50 text-[#3B7CED]"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                    title="List View"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              {STATUS_TABS.map((tab) => {
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

          {/* White section 2: table or cards */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {currentView === "list" ? (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px] w-full">
                    <TableHeader>
                      <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                        <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                          RECORD ID
                        </TableHead>
                        <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                          PRODUCT
                        </TableHead>
                        <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                          QUANTITY
                        </TableHead>
                        <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                          CAUSE
                        </TableHead>
                        <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                          LOCATION
                        </TableHead>
                        <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px] text-center">
                          STATUS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="px-6 py-12 text-center text-[#8898AA] text-sm"
                          >
                            Loading scrap records...
                          </TableCell>
                        </TableRow>
                      ) : paginatedScraps.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="px-6 py-12 text-center text-[#8898AA] text-sm"
                          >
                            No scrap records found matching your search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedScraps.map((scrap: any) => (
                          <TableRow
                            key={scrap.id}
                            className="hover:bg-gray-50/80 border-b border-gray-100 transition-colors cursor-pointer"
                            onClick={() => router.push(`/inventory/operation/scrap/${scrap.id}`)}
                          >
                            <TableCell className="px-4 py-3.5 font-mono text-xs font-semibold">
                              <Link
                                href={`/inventory/operation/scrap/${scrap.id}`}
                                className="text-[#3B7CED] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {scrap.id}
                              </Link>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <span className="text-[#32325D] text-sm font-medium">
                                {scrap.product}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <span className="text-[#32325D] text-sm font-mono font-semibold">
                                {scrap.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <span className="text-[#525F7F] text-sm capitalize">
                                {scrap.adjustmentType.toLowerCase()}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <span className="text-[#525F7F] text-sm">
                                {scrap.location}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-center">
                              <span
                                className={`inline-block min-w-[80px] px-2.5 py-1 text-[11px] rounded-full font-semibold capitalize ${
                                  scrap.status === "done" || scrap.status === "validated"
                                    ? "bg-[#E2F2E9] text-[#2BA24D]"
                                    : scrap.status === "draft" || scrap.status === "pending"
                                      ? "bg-[#E8F0FE] text-[#1A73E8]"
                                      : "bg-[#E2F2E9] text-[#2BA24D]"
                                }`}
                              >
                                {scrap.status === "done" || scrap.status === "validated" ? "Validated" : "Draft"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination footer */}
                <div className="px-6 py-3.5 flex items-center justify-between border-t border-gray-100 bg-white text-sm text-[#8898AA]">
                  <span>
                    Showing{" "}
                    <span className="font-semibold text-[#32325D]">
                      {filteredScraps.length === 0
                        ? 0
                        : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    –{" "}
                    <span className="font-semibold text-[#32325D]">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredScraps.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#32325D]">
                      {filteredScraps.length}
                    </span>{" "}
                    results
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md border border-gray-200 text-xs font-medium text-[#32325D] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1,
                      )
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                          acc.push("...");
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-[#8898AA]">
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setCurrentPage(item as number)}
                            className={`w-8 h-7 rounded-md text-xs font-medium transition-colors ${
                              currentPage === item
                                ? "bg-[#3B7CED] text-white"
                                : "border border-gray-200 text-[#32325D] hover:bg-gray-50"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md border border-gray-200 text-xs font-medium text-[#32325D] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4">
                <StockAdjustmentCards stockAdjustments={paginatedScraps} />
              </div>
            )}
          </div>
        </main>
      </div>
    </PageGuard>
  );
}
