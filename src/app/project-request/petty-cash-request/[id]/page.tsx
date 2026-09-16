"use client";

import React, { useMemo } from "react";
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
} from "@/api/requests/projectRequestApi";
import {
  useGetProjectCostingProjectsQuery,
  useGetProjectCostingProjectQuery,
} from "@/api/projectCostingApi";
import { Button } from "@/components/ui/button";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { useModulePermissions } from "@/hooks/useModulePermissions";
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
  status: "draft" | "approved" | "pending" | "rejected" | "cancelled";
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

  const [deleteRequest, { isLoading: isDeleting }] = useDeleteProjectRequestMutation();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitProjectRequestMutation();

  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  const { data: apiRequest, isLoading: apiLoading } = useGetProjectRequestQuery(numericId, {
    skip: isNaN(numericId),
  });

  const { data: rawProjects } = useGetProjectCostingProjectsQuery({});
  const projects = React.useMemo(() => {
    const list = Array.isArray(rawProjects) ? rawProjects : (rawProjects as any)?.results || [];
    return list;
  }, [rawProjects]);

  const getProjectName = (projId?: number) => {
    if (!projId) return "Building project";
    const proj = projects?.find((p: any) => p.id === projId);
    return proj ? proj.name || proj.project_name || `Project #${projId}` : "Building project";
  };

  const request = React.useMemo<PettyCashRequestDetail | null>(() => {
    if (!apiRequest) return null;

    let detail: any = {};
    if (apiRequest.detail) {
      if (typeof apiRequest.detail === "string") {
        try {
          detail = JSON.parse(apiRequest.detail);
        } catch (e) {
          detail = {};
        }
      } else {
        detail = apiRequest.detail;
      }
    }

    const matchedProject = projects.find((p: any) => p.id === apiRequest.project);
    let phaseName = detail.phase_name || detail.phase || "Roofing";
    let taskName = detail.task_name || detail.task || "P.O.P";

    if (matchedProject && matchedProject.wbs) {
      const matchPhase = matchedProject.wbs.find((w: any) => String(w.id) === String(detail.phase));
      if (matchPhase) phaseName = matchPhase.name;
      const matchTask = matchedProject.wbs.find((w: any) => String(w.id) === String(detail.task));
      if (matchTask) taskName = matchTask.name;
    }

    const refId =
      apiRequest.reference_id ||
      `PC${String(apiRequest.id || id).padStart(5, "0")}`;

    const requesterName = apiRequest.created_by_details
      ? `${apiRequest.created_by_details.first_name || ""} ${apiRequest.created_by_details.last_name || ""}`.trim() ||
        apiRequest.created_by_details.username
      : "Firstname Lastname";

    return {
      id: String(apiRequest.id),
      reference_id: refId,
      project: apiRequest.project_details?.name || getProjectName(apiRequest.project),
      projectId: apiRequest.project,
      activityId: detail.task || detail.activity,
      purpose: detail.purpose || "Engineer",
      description: detail.description || "This is a short description of the expense",
      amountRequested:
        parseFloat(detail.amount_requested) || detail.amountRequested || detail.amount || 500000,
      status: (apiRequest.status as any) || "approved",
      requester: requesterName,
      date: new Date(apiRequest.created_at || Date.now()).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      phase: phaseName,
      task: taskName,
      notes: detail.notes || detail.justification_notes || "-",
    };
  }, [apiRequest, projects, id]);

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(request?.projectId),
    { skip: !request?.projectId || isNaN(Number(request.projectId)) }
  );

  const availableBudget = useMemo(() => {
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
  }, [projectCosting, request?.activityId]);

  const isDraft = request?.status === "draft";
  const canEdit = isDraft && canDo("project_request", "edit");
  const canDelete = isDraft && canDo("project_request", "delete");
  const canSubmit = isDraft;

  const handleEdit = () => {
    router.push(`/project-request/petty-cash-request/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(numericId).unwrap();
      setIsConfirmingDelete(false);
      statusModal.showSuccess("Request Deleted", "The petty cash request has been deleted.");
    } catch (err) {
      statusModal.showError("Delete Failed", extractErrorMessage(err, "Failed to delete the request."));
    }
  };

  const handleSubmit = async () => {
    try {
      await submitRequest({ id: numericId }).unwrap();
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

              {/* Description of Expense */}
              <div className="mt-4">
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                  Description of Expense
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
