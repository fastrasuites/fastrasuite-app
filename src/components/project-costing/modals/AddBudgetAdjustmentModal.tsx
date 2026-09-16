import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, AlertTriangle, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { 
  useCreateBudgetAdjustmentMutation,
  useGetProjectSettingsQuery,
  useUpdateProjectSettingsMutation 
} from "@/api/projectCostingApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project?: any;
}

interface AdjustmentLine {
  id: string;
  adjustment_type: "EXISTING" | "NEW";
  activityId?: string;
  activityName: string;
  wbsCode?: string;
  phaseId?: string;
  phaseName: string;
  direction: "INCREASE" | "DECREASE";
  currentAmount?: number;
  quantity: number;
  rate: number;
  amount: number;
  reason?: string;
}

export function AddBudgetAdjustmentModal({ isOpen, onClose, project }: Props) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  
  // Modals & API
  const statusModal = useStatusModal();
  const [createBudgetAdjustment, { isLoading: isSubmitting }] = useCreateBudgetAdjustmentMutation();
  
  // Project settings query & mutation
  const { data: projectSettings, refetch: refetchSettings } = useGetProjectSettingsQuery(
    project?.id,
    { skip: !project?.id || !isOpen }
  );
  const [updateProjectSettings, { isLoading: isUpdatingSettings }] = useUpdateProjectSettingsMutation();

  // State for lines
  const [adjustmentLines, setAdjustmentLines] = useState<AdjustmentLine[]>([]);
  
  // Form State
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedPhaseForNew, setSelectedPhaseForNew] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [direction, setDirection] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [reason, setReason] = useState("");
  const [newActivityName, setNewActivityName] = useState("");
  const [overallReason, setOverallReason] = useState("");

  const allowBudgetDecrease = projectSettings?.allow_budget_decrease ?? project?.allow_budget_decrease ?? true;

  // Parse phases and structure activities by Phase
  const phasesList: { id: string; name: string; activities: any[] }[] = [];
  const allActivities: any[] = [];
  let phasesTotalSum = 0;

  if (project?.phases) {
    try {
      const phasesArr = typeof project.phases === 'string' ? JSON.parse(project.phases) : project.phases;
      if (Array.isArray(phasesArr)) {
        phasesArr.forEach((phase: any, pIndex: number) => {
          const pName = phase.name || `Phase ${pIndex + 1}`;
          const phaseId = String(phase.id || phase.uuid || `phase-${pIndex}`);
          const phaseObj = {
            id: phaseId,
            name: pName,
            activities: [] as any[],
          };
          if (phase.activities && Array.isArray(phase.activities)) {
            phase.activities.forEach((act: any, aIndex: number) => {
              const actAmt = Number(
                act.amount !== undefined
                  ? act.amount
                  : act.budget !== undefined
                  ? act.budget
                  : Number(act.quantity || 1) * Number(act.rate || 0)
              );
              phasesTotalSum += actAmt;
              const actObj = {
                activity_id: String(act.id || act.uuid || `${phaseObj.id}-act-${aIndex}`),
                activity_name: act.name || `Activity ${aIndex + 1}`,
                wbs_code: act.serial_number
                  ? `ACT-${act.serial_number}`
                  : act.sn
                  ? `S/N ${act.sn}`
                  : `Act ${aIndex + 1}`,
                phase_id: phaseId,
                phase_name: pName,
                amount: actAmt,
                budget: actAmt,
              };
              phaseObj.activities.push(actObj);
              allActivities.push(actObj);
            });
          }
          phasesList.push(phaseObj);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  let rawBudgetNum = 0;
  let originalBudgetNum = 0;
  if (project?.financials) {
    try {
      const fin = typeof project.financials === 'string' ? JSON.parse(project.financials) : project.financials;
      rawBudgetNum = Number(fin?.budget || 0);
      originalBudgetNum = Number(fin?.original_budget || fin?.budget || 0);
    } catch (e) {
      console.error(e);
    }
  }

  const budgetNum = rawBudgetNum > 0 ? rawBudgetNum : (phasesTotalSum > 0 ? phasesTotalSum : Number(project?.budget || project?.total_budget || 0));
  const origBudgetNum = originalBudgetNum > 0 ? originalBudgetNum : (phasesTotalSum > 0 ? phasesTotalSum : Number(project?.budget || project?.total_budget || 0));
  const currentBudgetNum = budgetNum;
  const totalStagedAdjustment = adjustmentLines.reduce((acc, line) => acc + (line.direction === "DECREASE" ? -line.amount : line.amount), 0);
  const proposedTotalBudget = budgetNum + totalStagedAdjustment;

  const selectedActivityObj = allActivities.find(
    (a) => String(a.activity_id) === String(selectedActivity)
  );

  const handleEnableBudgetDecrease = async () => {
    try {
      await updateProjectSettings({
        id: project.id,
        body: { allow_budget_decrease: true }
      }).unwrap();
      refetchSettings();
      statusModal.showSuccess("Settings Updated", "Budget decrease is now enabled for this project.");
    } catch (err) {
      console.error("Failed to update project settings", err);
      statusModal.showError("Update Failed", "Failed to update project settings. Please try again.");
    }
  };

  const addLine = () => {
    const qNum = Number(quantity) || 1;
    const rNum = Number(rate) || 0;
    let amtNum = Number(amountInput);
    if (!amtNum || isNaN(amtNum)) {
      amtNum = qNum * rNum;
    }

    if (amtNum <= 0) {
      statusModal.showError("Validation Error", "Amount or Quantity * Rate must be greater than 0.");
      return;
    }

    let actName = "";
    let actId = undefined;
    let phName = "";
    let phId = undefined;
    let currAmt = undefined;
    let wbsCode = undefined;

    if (activeTab === "existing") {
      if (!selectedActivity) {
        statusModal.showError("Validation Error", "Please select an activity to adjust.");
        return;
      }
      if (!selectedActivityObj) return;

      actName = selectedActivityObj.activity_name;
      actId = selectedActivityObj.activity_id;
      phName = selectedActivityObj.phase_name;
      phId = selectedActivityObj.phase_id;
      currAmt = selectedActivityObj.amount;
      wbsCode = selectedActivityObj.wbs_code;

      if (direction === "DECREASE" && amtNum > (currAmt || 0)) {
        statusModal.showError(
          "Invalid Decrease Amount",
          `Decrease amount (₦${amtNum.toLocaleString()}) cannot exceed current activity budget (₦${(currAmt || 0).toLocaleString()}).`
        );
        return;
      }
    } else {
      if (!newActivityName.trim()) {
        statusModal.showError("Validation Error", "Please enter a name for the new activity.");
        return;
      }
      const targetPhase = phasesList.find((p) => p.id === selectedPhaseForNew) || phasesList[0];
      if (!targetPhase) {
        statusModal.showError("Validation Error", "No phase available to attach activity to.");
        return;
      }
      actName = newActivityName.trim();
      phName = targetPhase.name;
      phId = targetPhase.id;
    }

    const newLine: AdjustmentLine = {
      id: Math.random().toString(36).substr(2, 9),
      adjustment_type: activeTab === "existing" ? "EXISTING" : "NEW",
      activityId: actId,
      activityName: actName,
      wbsCode,
      phaseId: phId,
      phaseName: phName,
      direction,
      currentAmount: currAmt,
      quantity: qNum,
      rate: rNum,
      amount: amtNum,
      reason: reason.trim() || undefined,
    };

    setAdjustmentLines([...adjustmentLines, newLine]);
    
    // Reset form
    setQuantity("1");
    setRate("");
    setAmountInput("");
    setReason("");
    setNewActivityName("");
    setSelectedActivity("");
  };

  const removeLine = (id: string) => {
    setAdjustmentLines(adjustmentLines.filter((l) => l.id !== id));
  };

  const handleSubmit = async () => {
    if (adjustmentLines.length === 0) {
      statusModal.showError("Validation Error", "Please add at least one adjustment line before submitting.");
      return;
    }

    const hasDecrease = adjustmentLines.some((l) => l.direction === "DECREASE");
    if (hasDecrease && !allowBudgetDecrease) {
      statusModal.showError(
        "Budget Decrease Restricted",
        "Budget decrease is disabled in project settings (allow_budget_decrease: false). Please enable it in project settings first."
      );
      return;
    }
    
    const topReason = overallReason.trim() || adjustmentLines.map((l) => l.reason).filter(Boolean)[0] || "Budget adjustment request";
    
    try {
      const payload = {
        reason: topReason,
        lines: adjustmentLines.map((line) => {
          if (line.adjustment_type === "EXISTING") {
            return {
              adjustment_type: "EXISTING",
              activity: line.activityId,
              direction: line.direction,
              quantity: line.quantity,
              rate: line.rate,
            };
          } else {
            return {
              adjustment_type: "NEW",
              phase: line.phaseId,
              activity_name: line.activityName,
              direction: line.direction,
              quantity: line.quantity,
              rate: line.rate,
            };
          }
        }),
      };

      await createBudgetAdjustment({
        id: project.id,
        body: payload,
      }).unwrap();

      statusModal.showSuccess(
        "Action Successful",
        `Successfully submitted budget adjustment request with ${adjustmentLines.length} line(s).`
      );
      
      setAdjustmentLines([]);
      setOverallReason("");
    } catch (error: any) {
      console.error("Failed to create budget adjustment:", error);
      let errorMsg = "Failed to submit budget adjustments. Please check your data and try again.";
      if (error?.data?.detail) {
        errorMsg = error.data.detail;
      } else if (error?.data?.message) {
        errorMsg = error.data.message;
      } else if (error?.data?.error) {
        errorMsg = typeof error.data.error === "string" ? error.data.error : JSON.stringify(error.data.error);
      }
      statusModal.showError("Submission Failed", errorMsg);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white rounded-xl shadow-xl font-['Open_Sans',sans-serif] font-open-sans">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight font-['Open_Sans',sans-serif] font-open-sans">
              Create Budget Adjustment
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1 leading-normal font-['Open_Sans',sans-serif]">
              Create a structured budget adjustment request. All changes require approval before becoming active.
            </p>
          </DialogHeader>

          <div className="px-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto pb-6 font-['Open_Sans',sans-serif] font-open-sans">
            {/* Budget Summary */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-900">Budget Summary</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Original Approved Budget</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">₦{origBudgetNum.toLocaleString()}</p>
                    <span className="text-[11px] text-gray-400 font-normal px-2.5 py-0.5 rounded-full border border-gray-200 bg-white">
                      Locked
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Current Approved Budget</p>
                  <p className="text-2xl font-semibold text-gray-900 tracking-tight">₦{currentBudgetNum.toLocaleString()}</p>
                </div>
              </div>

              {/* Reason for Adjustment */}
              <div className="mt-1">
                <label className="text-xs font-semibold text-gray-900 block mb-1.5">Reason for Adjustment</label>
                <Input
                  placeholder="Enter reason"
                  value={overallReason}
                  onChange={(e) => setOverallReason(e.target.value)}
                  className="h-10 border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500 font-['Open_Sans',sans-serif]"
                />
              </div>
            </div>

            {/* Add Adjustment Lines Card */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white flex flex-col gap-4 font-['Open_Sans',sans-serif]">
              <h4 className="text-base font-semibold text-gray-900">Add Adjustment Lines</h4>
              
              {/* Tabs */}
              <div className="flex border-b border-gray-100 gap-4">
                <button
                  type="button"
                  className={`pb-2 text-sm font-medium transition-colors relative ${
                    activeTab === "existing" 
                      ? "border-b-2 border-[#3B82F6] text-[#3B82F6] font-semibold -mb-[1px]" 
                      : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                  onClick={() => { setActiveTab("existing"); setSelectedActivity(""); setNewActivityName(""); }}
                >
                  Adjust Existing Activities
                </button>
                <button
                  type="button"
                  className={`pb-2 text-sm font-medium transition-colors relative ${
                    activeTab === "new" 
                      ? "border-b-2 border-[#3B82F6] text-[#3B82F6] font-semibold -mb-[1px]" 
                      : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                  onClick={() => { setActiveTab("new"); setSelectedActivity(""); setNewActivityName(""); }}
                >
                  Add New Activity
                </button>
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-4">
                {activeTab === "existing" ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-900">WBS Activity</label>
                    <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                      <SelectTrigger className="w-full text-gray-800 h-10 border-gray-300 rounded-md text-sm font-['Open_Sans',sans-serif]">
                        <SelectValue placeholder="Enter name" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] font-['Open_Sans',sans-serif] font-open-sans">
                        {phasesList.length > 0 ? (
                          phasesList.map((p) => (
                            <SelectGroup key={p.id}>
                              <SelectLabel className="text-[#3B7CED] font-bold text-xs uppercase px-2 py-1.5 bg-blue-50/80 rounded my-1 flex items-center justify-between font-['Open_Sans',sans-serif]">
                                <span>Phase: {p.name}</span>
                                <span className="text-gray-700 font-semibold normal-case text-xs">
                                  Total: ₦{p.activities.reduce((s: number, a: any) => s + (a.amount || 0), 0).toLocaleString()}
                                </span>
                              </SelectLabel>
                              {p.activities.map((act) => (
                                <SelectItem key={act.activity_id} value={act.activity_id} className="py-2.5 font-['Open_Sans',sans-serif]">
                                  <div className="flex items-center justify-between gap-6 w-full">
                                    <span className="font-medium text-gray-800">{act.activity_name}</span>
                                    <span className="font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 shrink-0">
                                      ₦{Number(act.amount || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No activities available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Connected Phase & Current Amount Banner */}
                    {selectedActivityObj && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50/60 border border-blue-100 rounded-md text-xs mt-0.5 font-['Open_Sans',sans-serif]">
                        <div className="flex items-center gap-1.5 text-[#3B7CED]">
                          <span className="font-semibold uppercase tracking-wider text-[11px]">Phase:</span>
                          <span className="font-medium text-gray-800">{selectedActivityObj.phase_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="text-[11px]">Current Budget:</span>
                          <span className="font-bold text-xs text-gray-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                            ₦{Number(selectedActivityObj.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-900">Target Phase</label>
                      <Select value={selectedPhaseForNew} onValueChange={setSelectedPhaseForNew}>
                        <SelectTrigger className="w-full text-gray-800 h-10 border-gray-300 rounded-md text-sm font-['Open_Sans',sans-serif]">
                          <SelectValue placeholder={phasesList[0]?.name ? `Phase: ${phasesList[0].name}` : "Select target phase"} />
                        </SelectTrigger>
                        <SelectContent className="font-['Open_Sans',sans-serif] font-open-sans">
                          {phasesList.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="font-['Open_Sans',sans-serif]">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-900">Activity Name</label>
                      <Input
                        placeholder="Enter name"
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        className="h-10 border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Budget Change Direction */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-900">Budget Change Direction</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDirection("INCREASE")}
                      className={`flex items-center justify-center gap-2 h-11 px-4 rounded-md border text-sm transition-all ${
                        direction === "INCREASE"
                          ? "border-gray-800 bg-white text-gray-900 font-semibold shadow-2xs"
                          : "border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Increase Budget</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("DECREASE")}
                      className={`flex items-center justify-center gap-2 h-11 px-4 rounded-md border text-sm transition-all ${
                        direction === "DECREASE"
                          ? "border-gray-800 bg-white text-gray-900 font-semibold shadow-2xs"
                          : "border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50"
                      }`}
                    >
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span>Decrease Budget</span>
                    </button>
                  </div>
                  
                  {/* Warning if decrease is chosen but allow_budget_decrease is false */}
                  {direction === "DECREASE" && !allowBudgetDecrease && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Budget decrease is currently disabled</span> for this project in Project Settings.
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        disabled={isUpdatingSettings}
                        onClick={handleEnableBudgetDecrease} 
                        className="text-xs h-7 px-2.5 bg-white border-amber-300 text-amber-900 hover:bg-amber-100 font-medium shrink-0"
                      >
                        {isUpdatingSettings ? "Enabling..." : "Enable in Settings"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Adjustment Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-900">Adjustment Amount</label>
                  <Input 
                    placeholder="Enter Amount" 
                    type="number" 
                    value={amountInput} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setAmountInput(val);
                      const q = Number(quantity) || 1;
                      if (val && !isNaN(Number(val))) {
                        setRate(String(Number(val) / q));
                      } else {
                        setRate("");
                      }
                    }} 
                    className="h-10 border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                {/* Unit breakdown: Quantity & Rate (Required for backend calculations & submissions) */}
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">Quantity</label>
                    <Input 
                      placeholder="1" 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuantity(val);
                        const q = Number(val) || 1;
                        if (rate) {
                          setAmountInput(String(q * Number(rate)));
                        } else if (amountInput) {
                          setRate(String(Number(amountInput) / q));
                        }
                      }} 
                      className="h-9 border-gray-200 text-xs rounded-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">Rate / Unit Cost (₦)</label>
                    <Input 
                      placeholder="Rate" 
                      type="number" 
                      value={rate} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setRate(val);
                        const q = Number(quantity) || 1;
                        if (val) {
                          setAmountInput(String(q * Number(val)));
                        }
                      }} 
                      className="h-9 border-gray-200 text-xs rounded-md"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addLine}
                  className="w-full h-10 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium text-sm rounded-md flex items-center justify-center gap-2 mt-1 transition-colors shadow-none"
                >
                  <Plus className="h-4 w-4" /> Add Adjustment
                </Button>
              </div>
            </div>
            
            {/* Added Lines Summary */}
            {adjustmentLines.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-base font-semibold text-gray-900">Adjustment Lines</h4>
                <div className="flex flex-col gap-3">
                  {adjustmentLines.map((line) => (
                    <div
                      key={line.id}
                      className="border border-gray-200 rounded-lg p-3.5 bg-white flex flex-col gap-1.5 transition-shadow hover:shadow-2xs"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{line.phaseName}</span>
                          <span className="text-[11px] text-gray-400 font-normal px-2.5 py-0.5 rounded-full border border-gray-200 bg-white">
                            {line.adjustment_type === "NEW" ? "New Activity" : "Existing Activity"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove line"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex items-center gap-2.5">
                          {line.wbsCode && (
                            <span className="font-mono text-gray-600 font-medium">{line.wbsCode}</span>
                          )}
                          <span>{line.activityName}</span>
                          {line.quantity && line.quantity > 1 ? (
                            <span className="text-gray-400">• Qty: {line.quantity}</span>
                          ) : null}
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            line.direction === "INCREASE" ? "text-[#10B981]" : "text-[#EF4444]"
                          }`}
                        >
                          {line.direction === "INCREASE" ? "+" : "-"}₦{line.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Action: Submit for approval */}
            <div className="flex justify-end pt-2 pb-1">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || adjustmentLines.length === 0}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 h-10 font-medium text-sm rounded-md transition-colors shadow-none"
              >
                {isSubmitting ? "Submitting..." : "Submit for approval"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => {
          statusModal.close();
          if (statusModal.type === "success") {
            onClose(); // Close the budget modal as well if successful
          }
        }}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        actionText={statusModal.type === "success" ? "Done" : "Try again"}
      />
    </>
  );
}
