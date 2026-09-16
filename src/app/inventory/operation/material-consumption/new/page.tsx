"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, AlertCircle, CheckCircle2, Trash2, Plus, Loader2 } from "lucide-react";
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
import { useCreateMaterialConsumptionMutation } from "@/api/requests/materialConsumptionRequestApi";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { StatusModal } from "@/components/shared/StatusModal";
import { PageGuard } from "@/components/auth/PageGuard";

// We'll assume these APIs exist based on the standard FastraSuite inventory modules
import { inventoryProductsApi } from "@/api/inventory/productsApi";
import { locationApi } from "@/api/inventory/locationApi";

export default function NewMaterialConsumptionPage() {
  const router = useRouter();
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  
  // Queries
  const { data: rawCostingProjects = [] } = useGetProjectCostingProjectsQuery({});
  const { data: activeLocations = [] } = locationApi.useGetActiveLocationsFilteredQuery();
  const { data: productsData = [] } = inventoryProductsApi.useGetInventoryProductsQuery({});

  // Parse arrays
  const locations = Array.isArray(activeLocations) ? activeLocations : (activeLocations as any).results || [];
  const products = Array.isArray(productsData) ? productsData : (productsData as any).results || [];

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
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [dateConsumed, setDateConsumed] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Product Lines State
  const [lines, setLines] = useState<any[]>([
    { id: Date.now().toString(), product: "", quantity: "", unit_cost: "", total_cost: 0 }
  ]);

  // Modals state: "above_budget" | "unsuccessful" | "submitted" | null
  const [modalType, setModalType] = useState<"above_budget" | "unsuccessful" | "submitted" | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch full project detail for WBS cascade
  const { data: costingProjectDetail } = useGetProjectCostingProjectQuery(
    Number(selectedProjectId),
    { skip: !selectedProjectId || isNaN(Number(selectedProjectId)) },
  );

  // Build a flat WBS list from either .wbs or .phases[].activities structure
  const wbsList = useMemo(() => {
    const proj: any = costingProjectDetail || projects.find((p: any) => String(p.id) === selectedProjectId);
    if (!proj) return [];
    if (Array.isArray(proj.wbs) && proj.wbs.length > 0) return proj.wbs;
    const items: any[] = [];
    const phasesArr = Array.isArray(proj.phases)
      ? proj.phases
      : Array.isArray(proj.phase_list) ? proj.phase_list : [];
    phasesArr.forEach((ph: any, pi: number) => {
      const phId = ph.id || ph.phase_id || `phase-${pi + 1}`;
      const phName = ph.name || ph.phase_name || `Phase ${pi + 1}`;
      items.push({ id: phId, name: phName, is_activity: false });
      const acts = Array.isArray(ph.activities) ? ph.activities
        : Array.isArray(ph.activity_list) ? ph.activity_list : [];
      acts.forEach((act: any, ai: number) => {
        items.push({
          ...act,
          id: act.id || act.activity_id || `act-${phId}-${ai + 1}`,
          name: act.name || act.activity_name || `Activity ${ai + 1}`,
          is_activity: true,
          parent: phId,
        });
      });
    });
    return items;
  }, [costingProjectDetail, projects, selectedProjectId]);

  const phases = useMemo(() => wbsList.filter((w: any) => !w.is_activity), [wbsList]);
  const tasks = useMemo(() => {
    if (!selectedPhaseId) return [];
    return wbsList.filter((w: any) => w.is_activity && String(w.parent) === String(selectedPhaseId));
  }, [wbsList, selectedPhaseId]);

  const selectedActivity = useMemo(() => tasks.find((t: any) => String(t.id) === selectedTaskId), [tasks, selectedTaskId]);
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
    availableBudget = selectedActivity.available_budget !== undefined && selectedActivity.available_budget !== null
      ? Number(selectedActivity.available_budget)
      : selectedActivity.remaining_budget !== undefined && selectedActivity.remaining_budget !== null
      ? Number(selectedActivity.remaining_budget)
      : selectedActivity.amount !== undefined && selectedActivity.amount !== null
      ? Number(selectedActivity.amount)
      : budgetData?.available_budget !== undefined && budgetData?.available_budget !== null
      ? Number(budgetData.available_budget)
      : 0;
  } else {
    availableBudget = budgetData?.available_budget ? Number(budgetData.available_budget) : 0;
  }

  // Calculate total required cost from all lines
  const totalCost = lines.reduce((acc, line) => {
    const qtyNum = Number(line.quantity || 0);
    const costNum = Number(line.unit_cost || 0);
    return acc + (qtyNum * costNum);
  }, 0);

  // Line Handlers
  const addLine = () => {
    setLines([...lines, { id: Date.now().toString(), product: "", quantity: "", unit_cost: "", total_cost: 0 }]);
  };

  const removeLine = (id: string) => {
    if (lines.length === 1) return; // Keep at least one line
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        const newLine = { ...l, [field]: value };
        if (field === "product") {
          // Auto-fill standard cost if available
          const product = products.find((p: any) => String(p.id) === String(value));
          if (product && product.standard_cost) {
            newLine.unit_cost = product.standard_cost;
          }
        }
        newLine.total_cost = Number(newLine.quantity || 0) * Number(newLine.unit_cost || 0);
        return newLine;
      }
      return l;
    }));
  };

  // Handle Form Submission
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validation
    if (!selectedProjectId) return setValidationError("Please select a project.");
    if (!selectedPhaseId) return setValidationError("Please select a WBS phase.");
    if (!selectedTaskId) return setValidationError("Please select a WBS activity.");
    if (!selectedLocationId) return setValidationError("Please select a location.");
    if (!dateConsumed) return setValidationError("Please select a consumption date.");
    
    // Validate Lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.product) return setValidationError(`Please select a product for line ${i + 1}.`);
      if (!line.quantity || Number(line.quantity) <= 0) return setValidationError(`Please enter a valid quantity for line ${i + 1}.`);
      if (!line.unit_cost || Number(line.unit_cost) <= 0) return setValidationError(`Please enter a valid unit cost for line ${i + 1}.`);
    }

    // Check budget limit
    if (totalCost > availableBudget) {
      setModalType("above_budget");
    } else {
      executeSubmission();
    }
  };

  const [createRequest, { isLoading: isCreating }] = useCreateMaterialConsumptionMutation();

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
      const payload = {
        project: Number(selectedProjectId),
        activity: ensureValidUUID(selectedTaskId),
        location: String(selectedLocationId),
        date_consumed: dateConsumed,
        notes: notes,
        lines: lines.map(l => ({
          product: Number(l.product),
          quantity: Number(l.quantity),
          unit_cost: String(l.unit_cost),
          total_cost: String(Number(l.quantity) * Number(l.unit_cost))
        }))
      };

      // Call API
      await createRequest(payload).unwrap();
      setModalType("submitted");
    } catch (error: any) {
      console.error("API submission failed:", error);
      let errMsg = "Your request submission was unsuccessful. Please check your data and try again.";
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

  return (
    <PageGuard application="inventory" module="materialconsumption">
      <div className="min-h-screen bg-[#F9FAFB] pb-28">
      {/* Header Bar */}
      <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30 shadow-none">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/inventory/operation/material-consumption")}
              className="p-1 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">New Material Consumption</h1>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Request Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
          <h2 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
            Requisition Details
          </h2>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-600 mb-1.5 block">Project</Label>
              <Select value={selectedProjectId} onValueChange={(val) => {
                setSelectedProjectId(val);
                setSelectedPhaseId("");
                setSelectedTaskId("");
                
                // Pre-fill location
                const proj = projects.find((p: any) => String(p.id) === val);
                if (proj) {
                  const locIdentifier = proj.site_location || proj.location;
                  if (locIdentifier) {
                    const matchedLoc = locations.find((l: any) => 
                      String(l.id) === String(locIdentifier) || 
                      l.location_name === locIdentifier || 
                      l.name === locIdentifier
                    );
                    if (matchedLoc) {
                      setSelectedLocationId(String(matchedLoc.id));
                    } else {
                      setSelectedLocationId(String(locIdentifier));
                    }
                  } else {
                    setSelectedLocationId("");
                  }
                } else {
                  setSelectedLocationId("");
                }
              }}>
                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.project_code ? `(${p.project_code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600 mb-1.5 block">WBS Phase</Label>
                <Select value={selectedPhaseId} onValueChange={(val) => {
                  setSelectedPhaseId(val);
                  setSelectedTaskId("");
                }} disabled={!selectedProjectId}>
                  <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                    <SelectValue placeholder="Select Phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((ph: any) => (
                      <SelectItem key={ph.id} value={String(ph.id)}>
                        {ph.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-600 mb-1.5 block">WBS Activity</Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={!selectedPhaseId}>
                  <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                    <SelectValue placeholder="Select Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600 mb-1.5 block">Target Location / Warehouse</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.location_name || loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-600 mb-1.5 block">Date Consumed</Label>
                <Input
                  type="date"
                  value={dateConsumed}
                  onChange={(e) => setDateConsumed(e.target.value)}
                  className="bg-gray-50/50 border-gray-200"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-600 mb-1.5 block">Justification Notes</Label>
              <Textarea
                placeholder="Enter reason for material consumption..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-gray-50/50 border-gray-200 min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Material Lines */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
              Material Lines
            </h2>
            <Button variant="outline" size="sm" onClick={addLine} className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={line.id} className="p-4 rounded border border-gray-100 bg-gray-50/30 relative">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Line {index + 1}</h3>
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(line.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <Label className="text-gray-600 mb-1 block text-xs">Product</Label>
                    <Select value={line.product} onValueChange={(val) => updateLine(line.id, "product", val)}>
                      <SelectTrigger className="w-full bg-white border-gray-200 h-9">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.product_name || p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-gray-600 mb-1 block text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="0.001"
                      step="any"
                      placeholder="Quantity"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, "quantity", e.target.value)}
                      className="bg-white border-gray-200 h-9"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Label className="text-gray-600 mb-1 block text-xs">Unit Cost (₦)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={line.unit_cost}
                      onChange={(e) => updateLine(line.id, "unit_cost", e.target.value)}
                      className="bg-white border-gray-200 h-9"
                    />
                  </div>
                </div>
                
                <div className="mt-3 text-right">
                  <span className="text-xs text-gray-500 mr-2">Line Total:</span>
                  <span className="text-sm font-bold text-[#32325D]">
                    ₦{(Number(line.quantity || 0) * Number(line.unit_cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Verification */}
        {selectedTaskId && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-none space-y-4">
            <h2 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
              Budget Verification
            </h2>

            <div className={`p-4 rounded-lg flex items-start gap-3 ${totalCost > availableBudget ? "bg-red-50 border border-red-100" : "bg-green-50/50 border border-green-100"}`}>
              {totalCost > availableBudget ? (
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              ) : (
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
              )}
              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-1">
                  <h3 className={`font-semibold ${totalCost > availableBudget ? "text-red-800" : "text-green-800"}`}>
                    {totalCost > availableBudget ? "Budget Exceeded" : "Within Budget"}
                  </h3>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Available Amount</p>
                    <p className="font-bold text-gray-800">
                      ₦{availableBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalCost > availableBudget ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{
                      width: availableBudget > 0 ? `${Math.min((totalCost / availableBudget) * 100, 100)}%` : "100%",
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-600">
                    Total Consumed: <strong className="text-gray-900">₦{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </p>
                  {totalCost > availableBudget && (
                    <p className="text-xs font-bold text-red-600">
                      Variance: +₦{(totalCost - availableBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50"
            onClick={() => router.push("/inventory/operation/material-consumption")}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            className="flex-[2] bg-[#3B7CED] hover:bg-[#3B7CED]/90 text-white"
            onClick={handleFormSubmit}
            disabled={isCreating || !selectedTaskId}
          >
            {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isCreating ? "Saving Draft..." : "Save Draft Requisition"}
          </Button>
        </div>
      </div>

      {/* Validations Modal */}
      <StatusModal
        isOpen={!!validationError}
        onClose={() => setValidationError(null)}
        title="Incomplete Details"
        message={validationError || ""}
        type="error"
      />

      {/* Submissions & Overrun Modals */}
      <StatusModal
        isOpen={modalType === "submitted"}
        onClose={() => {
          setModalType(null);
          router.push("/inventory/operation/material-consumption");
        }}
        title="Requisition Created!"
        message="Your Material Consumption request has been saved as a draft."
        type="success"
        actionText="View All Requisitions"
        onAction={() => {
          setModalType(null);
          router.push("/inventory/operation/material-consumption");
        }}
      />

      <StatusModal
        isOpen={modalType === "unsuccessful"}
        onClose={() => setModalType(null)}
        title="Creation Failed"
        message={apiError || "Your request could not be processed at this time."}
        type="error"
      />

      {modalType === "above_budget" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="mb-4 text-red-500">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Budget Overrun</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This request exceeds the available budget by{" "}
              <strong className="text-red-600">
                ₦{(totalCost - availableBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
              . You may save it as a draft, but submitting it will trigger the over-budget workflow requiring additional approvals.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModalType(null)}
                disabled={isCreating}
              >
                Go Back
              </Button>
              <Button
                className="flex-1 bg-[#3B7CED] hover:bg-[#3B7CED]/90 text-white"
                onClick={executeSubmission}
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      </div>
    </PageGuard>
  );
}
