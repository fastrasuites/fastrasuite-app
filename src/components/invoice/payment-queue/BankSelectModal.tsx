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
    onConfirm(
      selectedBank ||
        (currentBankAccountId ? String(currentBankAccountId) : null),
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-8 focus:outline-none">
          <div className="flex items-start justify-between mb-6">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Confirm Payment
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1.5">
                Select the company bank account the payment will leave from.
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
            <div className="mb-5 p-3.5 bg-blue-50 border border-blue-100 rounded-lg text-sm">
              <span className="text-blue-800 font-medium">
                Currently selected:{" "}
              </span>
              <span className="text-blue-700">{currentBankLabel}</span>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Bank Account
            </label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-full h-11">
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading accounts…"
                      : "Select company bank account"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((bank: any) => (
                  <SelectItem key={bank.id} value={String(bank.id)}>
                    {bank.bank_name} • {bank.account_number}
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
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-11">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={isLoading || (!selectedBank && !currentBankAccountId)}
              className="flex-1 h-11"
            >
              Confirm & Pay
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
