"use client";

import React from "react";
import { ArrowLeft, Loader2, ShieldCheck, DollarSign } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useGetProjectCostingProjectQuery,
  useGetProjectSettingsQuery,
  useUpdateProjectSettingsMutation,
} from "@/api/projectCostingApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectSettingsPage() {
  const params = useParams();
  const id = params?.id;

  const statusModal = useStatusModal();

  const {
    data: project,
    isLoading: isLoadingProject,
    refetch: refetchProject,
  } = useGetProjectCostingProjectQuery(Number(id), { skip: !id });

  const {
    data: projectSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useGetProjectSettingsQuery(Number(id), { skip: !id });

  const [updateProjectSettings, { isLoading: isUpdatingSettings }] =
    useUpdateProjectSettingsMutation();

  const allowBudgetDecrease =
    projectSettings?.allow_budget_decrease ??
    project?.allow_budget_decrease ??
    true;

  const handleToggleBudgetDecrease = async (checked: boolean) => {
    try {
      await updateProjectSettings({
        id: Number(id),
        body: { allow_budget_decrease: checked },
      }).unwrap();
      await refetchSettings();
      refetchProject();
      statusModal.showSuccess(
        "Settings Updated",
        `Budget decrease has been ${checked ? "enabled" : "disabled"} for this project.`
      );
    } catch (err) {
      console.error(err);
      statusModal.showError(
        "Update Failed",
        "Failed to update project settings. Please check your connection and try again."
      );
    }
  };

  return (
    <PageGuard module="project_costing" entitlement="view_project">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-gray-50 pb-20">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Link href={`/project-costing/${id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-medium text-gray-800">
                  Project Settings
                </h1>
                {project?.name && (
                  <span className="text-xs text-gray-500 font-normal">
                    • {project.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-[1000px] mx-auto w-full flex flex-col gap-6">
          {isLoadingProject || isLoadingSettings ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-4">
              <Skeleton className="h-6 w-48 bg-gray-100" />
              <Skeleton className="h-4 w-96 bg-gray-100" />
              <Skeleton className="h-24 w-full bg-gray-50 rounded mt-4" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Budget & Costing Settings
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage adjustment rules, thresholds, and financial controls for{" "}
                  <span className="font-semibold text-gray-700">
                    {project?.name || `Project #${id}`}
                  </span>
                  .
                </p>
              </div>

              {/* Setting Card: Allow Budget Decrease */}
              <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/50 flex items-start justify-between gap-6">
                <div className="flex flex-col gap-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-gray-800 text-base">
                      Allow Budget Decrease
                    </span>
                    <Badge
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 ${
                        allowBudgetDecrease
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {allowBudgetDecrease ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    When enabled, users and project managers can create budget adjustment requests that decrease individual activity or overall project allocations. When disabled, only budget increases or non-decreasing adjustments are permitted.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-1">
                  {isUpdatingSettings && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#3B7CED]" />
                  )}
                  <Switch
                    checked={allowBudgetDecrease}
                    disabled={isUpdatingSettings || isLoadingSettings}
                    className="data-[state=checked]:bg-[#3B7CED] data-[state=unchecked]:bg-gray-200"
                    onCheckedChange={handleToggleBudgetDecrease}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Modal */}
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText="Done"
          onAction={statusModal.close}
          showCloseButton={false}
        />
      </div>
    </PageGuard>
  );
}
