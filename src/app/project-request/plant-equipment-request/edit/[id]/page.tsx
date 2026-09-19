"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Bell, AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAvailableBudgetQuery } from "@/api/projectApi";
import {
  useGetProjectCostingProjectsQuery,
  useGetProjectCostingProjectQuery,
} from "@/api/projectCostingApi";
import { 
  useGetPlantEquipmentRequestQuery,
  useUpdatePlantEquipmentRequestMutation 
} from "@/api/requests/plantEquipmentRequestApi";
import { useCurrentUserName } from "@/hooks/useCurrentUser";
import { motion, AnimatePresence } from "framer-motion";
import { StatusModal } from "@/components/shared/StatusModal";
import { PageGuard } from "@/components/auth/PageGuard";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditPlantEquipmentRequestPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const loggedInUserName = useCurrentUserName();

  // Queries
  const { data: existingRequest, isLoading: isLoadingRequest } = useGetPlantEquipmentRequestQuery(id, { skip: !id || isNaN(id) });
  const { data: rawCostingProjects = [] } = useGetProjectCostingProjectsQuery({});

  // Filter approved/active projects
  const projects = useMemo(() => {
    const list = Array.isArray(rawCostingProjects)
      ? rawCostingProjects
      : (rawCostingProjects as any)?.results || [];
    return list.filter((p: any) => {
      const st = String(p.status || "").toUpperCase();
      return st === "APPROVED" || st === "ACTIVE" || p.is_approved === true || !p.status;
    });
  }, [rawCostingProjects]);

  // State values
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [equipmentName, setEquipmentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [requiredDate, setRequiredDate] = useState<string>("");
  const [estimatedCost, setEstimatedCost] = useState<number | "">("");
  const [notes, setNotes] = useState<string>("");

  // Modals state: "above_budget" | "unsuccessful" | "submitted" | null
  const [modalType, setModalType] = useState<"above_budget" | "unsuccessful" | "submitted" | null>(null);

  // Validation feedback modal state
  const [validationError, setValidationError] = useState<string | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);

  const requestId = useMemo(() => {
    if (!existingRequest) return "Loading...";
    const req = existingRequest as any;
    return (
      (req.reference_id && String(req.reference_id).trim()) ||
      ((req as any).detail?.reference_id && String((req as any).detail.reference_id).trim()) ||
      ((req as any).project_request?.reference_id && String((req as any).project_request.reference_id).trim()) ||
      `PE${String(req.id || id).padStart(4, "0")}`
    );
  }, [existingRequest, id]);

  const requestDate = useMemo(() => {
    if (!existingRequest?.created_at) return "";
    return new Date(existingRequest.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [existingRequest?.created_at]);

  // Populate data when existing request is loaded
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (existingRequest) {
      const req = existingRequest as any;
      setEquipmentName(req.equipment_name || "");
      setDescription(req.description || "");
      setQuantity(req.quantity || "");
      if (req.required_date) {
        setRequiredDate(new Date(req.required_date).toISOString().split('T')[0]);
      }
      setEstimatedCost(req.estimated_cost ? parseFloat(req.estimated_cost) : "");
      setNotes(req.justification_notes || "");
      
      if (req.project) setSelectedProjectId(String(req.project));
      else if (req.project_details?.id) setSelectedProjectId(String(req.project_details.id));

      if (req.phase) setSelectedPhaseId(String(req.phase));
      else if (req.phase_details?.id) setSelectedPhaseId(String(req.phase_details.id));

      if (req.activity) setSelectedTaskId(String(req.activity));
      else if (req.activity_details?.id) setSelectedTaskId(String(req.activity_details.id));
    }
  }, [existingRequest, id]);

  // Fetch full project detail for WBS cascade
  const { data: costingProjectDetail } = useGetProjectCostingProjectQuery(
    Number(selectedProjectId),
    { skip: !selectedProjectId || isNaN(Number(selectedProjectId)) },
  );

  // Helper to extract numeric budget from multiple potential backend fields
  const getBudgetValue = (item: any): number => {
    if (!item) return 0;
    const val =
      item.available_budget ??
      item.remaining_budget ??
      item.budget ??
      item.amount ??
      item.budgeted_amount ??
      item.total_amount ??
      (item.quantity && item.rate ? Number(item.quantity) * Number(item.rate) : undefined) ??
      item.cost ??
      0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Build a flat WBS list from either .wbs or .phases[].activities structure
  const wbsList = useMemo(() => {
    const proj: any = costingProjectDetail || projects.find((p: any) => String(p.id) === selectedProjectId);
    if (!proj) return [];
    if (Array.isArray(proj.wbs) && proj.wbs.length > 0) {
      const rawWbs = proj.wbs;
      return rawWbs.map((w: any) => {
        let budgetVal = getBudgetValue(w);
        if (budgetVal === 0 && !w.is_activity) {
          const childSum = rawWbs
            .filter((c: any) => c.is_activity && String(c.parent) === String(w.id))
            .reduce((sum: number, c: any) => sum + getBudgetValue(c), 0);
          if (childSum > 0) budgetVal = childSum;
        }
        return {
          ...w,
          amount: budgetVal,
        };
      });
    }

    const items: any[] = [];
    let phasesArr: any[] = [];
    if (typeof proj.phases === "string") {
      try {
        phasesArr = JSON.parse(proj.phases);
      } catch (e) {
        phasesArr = [];
      }
    } else if (Array.isArray(proj.phases)) {
      phasesArr = proj.phases;
    } else if (Array.isArray(proj.phase_list)) {
      phasesArr = proj.phase_list;
    } else if (proj.phases?.results && Array.isArray(proj.phases.results)) {
      phasesArr = proj.phases.results;
    }

    phasesArr.forEach((ph: any, pi: number) => {
      const phId = ph.id || ph.phase_id || `phase-${pi + 1}`;
      const phName = ph.name || ph.phase_name || `Phase ${pi + 1}`;

      const acts = Array.isArray(ph.activities) ? ph.activities
        : Array.isArray(ph.activity_list) ? ph.activity_list : [];

      const actsTotal = acts.reduce((sum: number, act: any) => sum + getBudgetValue(act), 0);
      const explicitPhaseBudget = getBudgetValue(ph);
      const phaseAmount = explicitPhaseBudget > 0 ? explicitPhaseBudget : actsTotal;

      items.push({
        ...ph,
        id: phId,
        name: phName,
        is_activity: false,
        amount: phaseAmount,
      });

      acts.forEach((act: any, ai: number) => {
        items.push({
          ...act,
          id: act.id || act.activity_id || `act-${phId}-${ai + 1}`,
          name: act.name || act.activity_name || `Activity ${ai + 1}`,
          is_activity: true,
          parent: phId,
          amount: getBudgetValue(act),
        });
      });
    });

    if (Array.isArray(proj.activities)) {
      proj.activities.forEach((act: any, ai: number) => {
        const actId = act.id || act.activity_id || `act-${ai + 1}`;
        if (!items.some((it) => String(it.id) === String(actId))) {
          items.push({
            ...act,
            id: actId,
            name: act.name || act.activity_name || `Activity ${ai + 1}`,
            is_activity: true,
            parent: act.phase || act.phase_id || act.parent || null,
            amount: getBudgetValue(act),
          });
        }
      });
    }

    return items;
  }, [costingProjectDetail, projects, selectedProjectId]);

  const phases = useMemo(() => {
    return wbsList.filter((w: any) => !w.is_activity);
  }, [wbsList]);

  // Filter Tasks
  const tasks = useMemo(() => {
    if (!selectedPhaseId) return [];
    return wbsList.filter(
      (w: any) => w.is_activity && String(w.parent) === String(selectedPhaseId)
    );
  }, [wbsList, selectedPhaseId]);

  const selectedActivity = useMemo(() => {
    return tasks.find((t: any) => String(t.id) === selectedTaskId);
  }, [tasks, selectedTaskId]);

  const selectedCostCode = selectedActivity?.cost_code || selectedActivity?.code || "CC-04";

  // Budget query
  const { data: budgetData, isLoading: isBudgetLoading } = useGetAvailableBudgetQuery(
    {
      project_id: Number(selectedProjectId),
      wbs_id: selectedTaskId,
      cost_code: selectedCostCode,
    },
    { skip: !selectedProjectId || !selectedTaskId }
  );

  let availableBudget = 0;
  if (selectedActivity) {
    const actBudget = Number(selectedActivity.amount ?? 0);
    if (actBudget > 0) {
      availableBudget = actBudget;
    } else if (budgetData?.available_budget !== undefined && budgetData?.available_budget !== null) {
      availableBudget = Number(budgetData.available_budget);
    }
  } else {
    availableBudget = budgetData?.available_budget ? Number(budgetData.available_budget) : 0;
  }

  // Calculations
  const qtyNum = Number(quantity || 0);
  const costNum = Number(estimatedCost || 0);
  const totalCost = qtyNum * costNum;

  // Handle Form Submission
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validation
    if (!selectedProjectId) {
      setValidationError("Please select a project.");
      return;
    }
    if (!equipmentName.trim()) {
      setValidationError("Please enter the equipment name.");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setValidationError("Please enter a valid quantity greater than 0.");
      return;
    }
    if (!requiredDate) {
      setValidationError("Please select a required date.");
      return;
    }
    if (!selectedPhaseId) {
      setValidationError("Please select a WBS phase.");
      return;
    }
    if (!selectedTaskId) {
      setValidationError("Please select a WBS activity.");
      return;
    }
    if (!estimatedCost || Number(estimatedCost) <= 0) {
      setValidationError("Please enter a valid estimated unit cost.");
      return;
    }

    // Check budget limit
    if (totalCost > availableBudget) {
      setModalType("above_budget");
    } else {
      executeSubmission();
    }
  };

  const [updateRequest, { isLoading: isUpdating }] = useUpdatePlantEquipmentRequestMutation();

  const executeSubmission = async () => {
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

      // Build API payload
      const payload: any = {
        reference_id: requestId,
        equipment_name: equipmentName,
        description: description,
        quantity: Number(quantity),
        required_date: requiredDate,
        estimated_cost: String(estimatedCost),
        justification_notes: notes,
        is_hidden: false,
        project: Number(selectedProjectId),
        project_request: Number(selectedProjectId),
        activity: ensureValidUUID(selectedTaskId),
        wbs_element: ensureValidUUID(selectedTaskId),
      };

      // Call API
      await updateRequest({ id, data: payload }).unwrap();
      setModalType("submitted");
    } catch (error: any) {
      console.error("API submission failed:", error);
      let errMsg = "Your request update was unsuccessful. Please check your data and try again.";
      if (error?.data) {
         const firstKey = Object.keys(error.data)[0];
         if (firstKey) {
            const val = error.data[firstKey];
            const errorText = (Array.isArray(val) ? String(val[0]) : String(val)).trim();
            errMsg = `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1).replace(/_/g, " ")}: ${errorText}`;
         }
      }
      setApiError(errMsg);
      setModalType("unsuccessful");
    }
  };

  if (isLoadingRequest) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pb-28">
        <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <Skeleton className="h-6 bg-gray-200 rounded w-36 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
              <Skeleton className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                  <Skeleton className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <PageGuard module="project_request" entitlement="edit">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="min-h-screen bg-[#F9FAFB] pb-28"
      >
      {/* Header Bar */}
      <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30 shadow-none">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/project-request/plant-equipment-request/${id}`)}
              className="p-1 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Edit Plant & Equipment Request</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell size={20} className="text-gray-800" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <img
                src="https://api.dicebear.com/7.x/pixel-art/svg?seed=user123"
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Request Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
          <h2 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
            Request Details
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Request ID</Label>
              <Input value={requestId} disabled className="h-11 bg-gray-50 text-gray-500 font-bold border-gray-200 shadow-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Date</Label>
              <Input value={requestDate || "—"} disabled className="h-11 bg-gray-50 text-gray-500 font-normal border-gray-200 shadow-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Requested by</Label>
              <Input value={loggedInUserName} disabled className="h-11 bg-gray-50 text-gray-500 font-normal border-gray-200 shadow-none" />
            </div>
          </div>
        </div>

        {/* Plant & Equipment Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
          <h2 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
            Plant & Equipment Details
          </h2>

          <div className="space-y-4">
            {/* Project Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedPhaseId("");
                  setSelectedTaskId("");
                }}
              >
                <SelectTrigger className="h-11 border-gray-200 bg-white w-full shadow-none">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Equipment Name</Label>
              <Input
                placeholder="Enter equipment name"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="h-11 border-gray-200 shadow-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Description</Label>
              <Input
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 border-gray-200 shadow-none"
              />
            </div>

            {/* Quantity & Required Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Quantity</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuantity(val === "" ? "" : Number(val));
                  }}
                  className="h-11 border-gray-200 shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Required Date</Label>
                <Input
                  type="date"
                  placeholder="Enter date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="h-11 border-gray-200 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* WBS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
          <h2 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
            WBS
          </h2>

          <div className="space-y-4">
            {/* Phase */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Phase</Label>
              <Select
                value={selectedPhaseId}
                onValueChange={(val) => {
                  setSelectedPhaseId(val);
                  setSelectedTaskId("");
                }}
                disabled={!selectedProjectId}
              >
                <SelectTrigger className="h-11 border-gray-200 bg-white disabled:bg-gray-50 w-full shadow-none [&>span]:w-full">
                  <SelectValue placeholder="Select a phase" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {phases.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No phases available
                    </div>
                  ) : (
                    phases.map((ph: any) => (
                      <SelectItem
                        key={ph.id}
                        value={String(ph.id)}
                        className="py-2.5 cursor-pointer [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
                      >
                        <span className="flex items-center justify-between gap-3 w-full min-w-0">
                          <span className="font-medium text-gray-800 truncate min-w-0">
                            {ph.name}
                          </span>
                          <span className="font-semibold text-xs text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-auto">
                            ₦{Number(ph.amount || 0).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Activity */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Activity</Label>
              <Select
                value={selectedTaskId}
                onValueChange={setSelectedTaskId}
                disabled={!selectedPhaseId}
              >
                <SelectTrigger className="h-11 border-gray-200 bg-white disabled:bg-gray-50 w-full shadow-none [&>span]:w-full">
                  <SelectValue placeholder="Select an activity" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {tasks.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No activities available
                    </div>
                  ) : (
                    tasks.map((t: any) => (
                      <SelectItem
                        key={t.id}
                        value={String(t.id)}
                        className="py-2.5 cursor-pointer [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
                      >
                        <span className="flex items-center justify-between gap-3 w-full min-w-0">
                          <span className="font-medium text-gray-800 truncate min-w-0">
                            {t.name}
                          </span>
                          <span className="font-semibold text-xs text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-auto">
                            ₦{Number(t.amount || 0).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Available Budget Section */}
            {selectedTaskId && (
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">
                    Cost Code
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedCostCode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">
                    Available Budget
                  </span>
                  <span className="text-sm font-bold text-[#3B7CED]">
                    {isBudgetLoading ? (
                      "Loading..."
                    ) : (
                      `₦${availableBudget.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
          <h2 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
            Cost Details
          </h2>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Estimated Cost</Label>
            <Input
              type="number"
              placeholder="Enter cost"
              value={estimatedCost}
              onChange={(e) => {
                const val = e.target.value;
                setEstimatedCost(val === "" ? "" : Number(val));
              }}
              className="h-11 border-gray-200 shadow-none"
            />
          </div>
        </div>

        {/* Summaries Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-3 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-gray-900 font-bold">Total Cost</span>
            <span className="font-extrabold text-[#3B7CED] text-sm">
              N{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Note */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Note</Label>
            <Textarea
              placeholder="Enter note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] border-gray-200 focus:ring-[#3B7CED]/20 shadow-none"
            />
          </div>
        </div>
      </main>

      {/* Floating Action Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-20 shadow-none">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleFormSubmit}
            disabled={isUpdating}
            className="w-full h-12 text-sm font-bold flex items-center justify-center bg-[#3B7CED] hover:bg-[#2d63c7] text-white rounded-lg shadow-none"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Above Available Budget Dialog */}
      <StatusModal
        isOpen={modalType === "above_budget"}
        onClose={() => setModalType(null)}
        type="warning"
        title="Above Available Budget"
        message="The total cost for your request is above the available budget and might be held. Will you like to submit anyways?"
        actionText="Submit"
        onAction={() => {
          setModalType(null);
          executeSubmission();
        }}
        secondaryText="Cancel"
        onSecondary={() => setModalType(null)}
        showCloseButton={true}
      />

      {/* Submission Unsuccessful Dialog */}
      <StatusModal
        isOpen={modalType === "unsuccessful"}
        onClose={() => {
          setModalType(null);
          setApiError(null);
        }}
        type="error"
        title="Update Unsuccessful"
        message={apiError || "Your request update was unsuccessful. Please check your data and try again."}
        actionText="Try Again"
        onAction={() => {
          setModalType(null);
          setApiError(null);
        }}
        showCloseButton={true}
      />

      {/* Request Submitted Dialog */}
      <StatusModal
        isOpen={modalType === "submitted"}
        onClose={() => {
          setModalType(null);
          router.push(`/project-request/plant-equipment-request/${id}`);
        }}
        type="success"
        title="Request Updated"
        message="Your request has successfully been updated"
        actionText="Done"
        onAction={() => {
          setModalType(null);
          router.push(`/project-request/plant-equipment-request/${id}`);
        }}
        showCloseButton={true}
      />

      {/* Validation Error Banner / Popup */}
      <AnimatePresence>
        {validationError && (
          <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 max-w-md bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between z-50">
            <span className="text-xs font-bold">{validationError}</span>
            <button
              onClick={() => setValidationError(null)}
              className="text-white hover:text-red-200 text-sm font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}
      </AnimatePresence>
      </motion.div>
    </PageGuard>
  );
}
