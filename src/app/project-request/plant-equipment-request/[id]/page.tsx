"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Trash2,
  Edit3,
  Send,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { extractErrorMessage } from "@/lib/utils";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetPlantEquipmentRequestQuery,
  useDeletePlantEquipmentRequestMutation,
  useSubmitPlantEquipmentRequestMutation,
} from "@/api/requests/plantEquipmentRequestApi";
import {
  useGetProjectCostingProjectsQuery,
  useGetProjectCostingProjectQuery,
} from "@/api/projectCostingApi";

interface PlantEquipmentRequestItem {
  id: string;
  project: string;
  projectId?: number;
  activityId?: string;
  equipment: string;
  description: string;
  quantity: number;
  estimatedCost: number;
  status: "draft" | "approved" | "pending" | "rejected";
  requester: string;
  date: string;
  requiredDate: string;
  phase: string;
  task: string;
  notes: string;
}

export default function PlantEquipmentRequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const statusModal = useStatusModal();
  const { canDo } = useModulePermissions();

  const numericId = Number(id);
  const { data: apiRequest, isLoading: apiLoading, refetch } = useGetPlantEquipmentRequestQuery(numericId, {
    skip: isNaN(numericId),
  });
  const [deleteRequest, { isLoading: isDeleting }] = useDeletePlantEquipmentRequestMutation();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitPlantEquipmentRequestMutation();

  const { data: projectsData } = useGetProjectCostingProjectsQuery({});
  const projects = useMemo(() => {
    return Array.isArray(projectsData)
      ? projectsData
      : (projectsData as any)?.results || [];
  }, [projectsData]);

  const request = useMemo<PlantEquipmentRequestItem | null>(() => {
    if (!apiRequest) return null;
    const req = apiRequest as any;
    const projectId =
      req.project_details?.id ||
      req.project_request_id ||
      req.project_request?.id ||
      req.project_request ||
      req.project;
    const projectObj = projects.find((p: any) => p.id === projectId || String(p.id) === String(projectId));

    let requesterName = "Firstname Lastname";
    if (req.created_by_details && typeof req.created_by_details === "object") {
      const fullName = `${req.created_by_details.first_name || ""} ${req.created_by_details.last_name || ""}`.trim();
      requesterName = fullName || req.created_by_details.username || req.created_by_details.email || "Firstname Lastname";
    } else if (
      typeof req.project_request === "object" &&
      req.project_request?.created_by_details
    ) {
      const prCreatedBy = req.project_request.created_by_details;
      const fullName = `${prCreatedBy.first_name || ""} ${prCreatedBy.last_name || ""}`.trim();
      requesterName = fullName || prCreatedBy.username || prCreatedBy.email || "Firstname Lastname";
    } else if (req.requester_details?.user) {
      const userObj = req.requester_details.user;
      const fullName = `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim();
      requesterName = fullName || userObj.username || userObj.email || "Firstname Lastname";
    } else if (req.created_by_name && typeof req.created_by_name === "string") {
      requesterName = req.created_by_name;
    } else if (req.requester_name && typeof req.requester_name === "string") {
      requesterName = req.requester_name;
    } else if (req.requester && typeof req.requester === "string" && isNaN(Number(req.requester))) {
      requesterName = req.requester;
    }

    const reqDateRaw = req.required_date || req.required_by_date;
    const formattedRequiredDate = reqDateRaw
      ? new Date(reqDateRaw).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "4 Apr 2024";

    const formattedCreatedDate = req.created_at || req.date_created
      ? new Date(req.created_at || req.date_created).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

    const refId =
      (req.reference_id && String(req.reference_id).trim()) ||
      ((req as any).detail?.reference_id && String((req as any).detail.reference_id).trim()) ||
      (req.project_request?.reference_id && String(req.project_request.reference_id).trim()) ||
      `PE${String(req.id || id).padStart(4, "0")}`;

    const statusVal = req.status || req.request_status || req.project_request?.status || "approved";

    let phaseName = req.phase_details?.name || req.phase_name || req.phase || "Roofing";
    let taskName = req.activity_details?.name || req.activity_name || (req.activity ? `Activity ${req.activity}` : req.task || "P.O.P");

    if (projectObj && projectObj.wbs) {
      const pMatch = projectObj.wbs.find((w: any) => String(w.id) === String(req.phase));
      if (pMatch) phaseName = pMatch.name;
      const aMatch = projectObj.wbs.find((w: any) => String(w.id) === String(req.activity || req.task));
      if (aMatch) taskName = aMatch.name;
    }

    const estCost =
      parseFloat(req.estimated_cost || req.amount || req.total_estimated_cost || "500000") || 500000;

    return {
      id: refId,
      project: req.project_details?.name || projectObj?.name || (projectId ? `Project #${projectId}` : "Building project"),
      projectId: typeof projectId === "number" ? projectId : undefined,
      activityId: req.activity || req.activity_details?.id,
      equipment: req.equipment_name || req.equipment || "Engineer",
      description: req.description || req.equipment_description || "-",
      quantity: Number(req.quantity || 24),
      estimatedCost: estCost,
      status: statusVal.toLowerCase() as any,
      requester: requesterName,
      date: formattedCreatedDate,
      requiredDate: formattedRequiredDate,
      phase: phaseName,
      task: taskName,
      notes: req.notes || req.justification_notes || "-",
    };
  }, [apiRequest, projects, id]);

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(request?.projectId),
    { skip: !request?.projectId || isNaN(Number(request.projectId)) }
  );

  const availableBudget = useMemo(() => {
    const rawBudget = (apiRequest as any)?.available_budget;
    if (rawBudget !== undefined && rawBudget !== null && rawBudget !== "") {
      const parsed = Number(rawBudget);
      if (!isNaN(parsed)) return parsed;
    }

    if (!projectCosting) return 5000000;

    if (request?.activityId) {
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
        const act = acts.find((a: any) => String(a.id || a.activity_id) === String(request.activityId));
        if (act) {
          if (act.available_budget !== undefined && act.available_budget !== null)
            return Number(act.available_budget);
          if (act.remaining_budget !== undefined && act.remaining_budget !== null)
            return Number(act.remaining_budget);
          if (act.amount !== undefined && act.amount !== null) return Number(act.amount);
        }
      }
    }

    if (projectCosting.financials) {
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

    return 5000000;
  }, [apiRequest, projectCosting, request]);

  const handleDelete = () => {
    statusModal.showConfirm(
      "Delete Plant & Equipment Request",
      "Are you sure you want to delete this plant and equipment request? This action cannot be undone.",
      async () => {
        try {
          const parentId =
            (typeof (apiRequest as any)?.project_request === "object"
              ? (apiRequest as any)?.project_request?.id
              : (apiRequest as any)?.project_request) ||
            (apiRequest as any)?.project_request_id ||
            numericId;
          await deleteRequest(Number(parentId)).unwrap();
          statusModal.showSuccess(
            "Request Deleted",
            "The plant and equipment request has been deleted successfully.",
            "Go to Requests",
            () => {
              statusModal.close();
              router.push("/project-request/plant-equipment-request");
            }
          );
        } catch (err) {
          statusModal.showError("Delete Failed", extractErrorMessage(err, "Failed to delete the request."));
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      const parentId =
        typeof (apiRequest as any)?.project_request === "object"
          ? (apiRequest as any)?.project_request?.id
          : (apiRequest as any)?.project_request || numericId;
      await submitRequest({ id: Number(parentId), data: {} }).unwrap();
      statusModal.showSuccess("Request Submitted", "The plant and equipment request has been submitted for approval.");
      refetch();
    } catch (err) {
      statusModal.showError("Submit Failed", extractErrorMessage(err, "Failed to submit the request."));
    }
  };

  const handleModalClose = () => {
    const isDeleted = statusModal.type === "success" && statusModal.title === "Request Deleted";
    statusModal.close();
    if (isDeleted) {
      router.push("/project-request/plant-equipment-request");
    }
  };

  const renderStatusBadge = (status?: string) => {
    const s = (status || "approved").toLowerCase();
    switch (s) {
      case "approved":
        return (
          <span className="bg-[#D8F5E5] text-[#22C55E] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center">
            Approved
          </span>
        );
      case "pending":
      case "submitted":
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
            {status || "Approved"}
          </span>
        );
    }
  };

  if (apiLoading || !request) {
    return (
      <div className="min-h-screen bg-white font-['Open_Sans',sans-serif]">
        <header className="w-full bg-white px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-6 h-6 rounded-md bg-gray-200" />
            <Skeleton className="h-6 w-32 rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-full bg-gray-200" />
            <Skeleton className="w-9 h-9 rounded-full bg-gray-200" />
          </div>
        </header>
        <div className="w-full h-2.5 bg-[#F1F3F6]" />
        <main className="max-w-[430px] mx-auto px-5 py-6 space-y-6">
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

  return (
    <PageGuard module="project_request" entitlement="view">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-white text-[#111827] font-['Open_Sans',sans-serif] pb-32"
      >
        <div className="max-w-[430px] mx-auto bg-white min-h-screen flex flex-col">
          {/* Top Header */}
          <header className="w-full bg-white px-5 h-16 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/project-request/plant-equipment-request")}
                className="p-1 -ml-1 text-[#1F2937] hover:text-black transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
              <h1 className="text-[18px] font-normal text-[#1F2937]">Request Details</h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-[#1E293B] hover:opacity-80 transition-opacity">
                <Bell size={22} strokeWidth={2} className="fill-current" />
              </button>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FECDD3] flex items-center justify-center shrink-0">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="User Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </header>

          {/* Divider Bar under header */}
          <div className="w-full h-2.5 bg-[#F1F3F6] shrink-0" />

          {/* Main Content Area */}
          <main className="px-5 py-6 space-y-7 flex-1">
            {/* Basic Information */}
            <section>
              <h2 className="text-lg font-normal text-[#3B7CED] mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Request ID</span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.id}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Status</span>
                  <div>{renderStatusBadge(request.status)}</div>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Request Type</span>
                  <span className="block text-[14px] font-semibold text-black/80">
                    Plant & Equipment Request
                  </span>
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
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Equipment Name</span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.equipment}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Quantity</span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.quantity}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Required Date</span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.requiredDate}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                  Description
                </span>
                <span className="block text-[14px] font-semibold text-black/80">{request.description}</span>
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

            {/* Cost Details */}
            <section>
              <h2 className="text-lg font-normal text-[#3B7CED] mb-4">Cost Details</h2>
              <div className="mb-4">
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                  Estimated Cost
                </span>
                <span className="block text-[14px] font-semibold text-black/80">
                  N{request.estimatedCost.toLocaleString("en-NG")}
                </span>
              </div>

              {/* Note */}
              <div className="mt-5">
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Note</span>
                <span className="block text-[14px] font-semibold text-black/80">{request.notes}</span>
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
                N{availableBudget.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black/80">Total Cost</span>
              <span className="text-[14px] font-semibold text-[#3B82F6]">
                N{request.estimatedCost.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </section>

          {/* Floating Bottom Action Bar for Draft/Editable requests */}
          {(canEdit || canDelete || canSubmit) && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3.5 z-40 shadow-lg">
              <div className="max-w-[430px] mx-auto flex items-center justify-between gap-3">
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
                      onClick={() => router.push(`/project-request/plant-equipment-request/edit/${numericId}`)}
                      className="h-10 px-4 text-xs font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg gap-1.5"
                    >
                      <Edit3 size={15} /> Edit
                    </Button>
                  )}

                  {canSubmit && (
                    <Button
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="h-10 px-4 text-xs font-semibold bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg gap-1.5 shadow-sm"
                    >
                      <Send size={14} /> Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
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
    </PageGuard>
  );
}
