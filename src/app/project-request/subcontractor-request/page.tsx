"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestDashboard } from "@/components/requests/RequestDashboard";
import { RequestDashboardConfig, RequestStatus } from "@/components/requests/types";
import { useGetSubcontractorRequestsQuery } from "@/api/subcontractorRequestApi";
import { SubcontractorRequest } from "@/types/subcontractorRequest";
import { extractErrorMessage } from "@/lib/utils";

export default function SubcontractorRequestPage() {
  const router = useRouter();
  const {
    data: rawRequests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSubcontractorRequestsQuery({}, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  useEffect(() => {
    if (typeof refetch === "function") {
      refetch();
    }
  }, [refetch]);

  const requests: any[] = useMemo(() => {
    if (Array.isArray(rawRequests)) return rawRequests;
    if (rawRequests && Array.isArray((rawRequests as any).results)) {
      return (rawRequests as any).results;
    }
    return [];
  }, [rawRequests]);

  const statusCounts: Record<RequestStatus, number> = useMemo(() => {
    const counts: Record<RequestStatus, number> = {
      draft: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    // Note: The API doesn't seem to provide a status field in the SubcontractorRequest schema provided
    // but the RequestDashboard component requires it. I'll default to 'pending' or try to map it if I find it.
    // Looking at the provided schema, there is no status. I'll assume 'pending' for now or check if it's hidden.
    // Wait, the previous mock had status. I'll use a placeholder or check if vendor_name exists to count as 'draft'.
    
    requests.forEach((req: any) => {
      const status = ((req as any).project_request?.status || req.status || "pending") as RequestStatus;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  }, [requests]);

  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return "validated";
      case "pending":
        return "pending";
      case "draft":
        return "draft";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const config: RequestDashboardConfig<any> = {
    title: "Subcontractor Request",
    idPrefix: "SUB",
    newRequestPath: "/project-request/subcontractor-request/new",
    statusCounts,
    summaryConfigs: [
      {
        status: "draft",
        label: "Draft",
        icon: FileText,
        colorClass: "text-blue-500",
        bgColorClass: "bg-blue-50",
        borderColorClass: "border-blue-200",
      },
      {
        status: "approved",
        label: "Approved",
        icon: CheckCircle,
        colorClass: "text-green-500",
        bgColorClass: "bg-green-50",
        borderColorClass: "border-green-200",
      },
      {
        status: "pending",
        label: "Pending",
        icon: Clock,
        colorClass: "text-amber-500",
        bgColorClass: "bg-amber-50",
        borderColorClass: "border-amber-200",
      },
      {
        status: "rejected",
        label: "Rejected",
        icon: XCircle,
        colorClass: "text-red-500",
        bgColorClass: "bg-red-50",
        borderColorClass: "border-red-200",
      },
    ],
    renderItem: (req: any) => {
      const displayTitle = (req as any).activity_details?.name || (req as any).project_details?.name || "Subcontractor Request";
      const subName = (req as any).vendor_details?.vendor_name || (req as any).vendor_name || (req as any).sub_contractor_name || "";
      const itemRefId =
        (req.reference_id && String(req.reference_id).trim()) ||
        ((req as any).detail?.reference_id && String((req as any).detail.reference_id).trim()) ||
        ((req as any).project_request?.reference_id && String((req as any).project_request.reference_id).trim()) ||
        `SUB${String(req.id).padStart(4, "0")}`;
      
      return (
      <div 
        key={req.id}
        onClick={() => router.push(`/project-request/subcontractor-request/${req.id}`)}
        className="p-4 border border-gray-200 rounded-lg bg-white hover:border-[#3B7CED] hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start">
          <span className="text-sm font-bold text-[#3B7CED] group-hover:text-blue-600">{itemRefId}</span>
          <Badge variant={getStatusBadgeVariant((req as any).project_request?.status || req.status || "pending")}>
            {((req as any).project_request?.status || req.status || "pending").charAt(0).toUpperCase() + ((req as any).project_request?.status || req.status || "pending").slice(1)}
          </Badge>
        </div>
        <p className="text-sm font-bold text-gray-900 mt-1">{displayTitle}</p>
        {subName && (
          <p className="text-xs text-gray-500 font-medium mt-0.5">{subName}</p>
        )}

        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-tight">Scope of Work</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5 line-clamp-1">{req.scope_of_work}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-tight">Value</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">₦{Number(req.contract_value || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    )},
    mockData: [...requests]
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.start_date || 0).getTime();
        const dateB = new Date(b.created_at || b.start_date || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return Number(b.id || 0) - Number(a.id || 0);
      })
      .map((req: any) => ({
        ...req,
        status: (req as any).project_request?.status || req.status || "pending",
      })),
  };

  return (
    <RequestDashboard
      config={config}
      backUrl="/project-request/make-request"
      isLoading={isLoading && requests.length === 0}
    />
  );
}
