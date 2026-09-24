"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Bell, User } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  useGetProjectRequestQuery, 
  useApproveProjectRequestMutation, 
  useRejectProjectRequestMutation 
} from "@/api/requests/projectRequestApi";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { extractErrorMessage } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGetUserByIdQuery } from "@/api/settings/usersApi";
import { useGetVendorByIdQuery, useGetActiveVendorsQuery } from "@/api/invoice/vendorsApi";

const DataField = ({ label, value, fullWidth = false }: { label: string; value: string | React.ReactNode; fullWidth?: boolean }) => (
  <div className={`flex flex-col gap-1 ${fullWidth ? "col-span-2" : ""}`}>
    <p className="text-[13px] text-gray-400 font-medium">{label}</p>
    <div className="text-[14px] font-semibold text-gray-900">{value}</div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-[17px] font-normal text-[#3B7CED] mb-4 mt-6 first:mt-0">{title}</h2>
);

export default function RequestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const user = useSelector((state: RootState) => state.auth?.user);
  const statusModal = useStatusModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const requestId = typeof params.id === "string" ? params.id : "";
  const numericId = Number(requestId);

  const { data: request, isLoading: isRequestLoading, refetch } = useGetProjectRequestQuery(numericId, {
    skip: !requestId || isNaN(numericId),
    refetchOnMountOrArgChange: true,
  });

  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const { data: rawProjects } = useGetProjectCostingProjectsQuery({});
  const projects = React.useMemo(() => {
    const list = Array.isArray(rawProjects) ? rawProjects : (rawProjects as any)?.results || [];
    return list;
  }, [rawProjects]);

  const [approveRequest, { isLoading: isApproving }] = useApproveProjectRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectProjectRequestMutation();

  const getProjectName = (projectId?: number) => {
    if (!projectId) return "General Project";
    const proj = projects?.find((p: any) => p.id === projectId);
    return proj ? (proj.name || proj.project_name || `Project #${projectId}`) : `Project #${projectId}`;
  };

  const getRequestTypeLabel = (type?: string) => {
    switch (type) {
      case "material_consumption":
        return "Material Consumption Request";
      case "labour":
        return "Labour Request";
      case "purchase":
        return "Purchase Request";
      case "petty_cash":
        return "Petty Cash Request";
      case "subcontractor":
        return "Subcontractor Request";
      case "plant_equipment":
        return "Plant & Equipment Request";
      default:
        return (type || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Project Request";
    }
  };

  const detail = React.useMemo(() => {
    if (!request?.detail) return {};
    if (typeof request.detail === "string") {
      try {
        return JSON.parse(request.detail);
      } catch (e) {
        return {};
      }
    }
    return request.detail;
  }, [request]);

  const requestType = request?.request_type || detail?.project_request?.request_type || "";
  const isMaterialConsumption = requestType === "material_consumption";
  const isPettyCash = requestType === "petty_cash";
  const isLabour = requestType === "labour";
  const isSubcontractor = requestType === "subcontractor";
  const isPlantEquipment = requestType === "plant_equipment";
  const isPurchase = requestType === "purchase" || (!isMaterialConsumption && !isPettyCash && !isLabour && !isSubcontractor && !isPlantEquipment && (detail.items || detail.lines || detail.pr_total_price || detail.site_location));

  const purchaseLines = React.useMemo(() => {
    if (Array.isArray(detail?.lines) && detail.lines.length > 0) return detail.lines;
    if (Array.isArray(detail?.items) && detail.items.length > 0) return detail.items;
    return [];
  }, [detail]);

  const cleanNotes = React.useMemo(() => {
    const raw = detail?.notes || detail?.justification_notes || detail?.purpose || "";
    if (typeof raw === "string" && raw.includes(" | ")) {
      const notesMatch = raw.match(/Notes?:\s*(.+)$/i);
      if (notesMatch && notesMatch[1]) return notesMatch[1].trim();
      const parts = raw.split(" | ");
      for (const part of parts) {
        if (part.startsWith("Notes: ") || part.startsWith("Note: ")) {
          return part.replace(/^Notes?:\s*/, "").trim();
        }
      }
    }
    return raw || "N/A";
  }, [detail]);

  const formatCurrency = (val?: string | number) => {
    if (val === undefined || val === null) return "₦0.00";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "₦0.00";
    return "₦" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Resolved entities from response
  const projectName = 
    request?.project_details?.name || 
    detail?.project_details?.name || 
    getProjectName(request?.project || detail?.project);

  const { fullName: currentUserName, user: currentUser } = useCurrentUser();

  const creatorTenantId = 
    detail?.requester_details?.id ||
    detail?.created_by_id ||
    request?.created_by;

  const { data: creatorTenantUser } = useGetUserByIdQuery(
    Number(creatorTenantId),
    { skip: !creatorTenantId || isNaN(Number(creatorTenantId)) }
  );

  const vendorId =
    detail?.vendor?.id ||
    detail?.vendor ||
    detail?.vendor_id ||
    (request as any)?.vendor?.id ||
    (request as any)?.vendor ||
    (request as any)?.vendor_id;

  const { data: vendorFromApi } = useGetVendorByIdQuery(Number(vendorId), {
    skip: !vendorId || isNaN(Number(vendorId)),
  });

  const { data: activeVendors = [] } = useGetActiveVendorsQuery(undefined, {
    skip: Boolean(vendorFromApi),
  });

  const subcontractorName = React.useMemo(() => {
    if (vendorFromApi?.vendor_name) return vendorFromApi.vendor_name;
    if (detail?.vendor_details?.vendor_name) return detail.vendor_details.vendor_name;
    if (typeof detail?.vendor_name === "string" && detail.vendor_name.trim().length > 0) {
      return detail.vendor_name.trim();
    }
    if (vendorId && activeVendors.length > 0) {
      const match = activeVendors.find((v: any) => String(v.id) === String(vendorId));
      if (match?.vendor_name) return match.vendor_name;
    }
    if (vendorId) return `Vendor #${vendorId}`;
    return "N/A";
  }, [vendorFromApi, detail, activeVendors, vendorId]);

  const requestedBy = React.useMemo(() => {
    // 1. If creator matches current user, use complete name from current user profile
    const creatorEmail = request?.created_by_details?.email || detail?.requester_details?.user?.email;
    const isCurrent =
      (creatorEmail && currentUser?.email && creatorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      (request?.created_by && currentUser?.id && Number(request.created_by) === Number(currentUser.id));
    if (isCurrent && currentUserName && currentUserName !== "Current User") {
      return currentUserName;
    }

    // 2. Try tenant user record
    if (creatorTenantUser) {
      const tName = `${creatorTenantUser.first_name || ""} ${creatorTenantUser.last_name || ""}`.trim();
      if (tName && tName.toLowerCase() !== "admin") return tName;
      if (creatorTenantUser.user?.username && creatorTenantUser.user.username.toLowerCase() !== "admin") {
        return creatorTenantUser.user.username;
      }
    }

    // 3. Try created_by_details
    if (request?.created_by_details) {
      const u = request.created_by_details;
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
      if (fullName && fullName.toLowerCase() !== "admin") return fullName;
      if (u.username && u.username.toLowerCase() !== "admin") return u.username;
    }

    // 4. Try requester_details in detail
    if (detail?.requester_details?.user) {
      const u = detail.requester_details.user;
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
      if (fullName && fullName.toLowerCase() !== "admin") return fullName;
      if (u.username && u.username.toLowerCase() !== "admin") return u.username;
    }

    // 5. If currentUserName is available, use it over generic "admin"
    if (currentUserName && currentUserName !== "Current User") {
      return currentUserName;
    }

    const fallbackUsername = detail?.requester_details?.user?.username || request?.created_by_details?.username;
    if (fallbackUsername) return fallbackUsername;

    const rawName = request?.created_by_details?.first_name || detail?.created_by_name;
    if (rawName) {
      return rawName.charAt(0).toUpperCase() + rawName.slice(1);
    }

    return "Admin User";
  }, [request, detail, currentUserName, currentUser, creatorTenantUser]);

  const subcontractorNote = React.useMemo(() => {
    return (
      detail?.justification_notes ||
      detail?.notes ||
      detail?.description ||
      (request as any)?.justification_notes ||
      (request as any)?.notes ||
      "N/A"
    );
  }, [detail, request]);

  const specificRefId =
    detail?.reference_id ||
    detail?.request_id ||
    detail?.petty_cash_id ||
    detail?.subcontractor_id ||
    detail?.plant_equipment_id ||
    detail?.labour_id;

  const mainRequestId = specificRefId || request?.reference_id || (request?.id ? `REQ-${request.id}` : "N/A");
  const subRequestId = specificRefId;

  const phaseName = 
    detail?.phase_details?.name || 
    (typeof detail?.phase === "object" ? detail?.phase?.name : null) || 
    detail?.phase_name || 
    (typeof detail?.phase === "string" && !detail.phase.includes("-") ? detail.phase : null) || 
    "N/A";

  const activityName = 
    detail?.activity_details?.name || 
    (typeof detail?.activity === "object" ? detail?.activity?.name : null) || 
    detail?.activity_name || 
    detail?.task || 
    (typeof detail?.activity === "string" && !detail.activity.includes("-") ? detail.activity : null) || 
    "N/A";
  
  const availableBudget = Number(
    detail?.available_budget !== undefined 
      ? detail.available_budget 
      : detail?.budget !== undefined 
      ? detail.budget 
      : 0
  );

  const getTotalCost = () => {
    if (detail?.project_request?.request_amount !== undefined && Number(detail.project_request.request_amount) > 0) {
      return Number(detail.project_request.request_amount);
    }
    if (detail?.total_amount !== undefined && Number(detail.total_amount) > 0) {
      return Number(detail.total_amount);
    }
    if (isPurchase) {
      if (detail.pr_total_price) return Number(detail.pr_total_price);
      if (purchaseLines.length > 0) {
        return purchaseLines.reduce((sum: number, i: any) => {
          const qty = Number(i.quantity || i.qty || 0);
          const cost = Number(i.estimated_unit_cost || i.estimated_unit_price || i.unit_cost || i.unit_price || 0);
          return sum + Number(i.line_total || i.total_cost || i.estimated_total_price || qty * cost);
        }, 0);
      }
    }
    if (isMaterialConsumption) {
      return (detail.lines || []).reduce((sum: number, l: any) => sum + Number(l.total_cost || (Number(l.quantity || 0) * Number(l.unit_cost || 0))), 0);
    }
    if (isPettyCash) {
      return Number(
        detail.amount_requested ||
        detail.amountRequested ||
        detail.amount ||
        detail.project_request?.request_amount ||
        (request as any)?.request_amount ||
        (request as any)?.amount ||
        0
      );
    }
    if (isLabour) {
      if (detail.projected_cost && parseFloat(detail.projected_cost) > 0)
        return parseFloat(detail.projected_cost);
      return (
        (Number(detail.estimated_daily_rate) || 0) *
        (Number(detail.number_of_workers) || 0) *
        (Number(detail.duration) || 0)
      );
    }
    if (isSubcontractor) return Number(detail.contract_value || 0);
    if (isPlantEquipment) return Number(detail.estimated_cost || 0);
    return Number((request as any)?.total_cost || (request as any)?.amount || (request as any)?.request_amount || 0);
  };

  const effectiveStatus = localStatus || request?.status || detail?.status || "pending";

  const getStatusBadge = (status?: string) => {
    const st = (status || effectiveStatus).toLowerCase();
    switch (st) {
      case "approved":
        return <span className="bg-emerald-50 text-emerald-600 font-semibold text-xs px-2.5 py-1 rounded-full border border-emerald-200">Approved</span>;
      case "rejected":
      case "cancelled":
        return <span className="bg-red-50 text-red-600 font-semibold text-xs px-2.5 py-1 rounded-full border border-red-200">Rejected</span>;
      default:
        return <span className="bg-amber-50 text-amber-600 font-semibold text-xs px-2.5 py-1 rounded-full border border-amber-200">Pending</span>;
    }
  };

  const handleApprove = async () => {
    const displayRequestId = mainRequestId;
    try {
      await approveRequest({ id: numericId }).unwrap();
      setLocalStatus("approved");
      statusModal.showSuccess(
        "Request Approved",
        `Project request ${displayRequestId} has been successfully approved.`
      );
      refetch();
    } catch (err: any) {
      console.error("Approve Error:", err);
      const errMsg = extractErrorMessage(err, "An error occurred while approving the request.");
      statusModal.showError("Approval Failed", errMsg);
    }
  };

  const handleReject = async () => {
    const displayRequestId = mainRequestId;
    try {
      await rejectRequest({ id: numericId }).unwrap();
      setLocalStatus("rejected");
      statusModal.showSuccess(
        "Request Rejected",
        `Project request ${displayRequestId} has been successfully rejected.`
      );
      refetch();
    } catch (err: any) {
      console.error("Reject Error:", err);
      const errMsg = extractErrorMessage(err, "An error occurred while rejecting the request.");
      statusModal.showError("Rejection Failed", errMsg);
    }
  };

  const handleModalClose = () => {
    statusModal.close();
    if (statusModal.type === "success") {
      router.push("/project-request/approve");
      router.refresh();
    }
  };

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-[#F9FAFB] pb-56 md:pb-64"
    >
      {/* Custom Header */}
      <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl md:text-2xl font-normal text-gray-900">Approve Request</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={24} className="text-gray-900" />
            </button>
            <div className="w-8 h-8 bg-[#ffcdd2] rounded-full flex items-center justify-center overflow-hidden">
              {user?.user_image ? (
                <img src={user.user_image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-red-900" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 bg-white min-h-[calc(100vh-64px)] shadow-sm pb-56 md:pb-64">
        {isRequestLoading ? (
          <div className="flex flex-col gap-6 py-6">
            <Skeleton className="h-5 w-40 bg-gray-200" />
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-20 bg-gray-100" />
                  <Skeleton className="h-4 w-36 bg-gray-100" />
                </div>
              ))}
            </div>
            <div className="border-t border-gray-150 my-2"></div>
            <Skeleton className="h-5 w-24 bg-gray-200" />
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 bg-gray-100" />
                <Skeleton className="h-4 w-28 bg-gray-100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 bg-gray-100" />
                <Skeleton className="h-4 w-28 bg-gray-100" />
              </div>
            </div>
          </div>
        ) : request ? (
          <>
            <SectionHeader title="Basic Information" />
            
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <DataField label="Request Type" value={getRequestTypeLabel(requestType)} />
              <DataField label="Requested by" value={requestedBy} />
              
              <DataField label="Request ID" value={mainRequestId} />
              <DataField label="Date" value={formatDate(detail.date_consumed || detail.created_at || request.created_at)} />
              
              <div className="col-span-2 border-t border-gray-100 my-1"></div>
              
              <DataField 
                label="Project" 
                value={projectName} 
              />
              <DataField label="Status" value={getStatusBadge(effectiveStatus)} />
              
              {isMaterialConsumption && (
                <>
                  {subRequestId && subRequestId !== mainRequestId && (
                    <DataField label="Material Request ID" value={subRequestId} />
                  )}
                  <DataField 
                    label="Store / Location" 
                    value={detail.location_details?.location_name || detail.location_details?.location_code || detail.location || "N/A"} 
                  />
                  {detail.date_consumed && (
                    <DataField label="Date Consumed" value={formatDate(detail.date_consumed)} />
                  )}
                  {detail.release_status && (
                    <DataField label="Release Status" value={detail.release_status} />
                  )}
                </>
              )}

              {isPettyCash && (
                <>
                  <DataField label="Purpose / Expense Category" value={detail.purpose || detail.category || "N/A"} />
                  <DataField label="Description" value={detail.description || "N/A"} fullWidth />
                </>
              )}

              {isLabour && (
                <>
                  <DataField label="Role / Trade Type" value={detail.role_type || detail.role || "N/A"} />
                  <DataField label="Number of Workers" value={String(detail.number_of_workers || 0)} />
                </>
              )}

              {isSubcontractor && (
                <>
                  <DataField label="Scope of Work" value={detail.scope_of_work || "N/A"} />
                  <DataField label="Subcontractor Name" value={subcontractorName} fullWidth />
                  <DataField label="Start Date" value={formatDate(detail.start_date)} />
                  <DataField label="End Date" value={formatDate(detail.end_date)} />
                  <DataField label="Note" value={subcontractorNote} fullWidth />
                </>
              )}

              {isPlantEquipment && (
                <>
                  <DataField label="Equipment Name" value={detail.equipment_name || "N/A"} />
                  <DataField label="Description" value={detail.description || "N/A"} fullWidth />
                  <DataField label="Quantity" value={String(detail.quantity || 0)} />
                  <DataField label="Required Date" value={formatDate(detail.required_date)} />
                </>
              )}

              {isPurchase && (
                <>
                  <DataField label="Required By Date" value={formatDate(detail.required_by_date || detail.requiredDate || detail.date_required)} />
                  <DataField 
                    label="Site Location" 
                    value={
                      detail.site_location ||
                      (request as any)?.site_location ||
                      detail.location_details?.location_name ||
                      detail.location_details?.name ||
                      detail.requesting_location_details?.location_name ||
                      detail.requesting_location_details?.name ||
                      detail.requesting_location ||
                      detail.location ||
                      (request as any)?.location ||
                      "N/A"
                    } 
                  />
                </>
              )}
            </div>

            <SectionHeader title="Work Breakdown Structure (WBS)" />
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <DataField 
                label="Phase" 
                value={phaseName} 
              />
              <DataField 
                label="Activity" 
                value={activityName} 
              />
              {availableBudget > 0 && !isMaterialConsumption && (
                <DataField label="Activity Available Budget" value={formatCurrency(availableBudget)} />
              )}
            </div>

            {/* Request Type Specific Details & Products */}
            {isMaterialConsumption && (
              <>
                <SectionHeader title="Materials Consumed" />
                <div className="space-y-3">
                  {detail.lines && detail.lines.length > 0 ? (
                    detail.lines.map((line: any, idx: number) => {
                      const prod = line.product_details || {};
                      const uom = prod.unit_of_measure_details?.unit_symbol || prod.unit_of_measure_details?.unit_name || line.unit_of_measure_details?.unit_symbol || "";
                      const lineTotal = Number(line.total_cost || (Number(line.quantity || 0) * Number(line.unit_cost || 0)));

                      return (
                        <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-white space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[14px] font-semibold text-gray-900">
                                {prod.product_name || line.product_name || `Product #${line.product}`}
                              </span>
                            </div>
                            <span className="text-[14px] font-bold text-gray-900">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-600">
                            <span>Quantity: <strong className="text-gray-900">{line.quantity} {uom}</strong></span>
                            <span>Unit Cost: <strong className="text-gray-900">{formatCurrency(line.unit_cost || prod.standard_cost)}</strong></span>
                            {prod.product_category_details?.category_name && (
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-[11px]">
                                {prod.product_category_details.category_name}
                              </span>
                            )}
                          </div>
                          {prod.description && (
                            <p className="text-[12px] text-gray-400">{prod.description}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 ">No material lines recorded.</p>
                  )}
                </div>
                <div className="mt-6">
                  <DataField label="Note" value={detail.notes || detail.justification_notes || "N/A"} fullWidth />
                </div>
              </>
            )}

            {isPettyCash && (
              <>
                <SectionHeader title="Cost Details" />
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <DataField
                    label="Amount Requested"
                    value={formatCurrency(
                      detail.amount_requested ||
                      detail.amountRequested ||
                      detail.amount ||
                      detail.project_request?.request_amount ||
                      (request as any)?.request_amount ||
                      (request as any)?.amount
                    )}
                    fullWidth
                  />
                  <DataField label="Note" value={detail.notes || detail.justification_notes || "N/A"} fullWidth />
                </div>
              </>
            )}

            {isLabour && (
              <>
                <SectionHeader title="Cost Details" />
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <DataField label="Duration" value={`${detail.duration || 0} ${detail.duration_unit || "days"}`} />
                  <DataField
                    label={
                      detail.duration_unit === "weeks"
                        ? "Estimated Weekly Rate"
                        : detail.duration_unit === "months"
                          ? "Estimated Monthly Rate"
                          : "Estimated Daily Rate"
                    }
                    value={formatCurrency(detail.estimated_daily_rate)}
                  />
                  <DataField label="Note" value={detail.justification_notes || detail.notes || "N/A"} fullWidth />
                </div>
              </>
            )}

            {isSubcontractor && (
              <>
                <SectionHeader title="Cost Details" />
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <DataField label="Contract Value (Estimated)" value={formatCurrency(detail.contract_value)} />
                  <DataField label="Payment Terms" value={detail.payment_terms || "N/A"} />
                  <DataField label="Payment Type" value={detail.payment_type ? (detail.payment_type === "milestone" ? "Milestone" : "Lump sum") : "N/A"} />
                  <DataField label="Note" value={subcontractorNote} fullWidth />
                </div>
              </>
            )}

            {isPlantEquipment && (
              <>
                <SectionHeader title="Cost Details" />
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <DataField label="Estimated Cost" value={formatCurrency(detail.estimated_cost)} fullWidth />
                  <DataField label="Note" value={detail.justification_notes || detail.notes || "N/A"} fullWidth />
                </div>
              </>
            )}

            {isPurchase && !isMaterialConsumption && (
              <>
                <SectionHeader title="Products" />
                <div className="space-y-4">
                  {purchaseLines && purchaseLines.length > 0 ? (
                    purchaseLines.map((item: any, idx: number) => {
                      const prodName =
                        item.product_name ||
                        item.product_details?.product_name ||
                        item.productName ||
                        (typeof item.product === "number"
                          ? `Product #${item.product}`
                          : typeof item.product === "string" && item.product
                          ? item.product
                          : "Unknown Product");

                      const qty = Number(item.quantity || item.qty || 0);
                      const unitCost = Number(
                        item.estimated_unit_cost ||
                        item.estimated_unit_price ||
                        item.unit_cost ||
                        item.unit_price ||
                        0
                      );
                      const lineTotal = Number(
                        item.line_total ||
                        item.total_cost ||
                        item.estimated_total_price ||
                        qty * unitCost
                      );

                      const uom =
                        item.unit_of_measure_symbol ||
                        item.unit_of_measure_name ||
                        item.unit_of_measure_details?.unit_symbol ||
                        item.unit_of_measure_details?.unit_name ||
                        item.uom ||
                        "";

                      const description =
                        item.description ||
                        item.product_details?.product_description ||
                        item.product_description ||
                        "";

                      return (
                        <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-white space-y-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[14px] font-semibold text-gray-900">
                              {prodName}
                            </span>
                            <span className="text-[14px] font-semibold text-gray-900">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[12px] text-gray-600">
                            <span>
                              Quantity: <strong className="text-gray-900">{qty} {uom}</strong>
                            </span>
                            <span>
                              Unit Price: <strong className="text-gray-900">{formatCurrency(unitCost)}</strong>
                            </span>
                          </div>
                          {description && (
                            <div className="text-[12px] text-gray-400">{description}</div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 ">No products listed.</p>
                  )}
                </div>
                <div className="mt-6">
                  <DataField label="Note" value={cleanNotes} fullWidth />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <p className="text-red-500 font-semibold">Request not found or failed to load.</p>
            <Button onClick={() => router.back()} className="mt-4 bg-[#3B7CED]">Go Back</Button>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Bar */}
      {request && effectiveStatus === "pending" && (
        <div className="fixed bottom-0 left-0 md:left-16 right-0 bg-white border-t border-gray-100 px-4 py-4 md:py-6 z-40">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Available Budget</span>
                <span>{formatCurrency(availableBudget)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Total Cost</span>
                <span className="text-[#3B7CED]">
                  {formatCurrency(getTotalCost())}
                </span>
              </div>
            </div>
            <PermissionGuard module="project_request" entitlement="approve">
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-12 text-base font-semibold"
                  disabled={isApproving || isRejecting}
                  onClick={handleReject}
                >
                  {isRejecting ? "Rejecting..." : "Reject"}
                </Button>
                <Button 
                  className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white h-12 text-base font-semibold border-none"
                  disabled={isApproving || isRejecting}
                  onClick={handleApprove}
                >
                  {isApproving ? "Approving..." : "Approve"}
                </Button>
              </div>
            </PermissionGuard>
          </div>
        </div>
      )}

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
    </motion.div>
  );
}
