"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Trash2, Edit3, Send } from "lucide-react";
import { UserHeaderActions } from "@/components/shared/TopBar/UserHeaderActions";
import { Button } from "@/components/ui/button";
import {
  useGetProjectPurchaseRequestQuery,
  useDeleteProjectPurchaseRequestMutation,
  usePatchProjectPurchaseRequestMutation,
  useSubmitProjectPurchaseRequestMutation,
} from "@/api/requests/projectPurchaseRequestApi";
import { useGetActivityOptionsQuery } from "@/api/requests/projectRequestApi";
import { StatusModal, useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import { FormActionFooter } from "@/components/shared/FormActionFooter";
import { useGetProjectCostingProjectQuery } from "@/api/projectCostingApi";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseRequestLineItemUi {
  id?: string | number;
  productName: string;
  description: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

interface PurchaseRequestItem {
  id: string;
  reference_id: string;
  title: string;
  status: "draft" | "approved" | "pending" | "rejected" | "cancelled";
  quantity: number;
  amount: number;
  requester: string;
  date: string;
  project: string;
  projectId?: number | string;
  activityId?: string;
  location: string;
  requiredDate: string;
  phase: string;
  task: string;
  notes: string;
  lines?: PurchaseRequestLineItemUi[];
}

const mapApiRequestToUi = (req: any): PurchaseRequestItem => {
  let parsedProject =
    req.project_details?.name ||
    (typeof (req as any).project_request === "object"
      ? (req as any).project_request?.project_details?.name
      : null) ||
    (typeof req.project === "number" ? `Project #${req.project}` : req.project) ||
    "Building project";

  let parsedPhase = req.phase_details?.name || req.phase || "Roofing";
  let parsedTask =
    req.activity_details?.name ||
    (req.activity ? `Activity ${req.activity}` : req.task || "P.O.P");

  const rawNotes = req.notes || req.purpose || "";
  let parsedNotes = rawNotes;

  if (rawNotes && typeof rawNotes === "string" && rawNotes.includes(" | ")) {
    const parts = rawNotes.split(" | ");
    let extractedNote = "";
    parts.forEach((part: string) => {
      if (part.startsWith("Project: ")) parsedProject = part.replace("Project: ", "").trim();
      if (part.startsWith("Phase: ")) parsedPhase = part.replace("Phase: ", "").trim();
      if (part.startsWith("Task: ")) parsedTask = part.replace("Task: ", "").trim();
      if (part.startsWith("Activity: ")) parsedTask = part.replace("Activity: ", "").trim();
      if (/^Notes?:/i.test(part)) {
        extractedNote = part.replace(/^Notes?:\s*/i, "").trim();
      }
    });
    parsedNotes = extractedNote;
  }

  if (typeof parsedNotes === "string") {
    parsedNotes = parsedNotes.trim();
    if (parsedNotes === "." || /^Notes?:\s*\.?$/i.test(parsedNotes)) {
      parsedNotes = "";
    }
  }

  const rawLines = req.lines || req.items || [];
  const mappedLines: PurchaseRequestLineItemUi[] = rawLines.map(
    (it: any, idx: number) => {
      const qty = Number(it.quantity || it.qty || 0);
      const cost = Number(it.estimated_unit_cost || it.estimated_unit_price || 0);
      const total = Number(it.line_total || qty * cost || 0);
      const name =
        it.product_name ||
        it.product_details?.product_name ||
        (typeof it.product === "number" ? `Product #${it.product}` : it.productName || "Cassava");
      return {
        id: it.id || idx,
        productName: name,
        description:
          it.description ||
          it.product_details?.product_description ||
          "",
        quantity: qty,
        unitCost: cost,
        lineTotal: total,
      };
    }
  );

  const totalQty =
    mappedLines.reduce((sum, item) => sum + item.quantity, 0) ||
    Number(req.quantity || 0);
  const totalAmount = Number(
    req.total_amount ||
      req.pr_total_price ||
      req.amount ||
      mappedLines.reduce((sum, item) => sum + item.lineTotal, 0)
  );

  let requesterName = "Requester";
  if (req.created_by_details && typeof req.created_by_details === "object") {
    const fullName = `${req.created_by_details.first_name || ""} ${req.created_by_details.last_name || ""}`.trim();
    requesterName = fullName || req.created_by_details.username || req.created_by_details.email || "Requester";
  } else if (
    typeof (req as any).project_request === "object" &&
    (req as any).project_request?.created_by_details
  ) {
    const prCreatedBy = (req as any).project_request.created_by_details;
    const fullName = `${prCreatedBy.first_name || ""} ${prCreatedBy.last_name || ""}`.trim();
    requesterName = fullName || prCreatedBy.username || prCreatedBy.email || "Requester";
  } else if (req.requester_details?.user) {
    const userObj = req.requester_details.user;
    const fullName = `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim();
    requesterName = fullName || userObj.username || userObj.email || "Requester";
  } else if (req.requester && typeof req.requester === "string" && isNaN(Number(req.requester))) {
    requesterName = req.requester;
  }

  const dateValue = req.created_at || req.date_created || req.date || Date.now();
  const formattedDate = new Date(dateValue).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const refId =
    (req.reference_id && String(req.reference_id).trim()) ||
    ((req as any).detail?.reference_id && String((req as any).detail.reference_id).trim()) ||
    (typeof req.project_request === "object" && req.project_request?.reference_id && String(req.project_request.reference_id).trim()) ||
    (typeof req.project_request === "string" && req.project_request.trim()) ||
    (req.id ? `PR${String(req.id).padStart(4, "0")}` : "PR-REQ");

  const statusVal =
    req.project_request?.status || req.request_status || req.status || "draft";
  const locationVal =
    req.site_location ||
    req.requesting_location_details?.location_name ||
    req.requesting_location ||
    req.location ||
    "-";

  const reqDateRaw = req.required_by_date || req.requiredDate || req.date_updated;
  const formattedRequiredDate = reqDateRaw
    ? new Date(reqDateRaw).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  const projectIdVal =
    req.project_details?.id ||
    (typeof (req as any).project_request === "object"
      ? (req as any).project_request?.project
      : null) ||
    req.project;

  return {
    id: String(req.id),
    reference_id: refId,
    title: req.title || "Purchase Request",
    status: (statusVal.toLowerCase() as any) || "draft",
    quantity: totalQty,
    amount: totalAmount,
    requester: requesterName,
    date: formattedDate,
    project: parsedProject,
    projectId: projectIdVal,
    activityId: req.activity || req.activity_details?.id,
    location: locationVal,
    requiredDate: formattedRequiredDate,
    phase: parsedPhase,
    task: parsedTask,
    notes: parsedNotes || "",
    lines: mappedLines,
  };
};

export default function PurchaseRequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { canDo } = useModulePermissions();
  const [request, setRequest] = useState<PurchaseRequestItem | null>(null);
  const statusModal = useStatusModal();

  const { data: apiData, isLoading: isApiLoading } = useGetProjectPurchaseRequestQuery(
    id as string,
    { skip: !id }
  );

  const [deleteRequest, { isLoading: isDeleting }] = useDeleteProjectPurchaseRequestMutation();
  const [patchRequest, { isLoading: isUpdating }] = usePatchProjectPurchaseRequestMutation();
  const [submitProjectRequest, { isLoading: isSubmitting }] = useSubmitProjectPurchaseRequestMutation();

  useEffect(() => {
    if (apiData) {
      setRequest(mapApiRequestToUi(apiData));
    } else {
      setRequest(null);
    }
  }, [id, apiData]);

  const projectId = request?.projectId;
  const activityId = request?.activityId;

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(projectId),
    { skip: !projectId || isNaN(Number(projectId)) }
  );

  const phaseId = request?.phase || apiData?.phase_details?.id || apiData?.phase;
  const { data: rawActivityOptions = [] } = useGetActivityOptionsQuery(
    { project_id: Number(projectId), phase_id: String(phaseId) },
    { skip: !projectId || !phaseId }
  );

  const availableBudget = useMemo(() => {
    // 1. Check activity options from permission-safe endpoint
    if (activityId && Array.isArray(rawActivityOptions) && rawActivityOptions.length > 0) {
      const match = rawActivityOptions.find((a: any) => String(a.id) === String(activityId));
      if (match) {
        if (match.available_budget !== undefined && match.available_budget !== null) {
          return Number(match.available_budget);
        }
        if (match.current_budget !== undefined && match.current_budget !== null) {
          return Number(match.current_budget);
        }
      }
    }

    // 2. Check direct available_budget on request
    if (apiData?.available_budget !== undefined && apiData?.available_budget !== null) {
      const num = Number(apiData.available_budget);
      if (!isNaN(num) && num > 0) return num;
    }

    // 3. Fallback to project costing if available
    if (projectCosting && activityId) {
      const phasesArr = Array.isArray(projectCosting.phases)
        ? projectCosting.phases
        : Array.isArray((projectCosting as any).phase_list)
        ? (projectCosting as any).phase_list
        : [];

      for (const ph of phasesArr) {
        const acts = Array.isArray(ph.activities)
          ? ph.activities
          : Array.isArray(ph.activity_list)
          ? ph.activity_list
          : [];
        const act = acts.find((a: any) => String(a.id || a.activity_id) === String(activityId));
        if (act) {
          if (act.available_budget !== undefined && act.available_budget !== null)
            return Number(act.available_budget);
          if (act.remaining_budget !== undefined && act.remaining_budget !== null)
            return Number(act.remaining_budget);
          if (act.current_budget !== undefined && act.current_budget !== null)
            return Number(act.current_budget);
          if (act.amount !== undefined && act.amount !== null) return Number(act.amount);
        }
      }
    }

    if (projectCosting?.financials) {
      if (
        projectCosting.financials.remaining_budget !== undefined &&
        projectCosting.financials.remaining_budget !== null
      )
        return Number(projectCosting.financials.remaining_budget);
      if (
        projectCosting.financials.budget !== undefined &&
        projectCosting.financials.budget !== null
      )
        return Number(projectCosting.financials.budget);
    }

    return 0;
  }, [projectCosting, activityId, rawActivityOptions, apiData]);

  const handleDelete = () => {
    statusModal.showConfirm(
      "Delete Purchase Request",
      "Are you sure you want to delete this purchase request? This action cannot be undone.",
      async () => {
        try {
          const deleteId =
            (typeof apiData?.project_request === "object"
              ? (apiData?.project_request as any)?.id
              : apiData?.project_request) ||
            (apiData as any)?.project_request_id ||
            apiData?.id ||
            id;
          await deleteRequest(deleteId).unwrap();
          statusModal.showSuccess(
            "Request Deleted",
            "The purchase request has been deleted successfully.",
            "Go to Requests",
            () => {
              statusModal.close();
              router.push("/project-request/purchase-request");
            }
          );
        } catch (error: any) {
          console.error("Failed to delete request:", error);
          statusModal.showError(
            "Delete Failed",
            extractErrorMessage(error, formatApiError(error) || "Failed to delete purchase request. Please try again.")
          );
        }
      }
    );
  };

  const handleModalClose = () => {
    const isDeleted = statusModal.type === "success" && statusModal.title === "Request Deleted";
    statusModal.close();
    if (isDeleted) {
      router.push("/project-request/purchase-request");
    }
  };

  const formatApiError = (error: any): string => {
    if (!error) return "An unexpected error occurred.";
    const data = error.data || error;

    if (data?.error && Array.isArray(data.error)) {
      const messages = data.error.map((errObj: any) => {
        if (typeof errObj === "string") return errObj;
        if (errObj && typeof errObj === "object") {
          const msg = errObj.error || errObj.message || "Error";
          const extraDetails: string[] = [];
          if (errObj.available !== undefined && errObj.available !== null) {
            extraDetails.push(
              `Available: ₦${Number(errObj.available).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}`
            );
          }
          if (errObj.requested !== undefined && errObj.requested !== null) {
            extraDetails.push(
              `Requested: ₦${Number(errObj.requested).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}`
            );
          }
          if (errObj.activity_budget !== undefined && errObj.activity_budget !== null) {
            extraDetails.push(
              `Activity Budget: ₦${Number(errObj.activity_budget).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}`
            );
          }
          if (extraDetails.length > 0) {
            return `${msg} (${extraDetails.join(", ")})`;
          }
          return msg;
        }
        return JSON.stringify(errObj);
      });
      if (messages.length > 0) return messages.join(" | ");
    }

    if (Array.isArray(data)) {
      const messages = data.map((errObj: any) => {
        if (typeof errObj === "string") return errObj;
        if (errObj && typeof errObj === "object") {
          const msg = errObj.error || errObj.message || "Error";
          const extraDetails: string[] = [];
          if (errObj.available !== undefined && errObj.available !== null) {
            extraDetails.push(
              `Available: ₦${Number(errObj.available).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}`
            );
          }
          if (errObj.requested !== undefined && errObj.requested !== null) {
            extraDetails.push(
              `Requested: ₦${Number(errObj.requested).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}`
            );
          }
          if (errObj.activity_budget !== undefined && errObj.activity_budget !== null) {
            extraDetails.push(
              `Activity Budget: ₦${Number(errObj.activity_budget).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}`
            );
          }
          if (extraDetails.length > 0) {
            return `${msg} (${extraDetails.join(", ")})`;
          }
          return msg;
        }
        return JSON.stringify(errObj);
      });
      if (messages.length > 0) return messages.join(" | ");
    }

    if (typeof data?.error === "string") {
      return data.error;
    }
    if (data?.message && typeof data.message === "string") {
      return data.message;
    }
    if (data?.detail && typeof data.detail === "string") {
      return data.detail;
    }
    if (typeof data === "object") {
      const fieldErrors: string[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          fieldErrors.push(`${key}: ${val.join(", ")}`);
        } else if (typeof val === "string") {
          fieldErrors.push(`${key}: ${val}`);
        }
      });
      if (fieldErrors.length > 0) return fieldErrors.join(" | ");
    }
    if (typeof data === "string") return data;
    return error.message || "Failed to update status on server.";
  };

  const handleStatusChange = async (newStatus: "approved" | "rejected" | "pending", confirmOverBudget = false) => {
    try {
      if (newStatus === "pending" && apiData) {
        const parentId =
          typeof apiData.project_request === "object"
            ? (apiData.project_request as any)?.id
            : apiData.project_request;

        if (parentId) {
          const payloadData = confirmOverBudget ? { confirm_over_budget: true } : {};
          await submitProjectRequest({ id: parentId as number, data: payloadData }).unwrap();
          if (request) {
            setRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
          statusModal.showSuccess(
            "Request Submitted",
            "Your purchase request has been submitted for approval."
          );
          return;
        }
      }

      await patchRequest({ id: id as string, data: { status: newStatus } }).unwrap();
      if (request) {
        setRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      statusModal.showSuccess(
        "Status Updated",
        `Request status has been updated to ${newStatus}.`
      );
    } catch (error: any) {
      console.error("API Error Response:", error);
      const errData = error?.data || error?.response?.data || error?.error?.data || error || {};
      const isOverBudget =
        errData?.confirmation_required === true ||
        errData?.code === "OVER_BUDGET" ||
        errData?.warning === true;

      if (isOverBudget) {
        const msg =
          errData?.confirmation_message ||
          errData?.message ||
          "This request is higher than the amount currently available for the selected activity. Do you want to continue?";

        let detailText = "";
        if (errData?.details) {
          const d = errData.details;
          const reqAmt = d.requested_amount ? `₦${Number(d.requested_amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : null;
          const availAmt = d.available_budget ? `₦${Number(d.available_budget).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : null;
          const overAmt = d.amount_over_budget ? `₦${Number(d.amount_over_budget).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : null;

          const parts: string[] = [];
          if (reqAmt) parts.push(`Requested: ${reqAmt}`);
          if (availAmt) parts.push(`Available: ${availAmt}`);
          if (overAmt) parts.push(`Over Budget: ${overAmt}`);
          if (parts.length > 0) {
            detailText = `\n\n• ${parts.join("\n• ")}`;
          }
        }

        statusModal.showConfirm(
          "Over Budget Warning",
          `${msg}${detailText}`,
          async () => {
            await handleStatusChange(newStatus, true);
          },
          "Yes, Continue",
          "No, Cancel"
        );
        return;
      }

      const errorMsg = formatApiError(error);
      statusModal.showError(
        "Submission Failed",
        errorMsg
      );
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "approved").toLowerCase();
    switch (s) {
      case "approved":
        return (
          <span className="bg-[#D8F5E5] text-[#22C55E] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center">
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="bg-[#FEF9C3] text-[#CA8A04] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center">
            Pending
          </span>
        );
      case "draft":
        return (
          <span className="bg-[#EFF6FF] text-[#3B82F6] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center">
            Draft
          </span>
        );
      case "rejected":
        return (
          <span className="bg-[#FEE2E2] text-[#EF4444] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center">
            Rejected
          </span>
        );
      default:
        return (
          <span className="bg-[#D8F5E5] text-[#22C55E] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center capitalize">
            {status}
          </span>
        );
    }
  };

  if (isApiLoading || !request) {
    return (
      <div className="min-h-screen bg-white font-['Open_Sans',sans-serif]">
        <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-6 h-6 rounded-md bg-gray-200" />
              <Skeleton className="h-6 w-32 rounded bg-gray-200" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded-full bg-gray-200" />
              <Skeleton className="w-9 h-9 rounded-full bg-gray-200" />
            </div>
          </div>
        </header>
        <div className="w-full h-2.5 bg-[#F1F3F6]" />
        <main className="max-w-4xl mx-auto px-5 py-6 space-y-6">
          <Skeleton className="h-6 w-36 rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-y-5 gap-x-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded bg-gray-200" />
                <Skeleton className="h-4 w-28 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const isDraft = request.status === "draft";
  const canEdit = isDraft && canDo("project_request", "edit");
  const canDelete = isDraft && canDo("project_request", "delete");
  const canSubmit = isDraft;

  const totalCost = request.amount || (request.lines?.reduce((sum, item) => sum + item.lineTotal, 0) ?? 0);

  const displayProducts = request.lines || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-white text-[#111827] font-['Open_Sans',sans-serif] pb-32"
    >
      <div className="max-w-4xl mx-auto bg-white min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="w-full bg-white px-5 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/project-request/purchase-request")}
              className="p-1 -ml-1 text-[#1F2937] hover:text-black transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <h1 className="text-[18px] font-normal text-[#1F2937]">Request Details</h1>
          </div>

          <UserHeaderActions />
        </header>

        {/* Divider Bar under header */}
        <div className="w-full h-2.5 bg-[#F1F3F6] shrink-0" />

        {/* Main Content Area */}
        <main className="px-5 py-6 space-y-7 flex-1">
          {/* Basic Information */}
          <section>
            <h2 className="text-lg text-[#3B7CED] mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Request ID</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.reference_id}</span>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Status</span>
                <div>{renderStatusBadge(request.status)}</div>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Request Type</span>
                <span className="block text-[14px] font-semibold text-black/80">Purchase Request</span>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Requested by</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.requester}</span>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Project</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.project}</span>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Site Location</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.location}</span>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Required By Date</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.requiredDate}</span>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Date</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.date}</span>
              </div>
            </div>
          </section>

          {/* WBS */}
          <section>
            <h2 className="text-lg font-normal text-[#3B7CED] mb-4">WBS</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Phase</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.phase}</span>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Task</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.task}</span>
              </div>
            </div>
          </section>

          {/* Products */}
          <section>
            <h2 className="text-lg font-normal text-[#3B7CED] mb-4">Products</h2>
            <div className="space-y-3">
              {displayProducts.map((line, idx) => (
                <div
                  key={line.id || idx}
                  className="bg-[#F5F8FF] border border-[#E5EEFF] rounded-[8px] p-3.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[14px] font-semibold text-black/80">{line.productName}</span>
                    <span className="text-[14px] font-semibold text-black/80">
                      ₦{line.lineTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#475569] font-normal mt-0.5">{line.quantity} QTY</div>
                  {line.description && (
                    <div className="text-[11px] text-[#8C9BAE] font-normal mt-0.5">
                      {line.description}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Note */}
            <div className="mt-5">
              <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Note</span>
              <span className="block text-[14px] font-semibold text-black/80">
                {request.notes || "-"}
              </span>
            </div>
          </section>
        </main>

        {/* Thick Divider Bar before Summary */}
        <div className="w-full h-2.5 bg-[#F1F3F6] shrink-0" />

        {/* Budget & Cost Summary */}
        <section className="px-5 py-4 space-y-2 bg-white shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-semibold text-black/80">Available Budget</span>
            <span className="text-[14px] font-semibold text-black/80">
              ₦{availableBudget.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-semibold text-[#111827]">Total Cost</span>
            <span className="text-[14px] font-semibold text-[#3B82F6]">
              ₦{totalCost.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </section>

        {/* Floating Bottom Action Bar for Draft/Editable requests */}
        {(canEdit || canDelete || canSubmit) && (
          <FormActionFooter
            maxWidth="max-w-4xl"
            zIndex="z-40"
            className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3.5 shadow-lg"
            containerClassName="flex items-center justify-between gap-3"
          >
            <div className="w-full flex items-center justify-end gap-2.5">
              {canDelete && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-10 px-3.5 text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 rounded-lg gap-1.5"
                >
                  <Trash2 size={15} /> {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}

              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/project-request/purchase-request/${request.id}/edit`)}
                  className="h-10 px-4 text-xs font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg gap-1.5"
                >
                  <Edit3 size={15} /> Edit
                </Button>
              )}

              {canSubmit && (
                <Button
                  disabled={isSubmitting || isUpdating}
                  onClick={() => handleStatusChange("pending")}
                  className="h-10 px-4 text-xs font-semibold bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg gap-1.5 shadow-sm"
                >
                  <Send size={14} /> Submit
                </Button>
              )}
            </div>
          </FormActionFooter>
        )}

        {/* Status Modal */}
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={handleModalClose}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.actionText}
          onAction={statusModal.onAction}
          secondaryText={statusModal.secondaryText}
          onSecondary={statusModal.onSecondary}
          actionVariant={statusModal.actionVariant}
        />
      </div>
    </motion.div>
  );
}
