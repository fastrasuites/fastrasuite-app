"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import { useCreateLabourRequestMutation } from "@/api/requests/labourRequestApi";
import { StatusModal } from "@/components/shared/StatusModal";
import extractErrorMessage from "@/components/requests/utils/RequestErrorHandler";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { PageGuard } from "@/components/auth/PageGuard";

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

export default function NewLabourRequestPage() {
  const router = useRouter();
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserName = React.useMemo(() => {
    if (!loggedInUser) return "Current User";
    const anyUser = loggedInUser as any;
    return `${anyUser.first_name || ""} ${anyUser.last_name || ""}`.trim() || loggedInUser.username || "Current User";
  }, [loggedInUser]);

  const [createLabourRequest, { isLoading: isCreating }] =
    useCreateLabourRequestMutation();
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    description: "",
  });

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
        date_required: new Date().toISOString().split("T")[0], // Today's date
        number_of_workers: data.numberOfWorkers,
        role_type: data.role,
        duration: data.duration,
        duration_unit: data.durationUnit,
        estimated_daily_rate: data.dailyRate.toString(),
        justification_notes: data.justification || "",
        activity: ensureValidUUID(data.task),
      };

      console.log("submitData from new page", submitData);
      await createLabourRequest(submitData).unwrap();

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Request Created",
        description: "Your labour request has been submitted successfully.",
      });

      setTimeout(() => {
        router.push(`/project-request/labour-request`);
      }, 2000);
    } catch (error) {
      console.error("Failed to create labour request:", error);
      const errorMessage = extractErrorMessage(error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const calculateLabourTotalCost = (data: Partial<FormValues>) => {
    const workers = Number(data.numberOfWorkers) || 0;
    const rate = Number(data.dailyRate) || 0;
    const dur = Number(data.duration) || 1;
    return workers * rate * dur;
  };

  const config: RequestFormConfig<FormValues> = {
    title: "Labour Request",
    requestId: "Auto-generated",
    requesterName: loggedInUserName,
    date: new Date().toLocaleDateString("en-GB", {
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
      project: "",
      phase: "",
      task: "",
      numberOfWorkers: 0,
      role: "",
      duration: 1,
      durationUnit: "days" as const,
      dailyRate: 0,
      justification: "",
    },
    onSubmit: handleSubmit,
    successMessage: {
      title: "Request Submitted",
      description: "Your labour request has been submitted successfully.",
    },
    backPath: "/project-request/labour-request",
    calculateProjectedCost: (data) => {
      return calculateLabourTotalCost(data);
    },
  };

  return (
    <PageGuard module="project_request" entitlement="create">
      <RequestForm config={config} />

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.description}
      />
    </PageGuard>
  );
}
