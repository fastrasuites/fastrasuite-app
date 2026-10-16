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

interface OverBudgetNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  overrunAmount: number | string;
  onApproveOverBudget: () => Promise<void> | void;
  onReject: () => void;
  isApproving?: boolean;
}

export function OverBudgetNoticeModal({
  isOpen,
  onClose,
  overrunAmount,
  onApproveOverBudget,
  onReject,
  isApproving = false,
}: OverBudgetNoticeModalProps) {
  const numericOverrun = Number(overrunAmount) || 0;
  const formattedOverrun = numericOverrun.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isApproving && !open && onClose()}>
      <DialogContent className="max-w-[440px] w-[calc(100%-2rem)] p-6 rounded-2xl bg-white gap-0 border-none shadow-xl font-['Open_Sans',sans-serif]">
        <div className="flex flex-col items-start w-full text-left">
          {/* Header section with Icon, Title and Message */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center border bg-[#FFF2F0] border-[#FFE0DB] text-[#E43D2B] mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <DialogTitle className="text-lg font-bold text-gray-900 leading-snug">
            Over-Budget Request Notice
          </DialogTitle>

          <DialogDescription className="text-sm font-medium text-gray-600 mt-2 leading-relaxed">
            This request exceeds the available budget for this activity by{" "}
            <span className="font-bold text-[#E43D2B]">₦{formattedOverrun}</span>. Please review the project budget or scope.
          </DialogDescription>

          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isApproving}
              onClick={() => {
                onClose();
                onReject();
              }}
              className="w-full h-12 rounded-lg font-semibold text-sm border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-none"
            >
              Reject
            </Button>
            <Button
              type="button"
              disabled={isApproving}
              onClick={onApproveOverBudget}
              className="w-full h-12 rounded-lg font-semibold text-xs leading-tight sm:text-sm border-none shadow-none text-white bg-[#3B7CED] hover:bg-[#2d63c7]"
            >
              {isApproving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </span>
              ) : (
                "Approve Over-Budget Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
