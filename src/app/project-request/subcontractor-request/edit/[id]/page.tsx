"use client";

import React, { useMemo } from "react";
import { z } from "zod";
import Link from "next/link";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExternalLink, Loader2 } from "lucide-react";
import { 
  useGetSubcontractorRequestQuery,
  useUpdateSubcontractorRequestMutation,
  usePatchSubcontractorRequestMutation,
} from "@/api/subcontractorRequestApi";
import { useGetActiveVendorsQuery } from "@/api/invoice/vendorsApi";
import { useGetProjectCostingProjectQuery } from "@/api/projectCostingApi";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUserName } from "@/hooks/useCurrentUser";
import { PageGuard } from "@/components/auth/PageGuard";

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
  const id = Number(params?.id);

  const { data: request, isLoading: isLoadingRequest } = useGetSubcontractorRequestQuery(id, {
    skip: !id || isNaN(id),
  });

  const [updateRequest, { isLoading: isSubmitting }] = useUpdateSubcontractorRequestMutation();
  const [patchRequest] = usePatchSubcontractorRequestMutation();

  const {
    data: vendors = [],
    isLoading: isLoadingVendors,
  } = useGetActiveVendorsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const loggedInUserName = useCurrentUserName();

  // Safely parse detail if stringified or object
  const parsedDetail = useMemo(() => {
    let d = (request as any)?.detail;
    if (typeof d === "string") {
      try {
        d = JSON.parse(d);
      } catch {
        d = null;
      }
    }
    return d && typeof d === "object" ? d : {};
  }, [request]);

  // Safely parse project_request if stringified or object
  const parsedProjectRequest = useMemo(() => {
    let pr = (request as any)?.project_request;
    if (typeof pr === "string") {
      try {
        pr = JSON.parse(pr);
      } catch {
        pr = null;
      }
    }
    return pr && typeof pr === "object" ? pr : {};
  }, [request]);

  // Safely parse project_request.detail if present
  const parsedProjectRequestDetail = useMemo(() => {
    let prd = parsedProjectRequest?.detail;
    if (typeof prd === "string") {
      try {
        prd = JSON.parse(prd);
      } catch {
        prd = null;
      }
    }
    return prd && typeof prd === "object" ? prd : {};
  }, [parsedProjectRequest]);

  // Project identification
  const rawProjectId =
    parsedDetail?.project_details?.id ??
    parsedDetail?.project?.id ??
    parsedDetail?.project ??
    (request as any)?.project_details?.id ??
    (request as any)?.project?.id ??
    (request as any)?.project ??
    parsedProjectRequest?.project_details?.id ??
    parsedProjectRequest?.project?.id ??
    parsedProjectRequest?.project ??
    parsedProjectRequestDetail?.project_details?.id ??
    parsedProjectRequestDetail?.project;
  const projectIdStr = rawProjectId !== undefined && rawProjectId !== null ? String(rawProjectId) : "";

  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(projectIdStr),
    { skip: !projectIdStr || isNaN(Number(projectIdStr)) }
  );

  // Activity / Task identification
  const rawTaskId =
    parsedDetail?.activity_details?.id ??
    parsedDetail?.activity?.id ??
    parsedDetail?.activity ??
    parsedDetail?.activity_id ??
    parsedDetail?.task?.id ??
    parsedDetail?.task ??
    parsedDetail?.task_id ??
    (request as any)?.activity_details?.id ??
    (request as any)?.activity?.id ??
    (request as any)?.activity ??
    (request as any)?.activity_id ??
    parsedProjectRequest?.activity_details?.id ??
    parsedProjectRequest?.activity ??
    parsedProjectRequestDetail?.activity_details?.id ??
    parsedProjectRequestDetail?.activity;
  const taskIdStr = rawTaskId !== undefined && rawTaskId !== null ? String(rawTaskId) : "";

  // Phase identification
  const resolvedPhaseId = useMemo(() => {
    const rawPhase =
      parsedDetail?.phase_details?.id ??
      parsedDetail?.phase?.id ??
      parsedDetail?.phase ??
      parsedDetail?.phase_id ??
      (request as any)?.phase_details?.id ??
      (request as any)?.phase?.id ??
      (request as any)?.phase ??
      (request as any)?.phase_id ??
      parsedProjectRequest?.phase_details?.id ??
      parsedProjectRequest?.phase ??
      parsedProjectRequestDetail?.phase_details?.id ??
      parsedProjectRequestDetail?.phase;

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
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail, projectCosting, taskIdStr]);

  // Budget calculations
  const rawBudget =
    (request as any)?.available_budget ??
    parsedDetail?.available_budget ??
    parsedProjectRequest?.available_budget;
  const reqBudget = rawBudget !== undefined && rawBudget !== null && rawBudget !== "" ? Number(rawBudget) : 0;

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

  // Project display name & options
  const projectName = useMemo(() => {
    return (
      parsedDetail?.project_details?.name ||
      (request as any)?.project_details?.name ||
      parsedProjectRequest?.project_details?.name ||
      parsedProjectRequestDetail?.project_details?.name ||
      (request as any)?.project_name ||
      parsedDetail?.project_name ||
      projectCosting?.name ||
      (projectIdStr ? `Project #${projectIdStr}` : "")
    );
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail, projectCosting, projectIdStr]);

  const projectOptions = useMemo(() => {
    if (projectIdStr) {
      return [{ label: projectName || `Project #${projectIdStr}`, value: projectIdStr }];
    }
    return [];
  }, [projectIdStr, projectName]);

  // Vendor identification & options
  const rawVendorId =
    parsedDetail?.vendor_details?.id ??
    parsedDetail?.vendor?.id ??
    parsedDetail?.vendor ??
    parsedDetail?.vendor_id ??
    (request as any)?.vendor_details?.id ??
    (request as any)?.vendor?.id ??
    (request as any)?.vendor ??
    (request as any)?.vendor_id ??
    parsedProjectRequest?.vendor_details?.id ??
    parsedProjectRequest?.vendor ??
    parsedProjectRequestDetail?.vendor_details?.id ??
    parsedProjectRequestDetail?.vendor;
  const vendorIdStr = rawVendorId !== undefined && rawVendorId !== null ? String(rawVendorId) : "";

  const existingVendorName = useMemo(() => {
    const vName =
      parsedDetail?.vendor_details?.vendor_name ||
      (request as any)?.vendor_details?.vendor_name ||
      parsedProjectRequest?.vendor_details?.vendor_name ||
      parsedProjectRequestDetail?.vendor_details?.vendor_name ||
      parsedDetail?.vendor_name ||
      (request as any)?.vendor_name ||
      parsedDetail?.subcontractor_name ||
      (request as any)?.subcontractor_name ||
      parsedDetail?.contractor_name ||
      (request as any)?.contractor_name;

    if (vName && String(vName).trim() !== "") {
      return String(vName).trim();
    }

    if (vendorIdStr && vendors.length > 0) {
      const found = vendors.find((v) => String(v.id) === vendorIdStr);
      if (found) return found.vendor_name;
    }

    return vendorIdStr ? `Vendor #${vendorIdStr}` : "";
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail, vendorIdStr, vendors]);

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

  const hasNoVendors = !isLoadingVendors && vendors.length === 0;

  // Phase options
  const phaseName = useMemo(() => {
    if (parsedDetail?.phase_details?.name) return parsedDetail.phase_details.name;
    if (parsedDetail?.phase_name) return parsedDetail.phase_name;
    if ((request as any)?.phase_details?.name) return (request as any).phase_details.name;
    if ((request as any)?.phase_name) return (request as any).phase_name;
    if (parsedProjectRequest?.phase_details?.name) return parsedProjectRequest.phase_details.name;
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
  }, [parsedDetail, request, parsedProjectRequest, projectCosting, resolvedPhaseId]);

  const phaseOptions = useMemo(() => {
    if (resolvedPhaseId) {
      return [{ label: phaseName || `Phase ${resolvedPhaseId}`, value: resolvedPhaseId }];
    }
    return [];
  }, [resolvedPhaseId, phaseName]);

  // Task / Activity options
  const taskName = useMemo(() => {
    if (parsedDetail?.activity_details?.name) {
      const sn = parsedDetail.activity_details.serial_number;
      return sn !== undefined && sn !== null ? `${sn} - ${parsedDetail.activity_details.name}` : parsedDetail.activity_details.name;
    }
    if (parsedDetail?.task_name) return parsedDetail.task_name;
    if ((request as any)?.activity_details?.name) {
      const sn = (request as any).activity_details.serial_number;
      return sn !== undefined && sn !== null ? `${sn} - ${(request as any).activity_details.name}` : (request as any).activity_details.name;
    }
    if ((request as any)?.task_name) return (request as any).task_name;
    if (parsedProjectRequest?.activity_details?.name) {
      const sn = parsedProjectRequest.activity_details.serial_number;
      return sn !== undefined && sn !== null ? `${sn} - ${parsedProjectRequest.activity_details.name}` : parsedProjectRequest.activity_details.name;
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
        const act = acts.find((a: any) => String(a.id || a.activity_id) === String(taskIdStr));
        if (act) {
          const sn = act.serial_number;
          const name = act.name || act.activity_name || "Activity";
          return sn !== undefined && sn !== null ? `${sn} - ${name}` : name;
        }
      }
    }
    return taskIdStr ? `Activity ${taskIdStr}` : "";
  }, [parsedDetail, request, parsedProjectRequest, projectCosting, taskIdStr]);

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

  // Scope of Work
  const resolvedScopeOfWork = useMemo(() => {
    return (
      parsedDetail.scope_of_work ??
      parsedDetail.service_type ??
      (request as any)?.scope_of_work ??
      (request as any)?.service_type ??
      parsedProjectRequest?.scope_of_work ??
      parsedProjectRequestDetail?.scope_of_work ??
      ""
    );
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail]);

  // Start Date & End Date
  const startDateStr = useMemo(() => {
    const raw =
      parsedDetail.start_date ||
      (request as any)?.start_date ||
      parsedProjectRequest?.start_date ||
      parsedProjectRequestDetail?.start_date;
    if (!raw) return "";
    const s = String(raw).trim();
    if (s.includes("T")) return s.split("T")[0];
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString().split("T")[0];
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail]);

  const endDateStr = useMemo(() => {
    const raw =
      parsedDetail.end_date ||
      (request as any)?.end_date ||
      parsedProjectRequest?.end_date ||
      parsedProjectRequestDetail?.end_date;
    if (!raw) return "";
    const s = String(raw).trim();
    if (s.includes("T")) return s.split("T")[0];
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString().split("T")[0];
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail]);

  // Contract Value
  const contractValueStr = useMemo(() => {
    const raw =
      parsedDetail.contract_value ??
      (request as any)?.contract_value ??
      parsedDetail.estimated_cost ??
      (request as any)?.estimated_cost ??
      parsedDetail.amount ??
      (request as any)?.amount ??
      parsedProjectRequest?.request_amount ??
      (request as any)?.request_amount ??
      parsedProjectRequestDetail?.contract_value ??
      "";
    return raw !== undefined && raw !== null && raw !== "" ? String(raw) : "";
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail]);

  // Payment Type
  const paymentTypeVal: "lump_sum" | "milestone" = useMemo(() => {
    const pt =
      parsedDetail.payment_type ||
      (request as any)?.payment_type ||
      parsedProjectRequest?.payment_type ||
      parsedProjectRequestDetail?.payment_type;
    return pt === "milestone" || pt === "milestone_based" ? "milestone" : "lump_sum";
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail]);

  // Milestones
  const milestonesVal = useMemo(() => {
    let raw =
      parsedDetail?.milestones ??
      (request as any)?.milestones ??
      parsedProjectRequest?.milestones ??
      parsedProjectRequestDetail?.milestones ??
      [];
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = [];
      }
    }
    if (!Array.isArray(raw)) return [];
    return raw.map((m: any) => ({
      name: m.name || m.title || m.milestone_name || "",
      percentage:
        m.percentage !== undefined && m.percentage !== null && m.percentage !== ""
          ? Number(m.percentage) || m.percentage
          : "",
      completion_criteria: m.completion_criteria || m.criteria || m.description || "",
    }));
  }, [parsedDetail, request, parsedProjectRequest, parsedProjectRequestDetail]);

  // Justification / Notes
  const justificationNotesStr = useMemo(() => {
    const raw =
      parsedDetail.justification_notes ??
      (request as any)?.justification_notes ??
      parsedDetail.notes ??
      (request as any)?.notes ??
      parsedDetail.description ??
      (request as any)?.description ??
      parsedProjectRequest?.justification_notes ??
      "";
    return raw === "N/A" || raw === "n/a" ? "" : String(raw);
  }, [parsedDetail, request, parsedProjectRequest]);

  // Header display details
  const rawCreatedAt =
    (request as any)?.created_at ||
    parsedDetail?.created_at ||
    parsedProjectRequest?.created_at;

  const requestDate = useMemo(() => {
    if (!rawCreatedAt) {
      return new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(rawCreatedAt);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [rawCreatedAt]);

  const requesterName = useMemo(() => {
    const userObj =
      (request as any)?.created_by_details ||
      parsedDetail?.created_by_details ||
      parsedProjectRequest?.created_by_details ||
      parsedProjectRequestDetail?.created_by_details;

    if (userObj?.first_name && userObj?.last_name) {
      return `${userObj.first_name} ${userObj.last_name}`.trim();
    }
    return (
      userObj?.first_name ||
      userObj?.username ||
      (request as any)?.created_by_name ||
      parsedDetail?.created_by_name ||
      parsedProjectRequest?.created_by_name ||
      loggedInUserName ||
      "Requester"
    );
  }, [request, parsedDetail, parsedProjectRequest, parsedProjectRequestDetail, loggedInUserName]);

  const requestId = useMemo(() => {
    const ref =
      ((request as any)?.reference_id && String((request as any).reference_id).trim()) ||
      (parsedDetail?.reference_id && String(parsedDetail.reference_id).trim()) ||
      (parsedProjectRequest?.reference_id && String(parsedProjectRequest.reference_id).trim()) ||
      (parsedProjectRequestDetail?.reference_id && String(parsedProjectRequestDetail.reference_id).trim());
    if (ref) return ref;
    const fallbackId = (request as any)?.id || id;
    return fallbackId ? `SUB${String(fallbackId).padStart(4, "0")}` : "SUB0001";
  }, [request, parsedDetail, parsedProjectRequest, parsedProjectRequestDetail, id]);

  const config: RequestFormConfig<FormValues> = useMemo(() => ({
    title: "Edit Subcontractor Request",
    requestId: requestId,
    requesterName: requesterName,
    date: requestDate,
    hideCostCode: true,
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
            placeholder: isLoadingVendors
              ? "Loading subcontractors..."
              : hasNoVendors
              ? "No vendors available (Create Vendor first)"
              : "Select subcontractor",
            options: vendorOptions,
            disabled: hasNoVendors || isLoadingVendors,
            action: hasNoVendors ? (
              <Link
                href="/invoice/settings?tab=vendor"
                className="text-xs text-[#3B7CED] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Create Vendor</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : undefined,
            emptyMessage: "No vendors found. Please create a vendor in Invoice Settings > Vendor tab.",
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
        ],
      },
      {
        title: "WBS",
        hideCostCode: true,
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
      scope_of_work: resolvedScopeOfWork,
      start_date: startDateStr,
      end_date: endDateStr,
      contract_value: contractValueStr,
      payment_type: paymentTypeVal,
      milestones: milestonesVal,
      phase: resolvedPhaseId,
      task: taskIdStr,
      justification_notes: justificationNotesStr,
    },
    calculateProjectedCost: (data: FormValues) => {
      return Number(data.contract_value || 0);
    },
    budgetConfig: {
      projectField: "project",
      wbsField: "task",
      costCode: "",
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

        const targetId =
          (request as any)?.detail?.id ||
          (request as any)?.subcontractor_request_id ||
          (request as any)?.id ||
          id;

        try {
          await updateRequest({ id: targetId, body: payload }).unwrap();
        } catch (updateErr) {
          console.warn("PUT update failed, attempting PATCH fallback:", updateErr);
          await patchRequest({ id: targetId, body: payload }).unwrap();
        }
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
    hasNoVendors,
    vendorOptions,
    phaseOptions,
    taskOptions,
    taskIdStr,
    defaultAvailableBudget,
    projectIdStr,
    vendorIdStr,
    resolvedScopeOfWork,
    startDateStr,
    endDateStr,
    contractValueStr,
    paymentTypeVal,
    milestonesVal,
    resolvedPhaseId,
    justificationNotesStr,
    id,
    request,
    updateRequest,
    patchRequest,
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
