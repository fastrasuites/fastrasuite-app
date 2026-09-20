"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RequestDashboard } from "@/components/requests/RequestDashboard";
import { RequestDashboardConfig, RequestStatus } from "@/components/requests/types";
import { useGetMaterialConsumptionsQuery } from "@/api/requests/materialConsumptionRequestApi";

interface MaterialConsumptionRequest {
  id: string;
  project: string;
  itemsCount: number;
  totalCost: number;
  requester: string;
  status: RequestStatus;
  realId: number;
}

const statusMap: Record<string, RequestStatus> = {
  APPROVED: "approved",
  approved: "approved",
  RELEASED: "approved",
  released: "approved",
  PENDING: "pending",
  pending: "pending",
  DRAFT: "draft",
  draft: "draft",
  REJECTED: "rejected",
  rejected: "rejected",
  CANCELLED: "rejected",
  cancelled: "rejected",
};

export default function MaterialConsumptionRequestPage() {
  const router = useRouter();
  const { data: apiData = [], isLoading, refetch } = useGetMaterialConsumptionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  React.useEffect(() => {
    refetch?.();
  }, [refetch]);

  const requests: MaterialConsumptionRequest[] = React.useMemo(() => {
    const rawList = Array.isArray(apiData)
      ? apiData
      : (apiData as any)?.results ?? [];

    const sortedList = [...rawList].sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.date_consumed || a.date || 0).getTime();
      const dateB = new Date(b.created_at || b.date_consumed || b.date || 0).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return sortedList.map((req: any) => {
      // 1. Calculate total cost from lines or project_request
      const calculatedLinesCost = (req.lines ?? []).reduce(
        (sum: number, line: any) => {
          const lineTotal =
            parseFloat(line.total_cost) ||
            (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_cost) || 0) ||
            0;
          return sum + lineTotal;
        },
        0,
      );

      const totalCost =
        calculatedLinesCost > 0
          ? calculatedLinesCost
          : parseFloat(req.project_request?.request_amount) ||
            parseFloat(req.total_cost) ||
            parseFloat(req.estimated_cost) ||
            0;

      // 2. Resolve requester from requester_details.user, created_by_details, etc.
      let requester = "—";
      if (req.requester_details?.user) {
        const u = req.requester_details.user;
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
        requester = fullName || u.username || u.email || "—";
      } else if (req.created_by_details) {
        const u = req.created_by_details;
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
        requester = fullName || u.username || u.email || "—";
      } else if (req.created_by_name) {
        requester = req.created_by_name;
      } else if (req.requester_name) {
        requester = req.requester_name;
      } else if (req.requester && typeof req.requester === "string") {
        requester = req.requester;
      } else if (req.created_by_id) {
        requester = `User #${req.created_by_id}`;
      }

      // 3. Resolve status
      const rawStatus = (req.status || req.project_request?.status || "pending").toLowerCase();
      const status: RequestStatus = statusMap[rawStatus] ?? "pending";

      // 4. Resolve project
      const project =
        req.project_details?.name ||
        (typeof req.project_request === "object" ? req.project_request?.project_details?.name : null) ||
        req.project_name ||
        (req.project ? `Project #${req.project}` : "—");

      return {
        id: req.request_id || req.reference_id || req.project_request?.reference_id || `MCR-${req.id}`,
        project,
        itemsCount: (req.lines ?? []).length,
        totalCost,
        requester,
        status,
        realId: req.id,
      };
    });
  }, [apiData]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<RequestStatus, number> = {
      draft: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    requests.forEach((r) => {
      if (r.status in counts) counts[r.status]++;
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
        return "default";
    }
  };

  const config: RequestDashboardConfig<MaterialConsumptionRequest> = {
    title: "Material Consumption Request",
    idPrefix: "MCR",
    newRequestPath: "/project-request/material-consumption-request/new",
    statusCounts,
    summaryConfigs: [
      {
        status: "draft",
        label: "Draft",
        icon: FileText,
        colorClass: "text-[#3B7CED]",
        bgColorClass: "bg-[#3B7CED]/5",
        borderColorClass: "border-[#3B7CED]/20",
      },
      {
        status: "approved",
        label: "Approved",
        icon: CheckCircle,
        colorClass: "text-[#2BA24D]",
        bgColorClass: "bg-[#2BA24D]/5",
        borderColorClass: "border-[#2BA24D]/20",
      },
      {
        status: "pending",
        label: "Pending",
        icon: Clock,
        colorClass: "text-[#F0B401]",
        bgColorClass: "bg-[#F0B401]/5",
        borderColorClass: "border-[#F0B401]/20",
      },
      {
        status: "rejected",
        label: "Rejected",
        icon: XCircle,
        colorClass: "text-[#E43D2B]",
        bgColorClass: "bg-[#E43D2B]/5",
        borderColorClass: "border-[#E43D2B]/20",
      },
    ],
    renderItem: (request) => (
      <Card
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() =>
          router.push(
            `/project-request/material-consumption-request/${request.realId}`,
          )
        }
      >
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-blue-500">
            {request.id}
          </span>
          <Badge variant={getStatusBadgeVariant(request.status) as any}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{request.project}</p>

        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-4">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Items</p>
              <p className="text-sm text-gray-900">{request.itemsCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">Total Cost</p>
              <p className="text-sm text-gray-900">
                ₦
                {request.totalCost.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 font-semibold">Requester</p>
            <p className="text-sm text-gray-900">{request.requester}</p>
          </div>
        </div>
      </Card>
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
