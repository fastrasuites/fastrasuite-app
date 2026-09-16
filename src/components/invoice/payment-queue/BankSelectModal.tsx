"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import * as Dialog from "@radix-ui/react-dialog";
import { useGetCompanyBankAccountsQuery } from "@/api/invoice/companyBankAccountsApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bankAccountId: string | null) => void;
  /** Already attached company bank account id (from the vendor bill) */
  currentBankAccountId?: number | null;
  /** Optional display label for the currently attached bank */
  currentBankLabel?: string;
}

export default function BankSelectModal({
  isOpen,
  onClose,
  onConfirm,
  currentBankAccountId,
  currentBankLabel,
}: Props) {
  const { data: bankAccounts = [], isLoading } = useGetCompanyBankAccountsQuery(
    undefined,
    { skip: !isOpen },
  );

  const [selectedBank, setSelectedBank] = useState<string>("");

  // Pre-select existing bank when modal opens
  useEffect(() => {
    if (isOpen && currentBankAccountId) {
      setSelectedBank(String(currentBankAccountId));
    } else if (isOpen) {
      setSelectedBank("");
    }
  }, [isOpen, currentBankAccountId]);

  const handleConfirm = () => {
    // Allow confirming with the already-attached bank (or newly selected)
    onConfirm(
      selectedBank ||
        (currentBankAccountId ? String(currentBankAccountId) : null),
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 focus:outline-none">
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Confirm Payment
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">
                Review or change the company bank account the payment will leave
                from. Changing is optional.
              </Dialog.Description>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {currentBankLabel && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
              <span className="text-blue-800 font-medium">
                Currently selected:{" "}
              </span>
              <span className="text-blue-700">{currentBankLabel}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Bank Account{" "}
              {currentBankAccountId ? "(optional change)" : ""}
            </label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading accounts…"
                      : "Keep current or select another"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((bank: any) => (
                  <SelectItem key={bank.id} value={String(bank.id)}>
                    {bank.bank_name} •{" "}
                    {bank.account_number_display || bank.account_number}
                    {bank.is_active === false ? " (inactive)" : ""}
                  </SelectItem>
                ))}
                {bankAccounts.length === 0 && !isLoading && (
                  <SelectItem value="__none" disabled>
                    No company bank accounts found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-gray-500">
              Leave as-is to use the bank already attached to this bill.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={isLoading || (!selectedBank && !currentBankAccountId)}
              className="flex-1"
            >
              Confirm & Pay
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
