"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";

interface UnitOfMeasurePaginationProps {
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
  pageSize: number;
  filteredUnitsLength: number;
}

export function UnitOfMeasurePagination({
  totalPages,
  currentPage,
  handlePageChange,
  pageSize,
  filteredUnitsLength,
}: UnitOfMeasurePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <AnimatedWrapper animation="slideUp" delay={0.3}>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredUnitsLength)} of{" "}
            {filteredUnitsLength} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AnimatedWrapper>
  );
}
