"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface InventoryStickyFooterProps {
  cancelHref: string;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  extraButtons?: React.ReactNode;
}

export function InventoryStickyFooter({
  cancelHref,
  onSaveDraft,
  onSubmit,
  submitLabel = "Validate & Post Record",
  isSubmitting = false,
  extraButtons,
}: InventoryStickyFooterProps) {
  return (
    <div className="bg-white border-t border-gray-200 py-4 px-6 fixed bottom-0 left-0 right-0 z-20 flex justify-end gap-3 shadow-lg">
      {extraButtons}

      <Link href={cancelHref}>
        <Button
          variant="outline"
          type="button"
          disabled={isSubmitting}
          className="border-gray-200 text-[#525F7F] hover:bg-gray-50 h-9 px-4 text-sm"
        >
          Cancel
        </Button>
      </Link>

      {onSaveDraft && (
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onSaveDraft}
          className="border-gray-200 text-[#32325D] hover:bg-gray-50 h-9 px-4 text-sm"
        >
          Save as Draft
        </Button>
      )}

      {onSubmit && (
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-5 text-sm font-medium shadow-2xs"
        >
          {isSubmitting ? "Processing..." : submitLabel}
        </Button>
      )}
    </div>
  );
}
