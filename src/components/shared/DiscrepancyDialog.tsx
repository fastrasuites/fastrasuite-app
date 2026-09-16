"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Undo2, ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DiscrepancyType = "backorder" | "return";

interface DiscrepancyDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog is closed without action */
  onClose: () => void;
  /** The type of discrepancy to handle */
  type: DiscrepancyType | null;
  /** Callback when the user confirms the action (Yes) */
  onConfirm: () => void;
  /** Callback when the user declines the action but acknowledges (No) */
  onDecline: () => void;
  /** Loading state for the action button */
  isLoading?: boolean;
}

export function DiscrepancyDialog({
  isOpen,
  onClose,
  type,
  onConfirm,
  onDecline,
  isLoading = false,
}: DiscrepancyDialogProps) {
  if (!type) return null;

  const isBackorder = type === "backorder";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md border-none p-0 overflow-hidden rounded-2xl bg-white shadow-xl"
        showCloseButton={false}
      >
        <div className="flex flex-col w-full">
          {/* Top Bar: Logo on the left with padding, Close Button on the right */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2 w-full">
            <img
              src="/fastraLogo.png"
              alt="FastraSuite Logo"
              className="h-8 w-auto object-contain"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Center Graphic & Header */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2 px-6">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-xs",
                isBackorder
                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              )}
            >
              {isBackorder ? (
                <ShoppingCart className="w-8 h-8" />
              ) : (
                <Undo2 className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">OOPS!</h2>
            <div className="flex gap-1 mt-1.5">
              <div
                className={cn(
                  "h-1.5 w-12 rounded-full",
                  isBackorder ? "bg-amber-400" : "bg-blue-400"
                )}
              />
              <div
                className={cn(
                  "h-1.5 w-4 rounded-full opacity-60",
                  isBackorder ? "bg-amber-400" : "bg-blue-400"
                )}
              />
            </div>
          </div>

          {/* Body Content */}
          <div className="px-8 py-5 text-center">
            <p className="text-gray-800 text-base font-semibold leading-relaxed mb-2">
              {isBackorder
                ? "The received quantity is less than the expected quantity."
                : "The received quantity is more than the expected quantity."}
            </p>
            <p className="text-gray-500 text-sm leading-normal">
              {isBackorder
                ? "Would you like to place a backorder for the remaining quantity?"
                : "Do you want to return the extra goods?"}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="px-8 pb-7 pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onDecline}
              disabled={isLoading}
              className="w-full sm:flex-1 h-11 text-gray-700 border border-gray-200 hover:bg-gray-50 font-medium text-sm transition-all duration-200 shadow-none rounded-lg"
            >
              No, Thank You
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "w-full sm:flex-1 h-11 font-medium text-sm text-white shadow-sm transition-all duration-200 border-none rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0",
                isBackorder
                  ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              )}
            >
              {isLoading
                ? "Processing..."
                : isBackorder
                ? "Yes, Place Backorder"
                : "Yes, Process Return"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DiscrepancyDialog;
