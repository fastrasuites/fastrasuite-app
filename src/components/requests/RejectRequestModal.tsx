"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  isLoading?: boolean;
  requestReference?: string;
}

export function RejectRequestModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  requestReference,
}: RejectRequestModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setError(null);
    await onConfirm(trimmed);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="max-w-[420px] w-[calc(100%-2rem)] p-6 rounded-2xl bg-white gap-0 border-none shadow-xl font-['Open_Sans',sans-serif]">
        <div className="flex flex-col items-start w-full text-left">
          {/* Header section with Icon, Title and Message */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center border bg-[#FFF2F0] border-[#FFE0DB] text-[#E43D2B] mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <DialogTitle className="text-lg font-bold text-gray-900 leading-snug">
            Reject Request {requestReference ? `(${requestReference})` : ""}
          </DialogTitle>

          <DialogDescription className="text-sm font-medium text-gray-500 mt-2 leading-relaxed">
            Please provide a reason for rejecting this request. A rejection reason is mandatory and will be recorded in the request audit trail.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="w-full mt-4 space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="rejection-reason" className="text-xs font-semibold text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="rejection-reason"
                rows={3}
                placeholder="Explain why this request is being rejected..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error && e.target.value.trim()) setError(null);
                }}
                disabled={isLoading}
                className="w-full text-sm border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg"
              />
              {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={onClose}
                className="w-full h-11 rounded-lg font-semibold text-sm border-gray-300 hover:bg-gray-50 text-gray-700 shadow-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg font-semibold text-sm border-none shadow-none text-white bg-[#E43D2B] hover:bg-[#c93322]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </span>
                ) : (
                  "Confirm Reject"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
