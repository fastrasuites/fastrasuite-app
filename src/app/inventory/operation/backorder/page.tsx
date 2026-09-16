"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/components/shared/types";
import Link from "next/link";
import { PageGuard } from "@/components/auth/PageGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetIncomingProductsQuery } from "@/api/inventory/incomingProductApi";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function BackorderPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    {
      label: "Backorders",
      href: "/inventory/operation/backorder",
      current: true,
    },
  ];

  const { data: backordersData, isLoading } = useGetIncomingProductsQuery({
    search: query || undefined,
    is_backorder: true,
  });

  const backordersList = Array.isArray(backordersData) ? backordersData : [];
  const totalPages = Math.max(1, Math.ceil(backordersList.length / ITEMS_PER_PAGE));
  const paginatedBackorders = backordersList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <PageGuard application="inventory" module="backorder">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs items={breadcrumbsItem} />

          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-[#32325D] shrink-0">
                  Pending Backorders
                </h2>
                <div className="relative w-[240px] md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search backorder ID, vendor, receipt..."
                    className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] text-[#32325D]"
                    value={query}
                    onChange={(e) => {
                       setQuery(e.target.value);
                       setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      BACKORDER ID
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      DATE CREATED
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      VENDOR
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px]">
                      SOURCE RECEIPT
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px] text-center">
                      PENDING LINES
                    </TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-[#8898AA] text-[11.5px] text-center">
                      STATUS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#3B7CED] mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : paginatedBackorders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-12 text-center text-[#8898AA] text-sm">
                        No backorders found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBackorders.map((bo: any) => (
                      <TableRow
                        key={bo.incoming_product_id || bo.id}
                        className="hover:bg-gray-50/80 border-b border-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/inventory/operation/incoming_product/${encodeURIComponent(decodeURIComponent(bo.incoming_product_id || bo.id))}`)}
                      >
                        <TableCell className="px-4 py-3.5 font-mono text-xs font-semibold">
                          <Link href={`/inventory/operation/incoming_product/${encodeURIComponent(decodeURIComponent(bo.incoming_product_id || bo.id))}`} className="text-[#3B7CED] hover:underline" onClick={(e) => e.stopPropagation()}>
                            {bo.incoming_product_id || bo.id}
                          </Link>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-[#525F7F] text-sm">
                          {bo.date_created ? new Date(bo.date_created).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <span className="text-[#32325D] text-sm font-medium">
                            {bo.supplier_details?.vendor_name || bo.supplier_details?.company_name || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <span className="text-[#3B7CED] hover:underline text-sm font-medium">
                            {bo.backorder_of_details?.incoming_product_id || bo.backorder_of || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center text-[#525F7F] text-sm">
                          {bo.incoming_product_items?.length || 0}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">
                          <span className={`inline-block min-w-[80px] px-2.5 py-1 text-[11px] rounded-full font-semibold capitalize ${
                            bo.status === "validated" ? "bg-[#E2F2E9] text-[#2BA24D]" : "bg-[#E8F0FE] text-[#1A73E8]"
                          }`}>
                            {bo.status || "draft"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="px-6 py-3.5 flex items-center justify-between border-t border-gray-100 bg-white text-sm text-[#8898AA]">
              <span>
                Showing <span className="font-semibold text-[#32325D]">{backordersList.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> – <span className="font-semibold text-[#32325D]">{Math.min(currentPage * ITEMS_PER_PAGE, backordersList.length)}</span> of <span className="font-semibold text-[#32325D]">{backordersList.length}</span> results
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-md border border-gray-200 text-xs font-medium text-[#32325D] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((item) => (
                  <button key={item} type="button" onClick={() => setCurrentPage(item as number)} className={`w-8 h-7 rounded-md text-xs font-medium ${currentPage === item ? "bg-[#3B7CED] text-white" : "border border-gray-200 text-[#32325D] hover:bg-gray-50"}`}>{item}</button>
                ))}
                <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md border border-gray-200 text-xs font-medium text-[#32325D] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageGuard>
  );
}
