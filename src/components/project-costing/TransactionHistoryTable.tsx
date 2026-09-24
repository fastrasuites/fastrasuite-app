import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  transactions?: any[];
  isLoading?: boolean;
  onRowClick?: (tx: any) => void;
}

export function extractAmount(tx: any): number {
  if (!tx) return 0;

  const candidates = [
    tx?.detail?.project_request?.request_amount,
    tx?.detail?.contract_value,
    tx?.detail?.total_amount,
    tx?.detail?.projected_cost,
    tx?.detail?.amount_requested,
    tx?.detail?.estimated_cost,
    tx?.detail?.amount,
    tx?.detail?.total,
    tx?.detail?.subtotal,
    tx?.amount,
    tx?.total_amount,
    tx?.request_amount,
    tx?.actual_amount,
    tx?.cost,
    tx?.total,
    tx?.subtotal,
    tx?.value,
  ];

  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== "") {
      if (typeof val === "number" && !isNaN(val)) {
        return val;
      }
      if (typeof val === "string") {
        const cleaned = val.replace(/[^0-9.-]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
  }

  if (Array.isArray(tx?.detail?.lines) && tx.detail.lines.length > 0) {
    const sum = tx.detail.lines.reduce((acc: number, line: any) => {
      const lineAmt =
        line.total_cost ??
        line.line_total ??
        line.total_amount ??
        line.amount ??
        line.subtotal ??
        Number(line.quantity || line.hours || 0) *
          Number(line.unit_cost || line.estimated_unit_cost || line.unit_price || line.hourly_rate || line.rate || 0);
      const num =
        typeof lineAmt === "number"
          ? lineAmt
          : parseFloat(String(lineAmt).replace(/[^0-9.-]/g, ""));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    if (sum > 0) return sum;
  }

  if (Array.isArray(tx?.lines) && tx.lines.length > 0) {
    const sum = tx.lines.reduce((acc: number, line: any) => {
      const lineAmt =
        line.total_cost ??
        line.line_total ??
        line.total_amount ??
        line.amount ??
        line.subtotal ??
        Number(line.quantity || line.hours || 0) *
          Number(line.unit_cost || line.estimated_unit_cost || line.unit_price || line.hourly_rate || line.rate || 0);
      const num =
        typeof lineAmt === "number"
          ? lineAmt
          : parseFloat(String(lineAmt).replace(/[^0-9.-]/g, ""));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    if (sum > 0) return sum;
  }

  return 0;
}

export function formatCategory(cat: string): string {
  if (!cat) return "-";
  return cat
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function TransactionHistoryTable({ transactions = [], isLoading = false, onRowClick }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const txList = Array.isArray(transactions)
    ? transactions
    : Array.isArray((transactions as any)?.results)
    ? (transactions as any).results
    : Array.isArray((transactions as any)?.data)
    ? (transactions as any).data
    : [];
  const totalPages = Math.max(1, Math.ceil(txList.length / itemsPerPage));
  const paginatedTransactions = txList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-150">
              <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 uppercase tracking-wider">Date</TableHead>
              <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 uppercase tracking-wider">Record ID</TableHead>
              <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 uppercase tracking-wider">Category</TableHead>
              <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 uppercase tracking-wider">Amount</TableHead>
              <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`tx-skeleton-${idx}`} className="border-b border-[#E9ECEF]">
                  <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-20 bg-gray-100" /></TableCell>
                  <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-32 bg-gray-100" /></TableCell>
                  <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                  <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                  <TableCell className="py-3.5 px-6"><Skeleton className="h-6 w-20 bg-gray-100 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : paginatedTransactions && paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((tx: any, idx: number) => {
                const dateStr = tx.date || tx.created_at ? new Date(tx.date || tx.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }) : "-";
                const primaryRef = tx.detail?.reference_id || tx.detail?.request_id;
                const mainRef = tx.reference_id || tx.record_id || tx.recordId || tx.reference_no || tx.reference || tx.ref;

                const recordId = primaryRef || mainRef || (tx.id ? (String(tx.id).startsWith("#") || String(tx.id).includes("-") ? String(tx.id) : `PjR-${tx.id}`) : "-");
                const subRef = (primaryRef && mainRef && String(primaryRef) !== String(mainRef)) ? mainRef : null;
                const catStr = formatCategory(tx.category || tx.request_type || tx.type || tx.project_type || "-");
                const amountVal = extractAmount(tx);
                const amountStr = `₦${Number(amountVal).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const statusStr = tx.status || "Approved";
                const statusLower = statusStr.toLowerCase();

                let badgeClass = "bg-gray-150 text-gray-700";
                if (statusLower.includes("approv") || statusLower === "done" || statusLower === "success" || statusLower === "released") {
                  badgeClass = "bg-[#E2F2E9] text-[#1E8E3E]";
                } else if (statusLower === "paid" || statusLower === "invoice") {
                  badgeClass = "bg-[#E8F0FE] text-[#1A73E8]";
                } else if (statusLower.includes("cancel") || statusLower.includes("reject")) {
                  badgeClass = "bg-[#FCE8E6] text-[#C5221F]";
                } else if (statusLower.includes("pend")) {
                  badgeClass = "bg-[#FFF2CC] text-[#D66011]";
                } else if (statusLower === "draft") {
                  badgeClass = "bg-[#E8F0FE] text-[#1A73E8]";
                }

                return (
                  <TableRow 
                    key={tx.id || idx} 
                    className="hover:bg-gray-50/50 border-b border-[#E9ECEF] cursor-pointer"
                    onClick={() => onRowClick?.(tx)}
                  >
                    <TableCell className="text-[#525F7F] py-3.5 px-6 text-sm">{dateStr}</TableCell>
                    <TableCell className="text-[#32325D] py-3.5 px-6 font-semibold text-sm">
                      <span>{recordId}</span>
                    </TableCell>
                    <TableCell className="text-[#525F7F] py-3.5 px-6 text-sm">{catStr}</TableCell>
                    <TableCell className="text-[#32325D] font-bold py-3.5 px-6 text-sm">{amountStr}</TableCell>
                    <TableCell className="py-3.5 px-6">
                      <Badge className={`border-none font-semibold px-3 py-1 rounded-full text-xs hover:bg-opacity-80 transition-all capitalize ${badgeClass}`}>
                        {statusStr}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No transactions found for this project.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center p-4 border-t border-gray-150 bg-white">
          <div className="flex items-center gap-1.5">
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-8 w-8 rounded border-none ${
                currentPage <= 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#E9ECEF] text-gray-500 hover:bg-gray-300"
              }`}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getVisiblePages().map((page, index) => {
              if (page === "...") {
                return (
                  <span key={`dots-${index}`} className="text-gray-400 px-2 font-medium">
                    ...
                  </span>
                );
              }
              const isPageSelected = currentPage === page;
              return (
                <Button
                  key={`page-${page}`}
                  variant="outline"
                  className={`h-8 w-8 p-0 text-xs font-semibold rounded border ${
                    isPageSelected
                      ? "border-[#3B7CED] text-[#3B7CED] bg-white hover:bg-white hover:text-[#3B7CED]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </Button>
              );
            })}

            <Button 
              variant="outline" 
              size="icon" 
              className={`h-8 w-8 rounded border ${
                currentPage >= totalPages ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-500 hover:bg-gray-100 border-gray-200"
              }`}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
