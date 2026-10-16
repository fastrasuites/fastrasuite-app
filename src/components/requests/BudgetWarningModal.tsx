"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface BudgetWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditRequest?: () => void;
  onSubmitAnyway: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export function BudgetWarningModal({
  isOpen,
  onClose,
  onEditRequest,
  onSubmitAnyway,
  isSubmitting = false,
}: BudgetWarningModalProps) {
  const handleEdit = () => {
    onClose();
    if (onEditRequest) {
      onEditRequest();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="max-w-[420px] w-[calc(100%-2rem)] p-6 rounded-2xl bg-white gap-0 border-none shadow-xl font-['Open_Sans',sans-serif]">
        <div className="flex flex-col items-start w-full text-left">
          {/* Header section with Icon, Title and Message */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center border bg-[#EEF4FF] border-[#D0E1FD] text-[#3B7CED] mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <DialogTitle className="text-lg font-bold text-gray-900 leading-snug">
            Budget Warning
          </DialogTitle>

          <DialogDescription className="text-sm font-medium text-gray-600 mt-2 leading-relaxed">
            This amount is more than the available budget for this activity. You can still submit. Your request will go to the project manager for a budget review.
          </DialogDescription>

          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onSubmitAnyway}
              className="w-full h-12 rounded-lg font-semibold text-sm border-gray-300 hover:bg-gray-50 text-gray-700 shadow-none"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Anyway"
              )}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleEdit}
              className="w-full h-12 rounded-lg font-semibold text-sm border-none shadow-none text-white bg-[#3B7CED] hover:bg-[#2d63c7]"
            >
              Edit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
