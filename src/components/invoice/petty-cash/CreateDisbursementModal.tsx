"use client";
import type {
  CreateDisbursementRequest,
  CreateCashDisbursement,
  CreateBankTransferDisbursement,
} from "@/api/invoice/disbursementApi";
import { useState, useEffect, useRef } from "react";
import { X, Loader2, InfoIcon } from "lucide-react";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { useGetCompanyBankAccountsQuery } from "@/api/invoice/companyBankAccountsApi";
import { useGetApprovedProjectRequestDetailsQuery } from "@/api/invoice/approvedProjectRequestsApi";

interface CreateDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSubmit: (payload: CreateDisbursementRequest) => void | Promise<void>;
  formatCurrency: (amount: number) => string;
  isSubmitting?: boolean;
}

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

export default function CreateDisbursementModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  formatCurrency,
  isSubmitting = false,
}: CreateDisbursementModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [disbursementMethod, setDisbursementMethod] = useState<
    "bank_transfer" | "cash"
  >("bank_transfer");
  const [bankAccount, setBankAccount] = useState("");
  const [accountName, setAccountName] = useState(""); // recipient_account_name
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState(""); // recipient_bank_name (free text)
  const [cashRecipientName, setCashRecipientName] = useState("");
  const [cashHandoverConfirmed, setCashHandoverConfirmed] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const primaryButtonRef = useRef<HTMLButtonElement>(null);

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

  const { data: banksRes, isLoading: isBanksLoading } =
    useGetCompanyBankAccountsQuery(undefined, { skip: !isOpen });

  const bankAccounts = Array.isArray(banksRes)
    ? banksRes.filter((b) => b.is_active)
    : [];

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
      setDisbursementMethod("bank_transfer");
      setBankAccount("");
      setAccountName("");
      setAccountNumber("");
      setBankName("");
      setCashRecipientName("");
      setCashHandoverConfirmed(false);
      setToast(null);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  // Prefill from details (preferred) with list fallbacks
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
  const requesterName = request?.requesterName || "—";
  const accountType = "Petty Cash & Miscellaneous";
  const amountApproved =
    Number(details?.amount_requested) || Number(request?.requestedAmount) || 0;
  const purpose =
    details?.purpose || details?.description || request?.purpose || "—";
  const description =
    details?.description && details.description !== details.purpose
      ? details.description
      : null;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSubmit = async () => {
    const sourceId = details?.id ?? requestId;
    if (!sourceId) {
      showToast("error", "Unable to determine request ID. Please try again.");
      return;
    }

    if (!bankAccount) {
      showToast("error", "Please select a company bank account");
      return;
    }

    if (disbursementMethod === "bank_transfer") {
      if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
        showToast("error", "Please fill in all recipient bank account details");
        return;
      }

      const payload: CreateBankTransferDisbursement = {
        source_type: "PETTY_CASH",
        disbursement_method: "BANK_TRANSFER",
        petty_cash_request: Number(sourceId),
        company_bank_account: Number(bankAccount),
        recipient_bank_name: bankName.trim(),
        recipient_account_number: accountNumber.trim(),
        recipient_account_name: accountName.trim(),
        cash_received: false,
      };

      console.log("Petty Cash Disbursement payload →", payload);
      try {
        await onSubmit(payload);
      } catch (err) {
        console.error("Disbursement submit failed:", err);
      }
      return;
    }

    // cash branch
    if (!cashRecipientName.trim()) {
      showToast("error", "Please enter the name of the person receiving cash");
      return;
    }
    if (!cashHandoverConfirmed) {
      showToast(
        "error",
        "Please confirm that the cash was physically handed over",
      );
      return;
    }

    const payload: CreateCashDisbursement = {
      source_type: "PETTY_CASH",
      disbursement_method: "CASH",
      petty_cash_request: Number(sourceId),
      company_bank_account: Number(bankAccount),
      recipient_name: cashRecipientName.trim(),
      cash_received: true,
    };

    if (process.env.NODE_ENV === "development")
      console.log("Petty Cash Disbursement payload →", payload);
    try {
      await onSubmit(payload);
    } catch (err) {
      console.error("Disbursement submit failed:", err);
    }
  };

  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900">
        <TruncateWithTooltip text={value} maxLength={42} />
      </p>
    </div>
  );

  const canSubmit =
    !isSubmitting &&
    !isDetailsLoading &&
    !isBanksLoading &&
    bankAccounts.length > 0;

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
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div>
              <h2
                id="disbursement-title"
                className="text-xl font-semibold text-gray-900"
              >
                Process Disbursement
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Originating Request:{" "}
                <TruncateWithTooltip text={referenceId} maxLength={28} />
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-2 mb-6">
              <InfoIcon className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                Petty cash is paid as a <strong>direct disbursement</strong> (no
                PO). On submit it moves to the Payment Queue. Actual cost is
                recorded when a user with Payer permission confirms payment.
              </p>
            </div>

            {isDetailsLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-sm text-gray-500">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <InfoCard label="Petty Cash Reference" value={pettyCashRef} />
                  <InfoCard label="WBS Element" value={wbs} />
                  {/* <InfoCard label="Requester Name" value={requesterName} /> */}
                  <InfoCard label="Project Name" value={projectName} />
                  <InfoCard label="Account Type" value={accountType} />
                  <InfoCard label="Request Type" value="Petty Cash Request" />
                  <InfoCard
                    label="Amount Approved"
                    value={formatCurrency(amountApproved)}
                  />
                </div>

                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Purpose
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {purpose}
                    </p>
                  </div>
                </div>

                {description && (
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Description
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {description}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Company bank account — required (PRD 9.3.2) */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Company Bank Account
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Select the company bank account the disbursement is going out
                from (Assets in Chart of Accounts).
              </p>
              {isBanksLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts…
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  No active company bank accounts found. Add one under Invoice
                  settings before submitting a disbursement.
                </div>
              ) : (
                <select
                  id="bank-account-select"
                  aria-label="Select Company Bank Account"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.bank_name} — {b.account_name} (
                      {b.account_number_display || b.account_number})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Disbursement method */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Disbursement Method
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Bank transfer to the requester, or physical cash handout.
              </p>
              <select
                aria-label="Disbursement method"
                value={disbursementMethod}
                onChange={(e) =>
                  setDisbursementMethod(
                    e.target.value as "bank_transfer" | "cash",
                  )
                }
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white disabled:opacity-60"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash Handout</option>
              </select>
            </div>

            {disbursementMethod === "bank_transfer" && (
              <div className="space-y-4 mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Recipient Bank Account
                </h3>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Account holder name"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. GTBank, First Bank, UBA…"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {disbursementMethod === "cash" && (
              <div className="space-y-4 mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Cash Handout Details
                </h3>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={cashRecipientName}
                    onChange={(e) => setCashRecipientName(e.target.value)}
                    placeholder="Name of person receiving cash"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-60"
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cashHandoverConfirmed}
                    onChange={(e) => setCashHandoverConfirmed(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm the cash was physically handed over to the
                    recipient. (Photo of signed voucher is encouraged but
                    optional.)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-busy={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
