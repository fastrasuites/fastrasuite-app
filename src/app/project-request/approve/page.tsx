"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, User, Loader2, FileCheck, ArrowRight } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  useGetProjectRequestsQuery, 
  useApproveProjectRequestMutation, 
  useRejectProjectRequestMutation 
} from "@/api/requests/projectRequestApi";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { extractErrorMessage } from "@/lib/utils";
import { ModuleWizard, WizardGuideButton } from "@/components/shared/wizard/ModuleWizard";

export default function ApproveRequestPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth?.user);
  const statusModal = useStatusModal();

  const [removedIds, setRemovedIds] = useState<number[]>([]);

  const { data: rawApiRequests, isLoading: isRequestsLoading, refetch } = useGetProjectRequestsQuery({
    status: "pending",
    ordering: "-created_at",
  }, {
    refetchOnMountOrArgChange: true,
  });

  React.useEffect(() => {
    refetch();
  }, [refetch]);
  
  const apiRequests = React.useMemo(() => {
    const list = Array.isArray(rawApiRequests) ? rawApiRequests : (rawApiRequests as any)?.results || [];
    return [...list]
      .filter((req: any) => !removedIds.includes(req.id))
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        return Number(b.id || 0) - Number(a.id || 0);
      });
  }, [rawApiRequests, removedIds]);
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

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
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
        return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const handleApprove = async (id: number) => {
    const request = apiRequests.find((r: any) => r.id === id);
    let displayId = `REQ-${id}`;
    if (request) {
      if (request.request_type === "material_consumption") {
        let detail = {};
        if (request.detail) {
          if (typeof request.detail === "string") {
            try {
              detail = JSON.parse(request.detail);
            } catch (e) {}
          } else {
            detail = request.detail;
          }
        }
        displayId = (detail as any)?.request_id || request.reference_id || `MCR-${id}`;
      } else {
        displayId = request.reference_id || `REQ-${id}`;
      }
    }

    // Optimistically remove from view immediately
    setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      await approveRequest({ id }).unwrap();
      statusModal.showSuccess(
        "Request Approved",
        `Project request ${displayId} has been successfully approved.`
      );
      refetch();
      router.refresh();
    } catch (err: any) {
      // Revert if error
      setRemovedIds((prev) => prev.filter((item) => item !== id));
      const errMsg = extractErrorMessage(err, "An error occurred while approving the request.");
      statusModal.showError("Approval Failed", errMsg);
    }
  };

  const handleReject = async (id: number) => {
    const request = apiRequests.find((r: any) => r.id === id);
    let displayId = `REQ-${id}`;
    if (request) {
      if (request.request_type === "material_consumption") {
        let detail = {};
        if (request.detail) {
          if (typeof request.detail === "string") {
            try {
              detail = JSON.parse(request.detail);
            } catch (e) {}
          } else {
            detail = request.detail;
          }
        }
        displayId = (detail as any)?.request_id || request.reference_id || `MCR-${id}`;
      } else {
        displayId = request.reference_id || `REQ-${id}`;
      }
    }

    // Optimistically remove from view immediately
    setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      await rejectRequest({ id }).unwrap();
      statusModal.showSuccess(
        "Request Rejected",
        `Project request ${displayId} has been successfully rejected.`
      );
      refetch();
      router.refresh();
    } catch (err: any) {
      // Revert if error
      setRemovedIds((prev) => prev.filter((item) => item !== id));
      const errMsg = extractErrorMessage(err, "An error occurred while rejecting the request.");
      statusModal.showError("Rejection Failed", errMsg);
    }
  };

  const handleModalClose = () => {
    statusModal.close();
    refetch();
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-[#F9FAFB]"
    >
      {/* Custom Header with Back Button */}
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
            <h1 className="text-xl md:text-2xl font-normal text-gray-900">
              Approve Request
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <WizardGuideButton moduleId="project-request" />
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={24} className="text-gray-900" />
            </button>
            <div className="w-8 h-8 bg-[#ffcdd2] rounded-full flex items-center justify-center overflow-hidden">
              {user?.user_image ? (
                <img
                  src={user.user_image}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={18} className="text-red-900" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pt-6 pb-24">
        <div className="space-y-4">
          {isRequestsLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
                  <div>
                    <Skeleton className="h-3 w-16 bg-gray-100 mb-2" />
                    <Skeleton className="h-5 w-48 bg-gray-100" />
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-16 bg-gray-100" />
                      <Skeleton className="h-4 w-24 bg-gray-100" />
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Skeleton className="h-3 w-16 bg-gray-100" />
                      <Skeleton className="h-4 w-28 bg-gray-100" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="h-10 flex-1 bg-gray-100 rounded" />
                    <Skeleton className="h-10 flex-1 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : apiRequests && apiRequests.length > 0 ? (
            apiRequests.map((request: any) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-[#3B7CED] transition-colors"
                onClick={() =>
                  router.push(`/project-request/approve/${request.id}`)
                }
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#3B7CED] mb-0.5 block">
                      {request.reference_id || `REQ-${request.id}`}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">
                      {getProjectName(request.project)}
                    </h3>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 font-medium mb-0.5">
                        Request Type
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {getRequestTypeLabel(request.request_type)}
                      </p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-400 font-medium mb-0.5">
                        Requester
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {request.created_by_details 
                          ? `${request.created_by_details.first_name} ${request.created_by_details.last_name}` 
                          : `User #${request.created_by}`}
                      </p>
                    </div>
                  </div>

                  <PermissionGuard module="project_request" entitlement="approve">
                    <div data-wizard="pr-approve-action" className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-10 font-semibold"
                        disabled={isApproving || isRejecting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(request.id);
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        className="flex-1 border border-[#22c55e] bg-[#22c55e] hover:bg-[#16a34a] text-white h-10 font-semibold"
                        disabled={isApproving || isRejecting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(request.id);
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  </PermissionGuard>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-6 max-w-md mx-auto mt-8 transition-all hover:shadow-md duration-300">
              <div className="relative">
                {/* Decorative background glow */}
                <div className="absolute inset-0 bg-[#3B7CED]/10 rounded-full blur-xl transform scale-150 animate-pulse"></div>
                <div className="w-16 h-16 bg-[#EEF4FF] border border-[#D0E1FD] rounded-full flex items-center justify-center relative z-10 text-[#3B7CED]">
                  <FileCheck size={28} className="animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                  There are no pending project requests awaiting your approval at the moment.
                </p>
              </div>

              <Button
                onClick={() => router.push("/project-request")}
                className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white px-6 h-11 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 border-none shadow-none"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </main>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={handleModalClose}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        actionText="Done"
        onAction={handleModalClose}
      />
      <ModuleWizard moduleId="project-request" />
    </motion.div>
  );
}
