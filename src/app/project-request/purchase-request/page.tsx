"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetProjectPurchaseRequestsQuery } from "@/api/requests/projectPurchaseRequestApi";
import { RequestDashboard } from "@/components/requests/RequestDashboard";
import { RequestDashboardConfig, RequestStatus } from "@/components/requests/types";

interface PurchaseRequestItem {
  id: string;
  reference_id: string;
  title: string;
  status: "draft" | "approved" | "pending" | "rejected";
  quantity: number;
  amount: number;
  requester: string;
  date: string;
  project: string;
  productName: string;
}

const mapApiRequestToUi = (req: any): PurchaseRequestItem => {
  let parsedProject =
    req.project_details?.name ||
    (typeof req.project_request === "object"
      ? (req as any).project_request?.project_details?.name
      : null) ||
    (typeof req.project === "number"
      ? `Project #${req.project}`
      : req.project) ||
    "Project";

  const rawLines = req.lines || req.items || [];
  
  let parsedProductName = "Product";
  if (req.product_name) {
    parsedProductName = req.product_name;
  } else if (req.product?.name) {
    parsedProductName = req.product.name;
  } else if (rawLines.length > 0) {
    const firstLine = rawLines[0];
    parsedProductName = firstLine.product_name || firstLine.item_name || firstLine.product?.name || firstLine.name || firstLine.description || "Product";
  }

  const totalQty =
    rawLines.reduce(
      (sum: number, item: any) => sum + Number(item.quantity || item.qty || 0),
      0,
    ) || Number(req.quantity || 0);
  const totalAmount = Number(
    req.total_amount ||
      req.pr_total_price ||
      req.amount ||
      rawLines.reduce(
        (sum: number, item: any) =>
          sum +
          Number(
            item.line_total ||
              (item.quantity || item.qty || 0) *
                (item.estimated_unit_cost || item.estimated_unit_price || 0) ||
              0,
          ),
        0,
      ),
  );

  let requesterName = "";
  if (req.created_by_details && typeof req.created_by_details === "object") {
    const fullName = `${req.created_by_details.first_name || ""} ${req.created_by_details.last_name || ""}`.trim();
    requesterName = fullName || req.created_by_details.username || req.created_by_details.email || "Requester";
  } else if (
    typeof req.project_request === "object" &&
    (req as any).project_request?.created_by_details
  ) {
    const prCreatedBy = (req as any).project_request.created_by_details;
    const fullName = `${prCreatedBy.first_name || ""} ${prCreatedBy.last_name || ""}`.trim();
    requesterName = fullName || prCreatedBy.username || prCreatedBy.email || "Requester";
  } else if (req.requester_details?.user) {
    const userObj = req.requester_details.user;
    const fullName = `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim();
    requesterName = fullName || userObj.username || userObj.email || "Requester";
  } else if (
    req.requester &&
    typeof req.requester === "string" &&
    isNaN(Number(req.requester))
  ) {
    requesterName = req.requester;
  } else if (req.created_by_id) {
    requesterName = `User #${req.created_by_id}`;
  }

  if (!requesterName) {
    requesterName = "Unknown";
  }

  const dateValue =
    req.created_at || req.date_created || req.date || Date.now();
  const formattedDate = new Date(dateValue).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const refId =
    req.reference_id ||
    (typeof req.project_request === "object"
      ? (req as any).project_request?.reference_id
      : null) ||
    (req.id ? `PR-${String(req.id).padStart(5, "0")}` : "PR-REQ");
    
  const statusVal =
    req.request_status ||
    req.status ||
    (typeof req.project_request === "object"
      ? (req as any).project_request?.status
      : null) ||
    "pending";

  return {
    id: String(req.id),
    reference_id: refId,
    title: parsedProject,
    status: (statusVal.toLowerCase() as any) || "pending",
    quantity: totalQty,
    amount: totalAmount,
    requester: requesterName,
    date: formattedDate,
    project: parsedProject,
    productName: parsedProductName,
  };
};

export default function PurchaseRequestsDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequestItem[]>([]);

  const { data: apiRequests, isLoading: isApiLoading, refetch } =
    useGetProjectPurchaseRequestsQuery(undefined, { refetchOnMountOrArgChange: true });

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    let raw: any[] = [];
    if (apiRequests && Array.isArray(apiRequests)) {
      raw = apiRequests;
    } else if (apiRequests && Array.isArray((apiRequests as any).results)) {
      raw = (apiRequests as any).results;
    }
    const sorted = [...raw].sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.date_created || a.date || 0).getTime();
      const dateB = new Date(b.created_at || b.date_created || b.date || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
    setRequests(sorted.map(mapApiRequestToUi));
  }, [apiRequests]);

  const getStatusBadgeVariant = (
    status: "draft" | "approved" | "pending" | "rejected",
  ) => {
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

  const getStatusCounts = () => {
    const counts = {
      draft: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    requests.forEach((req) => {
      if (counts[req.status] !== undefined) {
        counts[req.status]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const config: RequestDashboardConfig<PurchaseRequestItem> = {
    title: "Purchase Request",
    idPrefix: "PR",
    newRequestPath: "/project-request/purchase-request/new",
    statusCounts,
    summaryConfigs: [
      {
        status: "draft",
        label: "Draft",
        icon: FileText,
        colorClass: "text-[#3B7CED]",
        bgColorClass: "bg-[#F3F8FF]",
        borderColorClass: "border-[#D0E0FB]",
      },
      {
        status: "approved",
        label: "Approved",
        icon: CheckCircle,
        colorClass: "text-[#2BA24D]",
        bgColorClass: "bg-[#F2FDF5]",
        borderColorClass: "border-[#D7F4DF]",
      },
      {
        status: "pending",
        label: "Pending",
        icon: Clock,
        colorClass: "text-[#F0B401]",
        bgColorClass: "bg-[#FFFDF5]",
        borderColorClass: "border-[#FFF2CC]",
      },
      {
        status: "rejected",
        label: "Rejected",
        icon: XCircle,
        colorClass: "text-[#E43D2B]",
        bgColorClass: "bg-[#FFF7F6]",
        borderColorClass: "border-[#F9D6D2]",
      },
    ],
    renderItem: (req) => (
      <div
        key={req.id}
        onClick={() =>
          router.push(`/project-request/purchase-request/${req.id}`)
        }
        className="p-4 border border-gray-200 rounded-lg bg-white hover:border-[#3B7CED] hover:shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-[#3B7CED]">
            {req.reference_id}
          </span>
          <Badge variant={getStatusBadgeVariant(req.status)}>
            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
          </Badge>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-[#3B7CED] transition-colors">
          {req.title}
        </h3>
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-2">
          <span>{req.productName}</span>
        </div>

        <div className="grid grid-cols-3 text-xs gap-2 border-t border-gray-50 pt-3">
          <div>
            <span className="block text-gray-400 font-medium mb-0.5">
              Quantity
            </span>
            <span className="font-bold text-gray-800">
              {req.quantity}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-gray-400 font-medium mb-0.5">
              Amount
            </span>
            <span className="font-bold text-gray-800">
              ₦
              {req.amount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-gray-400 font-medium mb-0.5">
              Requester
            </span>
            <span className="font-bold text-gray-800 truncate block">
              {req.requester}
            </span>
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
      isLoading={isApiLoading && requests.length === 0}
    />
  );
}

