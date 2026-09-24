"use client";

import type {
  CreateCashDisbursement,
  CreateBankTransferDisbursement,
  CreateDisbursementBody,
  DisbursementAccountOption,
} from "@/api/invoice/disbursementApi";
import {
  useGetExpenseAccountsQuery,
  useGetPaymentOptionsQuery,
} from "@/api/invoice/disbursementApi";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
} from "lucide-react";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { useGetApprovedProjectRequestDetailsQuery } from "@/api/invoice/approvedProjectRequestsApi";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface CreateDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (payload: CreateDisbursementBody) => void | Promise<void>;
  formatCurrency: (amount: number) => string;
  isSubmitting?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

function TruncateWithTooltip({
  text,
  maxLength = 40,
  className = "",
}: {
  text: string;
  maxLength?: number;
  className?: string;
}) {
  if (!text) return <span className={className}>—</span>;
  const needsTruncate = text.length > maxLength;
  const display = needsTruncate ? `${text.slice(0, maxLength)}…` : text;

  return (
    <span
      className={`relative group cursor-default ${className}`}
      title={needsTruncate ? text : undefined}
    >
      {display}
    </span>
  );
}

function formatRequesterName(details?: any, fallbackRequest?: any): string {
  const user = details?.requester_details?.user;
  if (user) {
    const first = (user.first_name || "").trim();
    const last = (user.last_name || "").trim();
    if (first || last) {
      return `${first} ${last}`.trim();
    }
    if (user.username) {
      return String(user.username)
        .split(/[_\s.-]+/)
        .filter(Boolean)
        .map(
          (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join(" ");
    }
  }
  if (fallbackRequest?.requesterName) return fallbackRequest.requesterName;
  return "—";
}

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-CA");
  } catch {
    return "—";
  }
}

/** Label for an expense CoA option: "5500 · Petty Cash and Miscellaneous" */
function expenseAccountLabel(a: DisbursementAccountOption): string {
  const name = a.account_name || a.name || `Account #${a.id}`;
  const num = a.account_number ? `${a.account_number} · ` : "";
  return `${num}${name}`;
}

/**
 * Label for a payment-option row.
 * - Bank transfer (company_bank_accounts): "Opay - 8135425726"
 * - Cash (payment_accounts): "1120 · Petty Cash Account"
 */
function paymentOptionLabel(a: DisbursementAccountOption): string {
  const bank = (a.bank_name as string) || "";
  const acctNo =
    (a.account_number as string) || (a.account__account_number as string) || "";
  const name =
    (a.account_name as string) ||
    (a.account__account_name as string) ||
    (a.name as string) ||
    "";

  // Company bank account (has bank_name)
  if (bank && acctNo) return `${bank} - ${acctNo}`;
  if (bank) return bank;

  // Cash / CoA payment account: "1120 · Petty Cash Account"
  if (acctNo && name) return `${acctNo} · ${name}`;
  if (name) return name;
  if (acctNo) return acctNo;
  return `Account #${a.id}`;
}

/**
 * Normalize expense-accounts response:
 *   { expense_accounts: [...] } | [...]
 */
