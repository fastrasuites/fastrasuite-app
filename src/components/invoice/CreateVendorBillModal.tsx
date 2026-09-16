"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, File, Trash2, ChevronRight, Loader2 } from "lucide-react";

import { useCreateVendorBillMutation, useGetAccountsPayableAccountsQuery } from "@/api/invoice/vendorBillsApi";
import {
  useGetCompanyBankAccountsQuery,
  type CompanyBankAccount,
} from "@/api/invoice/companyBankAccountsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type VendorBillSourceType =
  | "PROJECT_PO"
  | "PLANT_AND_EQUIPMENT"
  | "SUBCONTRACTOR";

export type SubcontractorLineType = "milestone" | "lump_sum";

export interface VendorBillLineItem {
  id: number;
  description: string;
  qty?: number | string;
  unit_price?: number | string;
  line_total?: number | string;
  item_name?: string;
}

interface CreateVendorBillModalProps {
  isOpen: boolean;
  onClose: () => void;

  sourceType: VendorBillSourceType;
  /** project_purchase_order id OR project_request id */
  sourceId: number;
  vendorId: number;
  paymentTerm: number | null;
  lines: VendorBillLineItem[];
  formatCurrency: (amount: number) => string;
  onCreated?: (billId?: number) => void;

  subcontractorLineType?: SubcontractorLineType;

  title?: string;
  subtitle?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function extractErrorMessage(err: unknown): string {
  if (!err) return "An unexpected error occurred.";
  const data = (err as any)?.data ?? err;
  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error === "string") return data.error;
  if (Array.isArray(data?.error) && data.error.length > 0) {
    const first = data.error[0];
    if (typeof first === "string") return first;
    if (typeof first?.detail === "string") return first.detail;
    if (typeof first?.message === "string") return first.message;
    if (typeof first === "object") {
      const parts = Object.entries(first).map(([key, val]) => {
        if (typeof val === "string") return `${key}: ${val}`;
        if (Array.isArray(val)) return `${key}: ${val.join(", ")}`;
        try {
          return `${key}: ${JSON.stringify(val)}`;
        } catch {
          return key;
        }
      });
      if (parts.length) return parts.join("; ");
    }
  }
  try {
    return JSON.stringify(data).slice(0, 200);
  } catch {
    return "Failed to create vendor bill.";
  }
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export default function CreateVendorBillModal({
  isOpen,
  onClose,
  sourceType,
  sourceId,
  vendorId,
  paymentTerm,
  lines,
  formatCurrency,
  onCreated,
  subcontractorLineType = "milestone",
  title = "Create Vendor Bill",
  subtitle,
}: CreateVendorBillModalProps) {
  const router = useRouter();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [companyBankAccount, setCompanyBankAccount] = useState<number | null>(
    null,
  );
  const [accountsPayableAccount, setAccountsPayableAccount] = useState<number | null>(
    null,
  );
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: bankAccounts, isLoading: isBanksLoading } =
    useGetCompanyBankAccountsQuery(undefined, { skip: !isOpen });
  const { data: accountsPayableAccounts, isLoading: isAccountsPayableLoading } =
    useGetAccountsPayableAccountsQuery(undefined, { skip: !isOpen });
  const [createVendorBill, { isLoading: isSubmitting }] =
    useCreateVendorBillMutation();

  const activeBankAccounts =
    bankAccounts?.filter((account: CompanyBankAccount) => account.is_active) ||
    [];
  const activeAccountsPayable = accountsPayableAccounts || [];

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  /* ------------------------------ File helpers ---------------------------- */

