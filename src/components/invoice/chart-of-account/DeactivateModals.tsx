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
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-8 w-full max-w-md z-50 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <Dialog.Title className="text-xl font-semibold">
            Deactivate / Delete Account
          </Dialog.Title>
          <p className="text-gray-600 mt-2">
            Are you sure you want to deactivate or delete this account? This action cannot be undone.
          </p>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              disabled={isDeactivating}
              className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDeactivateConfirm(state.accountId!)}
              disabled={isDeactivating}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {isDeactivating ? "Processing..." : "Confirm"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
