"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  Package,
  Hammer,
  Trash2,
  Undo2,
  Archive,
  LayoutGrid,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem } from "@/types/purchase";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { IncomingProductCards } from "@/components/inventory/operation/IncomingProductCards";
import { useGetIncomingProductsQuery } from "@/api/inventory/incomingProductApi";
import { useGetIncomingProductReturnsQuery } from "@/api/inventory/incomingProductReturns";
import { useGetMaterialConsumptionsQuery } from "@/api/requests/materialConsumptionRequestApi";
import { useGetScrapsQuery } from "@/api/inventory/scrapApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";


const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Validated", value: "validated" },
  { label: "Canceled", value: "canceled" },
];

// StatusCards-style tiles: horizontal row, icon+label top, big colored count below, border-r dividers
function OperationsNavigationTiles({
  incomingCount,
  materialConsumptionCount,
  scrapCount,
  returnsCount,
  backordersCount,
}: {
  incomingCount: number;
  materialConsumptionCount: number;
  scrapCount: number;
  returnsCount: number;
  backordersCount: number;
}) {
  const operationModules = [
    {
      title: "Pending Incoming Products",
      href: "/inventory/operation",
      count: incomingCount,
      icon: Package,
      color: "#3B7CED",
    },
    {
      title: "Material Consumption",
      href: "/inventory/operation/material-consumption",
      count: materialConsumptionCount,
      icon: Hammer,
      color: "#F0B401",
    },
    {
      title: "Scrap Recording",
      href: "/inventory/operation/scrap",
      count: scrapCount,
      icon: Trash2,
      color: "#E43D2B",
    },
    {
      title: "Supplier Returns",
      href: "/inventory/operation/supplier_return",
      count: returnsCount,
      icon: Undo2,
      color: "#8E44AD",
    },
    {
      title: "Backorders",
      href: "/inventory/operation/backorder",
      count: backordersCount,
      icon: Archive,
      color: "#27AE60",
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-2xs overflow-hidden mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-5">
        {operationModules.map((mod, idx) => (
          <Link
            key={mod.title}
            href={mod.href}
            className={`p-5 cursor-pointer hover:bg-gray-50 transition-colors group flex flex-col ${
              idx < operationModules.length - 1
                ? "border-b sm:border-b-0 sm:border-r border-gray-100"
                : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <mod.icon
                className="w-[18px] h-[18px] shrink-0"
                style={{ color: mod.color }}
              />
              <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors leading-tight">
                {mod.title}
              </span>
            </div>
            <div
              className="text-[2rem] font-bold"
              style={{ color: mod.color }}
            >
              {mod.count}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

import { useRouter } from "next/navigation";

export default function OperationPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentView, setCurrentView] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: incomingProductsData = [], isLoading } = useGetIncomingProductsQuery({
    search: query || undefined,
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    is_backorder: false,
  });

  const { data: rawPendingIncoming = [] } = useGetIncomingProductsQuery({
    status: "draft",
    is_backorder: false,
  });

  const { data: rawMaterialConsumptions = [] } = useGetMaterialConsumptionsQuery({});
  const { data: rawScraps = [] } = useGetScrapsQuery({});
  const { data: rawReturns = [] } = useGetIncomingProductReturnsQuery({});
  const { data: rawBackOrders = [] } = useGetIncomingProductsQuery({ is_backorder: true });

  const incomingDraftCount = useMemo(() => {
    const list = Array.isArray(rawPendingIncoming) ? rawPendingIncoming : (rawPendingIncoming as any)?.results || [];
    return list.filter((i: any) => (i.status || "").toLowerCase() === "draft" && !i.is_backorder).length;
  }, [rawPendingIncoming]);

  const materialConsumptionDraftCount = useMemo(() => {
    const list = Array.isArray(rawMaterialConsumptions) ? rawMaterialConsumptions : (rawMaterialConsumptions as any)?.results || [];
    return list.filter((i: any) => {
      const s = (i.status || "").toLowerCase();
      const r = (i.release_status || "").toLowerCase();
      return (
        s === "draft" ||
        s === "partial_release" ||
        s === "partially_released" ||
        r === "partial_release" ||
        r === "partially_released"
      );
    }).length;
  }, [rawMaterialConsumptions]);

  const scrapDraftCount = useMemo(() => {
    const list = Array.isArray(rawScraps) ? rawScraps : (rawScraps as any)?.results || [];
    return list.length;
  }, [rawScraps]);

  const returnsDraftCount = useMemo(() => {
    const list = Array.isArray(rawReturns) ? rawReturns : (rawReturns as any)?.results || [];
    return list.filter((i: any) => (i.status || "").toLowerCase() === "draft").length;
  }, [rawReturns]);

  const backordersDraftCount = useMemo(() => {
    const list = Array.isArray(rawBackOrders) ? rawBackOrders : (rawBackOrders as any)?.results || [];
    return list.filter((i: any) => (i.status || "").toLowerCase() === "draft").length;
  }, [rawBackOrders]);

  const totalPages = Math.max(1, Math.ceil(incomingProductsData.length / ITEMS_PER_PAGE));
  const incomingProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return incomingProductsData.slice(start, start + ITEMS_PER_PAGE);
  }, [incomingProductsData, currentPage]);

  // Reset to page 1 when filters change
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };
  const handleQueryChange = (q: string) => {
    setQuery(q);
    setCurrentPage(1);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-800 font-medium">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    {
      label: "Operation",
      href: "/inventory/operation",
      current: true,
    },
  ];

  const handleViewChange = (view: "list" | "grid") => {
    setCurrentView(view);
  };

  return (
    <PageGuard module="inventory" entitlement="view_incomingproduct">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20"
      >
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          {/* Breadcrumbs — sits on gray */}
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

          {/* StatusCards-style tiles */}
          <OperationsNavigationTiles
            incomingCount={incomingDraftCount}
            materialConsumptionCount={materialConsumptionDraftCount}
            scrapCount={scrapDraftCount}
            returnsCount={returnsDraftCount}
            backordersCount={backordersDraftCount}
          />

          {/* White section 1: top bar + status pills */}
          <div data-wizard="inventory-incoming-table" className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {/* Top Bar: title + search + actions */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-[#32325D] shrink-0">
                  Incoming Products
                </h2>
                <div className="relative w-[240px] md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search receipt ID, type, or vendor..."
                    className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] text-[#32325D]"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    aria-label="Search incoming products"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <PermissionGuard module="inventory" entitlement="add_incomingproduct">
                  <Link href="/inventory/operation/incoming_product/new">
                    <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all">
                      New Incoming Product
                    </Button>
                  </Link>
                </PermissionGuard>
                <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white gap-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleViewChange("grid")}
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
                    onClick={() => handleViewChange("list")}
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
            <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
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

          {/* White section 2: table (separate card below) */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {/* Conditional rendering based on current view */}
            {currentView === "list" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Receipt ID
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Vendor
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Purchase Order
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Destination Location
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Date Created
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={`skeleton-row-${idx}`} className="border-b border-[#E9ECEF]">
                          <TableCell className="py-4 px-6"><Skeleton className="h-5 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                          <TableCell className="py-4 px-6"><Skeleton className="h-5 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
                          <TableCell className="py-4 px-6"><Skeleton className="h-5 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                          <TableCell className="py-4 px-6"><Skeleton className="h-5 w-28 bg-gray-200 rounded animate-pulse" /></TableCell>
                          <TableCell className="py-4 px-6"><Skeleton className="h-5 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                          <TableCell className="py-4 px-6"><Skeleton className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      incomingProducts.map((item: any) => (
                        <TableRow
                          key={item.incoming_product_id}
                          className="cursor-pointer hover:bg-gray-50/50 border-b border-[#E9ECEF] transition-colors"
                          onClick={() => router.push(`/inventory/operation/incoming_product/${encodeURIComponent(item.incoming_product_id)}`)}
                        >
                          <TableCell className="text-[#32325D] font-semibold text-sm py-3.5 px-6 whitespace-nowrap">
                            <Link
                              href={`/inventory/operation/incoming_product/${encodeURIComponent(item.incoming_product_id)}`}
                              className="text-[#3B7CED] hover:underline font-semibold"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {highlightText(item.incoming_product_id, query)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {highlightText(
                              item.supplier_details?.vendor_name || "N/A",
                              query,
                            )}
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {highlightText(
                              item.related_po ||
                                item.related_ppo_details?.po_number ||
                                (item.related_ppo ? `PO-${item.related_ppo}` : "N/A"),
                              query,
                            )}
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {highlightText(
                              item.destination_location_details?.location_name ||
                                "N/A",
                              query,
                            )}
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {highlightText(
                              item.date_created ? new Date(item.date_created).toLocaleDateString() : "N/A",
                              query,
                            )}
                          </TableCell>
                          <TableCell className="py-3.5 px-6 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold min-w-[80px] ${
                                item.status === "validated"
                                  ? "bg-[#E2F2E9] text-[#1E8E3E]"
                                  : item.status === "draft"
                                    ? "bg-[#E8F0FE] text-[#1A73E8]"
                                    : item.status === "canceled"
                                      ? "bg-[#FCE8E6] text-[#C5221F]"
                                      : "bg-[#E9ECEF] text-[#8898AA]"
                              }`}
                            >
                              {item.status === "validated"
                                ? "Validated"
                                : item.status === "draft"
                                  ? "Draft"
                                  : item.status === "canceled"
                                    ? "Canceled"
                                    : item.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {incomingProducts.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-[#8898AA] text-sm"
                        >
                          No incoming products found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-4">
                <IncomingProductCards
                  incomingProducts={incomingProducts}
                  query={query}
                />
              </div>
            )}

            {/* Pagination footer */}
            <div className="px-6 py-3.5 flex items-center justify-between border-t border-gray-100 bg-white text-sm text-[#8898AA]">
              <span>
                Showing{" "}
                <span className="font-semibold text-[#32325D]">
                  {incomingProductsData.length === 0
                    ? 0
                    : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                –{" "}
                <span className="font-semibold text-[#32325D]">
                  {Math.min(currentPage * ITEMS_PER_PAGE, incomingProductsData.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#32325D]">
                  {incomingProductsData.length}
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
          </div>
        </main>
      </motion.div>
    </PageGuard>
  );
}