  const handleFileUpload = (file: File) => {
    const ok =
      ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(
        file.type,
      ) || /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!ok) {
      showToast("Only PDF, PNG, or JPG files are allowed", "error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showToast("File must be under 20 MB", "error");
      return;
    }
    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ------------------------------ Submit ---------------------------------- */

  const handleSubmit = async () => {
    // PRD: vendor invoice upload is optional and never blocks submission
    // if (!companyBankAccount) {
    //   showToast("Please select a company bank account", "error");
    //   return;
    // }
    if (!accountsPayableAccount) {
      showToast("Please select an accounts payable account", "error");
      return;
    }

    if (!lines.length) {
      showToast("Please select at least one line item", "error");
      return;
    }

    if (!paymentTerm) {
      showToast("Payment term is missing on this purchase order", "error");
      return;
    }

    if (!vendorId) {
      showToast("Vendor is missing on this purchase order", "error");
      return;
    }

    if (sourceType === "SUBCONTRACTOR" && !subcontractorLineType) {
      showToast("Subcontractor line type is required", "error");
      return;
    }

    const invoiceDate = new Date().toISOString().split("T")[0];

    const formData = new FormData();
    formData.append("source_type", sourceType);
    formData.append("vendor", String(vendorId));
    formData.append("invoice_date", invoiceDate);
    formData.append("payment_term", String(paymentTerm));
    // formData.append("company_bank_account", String(companyBankAccount));
    formData.append("accounts_payable_account", String(accountsPayableAccount));
    if (uploadedFile) {
      formData.append("document", uploadedFile);
    }

    if (sourceType === "PROJECT_PO") {
      formData.append("project_purchase_order", String(sourceId));
    } else {
      // PLANT_AND_EQUIPMENT and SUBCONTRACTOR use project_request
      formData.append("project_request", String(sourceId));
    }

    const mappedLines = lines.map((line) => {
      const base = {
        description: line.description || line.item_name || "",
        ...(line.qty != null ? { quantity: String(line.qty) } : {}),
        ...(line.unit_price != null
          ? { unit_price: String(line.unit_price) }
          : {}),
      };

      if (sourceType === "PROJECT_PO") {
        return {
          ...base,
          project_purchase_order_line: line.id,
        };
      }

      if (sourceType === "PLANT_AND_EQUIPMENT") {
        return {
          ...base,
          plant_and_equipment: line.id,
        };
      }

      // SUBCONTRACTOR
      if (subcontractorLineType === "lump_sum") {
        return {
          ...base,
          subcontractor_request: line.id,
        };
      }

      return {
        ...base,
        subcontractor_milestone: line.id,
      };
    });

    formData.append("lines", JSON.stringify(mappedLines));

    try {
      if (process.env.NODE_ENV === "development")
        console.log("createVendorbill payload -> ", formData);
      const result = await createVendorBill(formData).unwrap();
      console.log("[CreateVendorBill] - API result: ", result);

      const billId = result?.id;
      console.log("[CreateVendorBill] - billId: ", billId);

      showToast(
        "Vendor bill created successfully. Redirecting to Payment Queue…",
        "success",
      );

      onCreated?.(billId);

      setTimeout(() => {
        onClose();

        // Fallback logic: use ID if exists, else base payment queue path
        const targetPath = billId
          ? `/invoice/payment-queue/${billId}`
          : `/invoice/payment-queue/`;

        router.push(targetPath);
      }, 1200);
    } catch (err: unknown) {
      showToast(extractErrorMessage(err), "error");
      console.error("[CreateVendorBill]", err);
    }
  };

  if (!isOpen) return null;

  const displaySubtitle =
    subtitle ||
    (sourceType === "PROJECT_PO"
      ? `${sourceId}`
      : sourceType === "PLANT_AND_EQUIPMENT"
        ? `Plant & Equipment #${sourceId}`
        : `Subcontractor Request #${sourceId}`);

  const linesTotal = lines.reduce(
    (sum, l) => sum + Number(l.line_total || 0),
    0,
  );

  return (
    <>
      <div className="fixed bottom-6 right-6 z-60 max-w-sm">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      </div>

      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-bill-title"
          className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2
                id="create-bill-title"
                className="text-xl font-semibold text-gray-900"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">{displaySubtitle}</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* File Upload — optional per PRD */}
            <div className="mb-6">
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                Vendor Invoice Document{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                PDF or image up to 20 MB. Upload does not block submission.
              </p>

              {!uploadedFile ? (
                <div
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drop your invoice document here
                  </p>
                  <p className="mt-1 text-sm font-medium text-blue-600">
                    or click to browse files
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    PDF, PNG, JPG up to 20 MB
                  </p>
                  <input
                    aria-label="Upload file"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <File className="h-8 w-8 shrink-0 text-blue-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={removeFile}
                    disabled={isSubmitting}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Company Bank Account (commented out - no longer required)
            <div className="mb-6">
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                Company Bank Account <span className="text-red-500">*</span>
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Account this vendor bill will be paid from.
              </p>
              {isBanksLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading accounts&hellip;
                </div>
              ) : activeBankAccounts.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No active company bank accounts found. Add one under Invoice
                  settings before submitting.
                </div>
              ) : (
                <Select
                  value={companyBankAccount ? String(companyBankAccount) : ""}
                  onValueChange={(value) =>
                    setCompanyBankAccount(Number(value))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select company bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBankAccounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.bank_name} &bull;{" "}
                        {account.account_number_display ||
                          account.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          */}

            {/* Accounts Payable Account */}
            <div className="mb-6">
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                Accounts Payable Account <span className="text-red-500">*</span>
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                The liability account to record this vendor bill against.
              </p>
              {isAccountsPayableLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading accounts&hellip;
                </div>
              ) : activeAccountsPayable.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No accounts payable accounts found. Configure accounts under
                  Chart of Accounts before submitting.
                </div>
              ) : (
                <Select
                  value={accountsPayableAccount ? String(accountsPayableAccount) : ""}
                  onValueChange={(value) =>
                    setAccountsPayableAccount(Number(value))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select accounts payable account" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccountsPayable.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Line Items */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Line Items
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Description
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          Qty
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          Unit Price
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lines.map((line, index) => (
                        <tr
                          key={line.id ?? index}
                          className="hover:bg-gray-50/80"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {line.description || line.item_name || "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            {line.qty ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            {line.unit_price != null
                              ? formatCurrency(Number(line.unit_price))
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {line.line_total != null
                              ? formatCurrency(Number(line.line_total))
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-200 bg-gray-50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-900"
                        >
                          Total
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(linesTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isAccountsPayableLoading ||
                activeAccountsPayable.length === 0 ||
                lines.length === 0
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting&hellip;
                </>
              ) : (
                <>
                  Submit Vendor Bill
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}