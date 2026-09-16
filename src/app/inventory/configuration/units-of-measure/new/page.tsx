"use client";

import React, { useState } from "react";
import { ArrowLeft, Loader2, CheckSquare, Square, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateInventoryUnitOfMeasureMutation } from "@/api/inventory/unitOfMeasureApi";
import { StatusModal, useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";

export default function NewUnitOfMeasurePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [category, setCategory] = useState("");

  const statusModal = useStatusModal();

  const [createUnit, { isLoading: isCreating }] =
    useCreateInventoryUnitOfMeasureMutation();

  const handleSubmit = async () => {
    if (!name.trim()) {
      statusModal.showError(
        "Validation Error",
        "Please enter a Unit Name before saving."
      );
      return;
    }

    if (!abbreviation.trim()) {
      statusModal.showError(
        "Validation Error",
        "Please enter a Unit Symbol / Abbreviation before saving."
      );
      return;
    }

    try {
      const payload = {
        unit_name: name.trim(),
        unit_symbol: abbreviation.trim(),
        unit_category: category.trim() || "General",
        is_active: true,
      };

      await createUnit(payload).unwrap();

      statusModal.showSuccess(
        "Unit Created",
        `Unit of Measure "${name.trim()} (${abbreviation.trim()})" has been created successfully.`
      );
    } catch (err: any) {
      console.error("Failed to create Unit of Measure:", err);
      const errorMsg = extractErrorMessage(
        err,
        "Failed to create Unit of Measure due to a server error. Please try again."
      );
      statusModal.showError("Creation Failed", errorMsg);
    }
  };

  const handleModalClose = () => {
    statusModal.close();
    if (statusModal.type === "success") {
      router.push("/inventory/configuration/units-of-measure");
    }
  };

  return (
    <PageGuard module="inventory" entitlement="add_unitofmeasure">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={handleModalClose}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.type === "success" ? "Go to Units" : "Try again"}
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
              <h1 className="text-lg font-semibold text-[#32325D]">New Unit of Measure</h1>
              <p className="text-xs text-[#8898AA] mt-0.5">Define a standard metric or imperial measurement unit.</p>
            </div>
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
                <Label className="text-sm font-semibold text-[#32325D]">
                  Unit Name <span className="text-[#E43D2B]">*</span>
                </Label>
                <Input
                  placeholder="e.g. Kilograms or 50kg Bag"
                  className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">
                  Abbreviation / Symbol <span className="text-[#E43D2B]">*</span>
                </Label>
                <Input
                  placeholder="e.g. kg / Bag"
                  className="bg-white border-gray-200 rounded-md h-9 font-mono font-bold text-sm text-[#3B7CED] focus:ring-[#3B7CED]"
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">
                  Unit Category
                </Label>
                <Input
                  list="unit-category-suggestions"
                  placeholder="e.g. Weight, Volume, Quantity"
                  className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="unit-category-suggestions">
                  <option value="Weight" />
                  <option value="Volume" />
                  <option value="Length" />
                  <option value="Quantity / Units" />
                  <option value="Time" />
                  <option value="Area" />
                </datalist>
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
          <PermissionGuard module="inventory" entitlement="add_unitofmeasure">
            <Button
              onClick={handleSubmit}
              disabled={isCreating}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 text-sm font-semibold shadow-2xs flex items-center gap-1.5"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Unit
                </>
              )}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </PageGuard>
  );
}
