"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Bell,
  Loader2,
  ChevronDown,
  Pencil,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";

import { 
  useCreateMaterialConsumptionMutation, 
  useGetMaterialConsumptionQuery,
  usePatchMaterialConsumptionMutation,
} from "@/api/requests/materialConsumptionRequestApi";
import {
  useGetProjectCostingProjectsQuery,
  useGetProjectCostingProjectQuery,
} from "@/api/projectCostingApi";
import { useGetActiveLocationsFilteredQuery } from "@/api/inventory/locationApi";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetInventoryProductsQuery } from "@/api/inventory/productsApi";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

// --- Schema ---
const productLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().positive("Quantity must be positive"),
  ),
  unitCost: z.number(),
  totalCost: z.number(),
  isEditing: z.boolean().optional().default(true),
});

const formSchema = z.object({
  project: z.string().min(1, "Project is required"),
  phase: z.string().min(1, "Phase is required"),
  wbsElement: z.string().min(1, "Activity is required"),
  dateConsumed: z.string().min(1, "Date is required"),
  warehouse: z.string().min(1, "Location is required"),
  notes: z.string().max(500).optional(),
  productLines: z
    .array(productLineSchema)
    .min(1, "At least one product is required"),
});

interface ProductLine {
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  isEditing?: boolean;
}

interface FormValues {
  project: string;
  phase: string;
  wbsElement: string;
  dateConsumed: string;
  warehouse: string;
  notes?: string;
  productLines: ProductLine[];
}

// Helper to convert numeric WBS ID to UUID
const toUUID = (val: string): string => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(val)) return val;
  const num = parseInt(val, 10);
  if (!isNaN(num)) {
    const hex = num.toString(16).padStart(12, "0");
    return `00000000-0000-0000-0000-${hex}`;
  }
  return "00000000-0000-0000-0000-000000000000";
};

const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3B7CED] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-50 appearance-none",
          className
        )}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <ChevronDown size={16} />
      </div>
    </div>
  );
});
NativeSelect.displayName = "NativeSelect";

