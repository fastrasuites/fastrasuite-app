"use client";

import React from "react";
import { Edit2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { UnitOfMeasure } from "@/api/purchase/unitOfMeasureApi";

interface EditingUnit {
  id: number;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
}

interface UnitOfMeasureRowProps {
  unit: UnitOfMeasure;
  index: number;
  editingId: number | null;
  editingUnit: EditingUnit | null;
  setEditingUnit: React.Dispatch<React.SetStateAction<EditingUnit | null>>;
  serverErrors: Record<string, string>;
  handleEdit?: (unit: UnitOfMeasure) => void;
  handleCancel: () => void;
  handleSave?: (id: number) => void;
  handleDelete?: (unit: UnitOfMeasure) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  formatDate: (dateString: string) => string;
  getUnitId: (url: string) => number;
}

export function UnitOfMeasureRow({
  unit,
  index,
  editingId,
  editingUnit,
  setEditingUnit,
  serverErrors,
  handleEdit,
  handleCancel,
  handleSave,
  handleDelete,
  isUpdating,
  isDeleting,
  formatDate,
  getUnitId,
}: UnitOfMeasureRowProps) {
  const unitId = getUnitId(unit.url);

  return (
    <AnimatedWrapper
      key={unitId}
      animation="slideUp"
      delay={index * 0.1}
      hoverEffect={true}
      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors ${
        editingId === unitId ? "bg-blue-50/30" : ""
      }`}
    >
      {/* Unit Name */}
      <div className="col-span-3">
        {editingId === unitId ? (
          <div className="space-y-2">
            <Input
              value={editingUnit?.unit_name || ""}
              onChange={(e) =>
                setEditingUnit((prev) =>
                  prev ? { ...prev, unit_name: e.target.value } : null,
                )
              }
              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Unit name"
              autoFocus
            />
            {serverErrors.unit_name && (
              <p className="text-sm text-red-600">{serverErrors.unit_name}</p>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-900 font-medium">
            {unit.unit_name}
          </span>
        )}
      </div>

      {/* Symbol */}
      <div className="col-span-2">
        {editingId === unitId ? (
          <div className="space-y-2">
            <Input
              value={editingUnit?.unit_symbol || ""}
              onChange={(e) =>
                setEditingUnit((prev) =>
                  prev ? { ...prev, unit_symbol: e.target.value } : null,
                )
              }
              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="kg"
              maxLength={20}
            />
            {serverErrors.unit_symbol && (
              <p className="text-sm text-red-600">{serverErrors.unit_symbol}</p>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-700 font-mono">
            {unit.unit_symbol}
          </span>
        )}
      </div>

      {/* Category */}
      <div className="col-span-3">
        {editingId === unitId ? (
          <div className="space-y-2">
            <Input
              value={editingUnit?.unit_category || ""}
              onChange={(e) =>
                setEditingUnit((prev) =>
                  prev ? { ...prev, unit_category: e.target.value } : null,
                )
              }
              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Weight"
              maxLength={50}
            />
            {serverErrors.unit_category && (
              <p className="text-sm text-red-600">
                {serverErrors.unit_category}
              </p>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-700">{unit.unit_category}</span>
        )}
      </div>

      {/* Date Created */}
      <div className="col-span-2">
        <span className="text-sm text-gray-700">
          {formatDate(unit.created_on)}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex items-center justify-end gap-2">
        {editingId === unitId ? (
          <>
            {handleSave && (
              <Button
                onClick={() => handleSave(unitId)}
                disabled={isUpdating}
                className="bg-[#3B7CED] hover:bg-[#3B7CED]/90 text-white px-4 h-10 rounded-md font-medium transition-colors text-sm"
              >
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            )}
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {handleEdit && (
              <Button
                onClick={() => handleEdit(unit)}
                variant="outline"
                className="bg-[#3B7CED] hover:bg-[#3B7CED]/90 text-white border-0 px-4 h-10 rounded-md font-medium transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            {handleDelete && (
              <button
                onClick={() => handleDelete(unit)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 font-medium px-3 h-10 transition-colors text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* General Error Display */}
      {editingId === unitId && serverErrors.general && (
        <div className="col-span-12 mt-2">
          <Alert variant="destructive" className="text-sm">
            {serverErrors.general}
          </Alert>
        </div>
      )}
    </AnimatedWrapper>
  );
}
