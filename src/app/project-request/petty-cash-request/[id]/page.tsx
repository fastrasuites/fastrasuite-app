"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Trash2,
  Edit3,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  useGetProjectRequestQuery,
  useDeleteProjectRequestMutation,
  useSubmitProjectRequestMutation,
  useGetPhaseOptionsQuery,
  useGetActivityOptionsQuery,
} from "@/api/requests/projectRequestApi";
import { useGetPettyCashRequestQuery } from "@/api/requests/pettyCashRequestApi";
import {
  useGetProjectCostingProjectsQuery,
  useGetProjectCostingProjectQuery,
} from "@/api/projectCostingApi";
import { Button } from "@/components/ui/button";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { extractErrorMessage } from "@/lib/utils";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface PettyCashRequestDetail {
  id: string;
  reference_id: string;
  project: string;
  projectId?: number;
  activityId?: string;
  purpose: string;
  description: string;
  amountRequested: number;
  status: "draft" | "approved" | "pending" | "rejected" | "cancelled" | string;
  requester: string;
  date: string;
  phase: string;
  task: string;
  notes: string;
}

export default function PettyCashRequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const numericId = Number(id);
  const { canDo } = useModulePermissions();
  const statusModal = useStatusModal();
  const { fullName: currentUserName } = useCurrentUser();

  const [deleteRequest, { isLoading: isDeleting }] = useDeleteProjectRequestMutation();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitProjectRequestMutation();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Attempt to fetch from ProjectRequest API
  const { data: apiProjectRequest, isLoading: isProjectLoading } = useGetProjectRequestQuery(numericId, {
    skip: isNaN(numericId),
  });

  // Attempt to fetch from PettyCashRequest API
  const { data: apiPettyCash, isLoading: isPettyCashLoading } = useGetPettyCashRequestQuery(numericId, {
    skip: isNaN(numericId),
  });

  const apiLoading = isProjectLoading && isPettyCashLoading;
  const rawRequest: any = apiPettyCash || apiProjectRequest;

  const { data: rawProjects } = useGetProjectCostingProjectsQuery({});
  const projects = useMemo(() => {
    return Array.isArray(rawProjects) ? rawProjects : (rawProjects as any)?.results || [];
  }, [rawProjects]);

  const detail: any = useMemo(() => {
    if (!rawRequest) return {};
    const d = rawRequest.detail || apiProjectRequest?.detail || apiPettyCash?.detail;
    if (!d) return {};
    if (typeof d === "string") {
      try {
        return JSON.parse(d);
      } catch {
        return {};
      }
    }
    return d;
  }, [rawRequest, apiProjectRequest, apiPettyCash]);

  const projectId = useMemo(() => {
    const p =
      rawRequest?.project ||
      rawRequest?.project_id ||
      rawRequest?.project_details?.id ||
      detail?.project ||
      detail?.projectId ||
      apiProjectRequest?.project;
    return p ? Number(p) : undefined;
  }, [rawRequest, detail, apiProjectRequest]);

  const phaseId = useMemo(() => {
    return String(
      rawRequest?.phase_details?.id ||
      rawRequest?.phase ||
      detail?.phase ||
      ""
    );
  }, [rawRequest, detail]);

  const activityId = useMemo(() => {
    return String(
      rawRequest?.activity_details?.id ||
      rawRequest?.activity ||
      rawRequest?.wbs_element ||
      detail?.activity ||
      detail?.task ||
      detail?.wbs_element ||
      ""
    );
  }, [rawRequest, detail]);

  // Query live phase & activity options
  const { data: phaseOptions = [] } = useGetPhaseOptionsQuery(
    { project_id: projectId! },
    { skip: !projectId || isNaN(projectId) }
  );

  const { data: activityOptions = [] } = useGetActivityOptionsQuery(
    { project_id: projectId!, phase_id: phaseId },
    { skip: !projectId || isNaN(projectId) || !phaseId }
  );

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(projectId),
    { skip: !projectId || isNaN(Number(projectId)) }
  );

  const request = useMemo<PettyCashRequestDetail | null>(() => {
    if (!rawRequest) return null;

    // Resolve project name
    let resolvedProject = "-";
    if (rawRequest.project_details?.name) {
      resolvedProject = rawRequest.project_details.name;
    } else if (rawRequest.project_name) {
      resolvedProject = rawRequest.project_name;
    } else if (typeof rawRequest.project_request === "object" && rawRequest.project_request?.project_details?.name) {
      resolvedProject = rawRequest.project_request.project_details.name;
    } else if (projectId) {
      const proj = projects.find((p: any) => p.id === projectId);
      resolvedProject = proj ? proj.name || proj.project_name || `Project #${projectId}` : `Project #${projectId}`;
    }

    // Resolve phase name
    let resolvedPhase = "-";
    if (rawRequest.phase_details?.name) {
      resolvedPhase = rawRequest.phase_details.name;
    } else if (rawRequest.phase_name) {
      resolvedPhase = rawRequest.phase_name;
    } else if (detail.phase_name) {
      resolvedPhase = detail.phase_name;
    } else if (phaseOptions.length > 0 && phaseId) {
      const match = phaseOptions.find((p: any) => String(p.id) === phaseId);
      if (match) resolvedPhase = match.name;
    }

    if (resolvedPhase === "-" && projectCosting?.phases) {
      const phasesArr = Array.isArray(projectCosting.phases)
        ? projectCosting.phases
        : Array.isArray((projectCosting as any).phase_list)
        ? (projectCosting as any).phase_list
        : [];
      if (phaseId) {
        const pMatch = phasesArr.find((p: any) => String(p.id || p.phase_id) === phaseId);
        if (pMatch) resolvedPhase = pMatch.name || pMatch.phase_name;
      }
      if (resolvedPhase === "-" && activityId) {
        for (const ph of phasesArr) {
          const acts = ph.activities || ph.activity_list || [];
          const aMatch = acts.find((a: any) => String(a.id || a.activity_id) === activityId);
          if (aMatch) {
            resolvedPhase = ph.name || ph.phase_name;
            break;
          }
        }
      }
    }

    if (resolvedPhase === "-" && detail.phase && !detail.phase.includes("-") && isNaN(Number(detail.phase))) {
      resolvedPhase = detail.phase;
    }

    // Resolve activity name
    let resolvedActivity = "-";
    if (rawRequest.activity_details?.name) {
      resolvedActivity = rawRequest.activity_details.name;
    } else if (rawRequest.activity_name) {
      resolvedActivity = rawRequest.activity_name;
    } else if (detail.task_name) {
      resolvedActivity = detail.task_name;
    } else if (detail.activity_name) {
      resolvedActivity = detail.activity_name;
    } else if (activityOptions.length > 0 && activityId) {
      const match = activityOptions.find((a: any) => String(a.id) === activityId);
      if (match) resolvedActivity = match.name;
    }

    if (resolvedActivity === "-" && projectCosting?.phases && activityId) {
      const phasesArr = Array.isArray(projectCosting.phases)
        ? projectCosting.phases
        : Array.isArray((projectCosting as any).phase_list)
        ? (projectCosting as any).phase_list
        : [];
      for (const ph of phasesArr) {
        const acts = ph.activities || ph.activity_list || [];
        const aMatch = acts.find((a: any) => String(a.id || a.activity_id) === activityId);
        if (aMatch) {
          resolvedActivity = aMatch.name || aMatch.activity_name;
          break;
        }
      }
    }

    if (resolvedActivity === "-" && detail.task && !detail.task.includes("-") && isNaN(Number(detail.task))) {
      resolvedActivity = detail.task;
    }

    // Resolve reference ID
    const refId =
      (rawRequest.reference_id && String(rawRequest.reference_id).trim()) ||
      (detail?.reference_id && String(detail.reference_id).trim()) ||
      (rawRequest.project_request?.reference_id && String(rawRequest.project_request.reference_id).trim()) ||
      (numericId ? `PC${String(numericId).padStart(4, "0")}` : "-");

    // Resolve requester name
    let requesterName = "-";
    if (rawRequest.requester_details?.user) {
      const u = rawRequest.requester_details.user;
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
      requesterName = fullName || u.username || u.email || "-";
    } else if (typeof rawRequest.project_request === "object" && rawRequest.project_request?.requester_details?.user) {
      const u = rawRequest.project_request.requester_details.user;
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
      requesterName = fullName || u.username || u.email || "-";
    } else {
      const userObj =
        rawRequest.created_by_details ||
        (typeof rawRequest.project_request === "object" && rawRequest.project_request?.created_by_details) ||
        apiProjectRequest?.created_by_details;

      if (userObj && typeof userObj === "object") {
        const fullName = `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim();
        requesterName = fullName || userObj.username || userObj.email || "-";
      } else if (rawRequest.created_by_name) {
        requesterName = rawRequest.created_by_name;
      } else if (rawRequest.requester_name) {
        requesterName = rawRequest.requester_name;
      } else if (rawRequest.requester && typeof rawRequest.requester === "string" && isNaN(Number(rawRequest.requester))) {
        requesterName = rawRequest.requester;
      } else if (rawRequest.created_by) {
        requesterName = `User #${rawRequest.created_by}`;
      }
    }

    // Amount requested
    const amountRequested =
      parseFloat(String(rawRequest.amount_requested ?? "")) ||
      parseFloat(String(rawRequest.amount ?? "")) ||
      parseFloat(String(detail.amount_requested ?? "")) ||
      parseFloat(String(detail.amountRequested ?? "")) ||
      parseFloat(String(detail.amount ?? "")) ||
      parseFloat(String(typeof rawRequest.project_request === "object" ? rawRequest.project_request?.request_amount ?? "" : "")) ||
      0;

    // Status
    const rawStatus = (
      rawRequest.status ||
      (typeof rawRequest.project_request === "object" && rawRequest.project_request?.status) ||
      apiProjectRequest?.status ||
      "pending"
    ).toLowerCase();
    const status = rawStatus === "cancelled" ? "rejected" : rawStatus;

    // Date
    const rawDate =
      rawRequest.created_at ||
      rawRequest.date_created ||
      (typeof rawRequest.project_request === "object" && rawRequest.project_request?.created_at);
    const dateFormatted = rawDate
      ? new Date(rawDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

    return {
      id: String(rawRequest.id || id),
      reference_id: refId,
      project: resolvedProject,
      projectId: projectId,
      activityId: activityId,
      purpose: rawRequest.purpose || detail.purpose || "-",
      description: rawRequest.description || detail.description || "-",
      amountRequested,
      status,
      requester: requesterName,
      date: dateFormatted,
      phase: resolvedPhase,
      task: resolvedActivity,
      notes: rawRequest.notes || detail.notes || detail.justification_notes || "-",
    };
  }, [rawRequest, apiProjectRequest, detail, projectId, phaseId, activityId, phaseOptions, activityOptions, projectCosting, projects, id, numericId]);

  // Compute live available budget without dummy fallback
  const availableBudget = useMemo(() => {
    // 0. Try rawRequest.available_budget directly from backend
    if (rawRequest?.available_budget !== undefined && rawRequest?.available_budget !== null && rawRequest?.available_budget !== "") {
      const parsed = parseFloat(String(rawRequest.available_budget));
      if (!isNaN(parsed)) return parsed;
    }

    // 1. Try activityOptions (live from activity-options endpoint)
    if (activityId && activityOptions?.length) {
      const act = activityOptions.find((a: any) => String(a.id) === activityId);
      if (act && act.available_budget !== undefined && act.available_budget !== null) {
        return Number(act.available_budget);
      }
      if (act && act.current_budget !== undefined && act.current_budget !== null) {
        return Number(act.current_budget);
      }
    }

    // 2. Try projectCosting phases and activities
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
          if (act.amount !== undefined && act.amount !== null) return Number(act.amount);
        }
      }
    }

    // 3. Try projectCosting financials
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
  }, [rawRequest, activityOptions, projectCosting, activityId]);

  const isDraft = request?.status === "draft";
  const canEdit = isDraft && canDo("project_request", "edit");
  const canDelete = isDraft && canDo("project_request", "delete");
  const canSubmit = isDraft;

  const handleEdit = () => {
    router.push(`/project-request/petty-cash-request/${id}/edit`);
  };

  const effectiveProjectRequestId = useMemo(() => {
    return (
      (typeof rawRequest?.project_request === "object" ? rawRequest?.project_request?.id : rawRequest?.project_request) ||
      rawRequest?.project_request_id ||
      apiProjectRequest?.id ||
      numericId
    );
  }, [rawRequest, apiProjectRequest, numericId]);

  const handleDelete = async () => {
    try {
      await deleteRequest(effectiveProjectRequestId).unwrap();
      setIsConfirmingDelete(false);
      statusModal.showSuccess("Request Deleted", "The petty cash request has been deleted.");
    } catch (err) {
      statusModal.showError("Delete Failed", extractErrorMessage(err, "Failed to delete the request."));
    }
  };

  const handleSubmit = async () => {
    try {
      await submitRequest({ id: effectiveProjectRequestId }).unwrap();
      statusModal.showSuccess("Request Submitted", "The petty cash request has been submitted for approval.");
    } catch (err) {
      statusModal.showError("Submit Failed", extractErrorMessage(err, "Failed to submit the request."));
    }
  };

  const handleModalClose = () => {
    statusModal.close();
    if (statusModal.type === "success" && !isConfirmingDelete) {
      router.push("/project-request/petty-cash-request");
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "pending").toLowerCase();
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
          <span className="bg-gray-100 text-gray-700 text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center capitalize">
            {status}
          </span>
        );
    }
  };

  if (apiLoading || (!request && (isProjectLoading || isPettyCashLoading))) {
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
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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

  if (!request) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Petty cash request not found.</p>
        <Button onClick={() => router.push("/project-request/petty-cash-request")}>
          Back to List
        </Button>
      </div>
    );
  }

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
                onClick={() => router.push("/project-request/petty-cash-request")}
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
              <h2 className="text-[17px] font-normal text-[#3B82F6] mb-4">Basic Information</h2>
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
                  <span className="block text-[14px] font-semibold text-black/80">Petty Cash Request</span>
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
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                    Purpose / Expense Category
                  </span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.purpose}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Date</span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.date}</span>
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
              <h2 className="text-[17px] font-normal text-[#3B82F6] mb-4">WBS</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Phase</span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.phase}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Activity</span>
                  <span className="block text-[14px] font-semibold text-black/80">{request.task}</span>
                </div>
              </div>
            </section>

            {/* Cost Details */}
            <section>
              <h2 className="text-[17px] font-normal text-[#3B82F6] mb-4">Cost Details</h2>
              <div className="mb-4">
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                  Amount Requested
                </span>
                <span className="block text-[14px] font-semibold text-black/80">
                  ₦{request.amountRequested.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                ₦{availableBudget.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black/80">Total Cost</span>
              <span className="text-[14px] font-semibold text-[#3B82F6]">
                ₦{request.amountRequested.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </section>

          {/* Floating Bottom Action Bar for Draft/Editable requests */}
          {(canEdit || canDelete || canSubmit) && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3.5 z-40 shadow-lg">
              <div className="max-w-[430px] mx-auto flex items-center justify-between gap-3">
                {isConfirmingDelete ? (
                  <div className="w-full flex items-center justify-between gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                    <span className="text-xs font-semibold text-red-700 flex items-center gap-1.5 pl-1">
                      <AlertCircle size={16} className="text-red-600" /> Confirm delete?
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="h-9 text-xs bg-white border-gray-200 text-gray-700 rounded-lg"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-end gap-2.5">
                    {canDelete && (
                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="h-10 px-3.5 text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 rounded-lg gap-1.5"
                      >
                        <Trash2 size={15} /> Delete
                      </Button>
                    )}

                    {canEdit && (
                      <Button
                        variant="outline"
                        onClick={handleEdit}
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
                )}
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
            actionText="Back to List"
            onAction={handleModalClose}
            showCloseButton={false}
          />
        </div>
      </motion.div>
    </PageGuard>
  );
}