export default function MaterialConsumptionForm({ requestId }: { requestId?: number }) {
  const router = useRouter();
  const [isProductLinesCollapsed, setIsProductLinesCollapsed] = useState(false);
  const statusModal = useStatusModal();
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserName = React.useMemo(() => {
    if (!loggedInUser) return "Current User";
    const anyUser = loggedInUser as any;
    return `${anyUser.first_name || ""} ${anyUser.last_name || ""}`.trim() || loggedInUser.username || "Current User";
  }, [loggedInUser]);

  // --- API Queries ---
  const { data: rawCostingProjects = [] } = useGetProjectCostingProjectsQuery({});

  // Filter approved/active projects only
  const projects = useMemo(() => {
    const list = Array.isArray(rawCostingProjects)
      ? rawCostingProjects
      : (rawCostingProjects as any)?.results || [];
    return list.filter((p: any) => {
      const st = String(p.status || "").toUpperCase();
      return st === "APPROVED" || st === "ACTIVE" || p.is_approved === true || !p.status;
    });
  }, [rawCostingProjects]);

  const isLoadingProjects = false;
  const { data: locations = [], isLoading: isLoadingLocations } =
    useGetActiveLocationsFilteredQuery();
  const { data: inventoryProducts = [], isLoading: isLoadingProducts } =
    useGetInventoryProductsQuery({});

  // --- Mutations & Async Data ---
  const [createMaterialConsumption, { isLoading: isCreating }] =
    useCreateMaterialConsumptionMutation();
  const [patchMaterialConsumption, { isLoading: isUpdating }] =
    usePatchMaterialConsumptionMutation();

  const { data: requestData, isLoading: isRequestLoading } = useGetMaterialConsumptionQuery(
    Number(requestId),
    { skip: !requestId }
  );

  const isSubmitting = isCreating || isUpdating;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      project: "",
      phase: "",
      wbsElement: "",
      dateConsumed: new Date().toISOString().split("T")[0],
      warehouse: "",
      notes: "",
      productLines: [{ productId: "", quantity: 0, unitCost: 0, totalCost: 0, isEditing: true }],
    },
    mode: "onBlur",
  });

  // Note: Form reset logic, including project-detail based warehouse handling, is implemented in the effect starting at line 263.

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "productLines",
  });

  const projectId = form.watch("project");
  const phaseId = form.watch("phase");
  const wbsElement = form.watch("wbsElement");
  const productLines = form.watch("productLines");

  // Fetch selected project detail for WBS (declared after projectId is available)
  const { data: selectedProjectDetail } = useGetProjectCostingProjectQuery(
    Number(projectId),
    { skip: !projectId || isNaN(Number(projectId)) },
  );



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

  // --- Derived WBS options (from project-costing data) ---
  const buildWbsList = (proj: any): any[] => {
    if (!proj) return [];
    if (Array.isArray(proj.wbs) && proj.wbs.length > 0) {
      const rawWbs = proj.wbs;
      return rawWbs.map((w: any) => {
        let budgetVal = getBudgetValue(w);
        if (budgetVal === 0 && !w.is_activity) {
          const childSum = rawWbs
            .filter((c: any) => c.is_activity && String(c.parent) === String(w.id || w.uuid))
            .reduce((sum: number, c: any) => sum + getBudgetValue(c), 0);
          if (childSum > 0) budgetVal = childSum;
        }
        return {
          ...w,
          id: w.uuid || w.id || w.activity_id || w.phase_id,
          parent: w.parent || w.phase || w.phase_id || w.parent_id,
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
      const phId = ph.uuid || ph.id || ph.phase_id || `phase-${pi + 1}`;
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
          id: act.uuid || act.id || `act-${phId}-${ai + 1}`, 
          name: act.name || `Activity ${ai + 1}`, 
          is_activity: true, 
          parent: phId,
          amount: getBudgetValue(act),
        });
      });
    });

    if (Array.isArray(proj.activities)) {
      proj.activities.forEach((act: any, ai: number) => {
        const actId = act.uuid || act.id || `act-${ai + 1}`;
        if (!items.some((it) => String(it.id) === String(actId))) {
          items.push({
            ...act,
            id: actId,
            name: act.name || `Activity ${ai + 1}`,
            is_activity: true,
            parent: act.phase || act.phase_id || act.parent || null,
            amount: getBudgetValue(act),
          });
        }
      });
    }

    return items;
  };

  const wbsList = useMemo(() => buildWbsList(selectedProjectDetail), [selectedProjectDetail]);

  // Determine if we are in edit mode
  const isEdit = !!requestId;

  const phases = useMemo(() => {
    const list = wbsList.filter((w: any) => !w.is_activity);
    if (isEdit && requestData) {
      const pd = (requestData as any).phase_details;
      if (pd && pd.id && pd.name) {
        if (!list.find((p: any) => String(p.id) === String(pd.id) || String(p.uuid) === String(pd.id))) {
          list.unshift({ id: pd.id, name: pd.name, is_activity: false });
        }
      }
    }
    return list;
  }, [wbsList, isEdit, requestData]);

  const activities = useMemo(() => {
    if (!phaseId) return [];
    const list = wbsList.filter((w: any) => w.is_activity && String(w.parent) === String(phaseId));
    if (isEdit && requestData) {
      const ad = (requestData as any).activity_details;
      const pd = (requestData as any).phase_details;
      // If the current phase matches the requestData's phase, inject the activity fallback
      if (ad && ad.id && ad.name && pd && String(pd.id) === String(phaseId)) {
        if (!list.find((a: any) => String(a.id) === String(ad.id) || String(a.uuid) === String(ad.id))) {
          list.unshift({ id: ad.id, name: ad.name, is_activity: true, parent: pd.id });
        }
      }
    }
    return list;
  }, [wbsList, phaseId, isEdit, requestData]);

  const availableBudget = useMemo(() => {
    if (!wbsElement) return 0;
    // First try activities list, then wbsList
    let task = activities.find((w: any) => String(w.id) === String(wbsElement) || String(w.uuid) === String(wbsElement));
    if (!task) {
      task = wbsList.find((w: any) => String(w.id) === String(wbsElement) || String(w.uuid) === String(wbsElement));
    }
    return task?.amount || 0;
  }, [wbsElement, activities, wbsList]);

  const hasInitialized = React.useRef(false);
  // Effect to initialise form values when request data is loaded
  useEffect(() => {
    if (requestData && !hasInitialized.current) {
      hasInitialized.current = true;
      const req = requestData as any;
      const getId = (val: any) => (val && typeof val === "object" ? String(val.id || val.uuid || val.project_id || val.phase_id || val.activity_id || val.location_id || "") : String(val || ""));
      form.reset({
        project: getId(req.project_request || req.project),
        phase: getId(req.phase),
        wbsElement: getId(req.activity),
        dateConsumed: req.date_consumed || new Date().toISOString().split("T")[0],
        warehouse: getId(req.location),
        notes: req.notes || "",
        productLines: (req.lines || []).map((l: any) => ({
          productId: getId(l.product),
          quantity: Number(l.quantity || 0),
          unitCost: parseFloat(l.unit_cost || "0") || 0,
          totalCost: parseFloat(l.total_cost || "0") || 0,
          isEditing: false,
        })),
      });
    }
  }, [requestData, form]);

  // Auto-fill warehouse based on the selected project
  useEffect(() => {
    if (projectId && selectedProjectDetail) {
      const proj = selectedProjectDetail as any;
      if (proj.site_location) {
        form.setValue("warehouse", String(proj.site_location));
      }
    }
  }, [projectId, selectedProjectDetail, form]);

  const fromUUID = (uuid: string): string => {
    if (!uuid) return "";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-([0-9a-f]{12})$/i;
    const match = uuid.match(uuidRegex);
    if (match) {
      const hex = match[1];
      return parseInt(hex, 16).toString();
    }
    return uuid;
  };

  // Derive exact phase and activity IDs from wbsList to fix UUID vs Numeric mismatches
  useEffect(() => {
    if (isEdit && requestData && wbsList.length > 0) {
      const req = requestData as any;
      const getId = (val: any) => (val && typeof val === "object" ? String(val.id || val.uuid || val.project_id || val.phase_id || val.activity_id || val.location_id || "") : String(val || ""));
      const reqPhaseVal = getId(req.phase);
      const reqActVal = getId(req.activity);
      
      const foundPhase = wbsList.find((w: any) => {
        if (w.is_activity) return false;
        if (String(w.id) === reqPhaseVal || String(w.uuid) === reqPhaseVal || String(w.phase_id) === reqPhaseVal) return true;
        if (req.phase_details?.name && w.name === req.phase_details.name) return true;
        return false;
      });

      if (foundPhase) {
        if (form.getValues("phase") !== String(foundPhase.id)) {
          form.setValue("phase", String(foundPhase.id));
        }
      }

      const foundAct = wbsList.find((w: any) => {
        if (!w.is_activity) return false;
        if (String(w.id) === reqActVal || String(w.uuid) === reqActVal || String(w.activity_id) === reqActVal) return true;
        if (toUUID(String(w.id)) === reqActVal || String(w.id) === fromUUID(reqActVal)) return true;
        if (req.activity_details?.name && w.name === req.activity_details.name) return true;
        return false;
      });

      if (foundAct) {
        if (form.getValues("wbsElement") !== String(foundAct.id)) {
          form.setValue("wbsElement", String(foundAct.id));
        }
        if (foundAct.parent && form.getValues("phase") !== String(foundAct.parent)) {
          form.setValue("phase", String(foundAct.parent));
        }
      }
    }
  }, [wbsList, requestData, isEdit, form]);

  // Reset activity when phase changes – only for new requests
  useEffect(() => {
    if (!isEdit) {
      form.setValue("wbsElement", "");
    }
  }, [phaseId, form, isEdit]);

  // --- Calculate totals when product lines change ---
  useEffect(() => {
    productLines.forEach((line, index) => {
      if (!line.productId) return;
      
      const totalCost = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0);

      if (line.totalCost !== totalCost) {
        form.setValue(`productLines.${index}.totalCost`, totalCost, {
          shouldValidate: true,
        });
      }
    });
  }, [productLines, form]);

  const totalRequestCost = productLines.reduce(
    (sum, line) => sum + (line.totalCost || 0),
    0,
  );

  const successRedirectId = React.useRef<number | null>(null);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        project: Number(data.project),
        activity: toUUID(data.wbsElement),
        location: data.warehouse,
        date_consumed: data.dateConsumed,
        notes: data.notes || "",
        lines: data.productLines.map((line) => ({
          product: Number(line.productId),
          quantity: line.quantity,
          unit_cost: line.unitCost.toFixed(2),
          total_cost: line.totalCost.toFixed(2),
        })),
      };

      if (requestId) {
        await patchMaterialConsumption({ id: requestId, body: payload }).unwrap();
        successRedirectId.current = requestId;
        statusModal.showSuccess(
          "Request Updated",
          "Material consumption request updated successfully.",
        );
      } else {
        const response = await createMaterialConsumption(payload).unwrap();
        if (response && response.id) {
          successRedirectId.current = response.id;
        }
        statusModal.showSuccess(
          "Request Submitted",
          "Material consumption logged successfully.",
        );
      }
    } catch (error) {
      statusModal.showError(
        "Submission Failed",
        "There was an error saving consumption. Please try again.",
      );
    }
  };

  const handleModalAction = () => {
    statusModal.close();
    if (statusModal.type === "success") {
      form.reset();
      if (successRedirectId.current) {
        router.push(`/project-request/material-consumption-request/${successRedirectId.current}`);
      } else {
        router.push("/project-request/material-consumption-request");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="min-h-screen bg-[#F9FAFB] pb-28"
      >
        {/* Header Bar */}
        <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30 shadow-none">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Back"
                type="button"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-800">
                {requestId ? "Edit Material Consumption" : "Material Consumption"}
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto pb-24 pt-4 space-y-4 px-4 sm:px-0">
          {/* Request Details Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-[#3B7CED] uppercase tracking-wider flex items-center gap-2">
              Request Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-gray-700">Request ID</FormLabel>
                <Input value={requestData?.request_id || "Auto-generated"} readOnly className="bg-gray-50 border-gray-200 text-gray-500 h-11" />
              </div>
              <div className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-gray-700">Date</FormLabel>
                <Input value={requestData?.created_at ? new Date(requestData.created_at).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB")} readOnly className="bg-gray-50 border-gray-200 text-gray-500 h-11" />
              </div>
              <div className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-gray-700">Requested by</FormLabel>
                <Input value={(requestData as any)?.requester_details?.name || loggedInUserName} readOnly className="bg-gray-50 border-gray-200 text-gray-500 h-11" />
              </div>
            </div>
          </div>

          {/* Consumption Details Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-[#3B7CED] uppercase tracking-wider flex items-center gap-2">
              Consumption Details
            </h2>

            <div className="space-y-4">
              {/* Project */}
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-gray-700">Project</FormLabel>
                    {isEdit ? (
                      <FormControl>
                        <NativeSelect value={field.value} onChange={field.onChange} className={form.formState.errors.project ? "border-red-500 focus:ring-red-500/20" : ""}>
                          <option value="" disabled>{isLoadingProjects ? "Loading projects..." : "Select active project"}</option>
                          {projects.map((p: any) => (
                            <option key={p.id} value={String(p.id)}>{p.name}</option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                    ) : (
                      <Select key={`project-select-${projects.length}`} onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              "h-11 w-full bg-white border-gray-200 focus:ring-[#3B7CED]/20",
                              form.formState.errors.project && "border-red-500 focus:ring-red-500/20"
                            )}
                          >
                            <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select active project"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location / Warehouse */}
              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-gray-700">Site Location</FormLabel>
                    {isEdit ? (
                      <FormControl>
                        <NativeSelect value={field.value} onChange={field.onChange} disabled={!!projectId} className={form.formState.errors.warehouse ? "border-red-500 focus:ring-red-500/20" : ""}>
                          <option value="" disabled>{isLoadingLocations ? "Loading locations..." : "Select site store"}</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={String(loc.id)}>{loc.location_name}</option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                    ) : (
                      <Select key={`warehouse-select-${locations.length}`} onValueChange={field.onChange} value={field.value ? String(field.value) : undefined} disabled={!!projectId}>
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              "h-11 w-full bg-white border-gray-200 focus:ring-[#3B7CED]/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                              form.formState.errors.warehouse && "border-red-500 focus:ring-red-500/20"
                            )}
                          >
                            <SelectValue placeholder={isLoadingLocations ? "Loading locations..." : "Select site store"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={String(loc.id)}>
                              {loc.location_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Consumed */}
              <FormField
                control={form.control}
                name="dateConsumed"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-gray-700">Date Consumed</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className={cn(
                          "h-11 bg-white border-gray-200 focus:ring-[#3B7CED]/20",
                          form.formState.errors.dateConsumed && "border-red-500 focus:ring-red-500/20"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* WBS Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-[#3B7CED] uppercase tracking-wider flex items-center gap-2">
              WBS
            </h2>

            <div className="space-y-4">
              {/* Phase */}
              <FormField
                control={form.control}
                name="phase"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-gray-700">Phase</FormLabel>
                    {isEdit ? (
                      <FormControl>
                        <NativeSelect value={field.value} onChange={field.onChange} disabled={!projectId || phases.length === 0} className={form.formState.errors.phase ? "border-red-500 focus:ring-red-500/20" : ""}>
                          <option value="" disabled>{!projectId ? "Select a project first" : "Select a phase"}</option>
                          {phases.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name} {p.amount !== undefined ? `— ₦${Number(p.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : ""}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                    ) : (
                      <Select key={`phase-select-${phases.length}`} onValueChange={field.onChange} value={field.value ? String(field.value) : undefined} disabled={!projectId || phases.length === 0}>
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              "h-11 w-full bg-white border-gray-200 focus:ring-[#3B7CED]/20 disabled:bg-gray-50 disabled:text-gray-400 [&>span]:w-full",
                              form.formState.errors.phase && "border-red-500 focus:ring-red-500/20"
                            )}
                          >
                            <SelectValue placeholder={!projectId ? "Select a project first" : "Select a phase"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72">
                          {phases.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={String(p.id)}
                              className="py-2.5 cursor-pointer [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
                            >
                              <span className="flex items-center justify-between gap-3 w-full min-w-0">
                                <span className="font-medium text-gray-800 truncate min-w-0">
                                  {p.name}
                                </span>
                                <span className="font-semibold text-xs text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-auto">
                                  ₦{Number(p.amount || 0).toLocaleString("en-NG", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Activity / WBS Element */}
              <FormField
                control={form.control}
                name="wbsElement"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-gray-700">Activity</FormLabel>
                    {isEdit ? (
                      <FormControl>
                        <NativeSelect value={field.value} onChange={field.onChange} disabled={!phaseId || activities.length === 0} className={form.formState.errors.wbsElement ? "border-red-500 focus:ring-red-500/20" : ""}>
                          <option value="" disabled>{!phaseId ? "Select a phase first" : "Select an activity"}</option>
                          {activities.map((a) => (
                            <option key={a.id} value={String(a.id)}>
                              {a.name} {a.amount !== undefined ? `— ₦${Number(a.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : ""}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormControl>
                    ) : (
                      <Select key={`activity-select-${activities.length}`} onValueChange={field.onChange} value={field.value ? String(field.value) : undefined} disabled={!phaseId || activities.length === 0}>
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              "h-11 w-full bg-white border-gray-200 focus:ring-[#3B7CED]/20 disabled:bg-gray-50 disabled:text-gray-400 [&>span]:w-full",
                              form.formState.errors.wbsElement && "border-red-500 focus:ring-red-500/20"
                            )}
                          >
                            <SelectValue placeholder={!phaseId ? "Select a phase first" : "Select an activity"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72">
                          {activities.map((a) => (
                            <SelectItem
                              key={a.id}
                              value={String(a.id)}
                              className="py-2.5 cursor-pointer [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
                            >
                              <span className="flex items-center justify-between gap-3 w-full min-w-0">
                                <span className="font-medium text-gray-800 truncate min-w-0">
                                  {a.name}
                                </span>
                                <span className="font-semibold text-xs text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-auto">
                                  ₦{Number(a.amount || 0).toLocaleString("en-NG", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-900">
                  Available Budget
                </span>
                <span className="text-xs font-semibold text-[#3B7CED]">
                  ₦
                  {availableBudget.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Product Lines Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <div
              onClick={() => setIsProductLinesCollapsed(!isProductLinesCollapsed)}
              className="flex justify-between items-center cursor-pointer select-none mb-2"
            >
              <h2 className="text-sm font-bold text-[#3B7CED] uppercase tracking-wider flex items-center gap-2">
                Product Line
              </h2>
              <ChevronDown
                className={`h-5 w-5 text-[#3B7CED] transition-transform duration-200 ${
                  isProductLinesCollapsed ? "" : "rotate-180"
                }`}
              />
            </div>

            {!isProductLinesCollapsed && (
              <div className="space-y-4">
                {fields.map((fieldItem, index) => {
                  const isEditing = form.watch(`productLines.${index}.isEditing`);
                  const prodId = form.watch(`productLines.${index}.productId`);
                  const prod = inventoryProducts.find((p) => String(p.id) === String(prodId));
                  const availableStock = prod
                    ? Number(
                        prod.available_stock ??
                          prod.available_product_quantity ??
                          prod.current_stock ??
                          prod.stock_quantity ??
                          prod.quantity ??
                          0
                      )
                    : 0;
                  const unitSymbol =
                    prod?.unit_of_measure_details?.unit_symbol ||
                    prod?.unit_of_measure_details?.unit_name ||
                    "units";

                  if (!isEditing) {
                    const qty = form.watch(`productLines.${index}.quantity`) || 0;
                    const uCost = form.watch(`productLines.${index}.unitCost`) || 0;
                    const tCost = qty * uCost;

                    return (
                      <div
                        key={fieldItem.id}
                        className="p-4 border border-[#E5EEFF] rounded-lg bg-[#F5F8FF] relative space-y-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium text-gray-400">
                            Item {index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => form.setValue(`productLines.${index}.isEditing`, true)}
                              className="p-1 rounded-md hover:bg-white transition-colors text-blue-500"
                              aria-label="Edit Item"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-1 rounded-md hover:bg-white transition-colors text-red-500"
                              aria-label="Delete Item"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <h3 className="text-sm font-semibold text-black/80">
                            {prod?.product_name || "Unknown Product"}
                            {unitSymbol ? ` (${unitSymbol})` : ""}
                          </h3>
                        </div>

                        <div className="flex justify-between items-center bg-white px-3 py-2 rounded-md border border-[#E5EEFF] text-xs">
                          <span className="text-gray-500">
                            Available: <strong className="text-black/80 font-semibold">{availableStock} {unitSymbol}</strong>
                          </span>
                          <span className="text-gray-500">
                            Consuming: <strong className="text-black/80 font-semibold">{qty} {unitSymbol}</strong>
                          </span>
                          <span className="font-semibold text-[#3B7CED]">
                            ₦{tCost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const enteredQty = form.watch(`productLines.${index}.quantity`) || 0;
                  const isOverStock = prod && enteredQty > availableStock;

                  return (
                    <div
                      key={fieldItem.id}
                      className="p-4 border border-gray-200 bg-white rounded-lg shadow-xs space-y-4 relative"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-500">
                          Item {index + 1}
                        </span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors text-red-500"
                            aria-label="Remove Item"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Product Select */}
                        <FormField
                          control={form.control}
                          name={`productLines.${index}.productId`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs font-semibold text-gray-700">
                                Product name
                              </FormLabel>
                              {isEdit ? (
                                <FormControl>
                                  <NativeSelect
                                    value={field.value}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      field.onChange(val);
                                      const selectedProd = inventoryProducts.find((p) => String(p.id) === val);
                                      if (selectedProd) {
                                        form.setValue(`productLines.${index}.unitCost`, Number(selectedProd.standard_cost) || 0, { shouldValidate: true });
                                      }
                                    }}
                                    className={form.formState.errors.productLines?.[index]?.productId ? "border-red-500 focus:ring-red-500/20" : ""}
                                  >
                                    <option value="" disabled>{isLoadingProducts ? "Loading inventory..." : "Search inventory..."}</option>
                                    {inventoryProducts.map((p) => {
                                      const pStock = Number(
                                        p.available_stock ??
                                          p.available_product_quantity ??
                                          p.current_stock ??
                                          p.stock_quantity ??
                                          p.quantity ??
                                          0
                                      );
                                      const pUnit = p.unit_of_measure_details?.unit_symbol || p.unit_of_measure_details?.unit_name || "";
                                      return (
                                        <option key={p.id} value={String(p.id)}>
                                          {p.product_name} {pUnit ? `(${pUnit})` : ""} — In Stock: {pStock}
                                        </option>
                                      );
                                    })}
                                  </NativeSelect>
                                </FormControl>
                              ) : (
                                <Select
                                  key={`product-select-${index}-${inventoryProducts.length}`}
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    const selectedProd = inventoryProducts.find((p) => String(p.id) === val);
                                    if (selectedProd) {
                                      form.setValue(`productLines.${index}.unitCost`, Number(selectedProd.standard_cost) || 0, { shouldValidate: true });
                                    }
                                  }}
                                  value={field.value ? String(field.value) : undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "h-11 bg-white border-gray-200 focus:ring-[#3B7CED]/20 w-full",
                                        form.formState.errors.productLines?.[index]?.productId &&
                                          "border-red-500 focus:ring-red-500/20"
                                      )}
                                    >
                                      <SelectValue
                                        placeholder={
                                          isLoadingProducts
                                            ? "Loading inventory..."
                                            : "Search inventory..."
                                        }
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {inventoryProducts.map((p) => {
                                      const pStock = Number(
                                        p.available_stock ??
                                          p.available_product_quantity ??
                                          p.current_stock ??
                                          p.stock_quantity ??
                                          p.quantity ??
                                          0
                                      );
                                      const pUnit = p.unit_of_measure_details?.unit_symbol || p.unit_of_measure_details?.unit_name || "";
                                      return (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                          <div className="flex justify-between items-center w-full gap-4">
                                            <span>
                                              {p.product_name} {pUnit ? `(${pUnit})` : ""}
                                            </span>
                                            <span className="text-[11px] font-semibold text-[#3B7CED] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                                              Stock: {pStock}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Available Stock Indicator Banner */}
                        {prod && (
                          <div className="col-span-2 bg-[#F5F8FF] border border-[#E5EEFF] rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#3B7CED] inline-block" />
                              <span className="text-xs font-medium text-gray-700">
                                Available in Inventory:
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-[#3B7CED] bg-white px-2.5 py-1 rounded-md border border-[#D0E2FF] shadow-2xs">
                              {availableStock} {unitSymbol}
                            </span>
                          </div>
                        )}

                        {/* Quantity */}
                        <FormField
                          control={form.control}
                          name={`productLines.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel className="text-xs font-semibold text-gray-700">
                                Quantity to Consume
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  className={cn(
                                    "h-11 bg-white border-gray-200 focus:ring-[#3B7CED]/20",
                                    form.formState.errors.productLines?.[index]?.quantity &&
                                      "border-red-500 focus:ring-red-500/20",
                                    isOverStock && "border-amber-400 focus:ring-amber-400/20"
                                  )}
                                  {...field}
                                />
                              </FormControl>
                              {prod && (
                                <p className={cn("text-[11px]", isOverStock ? "text-amber-600 font-semibold" : "text-gray-500")}>
                                  {isOverStock
                                    ? `Exceeds available stock (${availableStock} ${unitSymbol})`
                                    : `Max available: ${availableStock} ${unitSymbol}`}
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Unit Cost */}
                        <FormField
                          control={form.control}
                          name={`productLines.${index}.unitCost`}
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel className="text-xs font-semibold text-gray-700">
                                Unit Cost (₦)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className={cn(
                                    "h-11 bg-white border-gray-200 focus:ring-[#3B7CED]/20",
                                    form.formState.errors.productLines?.[index]?.unitCost &&
                                      "border-red-500 focus:ring-red-500/20"
                                  )}
                                  {...field}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : Number(val));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const pId = form.getValues(`productLines.${index}.productId`);
                          const qty = form.getValues(`productLines.${index}.quantity`);
                          if (!pId || !qty || qty <= 0) {
                            form.trigger(`productLines.${index}`);
                            return;
                          }
                          form.setValue(`productLines.${index}.isEditing`, false);
                        }}
                        className="w-full h-11 bg-[#2BA24D] hover:bg-[#238c41] text-white rounded-lg text-sm font-semibold flex items-center justify-center transition-colors mt-2"
                      >
                        Done
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                onClick={() =>
                  append({
                    productId: "",
                    quantity: 0,
                    unitCost: 0,
                    totalCost: 0,
                    isEditing: true,
                  })
                }
                className="w-full h-12 border-2 border-dashed border-blue-200 hover:border-[#3B7CED] hover:bg-blue-50/20 text-[#3B7CED] rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} />
                Add Another Product
              </button>
            </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-semibold text-gray-500">
                Available Budget
              </span>
              <span className="text-xs font-semibold text-gray-500">
                ₦{availableBudget.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-gray-100 pt-3">
              <span className="text-xs font-semibold text-gray-900">
                Total Cost
              </span>
              <span className="text-xs font-bold text-[#3B7CED]">
                ₦{totalRequestCost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-700">
                      Note
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional context..."
                        className="min-h-[100px] border-gray-200 focus:ring-[#3B7CED]/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      <div className="fixed bottom-0 left-16 right-0 bg-white border-t border-gray-100 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full h-12 text-sm font-bold flex items-center justify-center bg-[#3B7CED] hover:bg-[#2d63c7] text-white rounded-lg shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {requestId ? "Updating..." : "Submitting..."}
              </>
            ) : (
              requestId ? "Save Changes" : "Submit Requisition"
            )}
          </Button>
        </div>
      </div>

        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.type === "success" ? "Done" : "Try again"}
          onAction={handleModalAction}
          showCloseButton={false}
        />
      </form>
    </Form>
    </motion.div>
  );
}
