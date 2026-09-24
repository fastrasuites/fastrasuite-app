"use client";

import React, { useState } from "react";
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
import {
  useGetMaterialConsumptionQuery,
  useDeleteMaterialConsumptionMutation,
  useSubmitMaterialConsumptionRequestMutation,
} from "@/api/requests/materialConsumptionRequestApi";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { extractErrorMessage } from "@/lib/utils";

interface MaterialItem {
  id?: string | number;
  productName: string;
  unitCost: number;
  quantity: number;
  unitOfMeasure?: string;
  lineTotal: number;
}

export default function MaterialConsumptionRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const statusModal = useStatusModal();
  const { canDo } = useModulePermissions();
  const { fullName: currentUserName } = useCurrentUser();

  const { data: request, isLoading, error, refetch } = useGetMaterialConsumptionQuery(id, {
    skip: isNaN(id),
  });

  const [deleteRequest, { isLoading: isDeleting }] = useDeleteMaterialConsumptionMutation();
  const [submitProjectRequest, { isLoading: isSubmitting }] = useSubmitMaterialConsumptionRequestMutation();

  const handleDelete = () => {
    statusModal.showConfirm(
      "Delete Material Consumption Request",
      "Are you sure you want to delete this material consumption request? This action cannot be undone.",
      async () => {
        try {
          const deleteId =
            (typeof request?.project_request === "object"
              ? (request?.project_request as any)?.id
              : request?.project_request) ||
            (request as any)?.project_request_id ||
            request?.id ||
            id;
          await deleteRequest(Number(deleteId)).unwrap();
          statusModal.showSuccess(
            "Request Deleted",
            "The material consumption request has been deleted successfully.",
            "Go to Requests",
            () => {
              statusModal.close();
              router.push("/project-request/material-consumption-request");
            }
          );
        } catch (err: any) {
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
      const parentId =
        typeof request?.project_request === "object"
          ? (request?.project_request as any)?.id
          : request?.project_request;
      if (!parentId) throw new Error("Could not find parent project request ID");

      await submitProjectRequest({ id: parentId as number }).unwrap();
      statusModal.showSuccess(
        "Request Submitted",
        "The material consumption request has been submitted for approval."
      );
      refetch();
    } catch (err: any) {
      console.error("Failed to submit request:", err);
      statusModal.showError(
        "Submit Failed",
        extractErrorMessage(err, "Failed to submit the request. Please try again.")
      );
    }
  };

  const handleModalClose = () => {
    const isDeleted = statusModal.type === "success" && statusModal.title === "Request Deleted";
    statusModal.close();
    if (isDeleted) {
      router.push("/project-request/material-consumption-request");
    }
  };

  const handleEdit = () => {
    router.push(`/project-request/material-consumption-request/${id}/edit`);
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
            {[1, 2, 3, 4].map((i) => (
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

  const reqObj: any = request;
  const parentPR: any = typeof reqObj.project_request === "object" ? reqObj.project_request : null;

  // Resolve requester name accurately
  let requesterName = "-";
  if (reqObj.requester_details?.user) {
    const u = reqObj.requester_details.user;
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
    requesterName = fullName || u.username || u.email || "-";
  } else if (reqObj.created_by_details) {
    const fullName = `${reqObj.created_by_details.first_name || ""} ${reqObj.created_by_details.last_name || ""}`.trim();
    requesterName = fullName || reqObj.created_by_details.username || "-";
  } else if (parentPR?.created_by_details) {
    const fullName = `${parentPR.created_by_details.first_name || ""} ${parentPR.created_by_details.last_name || ""}`.trim();
    requesterName = fullName || parentPR.created_by_details.username || "-";
  } else if (reqObj.created_by_name) {
    requesterName = reqObj.created_by_name;
  } else if (reqObj.requester_name) {
    requesterName = reqObj.requester_name;
  } else if (reqObj.requester && typeof reqObj.requester === "string") {
    requesterName = reqObj.requester;
  } else if (reqObj.created_by_id) {
    requesterName = `User #${reqObj.created_by_id}`;
  }

  const refId =
    reqObj.request_id ||
    reqObj.reference_id ||
    parentPR?.reference_id ||
    `MC${String(reqObj.id || id).padStart(5, "0")}`;

  const createdDateRaw = reqObj.date_consumed || reqObj.created_at || reqObj.date;
  const formattedDate = createdDateRaw
    ? new Date(createdDateRaw).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  const projectName =
    reqObj.project_details?.name ||
    reqObj.project_name ||
    parentPR?.project_details?.name ||
    parentPR?.project_name ||
    (typeof reqObj.project === "number" ? `Project #${reqObj.project}` : "-");

  const locationName =
    reqObj.location_details?.location_name ||
    reqObj.location_details?.name ||
    reqObj.site_location ||
    parentPR?.site_location ||
    (typeof reqObj.location === "object" ? reqObj.location?.location_name || reqObj.location?.name : null) ||
    "-";

  const phaseName =
    reqObj.phase_details?.name ||
    reqObj.phase_name ||
    (typeof reqObj.phase === "string" && !reqObj.phase.includes("-") ? reqObj.phase : null) ||
    "-";

  const activityName =
    reqObj.activity_details?.name ||
    reqObj.activity_name ||
    (typeof reqObj.activity === "string" && !reqObj.activity.includes("-") ? reqObj.activity : null) ||
    "-";

  const rawLines = reqObj.lines || reqObj.items || [];
  const materials: MaterialItem[] = rawLines.map((item: any, idx: number) => {
    const qty = Number(item.quantity || item.quantity_used || 0);
    const cost = Number(item.unit_cost || item.standard_cost || item.estimated_unit_cost || 0);
    const total = Number(item.total_cost || qty * cost || 0);
    const pName =
      item.product_details?.name ||
      item.product_details?.product_name ||
      item.product_name ||
      (typeof item.product === "number" ? `Product #${item.product}` : "Product");
    const uomObj =
      (typeof item.product_details?.unit_of_measure === "object" ? item.product_details?.unit_of_measure : null) ||
      item.product_details?.unit_of_measure_details ||
      (typeof item.unit_of_measure === "object" ? item.unit_of_measure : null) ||
      item.unit_of_measure_details;
    const uom =
      uomObj?.symbol ||
      uomObj?.unit_symbol ||
      uomObj?.name ||
      uomObj?.unit_name ||
      (typeof item.unit_of_measure === "string" ? item.unit_of_measure : "");
    return {
      id: item.id || idx,
      productName: pName,
      unitCost: cost,
      quantity: qty,
      unitOfMeasure: uom,
      lineTotal: total,
    };
  });

  const totalCost =
    materials.reduce((sum, item) => sum + item.lineTotal, 0) ||
    Number(parentPR?.request_amount || 0);


  const noteText =
    reqObj.notes ||
    reqObj.consumption_reason ||
    reqObj.justification_notes ||
    "-";

  const statusVal = (reqObj.status || parentPR?.status || "pending").toLowerCase();
  const isDraft = statusVal === "draft";
  const canEdit = isDraft && canDo("project_request", "edit");
  const canDelete = isDraft && canDo("project_request", "delete");
  const canSubmit = isDraft;

  const renderStatusBadge = (status?: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "approved":
        return (
          <span className="bg-[#D8F5E5] text-[#22C55E] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center">
            Approved
          </span>
        );
      case "released":
        return (
          <span className="bg-[#D8F5E5] text-[#22C55E] text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center">
            Released
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
          <span className="bg-gray-100 text-gray-700 text-[12px] font-normal px-3 py-0.5 rounded-full inline-flex items-center justify-center capitalize">
            {status || "Pending"}
          </span>
        );
    }
  };

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
                onClick={() => router.push("/project-request/material-consumption-request")}
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
          <main className="space-y-0 flex-1">
            {/* Section 1: Basic Information */}
            <section className="px-5 py-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-lg font-normal text-[#3B7CED] mb-2">Basic Information</h2>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-1">{refId}</span>
                  <span className="block text-[16px] font-semibold text-black/80">
                    Material Consumption
                  </span>
                </div>
                <div className="pt-1">
                  {renderStatusBadge(reqObj.release_status === "RELEASED" ? "released" : statusVal)}
                </div>
              </div>

              <div className="border-b border-gray-100 my-4" />

              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                    Requested by
                  </span>
                  <span className="block text-[14px] font-semibold text-black/80">{requesterName}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Date</span>
                  <span className="block text-[14px] font-semibold text-black/80">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="w-full h-2.5 bg-[#F1F3F6]" />

            {/* Section 2: Consumption Details */}
            <section className="px-5 py-6 space-y-4">
              <h2 className="text-lg font-normal text-[#3B7CED]">Consumption Details</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Project</span>
                  <span className="block text-[14px] font-semibold text-black/80">{projectName}</span>
                </div>
                <div>
                  <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Location</span>
                  <span className="block text-[14px] font-semibold text-black/80">{locationName}</span>
                </div>
              </div>
              <div>
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">
                  Total Line Items
                </span>
                <span className="block text-[14px] font-semibold text-black/80">
                  {materials.length} items
                </span>
              </div>
            </section>

            {/* Divider */}
            <div className="w-full h-2.5 bg-[#F1F3F6]" />

            {/* Section 3: WBS Breakdown */}
            <section className="px-5 py-6">
              <h2 className="text-lg font-normal text-[#3B7CED] mb-4">WBS Breakdown</h2>
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

            {/* Divider */}
            <div className="w-full h-2.5 bg-[#F1F3F6]" />

            {/* Section 4: Consumed Materials Breakdown */}
            <section className="px-5 py-6 space-y-4">
              <h2 className="text-lg font-normal text-[#3B7CED]">Consumed Materials Breakdown</h2>
              <div className="space-y-3">
                {materials.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-white border border-[#E5E7EB] rounded-[8px] p-3.5 shadow-none"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[14px] font-semibold text-black/80">{item.productName}</span>
                      <span className="text-[14px] font-semibold text-black/80">
                        ₦{item.lineTotal.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[12px] text-[#8C9BAE]">
                      <span>Unit Cost: ₦{item.unitCost.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span>
                        Quantity: {item.quantity}{item.unitOfMeasure ? ` ${item.unitOfMeasure}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="pt-2">
                <span className="block text-[13px] text-[#8C9BAE] font-normal mb-0.5">Note</span>
                <span className="block text-[14px] font-semibold text-black/80">
                  {noteText && noteText.trim() ? noteText : "-"}
                </span>
              </div>
            </section>
          </main>

          {/* Thick Divider Bar at Bottom */}
          <div className="w-full h-2.5 bg-[#F1F3F6] shrink-0" />

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
