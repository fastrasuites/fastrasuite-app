"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, CheckSquare, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionHistoryTable } from "@/components/project-costing/TransactionHistoryTable";
import { FilterModal } from "@/components/project-costing/modals/FilterModal";
import { TransactionDetailsModal } from "@/components/project-costing/modals/TransactionDetailsModal";
import { useParams } from "next/navigation";
import { useGetProjectTransactionsQuery } from "@/api/projectCostingApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

import { DraftIcon } from "@/components/shared/icons";

const StatusIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0">
    <path
      d="M20.4006 9.73817C21.4669 10.8044 22 11.3375 22 12C22 12.6624 21.4669 13.1956 20.4006 14.2618C19.6838 14.9786 19.4637 15.4414 19.4637 16.4479C19.4637 17.2444 19.6182 18.3776 18.9905 19C18.3678 19.6175 17.2393 19.4637 16.4479 19.4637C15.4765 19.4637 15.0087 19.6537 14.3154 20.347C13.7251 20.9374 12.9337 22 12 22C11.0663 22 10.2749 20.9374 9.68457 20.347C8.99128 19.6537 8.52349 19.4637 7.55206 19.4637C6.76068 19.4637 5.63218 19.6175 5.00949 19C4.38181 18.3776 4.53628 17.2444 4.53628 16.4479C4.53628 15.4414 4.31616 14.9786 3.59938 14.2618C2.53314 13.1956 2.00002 12.6624 2 12C2.00001 11.3375 2.53312 10.8044 3.59935 9.73817C4.2392 9.09832 4.53628 8.46428 4.53628 7.55206C4.53628 6.76065 4.38249 5.63214 5 5.00944C5.62243 4.38178 6.7556 4.53626 7.55208 4.53626C8.46427 4.53626 9.09832 4.2392 9.73815 3.59937C10.8044 2.53312 11.3375 2 12 2C12.6625 2 13.1956 2.53312 14.2618 3.59937M18.9905 19H19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 9.5L12 13L21.0002 3"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function TransactionsPage() {
  const params = useParams();
  const id = params?.id || "1";
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const { data: rawTransactions = [], isLoading } = useGetProjectTransactionsQuery(Number(id), {
    skip: !id,
  });

  const transactions = Array.isArray(rawTransactions)
    ? rawTransactions
    : Array.isArray((rawTransactions as any)?.results)
    ? (rawTransactions as any).results
    : Array.isArray((rawTransactions as any)?.data)
    ? (rawTransactions as any).data
    : [];

  const approvedCount = transactions.filter((t: any) => (t.status || "approved").toLowerCase().includes("approv") || (t.status || "").toLowerCase() === "paid" || (t.status || "").toLowerCase() === "done" || (t.status || "").toLowerCase() === "released").length;
  const pendingCount = transactions.filter((t: any) => (t.status || "").toLowerCase().includes("pend")).length;
  const draftCount = transactions.filter((t: any) => (t.status || "").toLowerCase().includes("draft")).length;
  const totalCount = transactions.length;

  const handleRowClick = (tx: any) => {
    setSelectedTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  return (
    <PageGuard module="project_costing" entitlement="view_transactions">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col h-full bg-gray-50 relative min-h-screen"
    >
      {/* Breadcrumbs */}
      <div className="px-6 pt-6 flex items-center gap-1 text-sm text-[#8898AA] font-normal bg-transparent">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Home
        </Link>
        <span className="text-gray-300 mx-0.5">\</span>
        <Link href="/project-costing" className="hover:text-gray-600 transition-colors">
          Project Costing
        </Link>
      </div>

      {/* Top Navigation Row */}
      <div className="flex items-center justify-between px-6 py-4 bg-transparent border-b border-gray-200">
        <div className="flex items-center">
          <Link href={`/project-costing/${id}`}>
            <Button variant="ghost" size="icon" className="mr-2 h-8 w-8">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Transaction history</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsFilterModalOpen(true)}>
          <Filter className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        
        {/* KPI Cards Row (Consolidated Container) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-150 shadow-2xs">
          {/* Approved transactions */}
          <div className="flex-1 w-full pb-4 md:pb-0 md:pr-4 lg:pr-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#2D8A4E]">
              <StatusIcon color="#2D8A4E" />
              <span className="text-sm font-semibold">Approved transactions</span>
            </div>
            <div className="text-4xl font-bold text-[#2D8A4E] mt-1">
              {isLoading ? "-" : approvedCount}
            </div>
          </div>
          
          {/* Pending Approvals */}
          <div className="flex-1 w-full py-4 md:py-0 md:px-4 lg:px-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#D99B00]">
              <StatusIcon color="#F0B401" />
              <span className="text-sm font-semibold">Pending Approvals</span>
            </div>
            <div className="text-4xl font-bold text-[#D99B00] mt-1">
              {isLoading ? "-" : pendingCount}
            </div>
          </div>

          {/* Draft transactions */}
          <div className="flex-1 w-full py-4 md:py-0 md:px-4 lg:px-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#5E72E4]">
              <DraftIcon color="#5E72E4" className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">Draft transactions</span>
            </div>
            <div className="text-4xl font-bold text-[#5E72E4] mt-1">
              {isLoading ? "-" : draftCount}
            </div>
          </div>

          {/* Total Transactions */}
          <div className="flex-1 w-full pt-4 md:pt-0 md:pl-4 lg:pl-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#3B7CED]">
              <StatusIcon color="#3B7CED" />
              <span className="text-sm font-semibold">Total Transactions</span>
            </div>
            <div className="text-4xl font-bold text-[#3B7CED] mt-1">
              {isLoading ? "-" : totalCount}
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <TransactionHistoryTable transactions={transactions} isLoading={isLoading} onRowClick={handleRowClick} />

      </div>

      {/* Modals */}
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
      />
      <TransactionDetailsModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)}
        transaction={selectedTransaction}
      />
    </motion.div>
    </PageGuard>
  );
}
