"use client";

import React from "react";
import { FileText, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestDashboard } from "@/components/requests/RequestDashboard";
import { RequestDashboardConfig, RequestStatus } from "@/components/requests/types";
import { useGetPettyCashRequestsQuery } from "@/api/requests/pettyCashRequestApi";
import { useRouter } from "next/navigation";

interface PettyCashRequestItem {
  id: string;
  project: string;
  amountRequested: number;
  requester: string;
  status: RequestStatus;
  realId: number | string;
}

export default function PettyCashRequestPage() {
  const router = useRouter();
  const { data: rawApiRequests = [], isLoading, refetch } = useGetPettyCashRequestsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const apiRequests = React.useMemo(() => {
    if (Array.isArray(rawApiRequests)) return rawApiRequests;
    if (rawApiRequests && Array.isArray((rawApiRequests as any).results)) {
      return (rawApiRequests as any).results;
    }
    return [];
  }, [rawApiRequests]);

  React.useEffect(() => {
    if (typeof refetch === "function") {
      refetch();
    }
  }, [refetch]);

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
    }
  };

  const requests = React.useMemo(() => {
    const sorted = [...apiRequests].sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.date_created || 0).getTime();
      const dateB = new Date(b.created_at || b.date_created || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
    return sorted.map((req: any) => {
      let detail: any = {};
      if (req.detail) {
        if (typeof req.detail === "string") {
          try {
            detail = JSON.parse(req.detail);
          } catch (e) {
            detail = {};
          }
        } else {
          detail = req.detail;
        }
      }

      let requesterName = "—";
      if (req.requester_details?.user) {
        const u = req.requester_details.user;
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
        requesterName = fullName || u.username || u.email || "—";
      } else if (req.created_by_details && typeof req.created_by_details === "object") {
        const fullName = `${req.created_by_details.first_name || ""} ${req.created_by_details.last_name || ""}`.trim();
        requesterName = fullName || req.created_by_details.username || req.created_by_details.email || "—";
      } else if (
        typeof req.project_request === "object" &&
        req.project_request?.requester_details?.user
      ) {
        const u = req.project_request.requester_details.user;
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
        requesterName = fullName || u.username || u.email || "—";
      } else if (
        typeof req.project_request === "object" &&
        req.project_request?.created_by_details
      ) {
        const prCreatedBy = req.project_request.created_by_details;
        const fullName = `${prCreatedBy.first_name || ""} ${prCreatedBy.last_name || ""}`.trim();
        requesterName = fullName || prCreatedBy.username || prCreatedBy.email || "—";
      } else if (req.created_by_name && typeof req.created_by_name === "string") {
        requesterName = req.created_by_name;
      } else if (req.requester && typeof req.requester === "string" && isNaN(Number(req.requester))) {
        requesterName = req.requester;
      } else if (req.created_by) {
        requesterName = `User #${req.created_by}`;
      }

      const rawStatus = (
        (typeof req.project_request === "object" && req.project_request?.status) ||
        req.status ||
        "pending"
      ).toLowerCase();
      const status: RequestStatus =
        rawStatus === "cancelled" ? "rejected" : (rawStatus as RequestStatus);

      const itemRefId =
        (req.reference_id && String(req.reference_id).trim()) ||
        (detail?.reference_id && String(detail.reference_id).trim()) ||
        (typeof req.project_request === "object" && req.project_request?.reference_id && String(req.project_request.reference_id).trim()) ||
        `PC${String(req.id).padStart(4, "0")}`;

      const projectName =
        req.project_details?.name ||
        req.project_name ||
        (typeof req.project_request === "object" && req.project_request?.project_details?.name) ||
        (typeof req.project_request === "object" && req.project_request?.project_name) ||
        (req.project ? `Project #${req.project}` : "—");

      const amount =
        parseFloat(String(req.amount_requested ?? "")) ||
        parseFloat(String(req.amount ?? "")) ||
        parseFloat(String(detail.amount_requested ?? "")) ||
        parseFloat(String(detail.amountRequested ?? "")) ||
        parseFloat(String(detail.amount ?? "")) ||
        parseFloat(String(typeof req.project_request === "object" ? req.project_request?.request_amount ?? "" : "")) ||
        0;

      const realId =
        req.id ||
        (typeof req.project_request === "object" ? req.project_request?.id : req.project_request) ||
        req.project_request_id;

      return {
        id: itemRefId,
        project: projectName,
        amountRequested: amount,
        requester: requesterName,
        status,
        realId,
      };
    });
  }, [apiRequests]);

  const counts = React.useMemo(() => {
    const defaultCounts: Record<RequestStatus, number> = {
      draft: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    requests.forEach((r) => {
      if (r.status in defaultCounts) {
        defaultCounts[r.status]++;
      }
    });
    return defaultCounts;
  }, [requests]);

  const config: RequestDashboardConfig<PettyCashRequestItem> = {
    title: "Petty Cash Request",
    idPrefix: "PC",
    newRequestPath: "/project-request/petty-cash-request/new",
    statusCounts: counts,
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
    renderItem: (request) => (
      <div 
        onClick={() => router.push(`/project-request/petty-cash-request/${request.realId}`)}
        className="p-4 border border-gray-200 rounded-md bg-white hover:shadow-md transition-shadow duration-200 cursor-pointer"
      >
        <div className="flex justify-between items-start">
          <span className="text-sm font-bold text-[#3B7CED]">{request.id}</span>
          <Badge variant={getStatusBadgeVariant(request.status)}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm font-bold text-gray-900 mt-1">{request.project}</p>

        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">Amount Requested</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              ₦{request.amountRequested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-medium">Requester</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{request.requester}</p>
          </div>
        </div>
      </div>
    ),
    mockData: requests,
  };

  return (
    <RequestDashboard
      config={config}
      backUrl="/project-request/make-request"
      isLoading={isLoading && requests.length === 0}
    />
  );
}
