import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Activity, Phase } from "../types";
import { WBSActivityRow } from "./WBSActivityRow";

interface WBSPhaseRowProps {
  phase: Phase;
  phaseBudget: number;
  extraColumns: string[];
  onUpdatePhaseName: (name: string) => void;
  onAddPhaseActivity: () => void;
  onUpdateActivity: (activityId: string, updates: Partial<Activity>) => void;
  onRemoveActivity: (activityId: string) => void;
  onRemovePhase: () => void;
}

export function WBSPhaseRow({
  phase,
  phaseBudget,
  extraColumns,
  onUpdatePhaseName,
  onAddPhaseActivity,
  onUpdateActivity,
  onRemoveActivity,
  onRemovePhase,
}: WBSPhaseRowProps) {
  return (
    <React.Fragment>
      {/* Phase Header */}
      <TableRow className="bg-[#EEF2FB] hover:bg-[#EEF2FB]/80 border-b border-white">
        <TableCell
          colSpan={4}
          className="font-medium p-0 bg-[#EEF2FB] h-12"
        >
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-2">
              <span className="text-[#3B7CED] text-sm font-bold uppercase tracking-wide select-none shrink-0 whitespace-nowrap">
                Phase:
              </span>
              <Input
                value={phase.name}
                onChange={(e) => onUpdatePhaseName(e.target.value)}
                className="h-8 w-72 bg-transparent border-0 hover:bg-white/50 focus:bg-white transition-all font-bold text-base text-gray-900 px-2 shadow-none rounded focus-visible:ring-1 focus-visible:ring-[#3B7CED]/30"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddPhaseActivity}
              className="bg-white border border-gray-200 text-[#3B7CED] hover:bg-blue-50/50 hover:text-[#3B7CED] hover:border-[#3B7CED] text-xs flex items-center h-8 gap-1.5 px-3 shadow-xs rounded-md font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </Button>
          </div>
        </TableCell>
        <TableCell className="font-bold text-base py-2 bg-[#EEF2FB] text-gray-900">
          ₦{phaseBudget.toLocaleString()}
        </TableCell>
        {extraColumns.length > 0 && (
          <TableCell
            colSpan={extraColumns.length}
            className="py-2 bg-[#EEF2FB]"
          />
        )}
        <TableCell className="py-2 bg-[#EEF2FB] text-center">
          <button
            type="button"
            onClick={onRemovePhase}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Delete Phase"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </TableCell>
      </TableRow>

      {/* Phase Activities */}
      {phase.activities.map((activity) => (
        <WBSActivityRow
          key={activity.id}
          activity={activity}
          extraColumns={extraColumns}
          onUpdate={(updates) => onUpdateActivity(activity.id, updates)}
          onRemove={() => onRemoveActivity(activity.id)}
        />
      ))}
    </React.Fragment>
  );
}
