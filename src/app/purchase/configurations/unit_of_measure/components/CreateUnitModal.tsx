"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { UseFormReturn } from "react-hook-form";
import { UnitOfMeasureInput } from "@/lib/validations/currency-validation";

interface CreateUnitModalProps {
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  registerCreate: UseFormReturn<UnitOfMeasureInput>["register"];
  handleSubmitCreate: UseFormReturn<UnitOfMeasureInput>["handleSubmit"];
  resetCreate: UseFormReturn<UnitOfMeasureInput>["reset"];
  createErrors: UseFormReturn<UnitOfMeasureInput>["formState"]["errors"];
  isCreateValid: boolean;
  serverErrors: Record<string, string>;
  setServerErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onCreateSubmit: (data: UnitOfMeasureInput) => void;
  isCreating: boolean;
}

export function CreateUnitModal({
  showCreateForm,
  setShowCreateForm,
  registerCreate,
  handleSubmitCreate,
  resetCreate,
  createErrors,
  isCreateValid,
  serverErrors,
  setServerErrors,
  onCreateSubmit,
  isCreating,
}: CreateUnitModalProps) {
  return (
    <AnimatePresence>
      {showCreateForm && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Create New Unit of Measure
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetCreate();
                  setServerErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitCreate(onCreateSubmit)}
              className="space-y-4"
            >
              {/* General Error */}
              {serverErrors.general && (
                <Alert variant="destructive" className="text-sm">
                  {serverErrors.general}
                </Alert>
              )}

              {/* Unit Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Name
                </label>
                <Input
                  {...registerCreate("unit_name")}
                  placeholder="Kilogram"
                  className={createErrors.unit_name ? "border-red-500" : ""}
                />
                {createErrors.unit_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {createErrors.unit_name.message}
                  </p>
                )}
                {serverErrors.unit_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {serverErrors.unit_name}
                  </p>
                )}
              </div>

              {/* Unit Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Symbol
                </label>
                <Input
                  {...registerCreate("unit_symbol")}
                  placeholder="kg"
                  className={createErrors.unit_symbol ? "border-red-500" : ""}
                />
                {createErrors.unit_symbol && (
                  <p className="text-sm text-red-600 mt-1">
                    {createErrors.unit_symbol.message}
                  </p>
                )}
                {serverErrors.unit_symbol && (
                  <p className="text-sm text-red-600 mt-1">
                    {serverErrors.unit_symbol}
                  </p>
                )}
              </div>

              {/* Unit Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Category
                </label>
                <Input
                  {...registerCreate("unit_category")}
                  placeholder="Weight"
                  className={createErrors.unit_category ? "border-red-500" : ""}
                />
                {createErrors.unit_category && (
                  <p className="text-sm text-red-600 mt-1">
                    {createErrors.unit_category.message}
                  </p>
                )}
                {serverErrors.unit_category && (
                  <p className="text-sm text-red-600 mt-1">
                    {serverErrors.unit_category}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetCreate();
                    setServerErrors({});
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !isCreateValid}
                  variant={"contained"}
                >
                  {isCreating ? "Creating..." : "Create Unit"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
