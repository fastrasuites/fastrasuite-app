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
import { useGetProjectCostingProjectQuery } from "@/api/projectCostingApi";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUserName } from "@/hooks/useCurrentUser";
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
  payment_terms: z.string().min(1, "Payment terms are required"),
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
  const loggedInUserName = useCurrentUserName();

  const detail = useMemo(() => (request as any)?.detail || (request as any) || {}, [request]);
  const projectRequest = useMemo(() => (request as any)?.project_request || (request as any) || {}, [request]);

  const rawProjectId =
    detail?.project_details?.id ??
    detail?.project?.id ??
    detail?.project ??
    (request as any)?.project_details?.id ??
    (request as any)?.project?.id ??
    (request as any)?.project ??
    projectRequest?.project_details?.id ??
    projectRequest?.project;
  const projectIdStr = rawProjectId !== undefined && rawProjectId !== null ? String(rawProjectId) : "";

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(projectIdStr),
    { skip: !projectIdStr || isNaN(Number(projectIdStr)) }
  );

  const rawTaskId =
    detail?.activity_details?.id ??
    detail?.activity?.id ??
    detail?.activity ??
    detail?.activity_id ??
    detail?.task?.id ??
    detail?.task ??
    detail?.task_id ??
    (request as any)?.activity_details?.id ??
    (request as any)?.activity?.id ??
    (request as any)?.activity ??
    (request as any)?.activity_id;
  const taskIdStr = rawTaskId !== undefined && rawTaskId !== null ? String(rawTaskId) : "";

  const resolvedPhaseId = useMemo(() => {
    const rawPhase =
      detail?.phase_details?.id ??
      detail?.phase?.id ??
      detail?.phase ??
      detail?.phase_id ??
      (request as any)?.phase_details?.id ??
      (request as any)?.phase?.id ??
      (request as any)?.phase ??
      (request as any)?.phase_id;

    if (rawPhase !== undefined && rawPhase !== null && String(rawPhase).trim() !== "") {
      return String(rawPhase);
    }

    if (projectCosting && taskIdStr) {
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
        if (acts.some((a: any) => String(a.id || a.activity_id) === String(taskIdStr))) {
          return String(ph.id);
        }
      }
    }
    return "";
  }, [detail, request, projectCosting, taskIdStr]);

  const rawBudget = (request as any)?.available_budget ?? detail?.available_budget;
  const reqBudget = (rawBudget !== undefined && rawBudget !== null && rawBudget !== "") ? Number(rawBudget) : 0;

  const budgetFromCosting = useMemo(() => {
    if (!projectCosting) return 0;
    if (taskIdStr) {
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
        const act = acts.find((a: any) => String(a.id || a.activity_id) === String(taskIdStr));
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
  }, [projectCosting, taskIdStr]);

  const defaultAvailableBudget = reqBudget > 0 ? reqBudget : budgetFromCosting;

  const projectName =
    detail?.project_details?.name ||
    (request as any)?.project_details?.name ||
    projectRequest?.project_details?.name ||
    projectCosting?.name ||
    (projectIdStr ? `Project #${projectIdStr}` : "");

  const projectOptions = useMemo(() => {
    if (projectIdStr) {
      return [{ label: projectName || `Project #${projectIdStr}`, value: projectIdStr }];
    }
    return [];
  }, [projectIdStr, projectName]);

  const rawVendorId =
    detail?.vendor_details?.id ??
    detail?.vendor?.id ??
    detail?.vendor ??
    (request as any)?.vendor_details?.id ??
    (request as any)?.vendor?.id ??
    (request as any)?.vendor ??
    (request as any)?.vendor_id ??
    detail?.vendor_id;
  const vendorIdStr = rawVendorId !== undefined && rawVendorId !== null ? String(rawVendorId) : "";

  const existingVendorName =
    detail?.vendor_details?.vendor_name ||
    detail?.vendor_name ||
    (request as any)?.vendor_details?.vendor_name ||
    (request as any)?.vendor_name ||
    (vendorIdStr ? `Vendor #${vendorIdStr}` : "");

  const vendorOptions = useMemo(() => {
    const opts = vendors.map((vendor) => ({
      label: vendor.vendor_name,
      value: String(vendor.id),
    }));
    if (vendorIdStr && !opts.some((o) => o.value === vendorIdStr)) {
      opts.unshift({
        label: existingVendorName || `Vendor #${vendorIdStr}`,
        value: vendorIdStr,
      });
    }
    return opts;
  }, [vendors, vendorIdStr, existingVendorName]);

  const phaseName = useMemo(() => {
    if (detail?.phase_details?.name) return detail.phase_details.name;
    if (detail?.phase_name) return detail.phase_name;
    if ((request as any)?.phase_details?.name) return (request as any).phase_details.name;
    if ((request as any)?.phase_name) return (request as any).phase_name;
    if (projectCosting && resolvedPhaseId) {
      const phasesArr = Array.isArray(projectCosting.phases)
        ? projectCosting.phases
        : Array.isArray((projectCosting as any).phase_list)
        ? (projectCosting as any).phase_list
        : [];
      const found = phasesArr.find((p: any) => String(p.id) === String(resolvedPhaseId));
      if (found) return found.name || found.phase_name || "";
    }
    return resolvedPhaseId ? `Phase ${resolvedPhaseId}` : "";
  }, [detail, request, projectCosting, resolvedPhaseId]);

  const phaseOptions = useMemo(() => {
    if (resolvedPhaseId) {
      return [{ label: phaseName || `Phase ${resolvedPhaseId}`, value: resolvedPhaseId }];
    }
    return [];
  }, [resolvedPhaseId, phaseName]);

  const taskName = useMemo(() => {
    if (detail?.activity_details?.name) {
      const sn = detail.activity_details.serial_number;
      return sn !== undefined && sn !== null ? `${sn} - ${detail.activity_details.name}` : detail.activity_details.name;
    }
    if (detail?.task_name) return detail.task_name;
    if ((request as any)?.activity_details?.name) {
      const sn = (request as any).activity_details.serial_number;
      return sn !== undefined && sn !== null ? `${sn} - ${(request as any).activity_details.name}` : (request as any).activity_details.name;
    }
    if ((request as any)?.task_name) return (request as any).task_name;
    if (projectCosting && taskIdStr) {
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
        const act = acts.find((a: any) => String(a.id || a.activity_id) === String(taskIdStr));
        if (act) {
          const sn = act.serial_number;
          const name = act.name || act.activity_name || "Activity";
          return sn !== undefined && sn !== null ? `${sn} - ${name}` : name;
        }
      }
    }
    return taskIdStr ? `Activity ${taskIdStr}` : "";
  }, [detail, request, projectCosting, taskIdStr]);

  const taskOptions = useMemo(() => {
    if (taskIdStr) {
      return [
        {
          label: taskName || `Activity ${taskIdStr}`,
          value: taskIdStr,
          amount: defaultAvailableBudget,
        },
      ];
    }
    return [];
  }, [taskIdStr, taskName, defaultAvailableBudget]);

  const rawCreatedAt =
    (request as any)?.created_at ||
    detail?.created_at ||
    projectRequest?.created_at;

  const requestDate = useMemo(() => {
    if (!rawCreatedAt) return "";
    return new Date(rawCreatedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [rawCreatedAt]);

  const requesterName =
    (request as any)?.created_by_details?.first_name &&
    (request as any)?.created_by_details?.last_name
      ? `${(request as any).created_by_details.first_name} ${(request as any).created_by_details.last_name}`.trim()
      : (request as any)?.created_by_details?.first_name ||
        detail?.created_by_details?.first_name ||
        projectRequest?.created_by_details?.first_name ||
        detail?.created_by_name ||
        (request as any)?.created_by_name ||
        loggedInUserName ||
        "Requester";

  const requestId =
    ((request as any)?.reference_id && String((request as any).reference_id).trim()) ||
    (detail?.reference_id && String(detail.reference_id).trim()) ||
    (projectRequest?.reference_id && String(projectRequest.reference_id).trim()) ||
    (request ? `SUB${String(request.id).padStart(4, "0")}` : "SUB0001");

  const config: RequestFormConfig<FormValues> = useMemo(() => ({
    title: "Edit Subcontractor Request",
    requestId: requestId,
    requesterName: requesterName,
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
            <Input id="requestedBy" value={requesterName} readOnly className="bg-white text-gray-900" />
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
            options: projectOptions,
          },
          {
            name: "vendor",
            label: "Subcontractor Name",
            type: "select",
            placeholder: isLoadingVendors ? "Loading subcontractors..." : "Select subcontractor",
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
            placeholder: "Enter payment terms",
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
            options: phaseOptions,
          },
          {
            name: "task",
            label: "Activity",
            type: "select",
            placeholder: "Select an activity",
            dependsOn: "phase",
            options: taskOptions,
          },
        ],
      },
      {
        fields: [
          {
            name: "justification_notes",
            label: "Note",
            type: "text",
            placeholder: "Enter note (optional)",
          },
        ],
        renderTop: (data: FormValues, extra?: any) => {
          const isSameTask = String(data.task || "") === String(taskIdStr || "");
          const availBudget =
            extra?.availableBudget && Number(extra.availableBudget) > 0
              ? Number(extra.availableBudget)
              : isSameTask
              ? defaultAvailableBudget
              : extra?.availableBudget !== undefined
              ? Number(extra.availableBudget)
              : 0;

          return (
            <div className="pb-4 mb-4 border-b border-gray-200 space-y-2">
              {(availBudget > 0 || Boolean(data.task)) && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Available Budget</span>
                  <span className="text-sm font-semibold text-black/80">
                    ₦{Number(availBudget || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      project: projectIdStr,
      vendor: vendorIdStr,
      scope_of_work:
        detail.scope_of_work ??
        detail.service_type ??
        (request as any)?.scope_of_work ??
        (request as any)?.service_type ??
        "",
      start_date: detail.start_date
        ? String(detail.start_date).split("T")[0]
        : (request as any)?.start_date
        ? String((request as any).start_date).split("T")[0]
        : "",
      end_date: detail.end_date
        ? String(detail.end_date).split("T")[0]
        : (request as any)?.end_date
        ? String((request as any).end_date).split("T")[0]
        : "",
      contract_value: String(
        detail.contract_value ??
        detail.estimated_cost ??
        detail.amount ??
        (request as any)?.contract_value ??
        projectRequest?.request_amount ??
        (request as any)?.request_amount ??
        ""
      ),
      payment_type:
        detail.payment_type === "milestone" ||
        detail.payment_type === "milestone_based" ||
        (request as any)?.payment_type === "milestone" ||
        (request as any)?.payment_type === "milestone_based"
          ? "milestone"
          : "lump_sum",
      payment_terms: detail.payment_terms ?? (request as any)?.payment_terms ?? "",
      milestones: Array.isArray(detail.milestones)
        ? detail.milestones
        : Array.isArray((request as any)?.milestones)
        ? (request as any).milestones
        : [],
      phase: resolvedPhaseId,
      task: taskIdStr,
      justification_notes:
        detail.justification_notes ??
        detail.notes ??
        (request as any)?.justification_notes ??
        (request as any)?.notes ??
        "",
    },
    calculateProjectedCost: (data: FormValues) => {
      return Number(data.contract_value || 0);
    },
    budgetConfig: {
      projectField: "project",
      wbsField: "task",
      costCode: "SUB-001",
    },
    defaultBudget: defaultAvailableBudget,
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
          payment_terms: data.payment_terms,
          start_date: data.start_date,
          end_date: data.end_date,
          justification_notes: data.justification_notes?.trim() || "N/A",
          notes: data.justification_notes?.trim() || "",
          milestones: data.payment_type === "milestone"
            ? (data.milestones || []).map((m: any) => ({
                name: m.name,
                percentage: String(m.percentage),
                completion_criteria: m.completion_criteria,
                is_completed: m.is_completed || false,
              }))
            : [],
        };

        const targetId = (request as any)?.id || id;
        await updateRequest({ id: targetId, body: payload }).unwrap();
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
  }), [
    requestId,
    requesterName,
    requestDate,
    projectOptions,
    isLoadingVendors,
    vendorOptions,
    phaseOptions,
    taskOptions,
    taskIdStr,
    defaultAvailableBudget,
    projectIdStr,
    vendorIdStr,
    detail,
    request,
    projectRequest,
    resolvedPhaseId,
    id,
    updateRequest,
  ]);

  if (isLoadingRequest || !request) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#3B7CED] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading request...</p>
      </div>
    );
  }

  return (
    <PageGuard module="project_request" entitlement="edit">
      <RequestForm config={config} />
    </PageGuard>
  );
}
