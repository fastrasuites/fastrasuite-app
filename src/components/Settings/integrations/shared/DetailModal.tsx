"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./utils";

/**
 * Modal shell for the bill / payment detail cards ("BILL-0411", "PAY-0387"):
 * large bold reference number + status pill on the left, X on the right,
 * scrollable body, pinned footer with action buttons.
 */
export function DetailModal({
  open,
  onOpenChange,
  title,
  badge,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[560px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl focus:outline-none",
          )}
        >
          <div className="flex items-center gap-3">
            <Dialog.Title className="text-xl font-bold text-gray-900">
              {title}
            </Dialog.Title>
            {badge}
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="ml-auto rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>

          {footer ? (
            <div className="mt-6 flex shrink-0 items-center justify-end gap-3">{footer}</div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** "Sync details" section label inside a detail modal. */
export function DetailSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-medium text-blue-600">{children}</h3>
  );
}

/** Label / value pair in the two-column sync-details grid. */
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-1 text-[15px] font-medium text-gray-900">{children}</div>
    </div>
  );
}
