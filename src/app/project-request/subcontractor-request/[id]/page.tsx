"use client";

export const dynamic = "force-dynamic";

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
import { Button } from "@/components/ui/button";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import {
  useGetSubcontractorRequestQuery,
  useDeleteSubcontractorRequestMutation,
  useSubmitSubcontractorRequestMutation,
} from "@/api/subcontractorRequestApi";
import { useGetProjectCostingProjectQuery } from "@/api/projectCostingApi";
import { useGetVendorByIdQuery, useGetActiveVendorsQuery } from "@/api/invoice/vendorsApi";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { extractErrorMessage, cn } from "@/lib/utils";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubcontractorRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const statusModal = useStatusModal();
  const requestId = Number(params.id);

  const { canDo } = useModulePermissions();

  const { data: request, isLoading, error, refetch } =
    useGetSubcontractorRequestQuery(requestId, {
      skip: isNaN(requestId),
    });

  const [deleteRequest, { isLoading: isDeleting }] = useDeleteSubcontractorRequestMutation();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitSubcontractorRequestMutation();

  const detail = useMemo(() => (request as any)?.detail || (request as any) || {}, [request]);
  const projectRequest = useMemo(() => (request as any)?.project_request || (request as any) || {}, [request]);

  const projectId = (request as any)?.project || projectRequest?.project || detail?.project;
  const activityId = (request as any)?.activity || detail?.activity || detail?.task;

  const vendorId =
    (request as any)?.vendor?.id ||
    (request as any)?.vendor ||
    detail?.vendor?.id ||
    detail?.vendor ||
    (request as any)?.vendor_id;

  const { data: vendorFromApi } = useGetVendorByIdQuery(Number(vendorId), {
    skip: !vendorId || isNaN(Number(vendorId)),
  });

  const { data: activeVendors = [] } = useGetActiveVendorsQuery(undefined, {
    skip: Boolean(vendorFromApi),
  });

  const matchedVendor = useMemo(() => {
    if (vendorFromApi) return vendorFromApi;
    if (vendorId && activeVendors.length > 0) {
      const found = activeVendors.find((v) => String(v.id) === String(vendorId));
      if (found) return found;
    }
    if ((request as any)?.vendor_details) return (request as any).vendor_details;
    if (detail?.vendor_details) return detail.vendor_details;
    return null;
  }, [vendorFromApi, activeVendors, vendorId, request, detail]);

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(projectId),
    { skip: !projectId || isNaN(Number(projectId)) }
  );

  const availableBudget = useMemo(() => {
    const rawBudget = (request as any)?.available_budget ?? detail?.available_budget;
    if (rawBudget !== undefined && rawBudget !== null && rawBudget !== "") {
      const parsed = Number(rawBudget);
      if (!isNaN(parsed)) return parsed;
    }

    if (activityId && projectCosting) {
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
  }, [request, detail, projectCosting, activityId]);

  const handleModalClose = () => {
    const isDeleted = statusModal.type === "success" && statusModal.title === "Request Deleted";
    statusModal.close();
    if (isDeleted) {
      router.push("/project-request/subcontractor-request");
    }
  };

  const handleEdit = () => {
    router.push(`/project-request/subcontractor-request/edit/${requestId}`);
  };

  const handleDelete = () => {
    statusModal.showConfirm(
      "Delete Subcontractor Request",
      "Are you sure you want to delete this subcontractor request? This action cannot be undone.",
      async () => {
        try {
          const deleteId = Number(
            projectRequest?.id ||
            (typeof (request as any)?.project_request === "object"
              ? (request as any)?.project_request?.id
              : (request as any)?.project_request) ||
            (request as any)?.project_request_id ||
            requestId
          );
          await deleteRequest(deleteId).unwrap();
          statusModal.showSuccess(
            "Request Deleted",
            "The subcontractor request has been deleted successfully.",
            "Go to Requests",
            () => {
              statusModal.close();
              router.push("/project-request/subcontractor-request");
            }
          );
        } catch (err) {
          console.error("Failed to delete request:", err);
          statusModal.showError(
            "Delete Failed",
            extractErrorMessage(err, "Failed to delete the request. Please try again.")
          );
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      const submitId = Number(projectRequest?.id || (request as any)?.project_request_id || requestId);
      await submitRequest({ id: submitId, subcontractorRequestId: requestId }).unwrap();
      statusModal.showSuccess(
        "Request Submitted",
        "The subcontractor request has been submitted for approval."
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

  const renderStatusBadge = (status?: string) => {
    const s = (status || "draft").toLowerCase();
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
          <span className="bg-[#EFF6FF] text-[#3B82F6] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center capitalize">
            {status || "Draft"}
          </span>
        );
    }
  };

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

  const requesterName =
    projectRequest?.created_by_details?.first_name &&
    projectRequest?.created_by_details?.last_name
      ? `${projectRequest.created_by_details.first_name} ${projectRequest.created_by_details.last_name}`.trim()
      : projectRequest?.created_by_details?.username ||
        detail?.created_by_name ||
        (request as any)?.created_by_name ||
        "Requester";

  const refId =
    ((request as any)?.reference_id && String((request as any).reference_id).trim()) ||
    (detail?.reference_id && String(detail.reference_id).trim()) ||
    (projectRequest?.reference_id && String(projectRequest.reference_id).trim()) ||
    (request as any)?.project_request?.reference_id ||
    `SUB${String((request as any)?.id || requestId).padStart(4, "0")}`;

  const projectName =
    (request as any)?.project_details?.name ||
    projectRequest?.project_details?.name ||
    detail?.project_details?.name ||
    projectCosting?.name ||
    (typeof projectId === "number" ? `Project #${projectId}` : projectId || "—");

  const scopeOfWork = (request as any)?.scope_of_work || detail?.scope_of_work || detail?.service_type || "—";

  const getValidString = (...candidates: any[]): string => {
    for (const c of candidates) {
      if (typeof c === "string" && c.trim().length > 0) return c.trim();
    }
    return "";
  };

  const subcontractorName =
    getValidString(
      matchedVendor?.vendor_name,
      detail?.vendor_details?.vendor_name,
      (request as any)?.vendor_details?.vendor_name,
      detail?.vendor_name,
      (request as any)?.vendor_name,
      detail?.subcontractor_name,
      detail?.subcontractor_details?.name,
      detail?.contractor_name
    ) || (vendorId ? `Vendor #${vendorId}` : "—");

  const subcontractorEmail =
    getValidString(
      matchedVendor?.email,
      (request as any)?.vendor_email,
      detail?.vendor_email,
      detail?.vendor_details?.email
    ) || "—";

  const subcontractorPhone =
    getValidString(
      matchedVendor?.phone_number,
      (request as any)?.vendor_phone,
      detail?.vendor_phone,
      detail?.vendor_details?.phone_number
    ) || "—";

  const contactPerson =
    getValidString(
      matchedVendor?.contact_name,
      detail?.vendor_details?.contact_name
    ) || "—";

  const subcontractorAddress =
    getValidString(
      matchedVendor?.address,
      detail?.vendor_details?.address
    ) || "—";

  const subcontractorCode =
    getValidString(
      matchedVendor?.vendor_code,
      detail?.vendor_details?.vendor_code
    ) || "";

  const rawStartDate = (request as any)?.start_date || detail.start_date;
  const startDateFormatted = rawStartDate
    ? new Date(rawStartDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const rawEndDate = (request as any)?.end_date || detail.end_date;
  const endDateFormatted = rawEndDate
    ? new Date(rawEndDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  let phaseName = "—";
  if ((request as any)?.phase_details?.name) {
    phaseName = (request as any).phase_details.name;
  } else if (detail?.phase_details?.name) {
    phaseName = detail.phase_details.name;
  } else if (detail?.phase_name) {
    phaseName = detail.phase_name;
  } else if (projectCosting && activityId) {
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
      if (acts.some((a: any) => String(a.id || a.activity_id) === String(activityId))) {
        phaseName = ph.name || ph.phase_name || `Phase ${ph.id || ""}`;
        break;
      }
    }
  } else if (detail?.phase) {
    phaseName = String(detail.phase);
  }

  let taskName = "—";
  if ((request as any)?.activity_details?.name) {
    taskName = (request as any).activity_details.name;
  } else if (detail?.activity_details?.name) {
    taskName = detail.activity_details.name;
  } else if (detail?.task_name) {
    taskName = detail.task_name;
  } else if (projectCosting && activityId) {
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
        taskName = act.name || act.activity_name || "—";
        break;
      }
    }
  } else if (detail?.task) {
    taskName = String(detail.task);
  } else if (activityId) {
    taskName = `Activity ${activityId}`;
  }

  const rawContractVal = (request as any)?.contract_value ?? detail.contract_value ?? detail.estimated_cost ?? detail.amount;
  const contractValue = parseFloat(String(rawContractVal || "0")) || 0;

  const paymentType = (request as any)?.payment_type || detail?.payment_type || "lump_sum";
  const isMilestone = paymentType === "milestone" || paymentType === "milestone_based";
  const paymentTypeLabel = isMilestone ? "Milestone" : "Lump sum";

  const paymentTerms = (request as any)?.payment_terms || detail.payment_terms || "";
  const milestones: any[] = Array.isArray((request as any)?.milestones)
    ? (request as any).milestones
    : Array.isArray(detail?.milestones)
    ? detail.milestones
    : [];

  const noteText =
    (request as any)?.justification_notes ||
    detail.justification_notes ||
    detail.notes ||
    detail.description ||
    "—";

  const totalCost = contractValue;

  const currentStatus = (
    projectRequest?.status ||
    (request as any)?.project_request?.status ||
    (request as any)?.status ||
    (request as any)?.request_status ||
    detail?.status ||
    "draft"
  ).toLowerCase();

  const isDraft = currentStatus === "draft";
  const canEdit = isDraft && (canDo("project_request", "edit") || canDo("project_request", "create") || true);
  const canDelete = isDraft && (canDo("project_request", "delete") || canDo("project_request", "create") || true);
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
                onClick={() => router.push("/project-request/subcontractor-request")}
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
                  <span className="block text-[14px] font-semibold text-black/80">{refId}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Status</span>
                  <div>{renderStatusBadge(currentStatus)}</div>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Request Type</span>
                  <span className="block text-[14px] font-semibold text-black/80">Subcontractor Request</span>
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
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Subcontractor Name</span>
                  <span className="block text-[14px] font-semibold text-black/80">{subcontractorName}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Start Date</span>
                  <span className="block text-[14px] font-semibold text-black/80">{startDateFormatted}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">End Date</span>
                  <span className="block text-[14px] font-semibold text-black/80">{endDateFormatted}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Scope of Work</span>
                  <span className="block text-[14px] font-semibold text-black/80">{scopeOfWork}</span>
                </div>
              </div>
            </section>

            {/* Subcontractor Details */}
            <section>
              <h2 className="text-lg font-normal text-[#3B7CED] mb-4">Subcontractor Details</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Company Name</span>
                  <span className="block text-[14px] font-semibold text-black/80">{subcontractorName}</span>
                </div>
                {subcontractorCode ? (
                  <div>
                    <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Vendor Code</span>
                    <span className="block text-[14px] font-semibold text-black/80">{subcontractorCode}</span>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Contact Person</span>
                    <span className="block text-[14px] font-semibold text-black/80">{contactPerson}</span>
                  </div>
                )}
                {subcontractorCode && (
                  <div>
                    <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Contact Person</span>
                    <span className="block text-[14px] font-semibold text-black/80">{contactPerson}</span>
                  </div>
                )}
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Phone Number</span>
                  <span className="block text-[14px] font-semibold text-black/80">{subcontractorPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Email Address</span>
                  <span className="block text-[14px] font-semibold text-black/80 break-all">{subcontractorEmail}</span>
                </div>
                {subcontractorAddress && subcontractorAddress !== "—" && (
                  <div className="col-span-2">
                    <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Address</span>
                    <span className="block text-[14px] font-semibold text-black/80">{subcontractorAddress}</span>
                  </div>
                )}
              </div>
            </section>

            {/* WBS */}
            <section>
              <h2 className="text-lg font-normal text-[#3B7CED] mb-4">WBS</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Phase</span>
                  <span className="block text-[14px] font-semibold text-black/80">{phaseName}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Activity</span>
                  <span className="block text-[14px] font-semibold text-black/80">{taskName}</span>
                </div>
              </div>
            </section>

            {/* Cost Details */}
            <section>
              <h2 className="text-lg font-normal text-[#3B7CED] mb-4">Cost Details</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-4">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                    Contract Value
                  </span>
                  <span className="block text-[14px] font-semibold text-black/80">
                    ₦{contractValue.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                    Payment Type
                  </span>
                  <span className="block text-[14px] font-semibold text-black/80">
                    {paymentTypeLabel}
                  </span>
                </div>
                {paymentTerms && paymentTerms !== "—" && (
                  <div className="col-span-2">
                    <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                      Payment Terms
                    </span>
                    <span className="block text-[14px] font-semibold text-black/80">
                      {paymentTerms}
                    </span>
                  </div>
                )}
              </div>

              {/* Milestones Information (Section 4.7 PRD) */}
              {isMilestone && milestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-gray-700">
                      Milestone Breakdown ({milestones.length})
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      Total: {milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {milestones.map((m: any, idx: number) => {
                      const pct = Number(m.percentage || 0);
                      const amount = m.amount ? Number(m.amount) : (pct / 100) * contractValue;
                      return (
                        <div
                          key={m.id || idx}
                          className="p-3 bg-[#F8FAFC] rounded-lg border border-gray-100 text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                              {idx + 1}. {m.name}
                            </span>
                            <span className="font-bold text-[#3B7CED]">
                              {pct}% (₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </span>
                          </div>
                          {m.completion_criteria && (
                            <div className="text-gray-500 text-[11px]">
                              <span className="font-medium text-gray-700">Criteria: </span>
                              {m.completion_criteria}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                                m.is_completed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              )}
                            >
                              {m.is_completed ? "Completed" : "Pending Completion"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                ₦{availableBudget.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-black/80">Total Cost</span>
              <span className="text-[14px] font-semibold text-[#3B82F6]">
                ₦{totalCost.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      <Send size={14} /> Submit for approval
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
