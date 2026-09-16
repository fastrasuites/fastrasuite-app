"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  message = "Account has successfully been added",
}: Props) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-8 w-full max-w-md z-50 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <Dialog.Title className="text-xl font-semibold text-gray-900">
            Successful
          </Dialog.Title>
          <p className="text-gray-600 mt-2">{message}</p>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
