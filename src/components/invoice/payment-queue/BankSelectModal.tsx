"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  /**
   * bankAccountId — selected company bank
   * amountToPay — numeric amount to send as payload.amount
   */
  onConfirm: (bankAccountId: string | null, amountToPay: number) => void;
  /** Already attached company bank account id (from the vendor bill) */
  currentBankAccountId?: number | null;
  /** Optional display label for the currently attached bank */
  currentBankLabel?: string;
  /** Full invoice amount (read-only display) */
  totalAmount?: number | string | null;
  /** Outstanding balance — default for Amount to Pay */
  balance?: number | string | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

/** Parse user input like "12,500.50" or "₦12500" into a number */
function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export default function BankSelectModal({
  isOpen,
  onClose,
  onConfirm,
  currentBankAccountId,
  currentBankLabel,
  totalAmount,
  balance,
}: Props) {
  const { data: bankAccounts = [], isLoading } = useGetCompanyBankAccountsQuery(
    undefined,
    { skip: !isOpen },
  );

  const totalNum = Number(totalAmount ?? 0) || 0;
  const balanceNum = Number(balance ?? totalAmount ?? 0) || 0;

  const [selectedBank, setSelectedBank] = useState<string>("");
  /** Raw string in the input so users can type freely */
  const [amountInput, setAmountInput] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset / prefill when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (currentBankAccountId) {
      setSelectedBank(String(currentBankAccountId));
    } else {
      setSelectedBank("");
    }

    const defaultPay = balanceNum > 0 ? balanceNum : totalNum;
    setAmountInput(defaultPay > 0 ? String(defaultPay) : "");
    setAmountTouched(false);
    setError(null);
  }, [isOpen, currentBankAccountId, balanceNum, totalNum]);

  const amountValue = useMemo(
    () => parseMoneyInput(amountInput),
    [amountInput],
  );

  const isPayingFullBalance =
    amountValue != null &&
    balanceNum > 0 &&
    Math.abs(amountValue - balanceNum) < 0.005;

  const showBalanceHint = !amountTouched || isPayingFullBalance;

  const validate = (): string | null => {
    if (amountValue == null) {
      return "Enter a valid amount to pay";
    }
    if (amountValue <= 0) {
      return "Amount to pay must be greater than zero";
    }
    // Allow paying up to outstanding balance (partial payments)
    if (balanceNum > 0 && amountValue > balanceNum + 0.001) {
      return `Amount cannot exceed the outstanding balance (${formatCurrency(balanceNum)})`;
    }
    // If no balance field, cap at total
    if (balanceNum <= 0 && totalNum > 0 && amountValue > totalNum + 0.001) {
      return `Amount cannot exceed the total (${formatCurrency(totalNum)})`;
    }
    const bankId =
      selectedBank ||
      (currentBankAccountId ? String(currentBankAccountId) : null);
    if (!bankId) {
      return "Select a company bank account";
    }
    return null;
  };

  const handleConfirm = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onConfirm(
      selectedBank ||
        (currentBankAccountId ? String(currentBankAccountId) : null),
      amountValue as number,
    );
  };

  const canSubmit =
    !isLoading &&
    amountValue != null &&
    amountValue > 0 &&
    Boolean(selectedBank || currentBankAccountId);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Confirm Payment
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm text-gray-500">
                Choose the paying account and how much to pay now.
              </Dialog.Description>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-2xl leading-none text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {currentBankLabel && (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-3.5 text-sm">
              <span className="font-medium text-blue-800">
                Currently selected:{" "}
              </span>
              <span className="text-blue-700">{currentBankLabel}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Total Amount — read-only */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Total Amount
              </label>
              <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 tabular-nums">
                {formatCurrency(totalNum)}
              </div>
            </div>

            {/* Amount to Pay — editable */}
            <div>
              <label
                htmlFor="amount-to-pay"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Amount to Pay
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  ₦
                </span>
                <input
                  id="amount-to-pay"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amountInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    // Allow digits and one decimal point
                    if (v === "" || /^\d*\.?\d*$/.test(v)) {
                      setAmountInput(v);
                      setAmountTouched(true);
                      setError(null);
                    }
                  }}
                  onBlur={() => {
                    if (amountValue != null) {
                      // Normalize display without forcing commas mid-edit
                      setAmountInput(
                        amountValue % 1 === 0
                          ? String(amountValue)
                          : amountValue.toFixed(2),
                      );
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm font-medium text-gray-900 tabular-nums focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  aria-describedby="amount-hint"
                />
              </div>
              {showBalanceHint && balanceNum > 0 && (
                <p id="amount-hint" className="mt-1.5 text-xs text-gray-500">
                  Pre-filled with outstanding balance (
                  {formatCurrency(balanceNum)})
                </p>
              )}
              {!showBalanceHint && amountValue != null && amountValue > 0 && (
                <p className="mt-1.5 text-xs text-gray-500">
                  Paying {formatCurrency(amountValue)}
                  {balanceNum > 0
                    ? ` · remaining ${formatCurrency(Math.max(0, balanceNum - amountValue))}`
                    : ""}
                </p>
              )}
            </div>

            {/* Company Bank Account */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Company Bank Account
              </label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger className="h-11 w-full">
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

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={onClose} className="h-11 flex-1">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="h-11 flex-1"
            >
              Confirm & Pay
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
