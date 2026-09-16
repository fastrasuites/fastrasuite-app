"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/types/purchase";
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
import { useGetMaterialConsumptionsQuery } from "@/api/requests/materialConsumptionRequestApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

const STATUS_TABS = [
  { label: "All Records", value: "all" },
  { label: "Partial Release", value: "partial_release" },
  { label: "Released", value: "released" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Draft", value: "draft" },
];

const ITEMS_PER_PAGE = 10;

const getStatusBadge = (status: string, releaseStatus?: string) => {
  const rel = (releaseStatus || "").toUpperCase();
  const s = (status || "").toLowerCase().trim();

  if (rel === "RELEASED" || s === "released") {
    return {
      label: "Released",
      className: "bg-[#EAFDF0] text-[#2BA24D]",
    };
  }
  if (
    rel === "PARTIAL_RELEASE" ||
    rel === "PARTIALLY_RELEASED" ||
    s === "partial_release" ||
    s === "partially_released" ||
    s === "partial release"
  ) {
    return {
      label: "Partial Release",
      className: "bg-[#FFF4E5] text-[#D97706]",
    };
  }
  if (s === "approved" || s === "validated") {
    return {
      label: "Approved",
      className: "bg-[#DBEAFE] text-[#1D4ED8]",
    };
  }
  if (s === "draft") {
    return {
      label: "Draft",
      className: "bg-[#EEF4FF] text-[#1A73E8]",
    };
  }
  if (s === "rejected") {
    return {
      label: "Rejected",
      className: "bg-[#FCE8E6] text-[#E43D2B]",
    };
  }
  return {
    label: "Pending",
    className: "bg-[#FFFDF0] text-[#F0B401]",
  };
};

export default function MaterialConsumptionPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiData = [], isLoading, isError } = useGetMaterialConsumptionsQuery();

  const filteredRequests = useMemo(() => {
    const rawList = Array.isArray(apiData) ? apiData : (apiData as any).results ?? [];
    
    // Map API data to UI structure
    const mapped = rawList.map((req: any) => {
      let wbsActivity = "N/A";
      if (req.activity_details?.name) {
        wbsActivity = req.activity_details.name;
      } else if (req.project_details?.name) {
        wbsActivity = req.project_details.name;
      } else if (req.project) {
        wbsActivity = `Project #${req.project}`;
      }

      const rel = (req.release_status || "").toUpperCase();
      const st = (req.status || "pending").toLowerCase();
      let normalizedGroup = "pending";

      if (rel === "RELEASED" || st === "released") {
        normalizedGroup = "released";
      } else if (
        rel === "PARTIAL_RELEASE" ||
        rel === "PARTIALLY_RELEASED" ||
        st === "partial_release" ||
        st === "partially_released" ||
        st === "partial release"
      ) {
        normalizedGroup = "partial_release";
      } else if (st === "approved" || st === "validated") {
        normalizedGroup = "approved";
      } else if (st === "draft") {
        normalizedGroup = "draft";
      } else {
        normalizedGroup = "pending";
      }

      return {
        id: req.request_id || `MCR-${req.id}`,
        realId: req.id,
        wbsActivity: wbsActivity,
        requester: req.created_by_name || req.requester_details?.name || "System Request",
        requestDate: req.date_consumed ? new Date(req.date_consumed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        numberOfItems: (req.lines ?? []).length,
        status: req.status || "pending",
        releaseStatus: req.release_status || "PENDING",
        group: normalizedGroup,
      };
    });

    return mapped.filter((item: any) => {
      const matchesTab =
        selectedTab === "all" || item.group === selectedTab;

      const lowerQuery = query.toLowerCase();
      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(lowerQuery) ||
        String(item.wbsActivity).toLowerCase().includes(lowerQuery) ||
        String(item.requester).toLowerCase().includes(lowerQuery);

      return matchesTab && matchesSearch;
    });
  }, [apiData, query, selectedTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setCurrentPage(1);
  };

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    {
      label: "Material Consumption",
      href: "/inventory/operation/material-consumption",
      current: true,
    },
  ];

  return (
    <PageGuard application="inventory" module="materialconsumption">
      {/* Two-tone: gray page canvas */}
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
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

          {/* White section 1: top bar + status pills */}
          <div data-wizard="inventory-consumption-table" className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {/* Top Bar: title + search + actions */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-[#32325D] shrink-0">
                  Material Consumption
                </h1>
                <div className="relative w-[240px] md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search requisition ID, project, or WBS..."
                    className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] text-[#32325D]"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    aria-label="Search material requisitions"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <PermissionGuard module="inventory" entitlement="add_materialconsumptionrequest">
                  <Link href="/inventory/operation/material-consumption/new">
                    <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all">
                      <Plus className="w-4 h-4 mr-1.5" /> New Material Consumption
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              {STATUS_TABS.map((tab) => {
                const isSelected = selectedTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleTabChange(tab.value)}
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

          {/* White section 2: table card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      REQUEST ID
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      WBS ACTIVITY
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      REQUESTED BY
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      REQUEST DATE
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px] text-center">
                      NUMBER OF ITEMS
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px] text-center">
                      STATUS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-4 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-12 text-center text-red-500 text-sm">
                        Failed to load material consumption requests.
                      </TableCell>
                    </TableRow>
                  ) : paginatedRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-6 py-12 text-center text-[#8898AA] text-sm"
                      >
                        No requisitions found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRequests.map((req: any) => {
                      const badge = getStatusBadge(req.status, req.releaseStatus);
                      return (
                        <TableRow
                          key={req.id}
                          className="hover:bg-gray-50/80 border-b border-gray-100 transition-colors cursor-pointer"
                          onClick={() => router.push(`/inventory/operation/material-consumption/${req.realId}`)}
                        >
                          <TableCell className="px-4 py-3.5 text-sm font-semibold">
                            <Link
                              href={`/inventory/operation/material-consumption/${req.realId}`}
                              className="text-[#3B7CED] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {req.id}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <span className="text-[#32325D] text-sm font-medium">
                              {req.wbsActivity}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <span className="text-[#32325D] text-sm font-medium">
                              {req.requester}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <span className="text-[#525F7F] text-sm">
                              {req.requestDate}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center font-semibold text-[#32325D] text-sm">
                            {req.numberOfItems}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block min-w-[80px] px-2.5 py-1 text-[11px] rounded-full font-semibold capitalize ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            <div className="px-6 py-3.5 flex items-center justify-between border-t border-gray-100 bg-white text-sm text-[#8898AA]">
              <span>
                Showing{" "}
                <span className="font-semibold text-[#32325D]">
                  {filteredRequests.length === 0
                    ? 0
                    : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                –{" "}
                <span className="font-semibold text-[#32325D]">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#32325D]">
                  {filteredRequests.length}
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
      </div>
    </PageGuard>
  );
}
