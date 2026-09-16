"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  useGetProjectRequestQuery,
  usePatchProjectRequestMutation,
} from "@/api/requests/projectRequestApi";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { PageGuard } from "@/components/auth/PageGuard";

const formSchema = z.object({
  project: z.string().min(1, "Please select a project"),
  phase: z.string().min(1, "Please select a phase"),
  task: z.string().min(1, "Please select an activity"),
  amountRequested: z.coerce
    .number()
    .positive("Enter a valid amount")
    .max(50000, "Maximum Limit is ₦50,000"),
  purpose: z.string().min(2, "Purpose is required"),
  description: z.string().min(2, "Description is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditPettyCashRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserName = useMemo(() => {
    if (!loggedInUser) return "Current User";
    const anyUser = loggedInUser as any;
    return (
      `${anyUser.first_name || ""} ${anyUser.last_name || ""}`.trim() ||
      loggedInUser.username ||
      "Current User"
    );
  }, [loggedInUser]);

  const { data: request, isLoading } = useGetProjectRequestQuery(id, {
    skip: isNaN(id),
  });

  const [patchProjectRequest] = usePatchProjectRequestMutation();

  const detail = useMemo(() => {
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

  const requestId = request?.reference_id || `PC-${id}`;
  const currentDate = new Date(request?.created_at || Date.now()).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  const config: RequestFormConfig<FormValues> = {
    title: "Edit Petty Cash Request",
    requestId: requestId,
    requesterName: loggedInUserName,
    date: currentDate,
    renderHeader: () => (
      <div className="bg-white px-4 py-6">
        <h2 className="text-sm font-medium text-[#3B7CED] mb-4">Request Details</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="requestId" className="text-sm font-semibold text-gray-900">
              Request ID
            </Label>
            <Input
              id="requestId"
              value={requestId}
              readOnly
              className="bg-white text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold text-gray-900">
              Date
            </Label>
            <Input
              id="date"
              value={currentDate}
              readOnly
              className="bg-white text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestedBy" className="text-sm font-semibold text-gray-900">
              Requested by
            </Label>
            <Input
              id="requestedBy"
              value={loggedInUserName}
              readOnly
              className="bg-white text-gray-900"
            />
          </div>
        </div>
      </div>
    ),
    sections: [
      {
        title: "Petty Cash Details",
        fields: [
          {
            name: "project",
            label: "Project",
            type: "select",
            placeholder: "Select a project",
            options: [],
          },
          {
            name: "purpose",
            label: "Purpose / Expense Category",
            type: "text",
            placeholder: "Enter purpose",
          },
          {
            name: "description",
            label: "Description of Expense",
            type: "text",
            placeholder: "Enter description of expense",
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
            dependsOn: "project",
            options: [],
          },
          {
            name: "task",
            label: "Activity",
            type: "select",
            placeholder: "Select an activity",
            dependsOn: "phase",
            options: [],
          },
        ],
      },
      {
        title: "Cost Details",
        fields: [
          {
            name: "amountRequested",
            label: "Amount Requested",
            type: "number",
            placeholder: "Enter amount",
            hintText: "Maximum Limit: ₦50,000",
          },
        ],
      },
      {
        fields: [
          {
            name: "notes",
            label: "Note",
            type: "text",
            placeholder: "Enter note",
          },
        ],
        renderTop: (data: FormValues) => {
          return (
            <div className="pb-4 mb-4 border-b border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Total Cost</span>
                <span className="text-sm font-semibold text-[#3B7CED]">
                  ₦
                  {(data.amountRequested || 0).toLocaleString("en-NG", {
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
      project: String(request?.project || ""),
      phase: String(detail.phase || ""),
      task: String(detail.task || detail.wbs_element || ""),
      amountRequested:
        parseFloat(detail.amount_requested) || detail.amountRequested || 0,
      purpose: detail.purpose || "",
      description: detail.description || "",
      notes: detail.notes || "",
    },
    onSubmit: async (data) => {
      const ensureValidUUID = (val: string): string => {
        if (!val) return "";
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(val)) return val;
        const numericVal = parseInt(val, 10);
        if (!isNaN(numericVal)) {
          const hexString = numericVal.toString(16).padStart(12, "0");
          return `00000000-0000-0000-0000-${hexString}`;
        }
        return "00000000-0000-0000-0000-000000000000";
      };

      const payload = {
        project: Number(data.project),
        detail: {
          ...detail,
          project: Number(data.project),
          phase: data.phase,
          task: data.task,
          wbs_element: ensureValidUUID(data.task),
          activity: ensureValidUUID(data.task),
          amount_requested: data.amountRequested.toFixed(2),
          purpose: data.purpose,
          description: data.description,
          notes: data.notes || "",
        },
      };

      await patchProjectRequest({ id, data: payload }).unwrap();
    },
    successMessage: {
      title: "Request Updated",
      description: "Your petty cash request has successfully been updated",
    },
    errorMessage: {
      title: "Update Unsuccessful",
      description: "Failed to update your request. Please try again.",
    },
    backPath: `/project-request/petty-cash-request/${id}`,
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

  return (
    <PageGuard module="project_request" entitlement="edit">
      <RequestForm config={config} />
    </PageGuard>
  );
}
