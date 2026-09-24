"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";

interface Props {
  state: {
    isOpen: boolean;
    accountId: number | null;
  };
  onClose: () => void;
  onDeactivateConfirm: (id: number) => void;
  isDeactivating: boolean;
}

export function DeactivateModals({
  state,
  onClose,
  onDeactivateConfirm,
  isDeactivating,
}: Props) {
  if (!state.accountId) return null;

  return (
    <Dialog.Root open={state.isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <Dialog.Title className="text-xl font-semibold text-gray-900">
            Deactivate account
          </Dialog.Title>
          <p className="mt-2 text-sm text-gray-600">
            This will deactivate the account so it cannot be used for new
            postings. Existing history is preserved. You can reactivate it later
            from Edit → Active.
          </p>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeactivating}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onDeactivateConfirm(state.accountId!)}
              disabled={isDeactivating}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:bg-red-400"
            >
              {isDeactivating ? "Deactivating…" : "Deactivate"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
