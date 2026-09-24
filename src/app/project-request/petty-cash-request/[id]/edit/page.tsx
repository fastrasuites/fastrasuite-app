"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  useGetProjectRequestQuery,
  usePatchProjectRequestMutation,
} from "@/api/requests/projectRequestApi";
import { useGetPettyCashRequestQuery } from "@/api/requests/pettyCashRequestApi";
import { useGetProjectCostingProjectQuery } from "@/api/projectCostingApi";
import { useCurrentUserName } from "@/hooks/useCurrentUser";
import { PageGuard } from "@/components/auth/PageGuard";
import { Loader2 } from "lucide-react";

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
  const id = Number(params.id);
  const loggedInUserName = useCurrentUserName();

  // Fetch the petty cash record first (from /petty-cash/{id}/)
  const {
    data: apiPettyCash,
    isLoading: isPettyCashLoading,
  } = useGetPettyCashRequestQuery(id, {
    skip: isNaN(id),
  });

  // Resolve the parent project-request id from the petty cash record
  const effectiveProjectRequestId = useMemo(() => {
    const pr = apiPettyCash?.project_request;
    const prId = typeof pr === "object" ? (pr as any)?.id : pr;
    return Number(prId || (apiPettyCash as any)?.project_request_id || 0);
  }, [apiPettyCash]);

  // Fetch the parent project request (has `detail` with all WBS fields)
  const {
    data: apiProjectRequest,
    isLoading: isProjectLoading,
  } = useGetProjectRequestQuery(effectiveProjectRequestId, {
    skip: !effectiveProjectRequestId || effectiveProjectRequestId <= 0,
  });

  const [patchProjectRequest] = usePatchProjectRequestMutation();

  // Parse `detail` from the project request (it's either an object or a JSON string)
  const detail: any = useMemo(() => {
    const raw = apiProjectRequest?.detail;
    if (!raw) return {};
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return raw;
  }, [apiProjectRequest]);

  // ---------- Derive all field values ----------

  // Project ID — check detail first, then petty cash root, then project request root
  const projectIdStr = useMemo(() => {
    const val =
      detail?.project_details?.id ??
      detail?.project?.id ??
      detail?.project ??
      detail?.projectId ??
      (apiPettyCash as any)?.project_details?.id ??
      (apiPettyCash as any)?.project ??
      (apiPettyCash as any)?.project_id ??
      apiProjectRequest?.project;
    return val !== undefined && val !== null ? String(val) : "";
  }, [detail, apiPettyCash, apiProjectRequest]);

  // Activity (task) ID — petty cash root has it directly
  const taskIdStr = useMemo(() => {
    const val =
      detail?.activity_details?.id ??
      detail?.activity ??
      detail?.task ??
      detail?.wbs_element ??
      (apiPettyCash as any)?.activity_details?.id ??
      (apiPettyCash as any)?.activity ??
      (apiPettyCash as any)?.wbs_element ??
      (apiPettyCash as any)?.task;
    return val !== undefined && val !== null ? String(val) : "";
  }, [detail, apiPettyCash]);

  // Phase ID
  const phaseIdStr = useMemo(() => {
    const val =
      detail?.phase_details?.id ??
      detail?.phase?.id ??
      detail?.phase ??
      (apiPettyCash as any)?.phase_details?.id ??
      (apiPettyCash as any)?.phase?.id ??
      (apiPettyCash as any)?.phase;
    return val !== undefined && val !== null ? String(val) : "";
  }, [detail, apiPettyCash]);

  // Fetch project costing so we can resolve phase from activity if phase is missing
  const { data: projectCosting } = useGetProjectCostingProjectQuery(
    Number(projectIdStr),
    { skip: !projectIdStr || isNaN(Number(projectIdStr)) }
  );

  // Resolve phase — either direct or by finding phase that contains the activity
  const resolvedPhaseId = useMemo(() => {
    if (phaseIdStr) return phaseIdStr;
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
        if (acts.some((a: any) => String(a.id || a.activity_id) === taskIdStr)) {
          return String(ph.id);
        }
      }
    }
    return "";
  }, [phaseIdStr, projectCosting, taskIdStr]);

  // Available budget
  const defaultAvailableBudget = useMemo(() => {
    const raw =
      detail?.available_budget ??
      (apiPettyCash as any)?.available_budget;
    const fromRaw = raw !== undefined && raw !== null ? Number(raw) : 0;
    if (fromRaw > 0) return fromRaw;

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
        const act = acts.find((a: any) => String(a.id || a.activity_id) === taskIdStr);
        if (act) {
          const b = act.available_budget ?? act.remaining_budget ?? act.amount;
          if (b !== undefined && b !== null) return Number(b);
        }
      }
    }
    return 0;
  }, [detail, apiPettyCash, projectCosting, taskIdStr]);

  // Amount requested
  const amountRequestedVal = useMemo(() => {
    const raw =
      detail?.amount_requested ??
      detail?.amountRequested ??
      detail?.amount ??
      (apiPettyCash as any)?.amount_requested ??
      (apiPettyCash as any)?.amount ??
      (apiProjectRequest as any)?.request_amount;
    return parseFloat(String(raw ?? "0")) || 0;
  }, [detail, apiPettyCash, apiProjectRequest]);

  // Purpose
  const purposeVal =
    detail?.purpose ??
    (apiPettyCash as any)?.purpose ??
    "";

  // Description
  const descriptionVal =
    detail?.description ??
    (apiPettyCash as any)?.description ??
    "";

  // Notes
  const notesVal =
    detail?.notes ??
    detail?.justification_notes ??
    (apiPettyCash as any)?.notes ??
    (apiPettyCash as any)?.justification_notes ??
    "";

  // ---------- Display helpers ----------
  const projectName =
    detail?.project_details?.name ||
    (apiPettyCash as any)?.project_details?.name ||
    (apiPettyCash as any)?.project_name ||
    projectCosting?.name ||
    (projectIdStr ? `Project #${projectIdStr}` : "");

  const projectOptions = useMemo(() =>
    projectIdStr ? [{ label: projectName || `Project #${projectIdStr}`, value: projectIdStr }] : [],
    [projectIdStr, projectName]);

  const phaseName = useMemo(() => {
    if (detail?.phase_details?.name) return detail.phase_details.name;
    if ((apiPettyCash as any)?.phase_details?.name) return (apiPettyCash as any).phase_details.name;
    if (projectCosting && resolvedPhaseId) {
      const phasesArr = Array.isArray(projectCosting.phases)
        ? projectCosting.phases
        : Array.isArray((projectCosting as any).phase_list)
        ? (projectCosting as any).phase_list
        : [];
      const found = phasesArr.find((p: any) => String(p.id) === resolvedPhaseId);
      if (found) return found.name || found.phase_name || "";
    }
    return resolvedPhaseId ? `Phase ${resolvedPhaseId}` : "";
  }, [detail, apiPettyCash, projectCosting, resolvedPhaseId]);

  const phaseOptions = useMemo(() =>
    resolvedPhaseId ? [{ label: phaseName || `Phase ${resolvedPhaseId}`, value: resolvedPhaseId }] : [],
    [resolvedPhaseId, phaseName]);

  const taskName = useMemo(() => {
    if (detail?.activity_details?.name) {
      const sn = detail.activity_details.serial_number;
      return sn != null ? `${sn} - ${detail.activity_details.name}` : detail.activity_details.name;
    }
    if ((apiPettyCash as any)?.activity_details?.name) {
      const sn = (apiPettyCash as any).activity_details.serial_number;
      const n = (apiPettyCash as any).activity_details.name;
      return sn != null ? `${sn} - ${n}` : n;
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
        const act = acts.find((a: any) => String(a.id || a.activity_id) === taskIdStr);
        if (act) {
          const sn = act.serial_number;
          const n = act.name || act.activity_name || "Activity";
          return sn != null ? `${sn} - ${n}` : n;
        }
      }
    }
    return taskIdStr ? `Activity ${taskIdStr}` : "";
  }, [detail, apiPettyCash, projectCosting, taskIdStr]);

  const taskOptions = useMemo(() =>
    taskIdStr
      ? [{ label: taskName || `Activity ${taskIdStr}`, value: taskIdStr, amount: defaultAvailableBudget }]
      : [],
    [taskIdStr, taskName, defaultAvailableBudget]);

  // Request header fields
  const requestId =
    (apiProjectRequest?.reference_id && String(apiProjectRequest.reference_id).trim()) ||
    ((apiPettyCash as any)?.reference_id && String((apiPettyCash as any).reference_id).trim()) ||
    ((apiPettyCash as any)?.project_request?.reference_id && String((apiPettyCash as any).project_request.reference_id).trim()) ||
    `PC${String(id).padStart(4, "0")}`;

  const rawCreatedAt =
    apiProjectRequest?.created_at ||
    (apiPettyCash as any)?.created_at ||
    (apiPettyCash as any)?.date_created;

  const requestDate = useMemo(() => {
    if (!rawCreatedAt) return "";
    return new Date(rawCreatedAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  }, [rawCreatedAt]);

  const requesterName = useMemo(() => {
    const crd = apiProjectRequest?.created_by_details || (apiPettyCash as any)?.created_by_details;
    if (crd?.first_name || crd?.last_name) {
      return `${crd.first_name || ""} ${crd.last_name || ""}`.trim();
    }
    return loggedInUserName || "Requester";
  }, [apiProjectRequest, apiPettyCash, loggedInUserName]);

  // ---------- Form config ----------
  const config: RequestFormConfig<FormValues> = useMemo(() => ({
    title: "Edit Petty Cash Request",
    requestId,
    requesterName,
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
        title: "Petty Cash Details",
        fields: [
          {
            name: "project",
            label: "Project",
            type: "select",
            placeholder: "Select a project",
            options: projectOptions,
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
      project: projectIdStr,
      phase: resolvedPhaseId,
      task: taskIdStr,
      amountRequested: amountRequestedVal,
      purpose: purposeVal,
      description: descriptionVal,
      notes: notesVal,
    },
    calculateProjectedCost: (data: FormValues) => Number(data.amountRequested || 0),
    defaultBudget: defaultAvailableBudget,
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
          justification_notes: data.notes || "",
        },
      };

      const targetId = effectiveProjectRequestId > 0 ? effectiveProjectRequestId : id;
      await patchProjectRequest({ id: targetId, data: payload }).unwrap();
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
  }), [
    requestId, requesterName, requestDate,
    projectOptions, phaseOptions, taskOptions,
    taskIdStr, defaultAvailableBudget,
    projectIdStr, resolvedPhaseId,
    amountRequestedVal, purposeVal, descriptionVal, notesVal,
    detail, effectiveProjectRequestId, id, patchProjectRequest,
  ]);

  const isLoading = isPettyCashLoading || (isProjectLoading && effectiveProjectRequestId > 0);
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#3B7CED] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading request...</p>
      </div>
    );
  }

  if (!apiPettyCash && !apiProjectRequest) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Request not found.</p>
      </div>
    );
  }

  return (
    <PageGuard module="project_request" entitlement="edit">
      <RequestForm config={config} />
    </PageGuard>
  );
}
