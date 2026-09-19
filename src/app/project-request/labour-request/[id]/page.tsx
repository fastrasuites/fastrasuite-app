"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Trash2,
  Edit3,
  Send,
  AlertCircle,
} from "lucide-react";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { extractErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import {
  useGetLabourRequestQuery,
  useDeleteLabourRequestMutation,
  useSubmitLabourRequestMutation,
} from "@/api/requests/labourRequestApi";
import { useGetProjectCostingProjectQuery } from "@/api/projectCostingApi";
import { useModulePermissions } from "@/hooks/useModulePermissions";

export default function LabourRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? parseInt(rawId as string, 10) : NaN;
  const { canDo } = useModulePermissions();
  const statusModal = useStatusModal();

  const {
    data: request,
    isLoading,
    error,
    refetch,
  } = useGetLabourRequestQuery(id, {
    skip: !id || isNaN(id),
  });

  const [deleteRequest, { isLoading: isDeleting }] = useDeleteLabourRequestMutation();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitLabourRequestMutation();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Normalize request in case response is wrapped in an array
  const reqObj: any = (Array.isArray(request) ? request[0] : request) || {};
  const detail: any = useMemo(() => {
    const d = reqObj?.detail;
    if (!d) return (reqObj as any) || {};
    if (typeof d === "string") {
      try {
        return JSON.parse(d);
      } catch {
        return {};
      }
    }
    return d;
  }, [reqObj]);

  const projectRequest: any = useMemo(() => {
    const pr = reqObj?.project_request;
    if (!pr) return (reqObj as any) || {};
    if (typeof pr === "string") {
      try {
        return JSON.parse(pr);
      } catch {
        return {};
      }
    }
    return pr;
  }, [reqObj]);

  const rawProjectId =
    reqObj?.project ||
    detail?.project ||
    projectRequest?.project ||
    detail?.project_details?.id ||
    reqObj?.project_details?.id;

  const projectId = useMemo(() => {
    if (!rawProjectId) return null;
    if (typeof rawProjectId === "number") return rawProjectId;
    if (typeof rawProjectId === "string") {
      const parsed = parseInt(rawProjectId, 10);
      return isNaN(parsed) ? null : parsed;
    }
    if (typeof rawProjectId === "object" && rawProjectId?.id) {
      return Number(rawProjectId.id) || null;
    }
    return null;
  }, [rawProjectId]);

  const activityId =
    reqObj?.activity ||
    detail?.activity ||
    detail?.activity_details?.id;

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(projectId),
    { skip: !projectId || isNaN(Number(projectId)) }
  );

  const availableBudget = useMemo(() => {
    // 1. Direct available_budget from detail or reqObj
    if (
      detail?.available_budget !== undefined &&
      detail?.available_budget !== null &&
      !isNaN(Number(detail.available_budget))
    ) {
      return Number(detail.available_budget);
    }
    if (
      reqObj?.available_budget !== undefined &&
      reqObj?.available_budget !== null &&
      !isNaN(Number(reqObj.available_budget))
    ) {
      return Number(reqObj.available_budget);
    }

    if (!projectCosting) return 5000000;

    if (activityId) {
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
  }, [detail, reqObj, projectCosting, activityId]);

  const handleEdit = () => {
    router.push(`/project-request/labour-request/edit/${id}`);
  };

  const handleDelete = async () => {
    try {
      const deleteId = detail?.id || reqObj?.id || id;
      await deleteRequest(deleteId).unwrap();
      setIsConfirmingDelete(false);
      statusModal.showSuccess(
        "Request Deleted",
        "The labour request has been deleted successfully."
      );
    } catch (err) {
      console.error("Failed to delete request:", err);
      statusModal.showError(
        "Error",
        extractErrorMessage(err, "Failed to delete the request. Please try again.")
      );
    }
  };

  const handleSubmit = async () => {
    try {
      const submitId = reqObj?.id || projectRequest?.id || id;
      await submitRequest({ id: submitId, data: {} }).unwrap();
      statusModal.showSuccess(
        "Request Submitted",
        "The labour request has been submitted for approval."
      );
      refetch();
    } catch (err) {
      console.error("Failed to submit request:", err);
      statusModal.showError(
        "Submit Failed",
        extractErrorMessage(err, "Failed to submit the request. Please try again.")
      );
    }
  };

  const handleModalClose = () => {
    statusModal.close();
    if (statusModal.type === "success" && !isConfirmingDelete) {
      router.push("/project-request/labour-request");
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

  const rawPhaseName =
    detail?.phase_details?.name ||
    (typeof detail?.phase === "object" ? detail.phase?.name : null) ||
    detail?.phase_name ||
    (typeof detail?.phase === "string" ? detail.phase : null) ||
    (reqObj as any)?.phase_details?.name;

  const rawActivityName =
    detail?.activity_details?.name ||
    (typeof detail?.activity === "object" ? detail.activity?.name : null) ||
    detail?.activity_name ||
    detail?.task_name ||
    (typeof detail?.task === "string" ? detail.task : null) ||
    (reqObj as any)?.activity_details?.name;

  // Resolve Phase name
  const phaseName = useMemo(() => {
    if (rawPhaseName && !rawPhaseName.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
      return rawPhaseName;
    }
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
        if (act) return ph.name || ph.phase_name || ph.title;
      }
    }
    return rawPhaseName && !rawPhaseName.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)
      ? rawPhaseName
      : "—";
  }, [rawPhaseName, projectCosting, activityId]);

  // Resolve Activity name
  const activityName = useMemo(() => {
    if (rawActivityName && !rawActivityName.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
      return rawActivityName;
    }
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
        if (act) return act.name || act.activity_name || act.title;
      }
    }
    return rawActivityName && !rawActivityName.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)
      ? rawActivityName
      : "—";
  }, [rawActivityName, projectCosting, activityId]);

  const createdBy = reqObj?.created_by_details || projectRequest?.created_by_details;
  const requesterFullName =
    createdBy?.first_name || createdBy?.last_name
      ? `${createdBy.first_name || ""} ${createdBy.last_name || ""}`.trim()
      : createdBy?.user?.first_name || createdBy?.user?.last_name
      ? `${createdBy.user.first_name || ""} ${createdBy.user.last_name || ""}`.trim()
      : createdBy?.username || createdBy?.user?.username;

  const requesterName =
    requesterFullName ||
    detail?.created_by_name ||
    reqObj?.created_by_name ||
    createdBy?.email ||
    "Firstname Lastname";

  const dateValue = detail?.date_required || reqObj?.created_at || detail?.created_at || Date.now();
  const formattedDate = (() => {
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  })();

  // Reference code format: LB0001…
  const labourDetailId = detail?.id ?? (reqObj as any)?.detail_id ?? reqObj?.id ?? id;
  const refId =
    (detail as any)?.reference_code ||
    (detail as any)?.code ||
    (detail as any)?.labour_reference ||
    `LB${String(labourDetailId).padStart(4, "0")}`;

  const projectName =
    detail?.project_details?.name ||
    reqObj?.project_details?.name ||
    projectRequest?.project_details?.name ||
    projectCosting?.name ||
    (typeof projectId === "number" ? `Project #${projectId}` : "Building project");

  const roleType = detail?.role_type || detail?.role || "Labourers";
  const numberOfWorkers = detail?.number_of_workers ?? 0;

  const durationFormatted = detail?.duration
    ? `${detail.duration} ${
        detail.duration === 1 && detail.duration_unit === "days"
          ? "day"
          : detail.duration === 1 && detail.duration_unit === "weeks"
          ? "week"
          : detail.duration === 1 && detail.duration_unit === "months"
          ? "month"
          : detail.duration_unit || "day"
      }`
    : "1 day";

  const dailyRateNumber = parseFloat(detail?.estimated_daily_rate || "0");

  const calculatedCost =
    parseFloat(detail?.projected_cost || "0") ||
    numberOfWorkers * dailyRateNumber * (detail?.duration || 1) ||
    0;

  const noteText =
    detail?.justification_notes ||
    detail?.notes ||
    reqObj?.notes ||
    "—";

  const requestStatus = reqObj?.status || projectRequest?.status || "draft";
  const isDraft = requestStatus === "draft";
  const canEdit = isDraft && canDo("project_request", "edit");
  const canDelete = isDraft && canDo("project_request", "delete");
  const canSubmit = isDraft;

  if (isLoading) {
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

  if (error || !request) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-['Open_Sans',sans-serif]">
        <div className="text-center bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-sm w-full">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-gray-700 font-semibold mb-4">Failed to load request details</p>
          <Button
            onClick={() => router.back()}
            className="w-full bg-[#3B82F6] text-white hover:bg-blue-600 font-bold h-11 rounded-xl"
          >
            Go Back
          </Button>
        </div>
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
                onClick={() => router.push("/project-request/labour-request")}
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
                  <span className="block text-[14px] font-semibold text-black/80">{refId}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Status</span>
                  <div>{renderStatusBadge(requestStatus)}</div>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Request Type</span>
                  <span className="block text-[14px] font-semibold text-black/80">Labour Request</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Requested by</span>
                  <span className="block text-[14px] font-semibold text-black/80">{requesterName}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Project</span>
                  <span className="block text-[14px] font-semibold text-black/80">{projectName}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Role / Trade Type</span>
                  <span className="block text-[14px] font-semibold text-black/80 capitalize">{roleType}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Number of Workers</span>
                  <span className="block text-[14px] font-semibold text-black/80">{numberOfWorkers}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Date</span>
                  <span className="block text-[14px] font-semibold text-black/80">{formattedDate}</span>
                </div>
              </div>
            </section>

            {/* WBS */}
            <section>
              <h2 className="text-[17px] font-normal text-[#3B82F6] mb-4">WBS</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Phase</span>
                  <span className="block text-[14px] font-semibold text-black/80">{phaseName}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Activity</span>
                  <span className="block text-[14px] font-semibold text-black/80">{activityName}</span>
                </div>
              </div>
            </section>

            {/* Cost Details */}
            <section>
              <h2 className="text-[17px] font-normal text-[#3B82F6] mb-4">Cost Details</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-4">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                    Duration ({detail?.duration_unit || "days"})
                  </span>
                  <span className="block text-[14px] font-semibold text-black/80">{durationFormatted}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                    Estimated Daily Rate
                  </span>
                  <span className="block text-[14px] font-semibold text-black/80">
                    N{dailyRateNumber.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Note */}
              <div className="mt-5">
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Note</span>
                <span className="block text-[14px] font-semibold text-black/80">{noteText}</span>
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
                N{calculatedCost.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
