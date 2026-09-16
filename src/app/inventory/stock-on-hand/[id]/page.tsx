"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageGuard } from "@/components/auth/PageGuard";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/components/shared/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useGetStockOnHandDetailQuery, StockOnHandTransaction } from "@/api/inventory/stockOnHandApi";

export default function StockOnHandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const decodedId = decodeURIComponent(id);

  const { data, isLoading } = useGetStockOnHandDetailQuery({ id: decodedId });

  const basicInfo = data?.basic_information;
  const transactions = data?.recent_transactions || [];

  const breadcrumbsItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Stock on Hand", href: "/inventory/stock-on-hand" },
    { label: basicInfo?.code || decodedId, href: "#", current: true },
  ];

  const getStatusBadge = (statusKey?: string, statusLabel?: string) => {
    switch (statusKey) {
      case "in_stock":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8EE] text-[#1E8E3E]">
            {statusLabel || "In Stock"}
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF7E6] text-[#B06000]">
            {statusLabel || "Low Stock"}
          </span>
        );
      case "out_of_stock":
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#D93025]">
            {statusLabel || "Out of Stock"}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <PageGuard module="inventory" entitlement="view_inventory">
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B7CED]" />
        </div>
      </PageGuard>
    );
  }

  if (!basicInfo) {
    return (
      <PageGuard module="inventory" entitlement="view_inventory">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#F8FAFC] gap-4">
          <p className="text-gray-500 text-lg">Product not found.</p>
          <Button
            onClick={() => router.push("/inventory/stock-on-hand")}
            variant="outline"
          >
            Back to Stock on Hand
          </Button>
        </div>
      </PageGuard>
    );
  }

  return (
    <PageGuard module="inventory" entitlement="view_inventory">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F8FAFC] pb-16">
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs items={breadcrumbsItems} />

          {/* Top Title Row with Back, Status Badge and Edit Link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/inventory/stock-on-hand")}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {basicInfo.code || `PRD-${basicInfo.id}`}
              </h1>
              {getStatusBadge(basicInfo.status_key, basicInfo.status)}
            </div>

            <Link
              href={`/inventory/configuration/products/${basicInfo.id}`}
              className="text-[#3B7CED] font-medium text-sm hover:underline"
            >
              Edit
            </Link>
          </div>

          {/* Basic Information Card */}
          <section className="bg-white rounded-xl p-6 shadow-2xs border border-gray-100">
            <h2 className="text-[#3B7CED] text-base font-semibold mb-6">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Code
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {basicInfo.code || "—"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {basicInfo.product}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {basicInfo.category}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Unit
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {basicInfo.unit}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stock On Hand
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {basicInfo.stock_on_hand}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reorder Point
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {basicInfo.reorder_point !== null && basicInfo.reorder_point !== undefined
                    ? basicInfo.reorder_point
                    : "—"}
                </span>
              </div>
            </div>
          </section>

          {/* Recent Transactions Card */}
          <section className="bg-white rounded-xl shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-[#3B7CED] text-base font-semibold">
                Recent transactions
              </h2>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[900px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC] border-b border-gray-100 hover:bg-[#F8FAFC]">
                    <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                      Date
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                      Reference
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                      Transaction
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                      Source → Destination
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                      In
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                      Out
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                      Stock On Hand
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-gray-400 text-sm"
                      >
                        No movement history recorded for this product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx: StockOnHandTransaction) => (
                      <TableRow
                        key={tx.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        <TableCell className="py-3.5 px-6 text-gray-600 text-sm">
                          {tx.date || "—"}
                        </TableCell>
                        <TableCell className="py-3.5 px-6 font-medium text-gray-800 text-sm font-mono">
                          {tx.reference || tx.source_document_id || `SM-${tx.id}`}
                        </TableCell>
                        <TableCell className="py-3.5 px-6 text-gray-700 text-sm">
                          {tx.transaction}
                        </TableCell>
                        <TableCell className="py-3.5 px-6 text-gray-700 text-sm">
                          <span className="font-medium text-gray-900">
                            {tx.source_to_destination}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-6 text-right font-medium text-[#1E8E3E] text-sm">
                          {tx.in_qty !== null ? tx.in_qty : "—"}
                        </TableCell>
                        <TableCell className="py-3.5 px-6 text-right font-medium text-[#D93025] text-sm">
                          {tx.out_qty !== null ? tx.out_qty : "—"}
                        </TableCell>
                        <TableCell className="py-3.5 px-6 text-right font-semibold text-gray-900 text-sm">
                          {tx.stock_on_hand}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </main>
      </div>
    </PageGuard>
  );
}
