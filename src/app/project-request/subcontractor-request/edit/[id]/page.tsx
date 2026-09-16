"use client";

import React, { useMemo } from "react";
import { z } from "zod";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  useGetSubcontractorRequestQuery,
  useUpdateSubcontractorRequestMutation 
} from "@/api/subcontractorRequestApi";
import { useGetActiveVendorsQuery } from "@/api/invoice/vendorsApi";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { PageGuard } from "@/components/auth/PageGuard";
import { Loader2 } from "lucide-react";

const milestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  percentage: z.coerce
    .number()
    .min(1, "Percentage must be greater than 0")
    .max(100, "Percentage cannot exceed 100"),
  completion_criteria: z.string().min(1, "Completion criteria is required"),
});

const formSchema = z.object({
  project: z.string().min(1, "Please select a project"),
  vendor: z.string().min(1, "Please select a subcontractor"),
  scope_of_work: z.string().min(2, "Scope of work is required"),
  start_date: z.string().min(2, "Start date is required"),
  end_date: z.string().min(2, "End date is required"),
  contract_value: z.string().min(1, "Contract value is required"),
  payment_type: z.enum(["lump_sum", "milestone"], {
    message: "Please select a payment type",
  }),
  payment_terms: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
  phase: z.string().min(1, "Please select a phase"),
  task: z.string().min(1, "Please select an activity"),
  justification_notes: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "End date cannot be earlier than start date",
  path: ["end_date"],
}).refine((data) => {
  if (data.payment_type === "milestone") {
    const ms = data.milestones || [];
    if (ms.length < 2) {
      return false;
    }
    const total = ms.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
    return Math.abs(total - 100) < 0.01;
  }
  return true;
}, {
  message: "Milestone-based payment requires at least 2 milestones totaling exactly 100%",
  path: ["milestones"],
});

type FormValues = z.infer<typeof formSchema>;

