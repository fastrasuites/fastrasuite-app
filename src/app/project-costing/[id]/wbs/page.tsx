"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WbsTable } from "@/components/project-costing/WbsTable";
import { useParams } from "next/navigation";
import { useGetProjectCostingProjectQuery } from "@/api/projectCostingApi";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { PageGuard } from "@/components/auth/PageGuard";

export default function WBSPage() {
  const params = useParams();
  const id = params?.id || "1";
  
  const { data: project, isLoading } = useGetProjectCostingProjectQuery(Number(id), {
    skip: !id,
  });

  let budgetNum = 0;
  if (project?.financials) {
    try {
      const fin = typeof project.financials === "string" ? JSON.parse(project.financials) : project.financials;
      budgetNum = Number(fin.budget || fin.total_budget || 0);
    } catch (e) {
      console.error(e);
    }
  }
  if (budgetNum === 0 && project?.phases) {
    try {
      const parsedPhases = typeof project.phases === "string" ? JSON.parse(project.phases) : project.phases;
      if (Array.isArray(parsedPhases)) {
        budgetNum = parsedPhases.reduce((acc, phase) => {
          return acc + (phase.activities || []).reduce((sum: number, act: any) => sum + Number(act.amount || 0), 0);
        }, 0);
      }
    } catch (e) {
      //
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 relative min-h-screen">
        {/* Top Navigation Row */}
        <div className="flex items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
          <Skeleton className="h-4 w-48 bg-gray-200" />
        </div>

        <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          {/* Project Budget Card Skeleton */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex flex-col gap-2">
            <Skeleton className="h-4 w-28 bg-gray-200" />
            <Skeleton className="h-8 w-48 bg-gray-200 mt-1" />
          </div>

          {/* WBS Table Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-6 flex flex-col gap-4">
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
              <Skeleton className="h-4 w-1/4 bg-gray-200" />
              <Skeleton className="h-4 w-1/6 bg-gray-200" />
              <Skeleton className="h-4 w-20 bg-gray-200" />
            </div>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex justify-between gap-4 py-2">
                <Skeleton className="h-4 w-1/3 bg-gray-100" />
                <Skeleton className="h-4 w-1/6 bg-gray-100" />
                <Skeleton className="h-4 w-20 bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageGuard module="project_costing" entitlement="view_project">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col h-full bg-gray-50 relative min-h-screen"
      >
        {/* Top Navigation Row */}
        <div className="flex items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
          <Link href={`/project-costing/${id}`}>
            <Button variant="ghost" size="icon" className="mr-2 h-8 w-8">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <h1 className="text-lg font-medium text-gray-800">Work Breakdown Structure (WBS)</h1>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          
          {/* Project Budget Card */}
          <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-500">Project Budget</span>
            </div>
            <div className="text-3xl font-semibold text-green-500 mt-2">
              ₦{budgetNum.toLocaleString()}
            </div>
          </div>

          {/* WBS Table */}
          <WbsTable />

        </div>
      </motion.div>
    </PageGuard>
  );
}
