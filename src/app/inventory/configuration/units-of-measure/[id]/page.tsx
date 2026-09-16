"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetInventoryUnitOfMeasureQuery,
  useUpdateInventoryUnitOfMeasureMutation,
  useDeleteInventoryUnitOfMeasureMutation,
} from "@/api/inventory/unitOfMeasureApi";
import { StatusModal, useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";

export default function UnitOfMeasureDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: unitData, isLoading: isLoadingUnit } =
    useGetInventoryUnitOfMeasureQuery(id, { skip: !id });

  const [updateUnit, { isLoading: isUpdating }] =
    useUpdateInventoryUnitOfMeasureMutation();
  const [deleteUnit, { isLoading: isDeleting }] =
    useDeleteInventoryUnitOfMeasureMutation();

  const statusModal = useStatusModal();

  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (unitData) {
      setName(unitData.unit_name || "");
      setAbbreviation(unitData.unit_symbol || "");
      setCategory(unitData.unit_category || "General");
      setIsActive(unitData.is_active !== false);
    }
  }, [unitData]);

  const handleSave = async () => {
    if (!name.trim()) {
      statusModal.showError(
        "Validation Error",
        "Please enter a valid Unit Name."
      );
      return;
    }

    if (!abbreviation.trim()) {
      statusModal.showError(
        "Validation Error",
        "Please enter a valid Unit Symbol / Abbreviation."
      );
      return;
    }

    try {
      await updateUnit({
        id,
        data: {
          unit_name: name.trim(),
          unit_symbol: abbreviation.trim(),
          unit_category: category.trim() || "General",
          is_active: isActive,
        },
      }).unwrap();

      statusModal.showSuccess(
        "Changes Saved",
        `Unit of Measure "${name.trim()}" has been updated successfully.`
      );
    } catch (err: any) {
      console.error("Failed to update unit:", err);
      const errorMsg = extractErrorMessage(
        err,
        "Failed to update Unit of Measure. Please try again."
      );
      statusModal.showError("Update Failed", errorMsg);
    }
  };

  const handleDelete = () => {
    statusModal.showConfirm(
      "Delete Unit of Measure",
      "Are you sure you want to delete this Unit of Measure?",
      async () => {
        try {
          await deleteUnit(id).unwrap();
          statusModal.showSuccess(
            "Unit Deleted",
            "Unit of Measure has been deleted successfully."
          );
        } catch (err: any) {
          console.error("Failed to delete unit:", err);
          const errorMsg = extractErrorMessage(
            err,
            "Failed to delete Unit of Measure."
          );
          statusModal.showError("Deletion Failed", errorMsg);
        }
      },
      "Delete",
      "Cancel"
    );
  };

  const handleModalClose = () => {
    statusModal.close();
    if (
      statusModal.type === "success" &&
      (statusModal.title === "Unit Deleted" || statusModal.title === "Changes Saved")
    ) {
      router.push("/inventory/configuration/units-of-measure");
    }
  };

  if (isLoadingUnit) {
    return (
      <PageGuard module="inventory" entitlement="view_unitofmeasure">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#F6F9FC]">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B7CED]" />
          <p className="mt-2 text-sm font-semibold text-[#8898AA]">Loading unit details...</p>
        </div>
      </PageGuard>
    );
  }

  const statusStr = isActive ? "ACTIVE" : "INACTIVE";

  return (
    <PageGuard module="inventory" entitlement="view_unitofmeasure">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={handleModalClose}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={
            statusModal.actionText ||
            (statusModal.type === "success" ? "Done" : "Close")
          }
          onAction={statusModal.onAction || handleModalClose}
          secondaryText={statusModal.secondaryText}
          onSecondary={statusModal.onSecondary}
          actionVariant={statusModal.actionVariant}
        />

        {/* Clean Header Card */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href="/inventory/configuration/units-of-measure">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#32325D]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-semibold text-[#32325D]">{unitData?.unit_name || name || `Unit #${id}`}</h1>
                <Badge
                  className={`${
                    isActive
                      ? "bg-green-50 text-green-700 border border-green-200/60"
                      : "bg-red-50 text-red-700 border border-red-200/60"
                  } px-2.5 py-0.5 font-semibold text-xs rounded-md shadow-none`}
                >
                  {statusStr}
                </Badge>
              </div>
              <p className="text-xs text-[#8898AA] font-mono mt-0.5">Symbol / Abbreviation: {abbreviation || "-"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <PermissionGuard module="inventory" entitlement="change_unitofmeasure">
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="border-red-200 text-red-600 hover:bg-red-50 text-sm h-9 px-4 font-medium flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Main Form Container */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">Unit Attributes</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">Unit Name <span className="text-[#E43D2B]">*</span></Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">Abbreviation / Symbol <span className="text-[#E43D2B]">*</span></Label>
                <Input
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value)}
                  className="bg-white border-gray-200 rounded-md h-9 font-mono font-bold text-sm text-[#3B7CED] focus:ring-[#3B7CED]"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">Category</Label>
                <Input
                  list="edit-category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                />
                <datalist id="edit-category-suggestions">
                  <option value="Weight" />
                  <option value="Volume" />
                  <option value="Length" />
                  <option value="Quantity / Units" />
                  <option value="Time" />
                  <option value="Area" />
                </datalist>
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">Status</Label>
                <Select value={isActive ? "true" : "false"} onValueChange={(val) => setIsActive(val === "true")}>
                  <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </main>

        {/* Fixed Sticky Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
          <Link href="/inventory/configuration/units-of-measure">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm font-medium"
            >
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 text-sm font-semibold shadow-2xs flex items-center gap-1.5"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </PageGuard>
  );
}