export default function EditSubcontractorRequestPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const { data: request, isLoading: isLoadingRequest } = useGetSubcontractorRequestQuery(id, {
    skip: !id,
  });

  const [updateRequest, { isLoading: isSubmitting }] = useUpdateSubcontractorRequestMutation();
  const { data: vendors = [], isLoading: isLoadingVendors } = useGetActiveVendorsQuery();
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserName = React.useMemo(() => {
    if (!loggedInUser) return "Current User";
    const anyUser = loggedInUser as any;
    return `${anyUser.first_name || ""} ${anyUser.last_name || ""}`.trim() || loggedInUser.username || "Current User";
  }, [loggedInUser]);

  const vendorOptions = useMemo(() => {
    return vendors.map((vendor) => ({
      label: vendor.vendor_name,
      value: String(vendor.id),
    }));
  }, [vendors]);

  const requestDate = useMemo(() => {
    if (!request?.created_at) return "";
    return new Date(request.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [request?.created_at]);

  if (isLoadingRequest || !request) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#3B7CED] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading request...</p>
      </div>
    );
  }

  const requestId =
    ((request as any)?.reference_id && String((request as any).reference_id).trim()) ||
    ((request as any)?.detail?.reference_id && String((request as any).detail.reference_id).trim()) ||
    ((request as any)?.project_request?.reference_id && String((request as any).project_request.reference_id).trim()) ||
    `SUB${String(request.id).padStart(4, "0")}`;

  const config: RequestFormConfig<FormValues> = {
    title: "Edit Subcontractor Request",
    requestId: requestId,
    requesterName: loggedInUserName,
    date: requestDate,
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
            <Input id="date" value={requestDate} readOnly className="bg-white text-gray-900" />
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
        title: "Subcontractor Details",
        fields: [
          {
            name: "project",
            label: "Project",
            type: "select",
            placeholder: "Select a project",
            options: [],
          },
          {
            name: "vendor",
            label: "Subcontractor Name",
            type: "select",
            placeholder: isLoadingVendors ? "Loading subcontractors..." : "Enter name",
            options: vendorOptions,
          },
          {
            name: "scope_of_work",
            label: "Scope of Work",
            type: "text",
            placeholder: "Enter scope of work",
          },
          {
            name: "start_date",
            label: "Start Date",
            type: "date",
            placeholder: "Enter date",
            halfWidth: true,
          },
          {
            name: "end_date",
            label: "End Date",
            type: "date",
            placeholder: "Enter date",
            halfWidth: true,
          },
        ],
      },
      {
        title: "Cost Details",
        fields: [
          {
            name: "contract_value",
            label: "Contract Value",
            type: "text",
            placeholder: "Enter value",
          },
          {
            name: "payment_type",
            label: "Payment Type",
            type: "select",
            placeholder: "Select payment type",
            options: [
              { label: "Lump Sum", value: "lump_sum" },
              { label: "Milestone-Based", value: "milestone" },
            ],
          },
          {
            name: "milestones",
            label: "Milestones",
            type: "milestones",
            visibleIf: { field: "payment_type", value: "milestone" },
          },
          {
            name: "payment_terms",
            label: "Payment Terms",
            type: "text",
            placeholder: "Enter payment terms (optional)",
            hintText: "Optional payment terms or conditions",
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
        fields: [
          {
            name: "justification_notes",
            label: "Note",
            type: "text",
            placeholder: "Enter note",
          },
        ],
        renderTop: (data: FormValues, extra?: any) => {
          const availBudget = extra?.availableBudget || 0;
          return (
            <div className="pb-4 mb-4 border-b border-gray-200 space-y-2">
              {availBudget > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Available Budget</span>
                  <span className="text-sm font-semibold text-black/80">
                    ₦{Number(availBudget).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Total Cost</span>
                <span className="text-sm font-semibold text-[#3B7CED]">
                  ₦{Number(data.contract_value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        },
      },
    ],
    schema: formSchema,
    defaultValues: {
      project: String((request as any).project_details?.id || (request as any).project || ""),
      vendor: String((request as any).vendor || ""),
      scope_of_work: (request as any).scope_of_work || "",
      start_date: (request as any).start_date || "",
      end_date: (request as any).end_date || "",
      contract_value: String((request as any).contract_value || ""),
      payment_type: ((request as any).payment_type as any) || "lump_sum",
      payment_terms: (request as any).payment_terms || "",
      milestones: (request as any).milestones || [],
      phase:
        (request as any)?.detail?.phase_details?.id?.toString() ||
        (request as any)?.phase?.toString() ||
        "",
      task:
        (request as any)?.activity?.toString() ||
        (request as any)?.detail?.activity_details?.id?.toString() ||
        (request as any)?.activity?.toString() ||
        "",
      justification_notes: (request as any).justification_notes || "",
    },
    calculateProjectedCost: (data: FormValues) => {
      return Number(data.contract_value || 0);
    },
    budgetConfig: {
      projectField: "project",
      wbsField: "task",
      costCode: "SUB-001",
    },
    onSubmit: async (data) => {
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

        const payload: any = {
          project: Number(data.project),
          activity: ensureValidUUID(data.task),
          vendor: Number(data.vendor),
          scope_of_work: data.scope_of_work,
          payment_type: data.payment_type,
          contract_value: data.contract_value,
          payment_terms: data.payment_terms || "",
          start_date: data.start_date,
          end_date: data.end_date,
          justification_notes: data.justification_notes || "",
          milestones: data.payment_type === "milestone"
            ? (data.milestones || []).map((m: any) => ({
                name: m.name,
                percentage: String(m.percentage),
                completion_criteria: m.completion_criteria,
                is_completed: m.is_completed || false,
              }))
            : [],
        };

        await updateRequest({ id, body: payload }).unwrap();
      } catch (error) {
        console.error("Failed to update subcontractor request:", error);
        throw error;
      }
    },
    successMessage: {
      title: "Request Updated",
      description: "Your subcontractor request has successfully been updated",
    },
    errorMessage: {
      title: "Update Unsuccessful",
      description: "Your request update was unsuccessful. Please check your data and try again.",
    },
    backPath: `/project-request/subcontractor-request/${id}`,
  };

  return (
    <PageGuard module="project_request" entitlement="edit">
      <RequestForm config={config} />
    </PageGuard>
  );
}
