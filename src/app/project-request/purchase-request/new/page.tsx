"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Pencil, Trash, X, Plus, ChevronDown } from "lucide-react";
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
import { CreateProductModal } from "@/components/shared/CreateProductModal";
import {
  useGetAvailableBudgetQuery,
} from "@/api/projectApi";
import {
  useGetProjectOptionsQuery,
  useGetPhaseOptionsQuery,
  useGetActivityOptionsQuery,
  useGetProjectRequestProductsQuery,
} from "@/api/requests/projectRequestApi";
import { useGetCurrenciesQuery } from "@/api/purchase/currencyApi";
import { useGetVendorsQuery } from "@/api/purchase/vendorsApi";
import { useGetTenantUsersQuery } from "@/api/settings/tenantUserApi";
import { useCreateProjectPurchaseRequestMutation } from "@/api/requests/projectPurchaseRequestApi";
import { useGetActiveLocationsFilteredQuery } from "@/api/inventory/locationApi";
import { StatusModal } from "@/components/shared/StatusModal";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleWizard, WizardGuideButton } from "@/components/shared/wizard/ModuleWizard";

interface ItemState {
  id: string;
  isEditing: boolean;
  productName: string;
  productId?: string;
  quantity: number;
  unitCost: number;
  description: string;
  error?: string;
}

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const { fullName: loggedInUserName, user: loggedInUser, tenant_user_id } = useCurrentUser();

  // API queries
  const { data: rawProjectOptions = [] } = useGetProjectOptionsQuery();
  const { data: rawProjectProducts = [] } = useGetProjectRequestProductsQuery();
  const { data: currencies } = useGetCurrenciesQuery({});
  const { data: vendors } = useGetVendorsQuery({});
  const { data: tenantUsers } = useGetTenantUsersQuery({});
  const { data: activeLocations, isLoading: isLoadingLocations } = useGetActiveLocationsFilteredQuery();
  const [createProjectPurchaseRequest, { isLoading: isCreating }] =
    useCreateProjectPurchaseRequestMutation();

  // Local state for dropdown options
  const [customProducts, setCustomProducts] = useState<
    { id: string; name: string }[]
  >([]);

  // Form selections
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [requiredDate, setRequiredDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Product Lines
  const [items, setItems] = useState<ItemState[]>([
    {
      id: "1",
      isEditing: true,
      productName: "",
      quantity: 0,
      unitCost: 0,
      description: "",
    },
  ]);

  const [isProductLinesCollapsed, setIsProductLinesCollapsed] = useState(false);

  // Submission status modal
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

  // Unique Request ID and Date
  const [requestId] = useState(
    () => `PR${String(Math.floor(Math.random() * 90000) + 10000)}`,
  );
  const [formattedDate] = useState(() => {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  });

  // Available Budget Query
  const { data: budgetData } = useGetAvailableBudgetQuery(
    {
      project_id: Number(selectedProjectId),
      wbs_id: selectedTaskId,
      cost_code: "CC-04",
    },
    { skip: !selectedProjectId || !selectedTaskId },
  );

  const projects = useMemo(() => {
    return Array.isArray(rawProjectOptions)
      ? rawProjectOptions
      : (rawProjectOptions as any)?.results || [];
  }, [rawProjectOptions]);

  const numericProjectId = Number(selectedProjectId);
  const isValidProjectId = Boolean(selectedProjectId && !isNaN(numericProjectId) && numericProjectId > 0);

  const { data: rawPhaseOptions = [] } = useGetPhaseOptionsQuery(
    { project_id: numericProjectId },
    { skip: !isValidProjectId }
  );
  const phases = useMemo(() => {
    return Array.isArray(rawPhaseOptions)
      ? rawPhaseOptions
      : (rawPhaseOptions as any)?.results || [];
  }, [rawPhaseOptions]);

  const { data: rawActivityOptions = [] } = useGetActivityOptionsQuery(
    { project_id: numericProjectId, phase_id: selectedPhaseId },
    { skip: !isValidProjectId || !selectedPhaseId }
  );
  const tasks = useMemo(() => {
    return Array.isArray(rawActivityOptions)
      ? rawActivityOptions
      : (rawActivityOptions as any)?.results || [];
  }, [rawActivityOptions]);

  const currentProject = useMemo(() => {
    return projects.find((p: any) => String(p.id) === selectedProjectId);
  }, [projects, selectedProjectId]);

  const selectedPhaseObj = useMemo(() => {
    return phases.find((p: any) => String(p.id) === selectedPhaseId);
  }, [phases, selectedPhaseId]);

  const selectedTaskObj = useMemo(() => {
    return tasks.find((t: any) => String(t.id) === selectedTaskId);
  }, [tasks, selectedTaskId]);

  const availableBudget = useMemo(() => {
    if (selectedTaskObj) {
      if (selectedTaskObj.available_budget !== undefined && selectedTaskObj.available_budget !== null) {
        return Number(selectedTaskObj.available_budget);
      }
      if (selectedTaskObj.current_budget !== undefined && selectedTaskObj.current_budget !== null) {
        return Number(selectedTaskObj.current_budget);
      }
      if (selectedTaskObj.original_amount !== undefined && selectedTaskObj.original_amount !== null) {
        return Number(selectedTaskObj.original_amount);
      }
    }
    if (selectedPhaseObj) {
      if (selectedPhaseObj.current_budget !== undefined && selectedPhaseObj.current_budget !== null) {
        return Number(selectedPhaseObj.current_budget);
      }
      if (selectedPhaseObj.original_amount !== undefined && selectedPhaseObj.original_amount !== null) {
        return Number(selectedPhaseObj.original_amount);
      }
    }
    if (budgetData?.available_budget !== undefined && Number(budgetData.available_budget) > 0) {
      return Number(budgetData.available_budget);
    }
    return 0;
  }, [selectedTaskObj, selectedPhaseObj, budgetData]);

  // Auto-fill site location when current project is loaded or changes
  useEffect(() => {
    if (selectedProjectId && currentProject?.site_location) {
      const siteLoc = currentProject.site_location as any;
      const locId = typeof siteLoc === "object" ? siteLoc.id : siteLoc;
      const locName = typeof siteLoc === "object" ? siteLoc.name : String(siteLoc);
      const locObj = activeLocations?.find(
        (l: any) => String(l.id) === String(locId) || l.location_name?.toLowerCase() === (locName || "").toLowerCase()
      );
      const finalLoc = locObj
        ? (locObj.location_name || String(locObj.id))
        : (locName || String(locId || ""));
      setLocation(finalLoc);
    }
  }, [selectedProjectId, currentProject, activeLocations]);

  // Normalize project request products
  const projectProductsList = useMemo(() => {
    if (!rawProjectProducts) return [];
    if (Array.isArray(rawProjectProducts)) return rawProjectProducts;
    if ((rawProjectProducts as any).products && Array.isArray((rawProjectProducts as any).products)) {
      return (rawProjectProducts as any).products;
    }
    if ((rawProjectProducts as any).results && Array.isArray((rawProjectProducts as any).results)) {
      return (rawProjectProducts as any).results;
    }
    return [];
  }, [rawProjectProducts]);

  // Combine products
  const allProducts = useMemo(() => {
    const list: { id: string; name: string; standardCost?: number; description?: string }[] = [];
    projectProductsList.forEach((p: any) => {
      if (p && (p.product_name || p.name)) {
        const pName = String(p.product_name || p.name).trim();
        if (!list.some((item) => item.name.toLowerCase() === pName.toLowerCase())) {
          list.push({
            id: String(p.id),
            name: pName,
            standardCost: Number(p.standard_cost || p.estimated_unit_cost || p.unit_cost || p.cost || 0),
            description: p.description || p.product_description || "",
          });
        }
      }
    });
    customProducts.forEach((cp) => {
      if (!list.some((item) => item.name.toLowerCase() === cp.name.toLowerCase())) {
        list.push({
          ...cp,
          standardCost: 0,
          description: "",
        });
      }
    });
    return list;
  }, [projectProductsList, customProducts]);

  // Total cost
  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }, [items]);

  // Handle adding another product line
  const addAnotherProduct = () => {
    // Automatically save any unsaved item if valid, else keep editing
    const unsavedIndex = items.findIndex((item) => item.isEditing);
    if (unsavedIndex > -1) {
      const unsaved = items[unsavedIndex];
      if (!unsaved.productName) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === unsavedIndex ? { ...it, error: "Enter product name" } : it,
          ),
        );
        return;
      }
    }

    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        isEditing: true,
        productName: "",
        quantity: 0,
        unitCost: 0,
        description: "",
      },
    ]);
  };

  // Handle saving an item (Done button)
  const saveItem = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    if (!item.productName.trim()) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, error: "Enter product name" } : it,
        ),
      );
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, isEditing: false, error: undefined } : it,
      ),
    );
  };

  // Handle editing a completed item
  const editItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isEditing: true } : it)),
    );
  };

  // Handle deleting an item
  const deleteItem = (id: string) => {
    if (items.length === 1) {
      // Keep at least one empty item
      setItems([
        {
          id: String(Date.now()),
          isEditing: true,
          productName: "",
          quantity: 0,
          unitCost: 0,
          description: "",
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Handle submit form
  const handleSubmit = async () => {
    // Validate main details
    if (!selectedProjectId) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        description: "Please select a project.",
      });
      return;
    }
    if (!location) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        description: "Please select site location.",
      });
      return;
    }
    if (!requiredDate) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        description: "Please select a required by date.",
      });
      return;
    }
    if (!selectedPhaseId || !selectedTaskId) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        description: "Please select phase and activity.",
      });
      return;
    }

    // Validate and auto-save items
    let hasUnsavedOrInvalid = false;
    const validatedItems = items.map((item) => {
      if (item.isEditing) {
        if (!item.productName.trim()) {
          hasUnsavedOrInvalid = true;
          return { ...item, error: "Enter product name" };
        }
        return { ...item, isEditing: false, error: undefined };
      }
      return item;
    });

    if (hasUnsavedOrInvalid) {
      setItems(validatedItems);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        description: "Please resolve all errors in the Product Line items.",
      });
      return;
    }

    setItems(validatedItems);

    // Resolve TenantUser profile ID for the requester
    const currentUserProfile = tenantUsers?.find(
      (tu) => tu.user_id === loggedInUser?.id || tu.id === tenant_user_id,
    );
    const requesterId = tenant_user_id || currentUserProfile?.id || loggedInUser?.id || 1;

    // Build API payload
    const phaseName = phases.find((p: any) => String(p.id) === selectedPhaseId)?.name || "Phase";
    const taskName = tasks.find((t: any) => String(t.id) === selectedTaskId)?.name || "Task";
    const projectName = currentProject?.name || "Project";

    const locationName = activeLocations?.find((loc) => String(loc.id) === location)?.location_name || location || "Lagos Site";
    const linesPayload = validatedItems.map((item) => {
      const cleanId = item.productId || item.id;
      const parsedId = parseInt(cleanId);
      const matchedProd = projectProductsList.find(
        (p: any) =>
          String(p.product_name || p.name || "").toLowerCase() === item.productName.toLowerCase(),
      );
      const productDbId = !isNaN(parsedId)
        ? parsedId
        : (matchedProd?.id || projectProductsList[0]?.id || 1);

      return {
        product: productDbId,
        description: item.description || item.productName || "",
        quantity: String(item.quantity || 1),
        estimated_unit_cost: String(item.unitCost || 0),
        qty: item.quantity || 1,
        estimated_unit_price: String(item.unitCost || 0),
      };
    });

    const purposeStr = `Project: ${projectName} | Phase: ${phaseName} | Activity: ${taskName} | Notes: ${notes}`;

    const payload: any = {
      project: Number(selectedProjectId) || 1,
      activity: selectedTaskId,
      wbs_element: selectedTaskId,
      site_location: locationName,
      required_by_date: requiredDate,
      notes: purposeStr,
      lines: linesPayload,

      status: "pending" as const,
      currency: currencies?.[0]?.id || 1,
      requester: requesterId,
      requesting_location: location || String(activeLocations?.[0]?.id || 1),
      purpose: purposeStr,
      vendor: vendors?.[0]?.id || 1,
      items: linesPayload,
    };

    try {
      const result = await createProjectPurchaseRequest(payload).unwrap();

      const newRequest = {
        id: result?.id || `pr-${Date.now()}`,
        reference_id: result?.reference_id || requestId,
        title: validatedItems.map((it) => it.productName).join(", "),
        status: (result?.status || "pending") as any,
        quantity: validatedItems.reduce(
          (acc, it) => acc + Number(it.quantity || 0),
          0,
        ),
        amount: totalCost,
        requester: loggedInUserName,
        date: formattedDate,
        project: projectName,
        location: locationName,
        requiredDate,
        phase: phaseName,
        task: taskName,
        notes,
        lines: validatedItems.map((item, idx) => ({
          id: idx + 1,
          productName: item.productName,
          description: item.description || "",
          quantity: Number(item.quantity || 1),
          unitCost: Number(item.unitCost || 0),
          lineTotal: Number(item.quantity || 1) * Number(item.unitCost || 0),
        })),
      };

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Request Submitted",
        description: "Your request has successfully been submitted",
      });
    } catch (err: any) {
      console.error("API submission failed:", err);
      
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Submission Unsuccessful",
        description: err.data?.message || err.message || "There was an error submitting your request. Please check your connection and try again.",
      });
    }
  };

  const handleModalClose = () => {
    setStatusModal((prev) => ({ ...prev, isOpen: false }));
    if (statusModal.type === "success") {
      router.push("/project-request/purchase-request");
    }
  };

  return (
    <PageGuard module="project_request" entitlement="create">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="min-h-screen bg-[#F9FAFB] pb-28"
      >
      {/* Header Bar */}
      <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              Purchase Request
            </h1>
          </div>
          <WizardGuideButton moduleId="project-request" />
        </div>
      </header>

      {/* Main Form Fields */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Request Details Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-[#3B7CED] uppercase tracking-wider flex items-center gap-2">
            Request Details
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Request ID
              </Label>
              <Input
                value="Auto-generated"
                readOnly
                className="bg-gray-50 border-gray-200 text-gray-500 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Date
              </Label>
              <Input
                value={formattedDate}
                readOnly
                className="bg-gray-50 border-gray-200 text-gray-500 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Requested by
              </Label>
              <Input
                value={loggedInUserName}
                readOnly
                className="bg-gray-50 border-gray-200 text-gray-500 h-11"
              />
            </div>
          </div>
        </div>

        {/* Purchase Details Section */}
        <div data-wizard="pr-project-wbs-select" className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-[#3B7CED] uppercase tracking-wider flex items-center gap-2">
            Purchase Details
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Project
              </Label>
              <Select
                value={selectedProjectId}
                onValueChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedPhaseId("");
                  setSelectedTaskId("");
                  
                  const selectedProj = projects.find((p: any) => String(p.id) === val);
                  if (selectedProj && selectedProj.site_location) {
                    const siteLoc = selectedProj.site_location as any;
                    const locId = typeof siteLoc === "object" ? siteLoc.id : siteLoc;
                    const locName = typeof siteLoc === "object" ? siteLoc.name : String(siteLoc);
                    const locObj = activeLocations?.find(
                      (l: any) => String(l.id) === String(locId) || l.location_name?.toLowerCase() === (locName || "").toLowerCase()
                    );
                    setLocation(
                      locObj 
                        ? (locObj.location_name || String(locObj.id)) 
                        : (locName || String(locId || ""))
                    );
                  } else {
                    setLocation("");
                  }
                }}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:ring-[#3B7CED]/20 bg-white">
                  <SelectValue
                    placeholder="Select a project"
                    className="w-full"
                  />
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Site Location
              </Label>
              <Input
                type="text"
                placeholder="Enter site location e.g. Lagos Site"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 border-gray-200 focus:ring-[#3B7CED]/20 bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={!!selectedProjectId}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Required By Date
              </Label>
              <Input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="h-11 border-gray-200 focus:ring-[#3B7CED]/20"
              />
            </div>
          </div>
        </div>

        {/* WBS Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-[#3B7CED] uppercase tracking-wider flex items-center gap-2">
            {/* <span className="w-1.5 h-1.5 rounded-full bg-[#3B7CED]" /> */}
            WBS
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Phase
              </Label>
              <Select
                value={selectedPhaseId}
                onValueChange={(val) => {
                  setSelectedPhaseId(val);
                  setSelectedTaskId("");
                }}
                disabled={!selectedProjectId}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:ring-[#3B7CED]/20 bg-white disabled:bg-gray-50 disabled:text-gray-400 [&>span]:w-full">
                  <SelectValue placeholder="Select a phase" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {phases.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No phases available
                    </div>
                  ) : (
                    phases.map((ph: any) => {
                      const phaseBudget = ph.current_budget ?? ph.original_amount;
                      return (
                        <SelectItem
                          key={ph.id}
                          value={String(ph.id)}
                          className="py-2.5 cursor-pointer [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
                        >
                          <span className="flex items-center justify-between gap-3 w-full min-w-0">
                            <span className="font-medium text-gray-800 truncate min-w-0">
                              {ph.name}
                            </span>
                            {phaseBudget !== undefined && phaseBudget !== null && (
                              <span className="font-semibold text-xs text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-auto">
                                ₦{Number(phaseBudget).toLocaleString("en-NG", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Activity
              </Label>
              <Select
                value={selectedTaskId}
                onValueChange={setSelectedTaskId}
                disabled={!selectedPhaseId}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:ring-[#3B7CED]/20 bg-white disabled:bg-gray-50 disabled:text-gray-400 [&>span]:w-full">
                  <SelectValue placeholder="Select an activity" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {tasks.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No activities available
                    </div>
                  ) : (
                    tasks.map((t: any) => {
                      const taskBudget = t.available_budget ?? t.current_budget ?? t.original_amount;
                      return (
                        <SelectItem
                          key={t.id}
                          value={String(t.id)}
                          className="py-2.5 cursor-pointer [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
                        >
                          <span className="flex items-center justify-between gap-3 w-full min-w-0">
                            <span className="font-medium text-gray-800 truncate min-w-0">
                              {t.serial_number !== undefined && t.serial_number !== null
                                ? `${t.serial_number} - ${t.name}`
                                : t.name}
                            </span>
                            {taskBudget !== undefined && taskBudget !== null && (
                              <span className="font-semibold text-xs text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0 ml-auto">
                                ₦{Number(taskBudget).toLocaleString("en-NG", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

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

        {/* Product Line Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5">
          <div
            onClick={() => setIsProductLinesCollapsed(!isProductLinesCollapsed)}
            className="flex justify-between items-center cursor-pointer select-none"
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
              {items.map((item, index) => {
                if (item.isEditing) {
                  return (
                    <ItemEditForm
                      key={item.id}
                      item={item}
                      index={index}
                      allProducts={allProducts}
                      onSave={saveItem}
                      onDelete={deleteItem}
                      onUpdate={(patch) => {
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, ...patch } : it,
                          ),
                        );
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg bg-[#F8FAFC] relative space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-400">
                        Item {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editItem(item.id)}
                          className="p-1 rounded-md hover:bg-gray-200 transition-colors text-blue-500"
                          aria-label="Edit Item"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="p-1 rounded-md hover:bg-gray-200 transition-colors text-red-500"
                          aria-label="Delete Item"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-bold text-gray-900">
                        {item.productName}
                      </h3>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-800 font-medium">
                        {item.quantity} QTY
                      </span>
                      <span className="text-xs font-bold text-[#3B7CED]">
                        ₦
                        {(item.quantity * item.unitCost).toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-gray-500  mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Add Another Product Button */}
              <button
                type="button"
                onClick={addAnotherProduct}
                className="w-full h-12 border-2 border-dashed border-blue-200 hover:border-[#3B7CED] hover:bg-blue-50/20 text-[#3B7CED] rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} />
                Add Another Product
              </button>
            </div>
          )}
        </div>

        {/* Cost Summary Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-semibold text-gray-500">
              Available Budget
            </span>
            <span className="text-xs font-semibold text-gray-500">
              ₦
              {availableBudget.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-gray-100 pt-3">
            <span className="text-xs font-semibold text-gray-900">
              Total Cost
            </span>
            <span className="text-xs font-bold text-[#3B7CED]">
              ₦{totalCost.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold text-gray-700">
              Note
            </Label>
            <Textarea
              placeholder="Enter note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] border-gray-200 focus:ring-[#3B7CED]/20"
            />
          </div>
        </div>
      </main>

      {/* Floating Action Submit Button */}
      <div className="fixed bottom-0 left-16 right-0 bg-white border-t border-gray-100 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <Button
            data-wizard="pr-items-submit"
            onClick={handleSubmit}
            className="w-full h-12 text-sm font-bold flex items-center justify-center bg-[#3B7CED] hover:bg-[#2d63c7] text-white rounded-lg shadow-sm"
          >
            Submit request
          </Button>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={handleModalClose}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.description}
        actionText="Done"
        onAction={handleModalClose}
        showCloseButton={false}
      />
      <ModuleWizard moduleId="project-request" />
      </motion.div>
    </PageGuard>
  );
}

// Subcomponent for item editing form
function ItemEditForm({
  item,
  index,
  allProducts,
  onSave,
  onDelete,
  onUpdate,
}: {
  item: ItemState;
  index: number;
  allProducts: Array<{ id: string; name: string; standardCost?: number; description?: string }>;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (patch: Partial<ItemState>) => void;
}) {
  const [searchQuery, setSearchQuery] = useState(item.productName);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    return allProducts.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allProducts, searchQuery]);

  const exactMatch = useMemo(() => {
    return allProducts.some(
      (p) => p.name.toLowerCase() === searchQuery.toLowerCase(),
    );
  }, [allProducts, searchQuery]);

  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);

  const handleSelect = (name: string, id: string) => {
    const selectedProd = allProducts.find((p) => p.id === id || p.name.toLowerCase() === name.toLowerCase());
    onUpdate({
      productName: name,
      productId: id,
      ...(selectedProd?.standardCost ? { unitCost: selectedProd.standardCost } : {}),
      ...(selectedProd?.description ? { description: selectedProd.description } : {}),
      error: undefined,
    });
    setSearchQuery(name);
    setIsOpen(false);
  };

  const handleAddNew = (name: string) => {
    setIsCreateProductModalOpen(true);
    setIsOpen(false);
  };

  const handleProductCreated = (product: { id: string | number; name: string; standardCost?: string | number; description?: string }) => {
    onUpdate({ 
      productName: product.name, 
      productId: String(product.id), 
      ...(product.standardCost ? { unitCost: Number(product.standardCost) } : {}),
      ...(product.description ? { description: product.description } : {}),
      error: undefined 
    });
    setSearchQuery(product.name);
    setIsCreateProductModalOpen(false);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white relative space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-500">
          Item {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors text-red-500"
          aria-label="Remove Item"
        >
          <X size={16} />
        </button>
      </div>

      {/* Product Name Search Select */}
      <div className="space-y-1.5 relative" ref={dropdownRef}>
        <Label className="text-xs font-semibold text-gray-700">
          Product name
        </Label>
        <div className="relative">
          <input
            type="text"
            placeholder="Select a product"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onUpdate({ productName: e.target.value });
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className={`w-full h-11 px-3 pr-10 border rounded-lg text-sm bg-white focus:outline-none transition-all ${
              item.error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-gray-200 focus:border-[#3B7CED] focus:ring-1 focus:ring-[#3B7CED]"
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {item.error && (
          <p className="text-xs text-red-500 mt-1">{item.error}</p>
        )}

        {isOpen && (
          <div className="absolute top-full left-0 w-full z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1 py-1">
            {/* Filtered list */}
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleSelect(prod.name, prod.id)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {prod.name}
              </button>
            ))}

            {/* Add new option if no exact match */}
            {searchQuery.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => handleAddNew(searchQuery.trim())}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#2BA24D] hover:bg-green-50 transition-colors border-t border-gray-100"
              >
                + Add new: "{searchQuery.trim()}"
              </button>
            )}

            {filteredProducts.length === 0 && !searchQuery.trim() && (
              <div className="px-4 py-2.5 text-sm text-gray-400 text-center">
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quantity & Cost Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">
            Quantity
          </Label>
          <Input
            type="number"
            placeholder="Enter quantity"
            value={item.quantity || ""}
            onChange={(e) =>
              onUpdate({ quantity: Math.max(0, Number(e.target.value || 0)) })
            }
            className="h-11 border-gray-200 focus:ring-[#3B7CED]/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">
            Estimated unit cost
          </Label>
          <Input
            type="number"
            placeholder="Enter cost"
            value={item.unitCost || ""}
            onChange={(e) =>
              onUpdate({ unitCost: Math.max(0, Number(e.target.value || 0)) })
            }
            className="h-11 border-gray-200 focus:ring-[#3B7CED]/20"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          Description
        </Label>
        <Input
          placeholder="Enter descriptions"
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="h-11 border-gray-200 focus:ring-[#3B7CED]/20"
        />
      </div>

      {/* Done Button */}
      <button
        type="button"
        onClick={() => onSave(item.id)}
        className="w-full h-11 bg-[#2BA24D] hover:bg-[#238c41] text-white rounded-lg text-sm font-semibold flex items-center justify-center transition-colors mt-2"
      >
        Done
      </button>

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
        initialProductName={searchQuery.trim()}
        onSuccess={handleProductCreated}
      />
    </div>
  );
}
