"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { AnimatePresence } from "framer-motion";
import { UnitOfMeasure } from "@/api/purchase/unitOfMeasureApi";
import { formatErrorMessage, type ApiError } from "@/lib/utils/error-handling";
import { UnitOfMeasureRow } from "./UnitOfMeasureRow";
import { UnitOfMeasurePagination } from "./UnitOfMeasurePagination";

interface EditingUnit {
  id: number;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
}

interface UnitOfMeasureTableProps {
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  paginatedUnits: UnitOfMeasure[];
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
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
  pageSize: number;
  filteredUnitsLength: number;
  searchTerm: string;
  categoryFilter: string;
}

export function UnitOfMeasureTable({
  isLoading,
  error,
  refetch,
  paginatedUnits,
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
  totalPages,
  currentPage,
  handlePageChange,
  pageSize,
  filteredUnitsLength,
  searchTerm,
  categoryFilter,
}: UnitOfMeasureTableProps) {
  const loading: boolean = Boolean(isLoading);
  const hasError: boolean = Boolean(error);
  return (
    <div className="mx-auto pb-6">
      <AnimatedWrapper
        animation="fadeIn"
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B7CED] mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">
                Loading units of measure...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="p-6">
            <Alert variant="destructive">
              <p className="font-medium">Error loading units of measure</p>
              <p className="text-sm mt-1">
                {hasError &&
                error &&
                typeof error === "object" &&
                "data" in error
                  ? formatErrorMessage(error as ApiError)
                  : "An unexpected error occurred"}
              </p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-3"
                size="sm"
              >
                Retry
              </Button>
            </Alert>
          </div>
        )}

        {/* Content */}
        {!loading && !hasError && (
          <>
            {/* Table Header */}
            <AnimatedWrapper animation="slideDown" delay={0.2}>
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="col-span-3 text-sm font-medium text-gray-600">
                  Unit Name
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-600">
                  Symbol
                </div>
                <div className="col-span-3 text-sm font-medium text-gray-600">
                  Category
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-600">
                  Date Created
                </div>
                <div className="col-span-2"></div>
              </div>
            </AnimatedWrapper>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {paginatedUnits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm || categoryFilter
                      ? "No units found matching your criteria"
                      : "No units of measure found"}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {paginatedUnits.map((unit, index) => (
                    <UnitOfMeasureRow
                      key={getUnitId(unit.url)}
                      unit={unit}
                      index={index}
                      editingId={editingId}
                      editingUnit={editingUnit}
                      setEditingUnit={setEditingUnit}
                      serverErrors={serverErrors}
                      handleEdit={handleEdit}
                      handleCancel={handleCancel}
                      handleSave={handleSave}
                      handleDelete={handleDelete}
                      isUpdating={isUpdating}
                      isDeleting={isDeleting}
                      formatDate={formatDate}
                      getUnitId={getUnitId}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Pagination */}
            <UnitOfMeasurePagination
              totalPages={totalPages}
              currentPage={currentPage}
              handlePageChange={handlePageChange}
              pageSize={pageSize}
              filteredUnitsLength={filteredUnitsLength}
            />
          </>
        )}
      </AnimatedWrapper>
    </div>
  );
}
