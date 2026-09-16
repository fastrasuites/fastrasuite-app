import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Activity } from "../types";

interface WBSActivityRowProps {
  activity: Activity;
  extraColumns: string[];
  onUpdate: (updates: Partial<Activity>) => void;
  onRemove: () => void;
}

export function WBSActivityRow({
  activity,
  extraColumns,
  onUpdate,
  onRemove,
}: WBSActivityRowProps) {
  return (
    <TableRow className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
      {/* S/N */}
      <TableCell className="py-2 pl-4 text-center">
        <Input
          value={activity.sn || ""}
          onChange={(e) => onUpdate({ sn: e.target.value })}
          className="h-8 w-full bg-transparent border-gray-200 focus-visible:ring-1 focus-visible:ring-[#3B7CED] text-sm p-1 text-center shadow-none border-dashed hover:border-solid rounded"
        />
      </TableCell>

      {/* Activity */}
      <TableCell className="py-2">
        <Input
          value={activity.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-8 w-full bg-transparent border-gray-200 focus-visible:ring-1 focus-visible:ring-[#3B7CED] text-sm p-1 shadow-none border-dashed hover:border-solid rounded"
        />
      </TableCell>

      {/* Quantity */}
      <TableCell className="py-2">
        <Input
          type="number"
          value={activity.quantity || ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            onUpdate({
              quantity: val,
              budget: val * (activity.rate || 0),
            });
          }}
          className="h-8 w-full bg-transparent border-gray-200 focus-visible:ring-1 focus-visible:ring-[#3B7CED] text-sm p-1 shadow-none border-dashed hover:border-solid rounded"
        />
      </TableCell>

      {/* Rate */}
      <TableCell className="py-2">
        <Input
          type="number"
          value={activity.rate || ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            onUpdate({
              rate: val,
              budget: (activity.quantity || 0) * val,
            });
          }}
          className="h-8 w-full bg-transparent border-gray-200 focus-visible:ring-1 focus-visible:ring-[#3B7CED] text-sm p-1 shadow-none border-dashed hover:border-solid rounded"
        />
      </TableCell>

      {/* Amount (Budget) */}
      <TableCell className="py-2">
        <Input
          type="number"
          value={activity.budget || ""}
          disabled
          className="h-8 w-full bg-gray-50 border-gray-200 text-sm p-1 shadow-none cursor-not-allowed font-medium text-gray-700 rounded"
        />
      </TableCell>

      {/* Custom Extra Columns */}
      {extraColumns.map((colName) => (
        <TableCell key={colName} className="py-2">
          <Input
            value={activity[colName] || ""}
            onChange={(e) => onUpdate({ [colName]: e.target.value })}
            className="h-8 w-full bg-transparent border-gray-200 focus-visible:ring-1 focus-visible:ring-[#3B7CED] text-sm p-1 shadow-none border-dashed hover:border-solid rounded"
          />
        </TableCell>
      ))}

      {/* Action */}
      <TableCell className="py-2 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </TableCell>
    </TableRow>
  );
}
