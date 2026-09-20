"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import {
  useGetLabourRequestQuery,
  useUpdateLabourRequestMutation,
  usePatchLabourRequestMutation,
} from "@/api/requests/labourRequestApi";
import { StatusModal } from "@/components/shared/StatusModal";
import { format } from "date-fns";
import extractErrorMessage from "@/components/requests/utils/RequestErrorHandler";
import { useCurrentUserName } from "@/hooks/useCurrentUser";

const formSchema = z.object({
  project: z.string().min(1, "Please select a project"),
  phase: z.string().min(1, "Please select a phase"),
  task: z.string().min(1, "Please select an activity"),
  numberOfWorkers: z.coerce
    .number()
    .positive("Enter a correct number")
    .min(1, "Enter a correct number")
    .max(100, "Maximum 100 workers"),
  role: z.string().min(2, "Role is required").max(100, "Role name too long"),
  duration: z.coerce
    .number()
    .positive("Enter a valid duration")
    .min(1, "Duration must be at least 1"),
  durationUnit: z.enum(["days", "weeks", "months"], {
    message: "Please select duration unit",
  }),
  dailyRate: z.coerce
    .number()
    .positive("Enter a valid daily rate")
    .min(0, "Daily rate cannot be negative"),
  justification: z
    .string()
    .max(500, "Notes too long (max 500 characters)")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditLabourRequestPage() {
  const params = useParams();
  const router = useRouter();
  const loggedInUserName = useCurrentUserName();
  const id = parseInt(params.id as string);

  const {
    data: request,
    isLoading,
    error,
    refetch,
  } = useGetLabourRequestQuery(id, {
    skip: isNaN(id),
  });

  const [updateLabourRequest, { isLoading: isUpdating }] =
    useUpdateLabourRequestMutation();
  const [patchLabourRequest, { isLoading: isPatching }] =
    usePatchLabourRequestMutation();

  const handleSubmit = async (data: FormValues) => {
    try {
      const ensureValidUUID = (val: string): string => {
        if (!val) return "";
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(val)) return val;
        const numericVal = parseInt(val, 10);
        if (!isNaN(numericVal)) {
          const hexString = numericVal.toString(16).padStart(12, "0");
          return `00000000-0000-0000-0000-${hexString}`;
        }
        return val;
      };

      const submitData = {
        project: parseInt(data.project),
        date_required:
          request?.detail?.date_required ||
          (request as any)?.date_required ||
          new Date().toISOString().split("T")[0],
        number_of_workers: data.numberOfWorkers,
        role_type: data.role,
        duration: data.duration,
        duration_unit: data.durationUnit,
        estimated_daily_rate: data.dailyRate.toString(),
        justification_notes: data.justification || "",
        activity: ensureValidUUID(data.task),
      };

      const targetLabourRequestId = request?.detail?.id || id;

      // Prefer PATCH for partial updates
      await patchLabourRequest({ id: targetLabourRequestId, data: submitData }).unwrap();

      const refetchResult = await refetch();
      const updatedId = refetchResult.data?.id || id;
    } catch (error) {
      console.error("Failed to update labour request:", error);
      throw error;
    }
  };

  if (isLoading || !request) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B7CED] mx-auto mb-2"></div>
          <p className="text-gray-600">Loading request...</p>
        </div>
      </div>
    );
  }

  const calculateLabourTotalCost = (data: Partial<FormValues>) => {
    const workers = Number(data.numberOfWorkers) || 0;
    const rate = Number(data.dailyRate) || 0;
    const dur = Number(data.duration) || 1;
    return workers * rate * dur;
  };

  const config: RequestFormConfig<FormValues> = {
    title: "Edit Labour Request",
    requestId:
      (request?.detail as any)?.reference_code ||
      (request?.detail as any)?.code ||
      `LB${String(request?.detail?.id || request?.id || id).padStart(4, "0")}`,
    requesterName:
      request?.detail?.created_by_name ||
      (request as any)?.project_request?.created_by_details?.first_name ||
      (request as any)?.created_by_name ||
      loggedInUserName,
    date: new Date(
      request?.detail?.created_at ||
        (request as any)?.project_request?.created_at ||
        request?.created_at ||
        Date.now(),
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    sections: [
      {
        title: "Labour Details",
        fields: [
          {
            name: "project",
            label: "Project",
            type: "select",
            placeholder: "Select a project",
            options: [],
          },
          {
            name: "numberOfWorkers",
            label: "Number of Workers",
            type: "number",
            placeholder: "Enter number of workers",
          },
          {
            name: "role",
            label: "Role / Trade Type",
            type: "text",
            placeholder: "Enter role",
          },
        ],
      },
      {
        title: "WBS",
        fields: [
          {
            name: "phase",
            label: "Phase",
            type: "select",
            placeholder: "Select a phase",
            options: [],
            dependsOn: "project",
          },
          {
            name: "task",
            label: "Activity",
            type: "select",
            placeholder: "Select a task",
            options: [],
            dependsOn: "phase",
          },
        ],
      },
      {
        title: "Cost Details",
        fields: [
          {
            name: "duration",
            label: "Duration",
            type: "number",
            placeholder: "Enter duration",
            hintText: "Number of days/weeks/months",
            halfWidth: true,
          },
          {
            name: "durationUnit",
            label: "Duration Unit",
            type: "select",
            placeholder: "Select unit",
            options: [
              { label: "Days", value: "days" },
              { label: "Weeks", value: "weeks" },
              { label: "Months", value: "months" },
            ],
            halfWidth: true,
          },
          {
            name: "dailyRate",
            label: "Estimated Daily Rate",
            type: "number",
            placeholder: "Enter daily rate",
            getDynamicLabel: (values: any) =>
              values?.durationUnit === "weeks"
                ? "Estimated Weekly Rate"
                : values?.durationUnit === "months"
                  ? "Estimated Monthly Rate"
                  : "Estimated Daily Rate",
            getDynamicPlaceholder: (values: any) =>
              values?.durationUnit === "weeks"
                ? "Enter weekly rate"
                : values?.durationUnit === "months"
                  ? "Enter monthly rate"
                  : "Enter daily rate",
          },
        ],
      },
      {
        fields: [
          {
            name: "justification",
            label: "Note",
            type: "textarea",
            placeholder: "Enter note",
            rows: 4,
          },
        ],
        renderTop: (data: FormValues, extra?: any) => {
          const totalCost = calculateLabourTotalCost(data);
          const availBudget = extra?.availableBudget || 0;
          return (
            <div className="pb-4 mb-4 border-b border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">
                  Available Budget
                </span>
                <span className="text-sm font-bold text-[#3B7CED]">
                  ₦
                  {availBudget.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">
                  Total Cost
                </span>
                <span className="text-sm font-bold text-[#3B7CED]">
                  ₦
                  {totalCost.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          );
        },
      },
    ],
    schema: formSchema,
    defaultValues: {
      project:
        request?.project?.toString() ||
        (request as any)?.project_request?.project?.toString() ||
        request?.detail?.project_details?.id?.toString() ||
        "",
      numberOfWorkers:
        request?.detail?.number_of_workers ??
        (request as any)?.number_of_workers ??
        1,
      role: request?.detail?.role_type || (request as any)?.role_type || "",
      duration: request?.detail?.duration ?? (request as any)?.duration ?? 1,
      durationUnit:
        (request?.detail?.duration_unit as any) ||
        ((request as any)?.duration_unit as any) ||
        "days",
      dailyRate: parseFloat(
        request?.detail?.estimated_daily_rate ||
          (request as any)?.estimated_daily_rate ||
          "0",
      ),
      justification:
        request?.detail?.justification_notes ||
        (request as any)?.justification_notes ||
        "",
      phase:
        request?.detail?.phase_details?.id?.toString() ||
        (request as any)?.phase?.toString() ||
        "",
      task:
        request?.activity?.toString() ||
        request?.detail?.activity_details?.id?.toString() ||
        (request as any)?.activity?.toString() ||
        "",
    },
    onSubmit: handleSubmit,
    successMessage: {
      title: "Request Updated",
      description: "Your labour request has been updated successfully.",
    },
    backPath: `/project-request/labour-request/${id}`,
    calculateProjectedCost: (data) => {
      return calculateLabourTotalCost(data);
    },
  };

  return <RequestForm config={config} />;
}
