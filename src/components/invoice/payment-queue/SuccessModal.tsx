"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function SuccessModal({ isOpen, onClose, onDone }: Props) {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center ">
          <Dialog.Content className="bg-white rounded-3xl w-full max-w-md shadow p-10">
            <div className=" mb-4">
              <CircleCheck className="w-16 h-16 text-blue-600" />
            </div>
            <Dialog.Title className="text-2xl font-semibold mb-2">
              Successful
            </Dialog.Title>
            <p className="text-gray-600 mb-10">
              Your payment has successfully been made
            </p>

            <div className="flex gap-4 justify-center items-center">
              <Button variant={"outline"} onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button variant={"contained"} onClick={onDone} className="flex-1">
                Done
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