function normalizeExpenseAccounts(res: unknown): DisbursementAccountOption[] {
  if (Array.isArray(res)) return res as DisbursementAccountOption[];
  if (res && typeof res === "object") {
    const r = res as any;
    if (Array.isArray(r.expense_accounts)) return r.expense_accounts;
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

/**
 * Normalize payment-options response:
 *   { company_bank_accounts: [...] } | { payment_accounts: [...] } | [...]
 */
function normalizePaymentOptions(res: unknown): DisbursementAccountOption[] {
  if (Array.isArray(res)) return res as DisbursementAccountOption[];
  if (res && typeof res === "object") {
    const r = res as any;
    if (Array.isArray(r.company_bank_accounts)) return r.company_bank_accounts;
    if (Array.isArray(r.payment_accounts)) return r.payment_accounts;
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

/** Prefer the dedicated Petty Cash expense account when present */
function pickDefaultExpenseAccount(
  accounts: DisbursementAccountOption[],
): string {
  if (!accounts.length) return "";
  const petty = accounts.find((a) => {
    const name = (a.account_name || a.name || "").toLowerCase();
    const num = String(a.account_number || "");
    return (
      name.includes("petty cash") ||
      name.includes("miscellaneous") ||
      num === "5500"
    );
  });
  return String((petty || accounts[0]).id);
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function CreateDisbursementModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  formatCurrency,
  isSubmitting = false,
}: CreateDisbursementModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "cash" | null
  >(null);

  /** Expense (GL) account – required for both methods */
  const [expenseAccount, setExpenseAccount] = useState("");

  /**
   * Payment source:
   * - bank_transfer → company_bank_account (from payment-options?method=BANK_TRANSFER)
   * - cash → payment_account (from payment-options?method=CASH)
   */
  const [paymentSourceId, setPaymentSourceId] = useState("");

  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const [cashRecipientName, setCashRecipientName] = useState("");
  const [cashHandoverConfirmed, setCashHandoverConfirmed] = useState(false);

  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  /* ----------------------------- Data fetching ---------------------------- */

  const requestId = (() => {
    if (request?.backendId) return Number(request.backendId);
    if (request?.sourceId) return Number(request.sourceId);
    const match = String(request?.id || "").match(/(\d+)$/);
    return match ? Number(match[1]) : undefined;
  })();

  const {
    data: details,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
  } = useGetApprovedProjectRequestDetailsQuery(requestId as number, {
    skip: !isOpen || !requestId,
  });

  const { data: expenseRes, isLoading: isExpenseLoading } =
    useGetExpenseAccountsQuery(undefined, { skip: !isOpen });

  const expenseAccounts = normalizeExpenseAccounts(expenseRes);

  const paymentMethodParam =
    paymentMethod === "cash"
      ? "CASH"
      : paymentMethod === "bank_transfer"
        ? "BANK_TRANSFER"
        : undefined;

  const { data: paymentOptsRes, isLoading: isPaymentOptsLoading } =
    useGetPaymentOptionsQuery(
      { method: paymentMethodParam! },
      { skip: !isOpen || !paymentMethodParam },
    );

  const paymentOptions = normalizePaymentOptions(paymentOptsRes);

  /* ----------------------------- Lifecycle -------------------------------- */

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => primaryButtonRef.current?.focus(), 100);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod(null);
      setExpenseAccount("");
      setPaymentSourceId("");
      setAccountName("");
      setAccountNumber("");
      setBankName("");
      setCashRecipientName("");
      setCashHandoverConfirmed(false);
      setVoucherFile(null);
      setIsDragging(false);
      setToast(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  // Reset payment source when method changes
  useEffect(() => {
    setPaymentSourceId("");
  }, [paymentMethod]);

  // Default expense account to Petty Cash / 5500 when available
  useEffect(() => {
    if (!isOpen) return;
    if (expenseAccount) return;
    if (!expenseAccounts.length) return;
    setExpenseAccount(pickDefaultExpenseAccount(expenseAccounts));
  }, [isOpen, expenseAccounts, expenseAccount]);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 4500);
    },
    [],
  );

  const acceptFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ];
      if (!allowed.includes(file.type)) {
        showToast(
          "error",
          "Please upload an image (JPG, PNG, WebP) or PDF of the signed voucher.",
        );
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast("error", "File is too large. Maximum size is 8 MB.");
        return;
      }
      setVoucherFile(file);
    },
    [showToast],
  );

  if (!isOpen && !isVisible) return null;

  /* ----------------------------- Derived data ----------------------------- */

  const referenceId =
    details?.project_request?.reference_id || request?.id || "—";
  const pettyCashRef =
    details?.reference_id ||
    details?.project_request?.reference_id ||
    request?.id ||
    "—";
  const wbs = details
    ? `${details.project_details?.name || "—"} › ${details.phase_details?.name || "—"} › ${details.activity_details?.name || "—"}`
    : request?.wbs || "—";
  const projectName =
    details?.project_details?.name || request?.projectName || "—";
  const requesterName = formatRequesterName(details, request);
  const amountApproved =
    Number(details?.amount_requested) || Number(request?.requestedAmount) || 0;
  const purpose =
    details?.purpose || details?.description || request?.purpose || "—";
  const requestDate = formatDisplayDate(
    details?.created_at || request?.date || request?.approvalDate,
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const clearVoucherFile = () => {
    setVoucherFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const appendPayloadToForm = (
    form: FormData,
    payload: Record<string, unknown>,
  ) => {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, String(value));
      }
    });
  };

  /* ----------------------------- Submit ----------------------------------- */

  const handleSubmit = async () => {
    const sourceId = details?.id ?? requestId;
    if (!sourceId) {
      showToast("error", "Unable to determine the petty-cash request id.");
      return;
    }
    if (!expenseAccount) {
      showToast("error", "Please select an expense account.");
      return;
    }
    if (!paymentMethod) {
      showToast("error", "Please select a payment method.");
      return;
    }
    if (!paymentSourceId) {
      showToast(
        "error",
        paymentMethod === "cash"
          ? "Please select a payment (cash) account."
          : "Please select a company bank account.",
      );
      return;
    }

    // ---------- Bank Transfer ----------
    if (paymentMethod === "bank_transfer") {
      if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
        showToast(
          "error",
          "Please fill in all recipient bank account details.",
        );
        return;
      }

      const base: CreateBankTransferDisbursement = {
        source_type: "PETTY_CASH",
        disbursement_method: "BANK_TRANSFER",
        expense_account: Number(expenseAccount),
        company_bank_account: Number(paymentSourceId),
        petty_cash_request: Number(sourceId),
        recipient_name: accountName.trim(),
        recipient_bank_name: bankName.trim(),
        recipient_account_number: accountNumber.trim(),
        recipient_account_name: accountName.trim(),
        cash_received: false,
      };

      try {
        if (voucherFile) {
          const form = new FormData();
          appendPayloadToForm(form, base as unknown as Record<string, unknown>);
          form.append("document", voucherFile);
          await onSubmit(form);
        } else {
          await onSubmit(base);
        }
      } catch (err) {
        console.error("Disbursement submit failed:", err);
      }
      return;
    }

    // ---------- Physical Cash Handout ----------
    if (!cashRecipientName.trim()) {
      showToast("error", "Please enter the name of the person receiving cash.");
      return;
    }
    if (!cashHandoverConfirmed) {
      showToast(
        "error",
        "Please confirm that the cash was physically handed over.",
      );
      return;
    }

    const cashBase: CreateCashDisbursement = {
      source_type: "PETTY_CASH",
      disbursement_method: "CASH",
      expense_account: Number(expenseAccount),
      payment_account: Number(paymentSourceId),
      petty_cash_request: Number(sourceId),
      recipient_name: cashRecipientName.trim(),
      amount: amountApproved ? String(amountApproved) : undefined,
      cash_received: true,
    };

    try {
      if (voucherFile) {
        const form = new FormData();
        appendPayloadToForm(
          form,
          cashBase as unknown as Record<string, unknown>,
        );
        form.append("document", voucherFile);
        await onSubmit(form);
      } else {
        await onSubmit(cashBase);
      }
    } catch (err) {
      console.error("Disbursement submit failed:", err);
    }
  };

  /* ----------------------------- Validation ------------------------------- */

  const canSubmit =
    !isSubmitting &&
    !isDetailsLoading &&
    !isExpenseLoading &&
    !!expenseAccount &&
    !!paymentMethod &&
    !isPaymentOptsLoading &&
    paymentOptions.length > 0 &&
    !!paymentSourceId &&
    (paymentMethod === "bank_transfer"
      ? accountName.trim() && accountNumber.trim() && bankName.trim()
      : cashRecipientName.trim() && cashHandoverConfirmed);

  /* ----------------------------- Render ----------------------------------- */

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-50 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disbursement-title"
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <div>
              <h2
                id="disbursement-title"
                className="text-xl font-semibold text-gray-900"
              >
                Process Disbursement
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Petty Cash Request ·{" "}
                <TruncateWithTooltip
                  text={String(referenceId)}
                  maxLength={32}
                />
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 -mr-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {isDetailsLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading petty cash details…
              </div>
            ) : (
              <>
                {isDetailsError && (
                  <div className="mb-4 border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-800">
                    Could not load full details. Showing available list data.
                  </div>
                )}

                {/* Request summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Petty Cash Request ID
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      <TruncateWithTooltip
                        text={String(pettyCashRef)}
                        maxLength={28}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Requester Name
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {requesterName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">WBS Element</p>
                    <p className="text-sm font-medium text-gray-900">
                      <TruncateWithTooltip text={wbs} maxLength={42} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Amount Approved
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(amountApproved)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {requestDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Project Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      <TruncateWithTooltip text={projectName} maxLength={36} />
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6 pb-5 border-b border-gray-100">
                  <div className="shrink-0">
                    <p className="text-xs text-gray-500 mb-1">Request type</p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      Petty Cash Request
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">Purpose</p>
                    <p className="text-sm text-gray-800 leading-snug">
                      {purpose}
                    </p>
                  </div>
                </div>

                {/* Expense Account – required for both methods */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Expense Account
                  </h3>
                  <label
                    htmlFor="expense-account"
                    className="block text-sm text-gray-600 mb-1.5"
                  >
                    Select Expense Account
                  </label>
                  {isExpenseLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading expense accounts…
                    </div>
                  ) : expenseAccounts.length === 0 ? (
                    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      No expense accounts available. Check Chart of Accounts
                      configuration.
                    </div>
                  ) : (
                    <select
                      id="expense-account"
                      value={expenseAccount}
                      onChange={(e) => setExpenseAccount(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full max-w-md px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                    >
                      <option value="">Select expense account</option>
                      {expenseAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {expenseAccountLabel(a)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Payment Method */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bank_transfer")}
                      disabled={isSubmitting}
                      className={`text-left rounded-xl border-2 p-4 transition-all ${
                        paymentMethod === "bank_transfer"
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            paymentMethod === "bank_transfer"
                              ? "border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === "bank_transfer" && (
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Bank Transfer
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Transfer to recipient&apos;s bank account
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      disabled={isSubmitting}
                      className={`text-left rounded-xl border-2 p-4 transition-all ${
                        paymentMethod === "cash"
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            paymentMethod === "cash"
                              ? "border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {paymentMethod === "cash" && (
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Physical Cash Handout
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Cash disbursed in person
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment source – depends on method */}
                {paymentMethod && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      {paymentMethod === "cash"
                        ? "Payment Account"
                        : "Company Bank Account"}
                    </h3>
                    <label
                      htmlFor="payment-source"
                      className="block text-sm text-gray-600 mb-1.5"
                    >
                      {paymentMethod === "cash"
                        ? "Select cash / float account"
                        : "Select bank account (source of funds)"}
                    </label>
                    {isPaymentOptsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading accounts…
                      </div>
                    ) : paymentOptions.length === 0 ? (
                      <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        No {paymentMethod === "cash" ? "cash" : "bank"} accounts
                        available for this method.
                      </div>
                    ) : (
                      <select
                        id="payment-source"
                        value={paymentSourceId}
                        onChange={(e) => setPaymentSourceId(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full max-w-md px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                      >
                        <option value="">
                          {paymentMethod === "cash"
                            ? "Select payment account"
                            : "Select bank account"}
                        </option>
                        {paymentOptions.map((a) => (
                          <option key={a.id} value={a.id}>
                            {paymentOptionLabel(a)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Bank Transfer recipient */}
                {paymentMethod === "bank_transfer" && (
                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                      Recipient Bank Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="recipient-account-name"
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Account Name
                        </label>
                        <input
                          id="recipient-account-name"
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="e.g John Doe"
                          disabled={isSubmitting}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="recipient-bank-name"
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Bank Name
                        </label>
                        <input
                          id="recipient-bank-name"
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g GTBank"
                          disabled={isSubmitting}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="recipient-account-number"
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Account Number
                        </label>
                        <input
                          id="recipient-account-number"
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="0123456789"
                          disabled={isSubmitting}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash handout */}
                {paymentMethod === "cash" && (
                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                      Cash Handout Details
                    </h4>

                    <div className="mb-4">
                      <label
                        htmlFor="cash-recipient-name"
                        className="block text-sm text-gray-600 mb-1"
                      >
                        Name of Person Receiving Cash
                      </label>
                      <input
                        id="cash-recipient-name"
                        type="text"
                        value={cashRecipientName}
                        onChange={(e) => setCashRecipientName(e.target.value)}
                        placeholder="Full name"
                        disabled={isSubmitting}
                        className="w-full max-w-md px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                      />
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Signed Petty Cash Voucher Photo{" "}
                        <span className="text-gray-400">(recommended)</span>
                      </p>

                      {!voucherFile ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
                            isDragging
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40"
                          }`}
                        >
                          <Upload className="w-5 h-5 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Upload photo of signed voucher
                          </p>
                          <p className="text-xs text-gray-400">
                            Drag & drop or click · JPG, PNG, WebP or PDF · max 8
                            MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                            className="hidden"
                            onChange={handleFileInputChange}
                            disabled={isSubmitting}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                          {voucherFile.type.startsWith("image/") ? (
                            <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {voucherFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(voucherFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={clearVoucherFile}
                            disabled={isSubmitting}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            aria-label="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">
                        Not mandatory, but its absence will be noted in the
                        audit trail.
                      </p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={cashHandoverConfirmed}
                        onChange={(e) =>
                          setCashHandoverConfirmed(e.target.checked)
                        }
                        disabled={isSubmitting}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 leading-snug">
                        I confirm that the cash of{" "}
                        <strong>{formatCurrency(amountApproved)}</strong> was
                        physically handed over to the named recipient and the
                        petty cash voucher was signed.
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-busy={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Disbursement"
              )}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm">
          <ToastNotification
            show={true}
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </>
  );
}
