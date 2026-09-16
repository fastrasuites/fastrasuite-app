import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Maximize2, Minimize2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phase, Activity } from "../types";
import { WBSPhaseRow } from "./WBSPhaseRow";

const generateId = () => Math.random().toString(36).substr(2, 9);

interface WBSTableProps {
  phases: Phase[];
  setPhases: React.Dispatch<React.SetStateAction<Phase[]>>;
  extraColumns: string[];
  setExtraColumns: React.Dispatch<React.SetStateAction<string[]>>;
}

export function WBSTable({
  phases,
  setPhases,
  extraColumns,
  setExtraColumns,
}: WBSTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newColName, setNewColName] = useState("");

  const filteredExtraColumns = useMemo(() => {
    const standardLower = new Set([
      "sn",
      "s/n",
      "s_n",
      "serial",
      "serial number",
      "serial_number",
      "serial no",
      "serial_no",
      "phase",
      "phase name",
      "phase_name",
      "activity",
      "activity name",
      "name",
      "quantity",
      "qty",
      "rate",
      "unit rate",
      "amount",
      "budget",
      "total amount",
    ]);
    return extraColumns.filter((c) => !standardLower.has(c.toLowerCase().trim()));
  }, [extraColumns]);

  // Compute total budget
  const totalBudget = useMemo(() => {
    let total = 0;
    phases.forEach((p) => {
      p.activities.forEach((a) => (total += a.budget || 0));
    });
    return total;
  }, [phases]);

  // Count total activities
  const totalActivities = useMemo(() => {
    return phases.reduce((sum, p) => sum + p.activities.length, 0);
  }, [phases]);

  // Helper to get Phase Budget
  const getPhaseBudget = (phase: Phase) => {
    return phase.activities.reduce((sum, a) => sum + (a.budget || 0), 0);
  };

  // --- Handlers ---
  const addPhase = () => {
    const newPhase: Phase = {
      id: generateId(),
      name: `Phase ${phases.length + 1}`,
      activities: [],
    };
    setPhases([...phases, newPhase]);
  };

  const addPhaseActivity = (phaseId: string) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id === phaseId) {
          const nextSn = `${p.activities.length + 1}`;
          return {
            ...p,
            activities: [
              ...p.activities,
              {
                id: generateId(),
                sn: nextSn,
                name: `Activity ${nextSn}`,
                budget: 0,
                quantity: 1,
                rate: 0,
              },
            ],
          };
        }
        return p;
      }),
    );
  };

  const updatePhaseName = (phaseId: string, name: string) => {
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, name } : p)),
    );
  };

  const updateActivity = (
    phaseId: string,
    activityId: string,
    updates: Partial<Activity>,
  ) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id === phaseId) {
          return {
            ...p,
            activities: p.activities.map((a) =>
              a.id === activityId ? { ...a, ...updates } : a,
            ),
          };
        }
        return p;
      }),
    );
  };

  const removeActivity = (phaseId: string, activityId: string) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id === phaseId) {
          return {
            ...p,
            activities: p.activities.filter((a) => a.id !== activityId),
          };
        }
        return p;
      }),
    );
  };

  const removePhase = (phaseId: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== phaseId));
  };

  const handleAddColumn = () => {
    const clean = newColName.trim();
    if (!clean) return;
    const lowerClean = clean.toLowerCase();
    if (
      [
        "sn",
        "s/n",
        "phase",
        "activity",
        "quantity",
        "rate",
        "amount",
        "budget",
      ].includes(lowerClean)
    ) {
      alert("Cannot add a mandatory column name.");
      return;
    }
    if (extraColumns.includes(clean)) {
      alert("Column already exists.");
      return;
    }
    setExtraColumns([...extraColumns, clean]);
    setNewColName("");
  };

  const handleDeleteColumn = (colName: string) => {
    setExtraColumns(extraColumns.filter((c) => c !== colName));
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        activities: p.activities.map((a) => {
          const copy = { ...a };
          delete copy[colName];
          return copy;
        }),
      })),
    );
  };

  const tableContent = (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="New Column Header"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            className="h-9 w-48 bg-white border-gray-300 focus-visible:ring-[#3B7CED]"
          />
          <Button
            type="button"
            onClick={handleAddColumn}
            className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 flex items-center gap-1.5 font-medium"
          >
            <Plus className="w-4 h-4" /> Add Column
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <Table className="min-w-[1100px] table-fixed">
          <colgroup>
            <col className="w-[120px]" />
            <col className="min-w-[300px]" />
            <col className="w-[100px]" />
            <col className="w-[130px]" />
            <col className="w-[140px]" />
            {filteredExtraColumns.map((col) => (
              <col key={col} className="min-w-[150px]" />
            ))}
            <col className="w-[80px]" />
          </colgroup>
          <TableHeader className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20 shadow-xs">
            <TableRow className="hover:bg-gray-50 border-0 bg-gray-50">
              <TableHead className="font-semibold text-gray-600 py-3 pl-4 text-left sticky top-0 bg-gray-50 z-20">
                S/N
              </TableHead>
              <TableHead className="font-semibold text-gray-600 py-3 sticky top-0 bg-gray-50 z-20">
                Activity
              </TableHead>
              <TableHead className="font-semibold text-gray-600 py-3 sticky top-0 bg-gray-50 z-20">
                Quantity
              </TableHead>
              <TableHead className="font-semibold text-gray-600 py-3 sticky top-0 bg-gray-50 z-20">
                Rate
              </TableHead>
              <TableHead className="font-semibold text-gray-600 py-3 sticky top-0 bg-gray-50 z-20">
                Amount
              </TableHead>
              {filteredExtraColumns.map((col) => (
                <TableHead
                  key={col}
                  className="font-semibold text-gray-600 py-3 sticky top-0 bg-gray-50 z-20"
                >
                  <div className="flex items-center justify-between gap-1 group">
                    <span className="truncate">{col}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col)}
                      className="text-red-500 hover:text-red-700 text-sm font-bold px-1 rounded hover:bg-red-50"
                      title={`Delete column "${col}"`}
                    >
                      ×
                    </button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="font-semibold text-gray-600 py-3 text-center sticky top-0 bg-gray-50 z-20">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6 + filteredExtraColumns.length}
                  className="text-center py-16 text-gray-400 bg-gray-50/20 border-b border-gray-100"
                >
                  <div className="flex flex-col items-center justify-center text-center gap-1.5 py-4 w-full">
                    <p className="text-sm font-semibold text-gray-500 text-center">
                      No WBS phases added yet
                    </p>
                    <p className="text-xs text-gray-400 max-w-md mx-auto text-center leading-relaxed">
                      Click{" "}
                      <strong className="text-[#3B7CED]">Add a Phase</strong>{" "}
                      below to build the structure manually
                    </p>
                    <p className="text-xs text-gray-400 max-w-md mx-auto text-center leading-relaxed -mt-2">
                      or{" "}
                      <strong className="text-[#3B7CED]">
                        Import WBS Excel
                      </strong>{" "}
                      button above to populate it from a spreadsheet.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              phases.map((phase) => (
                <WBSPhaseRow
                  key={phase.id}
                  phase={phase}
                  phaseBudget={getPhaseBudget(phase)}
                  extraColumns={filteredExtraColumns}
                  onUpdatePhaseName={(name) => updatePhaseName(phase.id, name)}
                  onAddPhaseActivity={() => addPhaseActivity(phase.id)}
                  onUpdateActivity={(activityId, updates) =>
                    updateActivity(phase.id, activityId, updates)
                  }
                  onRemoveActivity={(activityId) =>
                    removeActivity(phase.id, activityId)
                  }
                  onRemovePhase={() => removePhase(phase.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* WBS Footer */}
      <div className="flex items-center justify-between p-4 bg-white border-t border-gray-200">
        <Button
          type="button"
          onClick={addPhase}
          className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-6 rounded font-medium"
        >
          Add a Phase
        </Button>
        <div className="text-gray-600 text-sm font-medium">
          Total Project Budget:{" "}
          <span className="text-xl font-bold text-gray-800 ml-2">
            ₦{totalBudget.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[96vw] h-[92vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <h2 className="text-[#3B7CED] text-lg font-semibold">
                  Work Breakdown Structure (WBS) Workspace
                </h2>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium">
                  <span className="bg-blue-50 text-[#3B7CED] px-2.5 py-1 rounded">
                    Phases: {phases.length}
                  </span>
                  <span className="bg-blue-50 text-[#3B7CED] px-2.5 py-1 rounded">
                    Activities: {totalActivities}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded font-semibold">
                    Total Budget: ₦{totalBudget.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 p-1.5 flex items-center gap-1.5 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                <Minimize2 className="w-4 h-4" /> Minimize Workspace
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/20">
              {tableContent}
            </div>
          </div>
        </div>
      )}

      <section className={isExpanded ? "opacity-0 h-0 overflow-hidden" : ""}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#3B7CED] text-base font-medium">
            Work Breakdown Structure (WBS)
          </h2>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-[#3B7CED] text-sm font-medium flex items-center gap-1 hover:underline"
          >
            <Maximize2 className="w-4 h-4" /> Expand
          </button>
        </div>
        {tableContent}
      </section>
    </>
  );
}
