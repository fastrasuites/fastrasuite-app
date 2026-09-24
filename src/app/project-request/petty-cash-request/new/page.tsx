"use client";

import React from "react";
import { z } from "zod";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCreatePettyCashRequestMutation } from "@/api/requests/pettyCashRequestApi";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { useCurrentUserName } from "@/hooks/useCurrentUser";
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

export default function NewPettyCashRequestPage() {
  const [createPettyCashRequest] = useCreatePettyCashRequestMutation();
  const loggedInUserName = useCurrentUserName();

  const [requestId] = React.useState("Auto-generated");

  const [currentDate] = React.useState(() =>
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  );

  const config: RequestFormConfig<FormValues> = {
    title: "Petty Cash Request",
    requestId: requestId,
    requesterName: loggedInUserName,
    date: currentDate,
    renderHeader: () => (
      <div className="bg-white px-4 py-6">
        <h2 className="text-sm font-medium text-[#3B7CED] mb-4">Request Details</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="requestId" className="text-sm font-semibold text-gray-900">Request ID</Label>
            <Input id="requestId" value={requestId} readOnly className="bg-white text-gray-900" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold text-gray-900">Date</Label>
            <Input id="date" value={currentDate} readOnly className="bg-white text-gray-900" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestedBy" className="text-sm font-semibold text-gray-900">Requested by</Label>
            <Input id="requestedBy" value={loggedInUserName} readOnly className="bg-white text-gray-900" />
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
            label: "Description",
            type: "text",
            placeholder: "Enter description",
          },
        ],
      },
      {
        title: "WBS",
        hideCostSummary: true,
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
                  ₦{(data.amountRequested || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      amountRequested: 0,
      purpose: "",
      description: "",
      notes: "",
    },
    onSubmit: async (data) => {
      // Helper to ensure the wbs_element is a valid UUID format for the backend
      const ensureValidUUID = (val: string): string => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(val)) {
          return val;
        }
        const numericVal = parseInt(val, 10);
        if (!isNaN(numericVal)) {
          const hexString = numericVal.toString(16).padStart(12, "0");
          return `00000000-0000-0000-0000-${hexString}`;
        }
        return "00000000-0000-0000-0000-000000000000";
      };

      // Map frontend form properties to backend API spec parameters
      const payload = {
        project: Number(data.project),
        wbs_element: ensureValidUUID(data.task), // Ensures valid UUID format for task ID
        activity: ensureValidUUID(data.task), // Resolves backend "This field is required." error
        amount_requested: data.amountRequested.toFixed(2), // Converts numeric amount to decimal string
        purpose: data.purpose,
        description: data.description,
        notes: data.notes || "",
      };

      console.log("Form submission formatted payload for API:", payload);
      await createPettyCashRequest(payload).unwrap();
    },
    successMessage: {
      title: "Request Submitted",
      description: "Your request has successfully been submitted",
    },
    errorMessage: {
      title: "Submission Unsuccessful",
      description: "Your request submission was unsuccessful. Please try again.",
    },
    backPath: "/project-request/petty-cash-request",
  };

  return (
    <PageGuard module="project_request" entitlement="create">
      <RequestForm config={config} />
    </PageGuard>
  );
}

