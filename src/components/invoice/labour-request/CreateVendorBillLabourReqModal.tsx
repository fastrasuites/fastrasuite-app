"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  File,
  Trash2,
  Loader2,
  AlertTriangle,
  InfoIcon,
} from "lucide-react";
import { useGetApprovedProjectRequestDetailsQuery } from "@/api/invoice/approvedProjectRequestsApi";
import { useGetCompanyBankAccountsQuery } from "@/api/invoice/companyBankAccountsApi";
import {
  useGetActiveVendorsQuery,
  useGetVendorsByTypeQuery,
} from "@/api/invoice/vendorsApi";
import { useGetPaymentTermsQuery } from "@/api/invoice/paymentTermsApi";
import {
  useCreateVendorBillMutation,
  useGetAccountsPayableAccountsQuery,
} from "@/api/invoice/vendorBillsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  formatCurrency: (amount: number) => string;
}

function Truncate({ text, max = 40 }: { text: string; max?: number }) {
  if (!text) return <span>—</span>;
  return (
    <span title={text.length > max ? text : undefined}>
      {text.length > max ? `${text.slice(0, max)}…` : text}
    </span>
  );
}

const InfoCard = ({
  label,
  value,
  isLoading = false,
}: {
  label: string;
  value: string;
  isLoading?: boolean;
}) => (
  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </p>
    {isLoading ? (
      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
    ) : (
      <p className="text-sm font-medium text-gray-900">
        <Truncate text={value} />
      </p>
    )}
  </div>
);

const InfoBanner = ({
  type = "info",
  children,
}: {
  type?: "info" | "warning";
  children: React.ReactNode;
}) => {
  const styles =
    type === "warning"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-blue-50 border-blue-100 text-blue-800";
  const Icon = type === "warning" ? AlertTriangle : InfoIcon;
  return (
    <div className={`border rounded-lg px-4 py-3 flex gap-2 ${styles}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-sm">{children}</p>
    </div>
  );
};

function extractErrorMessage(err: unknown): string {
  if (!err) return "An unexpected error occurred.";
  const data = (err as any)?.data ?? err;
  if (typeof data === "string") return data;
  if (data?.detail && typeof data.detail === "string") return data.detail;
  if (data?.error && typeof data.error === "string") return data.error;
  if (Array.isArray(data?.error) && data.error.length > 0) {
    const first = data.error[0];
    if (typeof first === "string") return first;
    if (first?.detail && typeof first.detail === "string") return first.detail;
    if (first?.message && typeof first.message === "string")
      return first.message;
  }
  try {
    return JSON.stringify(data).slice(0, 180);
  } catch {
    return "An unexpected error occurred.";
  }
}

export default function CreateVendorBillLabourReqModal({
  isOpen,
  onClose,
  request,
  formatCurrency,
}: Props) {
  const router = useRouter();

  /* ─── Form state ───────────────────────────────── */
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<string | null>(null);
  const [bankAccountId, setBankAccountId] = useState("");
  const [accountsPayableAccountId, setAccountsPayableAccountId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [paymentTermId, setPaymentTermId] = useState("");
  const [discrepancyAck, setDiscrepancyAck] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  /* ─── Request ID ───────────────────────────────── */
  const requestId = (() => {
    if (request?.backendId) return Number(request.backendId);
    if (request?.sourceId) return Number(request.sourceId);
    const m = String(request?.id || "").match(/(\d+)$/);
    return m ? Number(m[1]) : undefined;
  })();

  /* ─── Queries ─────────────────────────────────── */
  const {
    data: details,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
  } = useGetApprovedProjectRequestDetailsQuery(requestId as number, {
    skip: !isOpen || !requestId,
  });

  const { data: bankAccountsResponse, isLoading: isBanksLoading } =
    useGetCompanyBankAccountsQuery(undefined, { skip: !isOpen });

  const { data: accountsPayableAccountsResponse, isLoading: isAccountsPayableLoading } =
    useGetAccountsPayableAccountsQuery(undefined, { skip: !isOpen });

  // const { data: vendorsResponse, isLoading: isVendorsLoading } =
  //   useGetActiveVendorsQuery(undefined, { skip: !isOpen });

  const { data: vendorsResponse, isLoading: isVendorsLoading } =
    useGetVendorsByTypeQuery(undefined, { skip: !isOpen });

  const { data: paymentTermsResponse, isLoading: isPaymentTermsLoading } =
    useGetPaymentTermsQuery(undefined, { skip: !isOpen });

  const [createVendorBill, { isLoading: isSubmitting }] =
    useCreateVendorBillMutation();

  /* ─── Derived data ───────────────────────────── */
  const bankAccounts = Array.isArray(bankAccountsResponse)
    ? bankAccountsResponse.filter((b: any) => b.is_active)
    : [];

  const accountsPayableAccounts = Array.isArray(accountsPayableAccountsResponse)
    ? accountsPayableAccountsResponse
    : [];

  const vendors = Array.isArray(vendorsResponse) ? vendorsResponse : [];

  const labourVendors = vendors.filter((v: any) => v.vendor_type === "labour");

  const paymentTerms = Array.isArray(paymentTermsResponse)
    ? paymentTermsResponse.filter((t: any) => t.is_active)
    : [];

  const projectedCost =
    Number(details?.projected_cost) || Number(request?.requestedAmount) || 0;
  const dailyRate = Number(details?.estimated_daily_rate) || 0;
  const workers = details?.number_of_workers ?? "—";
  const workersNum = Number(details?.number_of_workers) || 0;
  const roleType = details?.role_type || "—";
  const duration = details
    ? `${details.duration ?? "—"} ${details.duration_unit || ""}`.trim()
    : "—";
  const dateRequired = details?.date_required?.slice(0, 10) || "—";
  const requester = details?.created_by_name || request?.supplierName || "—";
  const projectName = details?.project_details?.name || "—";
  const wbs = details
    ? `${details.project_details?.name || "—"} › ${details.phase_details?.name || "—"} › ${details.activity_details?.name || "—"}`
    : request?.wbs || "—";
  const refId = details?.project_request?.reference_id || request?.id || "—";

  const effectiveInvoiceAmount =
    invoiceAmount !== null ? invoiceAmount : String(projectedCost || "");
  const invoiceNum = Number(effectiveInvoiceAmount) || 0;
  const hasDiscrepancy =
    projectedCost > 0 && Math.abs(invoiceNum - projectedCost) > 0.01;

  const effectiveVendorId = labourVendors.some(
    (v: any) => v.id === Number(vendorId),
  )
    ? vendorId
    : "";
  const vendorStale = Boolean(vendorId) && !effectiveVendorId;
  const selectedVendor = labourVendors.find(
    (v: any) => v.id === Number(effectiveVendorId),
  );
  const vendorPaymentTermId = selectedVendor?.payment_term;
  const effectivePaymentTermId =
    paymentTermId || (vendorPaymentTermId ? String(vendorPaymentTermId) : "");
  const selectedPaymentTermName = paymentTerms.find(
    (t: any) => t.id === Number(effectivePaymentTermId),
  )?.name;

  /* ─── Focus on open ─────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => submitButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /* ─── Handlers ───────────────────────────────── */
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  const handleFile = (file: File) => {
    const ok =
      ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(
        file.type,
      ) || /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!ok) {
      showToast("error", "Only PDF, PNG, or JPG files are allowed");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showToast("error", "File must be under 20 MB");
      return;
    }
    setUploadedFile(file);
  };

  const handleSubmit = async () => {
    if (!requestId && !details?.id) {
      showToast("error", "Invalid request");
      return;
    }
    if (!vendorId || !selectedVendor) {
      showToast("error", "Please select a labour vendor");
      return;
    }
    // if (!bankAccountId) {
    //   showToast("error", "Please select a company bank account");
    //   return;
    // }
    if (!accountsPayableAccountId) {
      showToast("error", "Please select an accounts payable account");
      return;
    }
    if (!effectivePaymentTermId) {
      showToast("error", "Please select a payment term");
      return;
    }
    if (!effectiveInvoiceAmount || invoiceNum <= 0) {
      showToast("error", "Please enter a valid invoice amount");
      return;
    }
    if (hasDiscrepancy && !discrepancyAck) {
      showToast(
        "error",
        "Invoice amount differs from approved cost. Please acknowledge the discrepancy",
      );
      return;
    }

    const labourRequestId = Number(details?.id); // 1
    const projectRequestId = Number(details?.project_request?.id ?? requestId);

    if (!labourRequestId || !projectRequestId) {
      showToast("error", "Invalid request identifiers");
      return;
    }
    const unitPrice =
      workersNum > 0 ? (invoiceNum / workersNum).toFixed(2) : String(dailyRate);

    const formData = new FormData();
    formData.append("source_type", "LABOUR");
    formData.append("project_request", String(projectRequestId));
    formData.append("vendor", String(vendorId));
    formData.append("invoice_date", new Date().toISOString().split("T")[0]);
    formData.append("payment_term", String(effectivePaymentTermId));
    // formData.append("company_bank_account", String(bankAccountId));
    formData.append("accounts_payable_account", String(accountsPayableAccountId));
    if (uploadedFile) {
      formData.append("document", uploadedFile);
    }

    const line = {
      labour_request: labourRequestId,
      description: `${roleType} labour — ${workers} worker(s)${duration !== "—" ? ` (${duration})` : ""}`,
      quantity: String(workersNum > 0 ? workersNum : 1),
      unit_price: unitPrice,
    };
    formData.append("lines", JSON.stringify([line]));

    try {
      await createVendorBill(formData).unwrap();
      showToast(
        "success",
        "Vendor bill created successfully. Redirecting to Payment Queue…",
      );

      setTimeout(() => {
        onClose();
        router.push("/invoice/payment-queue");
      }, 1500);
    } catch (err: unknown) {
      showToast("error", extractErrorMessage(err));
      console.error("Create vendor bill error:", err);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-300 z-50 opacity-100"
        onClick={isSubmitting || isDetailsLoading ? undefined : onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="labour-bill-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* ─── Header ─── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div>
              <h2
                id="labour-bill-title"
                className="text-xl font-semibold text-gray-900"
              >
                Create Vendor Bill
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Originating Request: <Truncate text={refId} max={28} />
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={isSubmitting || isDetailsLoading}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── Body ─── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <InfoBanner>
              Labour is paid as a <strong>direct vendor bill</strong> (no PO).
              Review the approved request details, enter the invoice
              information, then submit. The bill enters the{" "}
              <strong>Payment Queue</strong> after submission.
            </InfoBanner>

            {/* ── Request Details ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Request Details
              </h3>
              {isDetailsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <InfoCard
                      key={i}
                      label="Loading…"
                      value=""
                      isLoading={true}
                    />
                  ))}
                </div>
              ) : isDetailsError ? (
                <InfoBanner type="warning">
                  Could not load full request details. Proceeding with
                  list-level data.
                </InfoBanner>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoCard label="Request ID" value={refId} />
                  <InfoCard label="Role / Trade" value={roleType} />
                  <InfoCard label="Project" value={projectName} />
                  <InfoCard label="WBS Element" value={wbs} />
                  <InfoCard label="Workers" value={String(workers)} />
                  <InfoCard label="Duration" value={duration} />
                  <InfoCard
                    label="Daily Rate"
                    value={formatCurrency(dailyRate)}
                  />
                  <InfoCard
                    label="Projected Cost"
                    value={formatCurrency(projectedCost)}
                  />
                  <InfoCard label="Date Required" value={dateRequired} />
                  <InfoCard label="Requested By" value={requester} />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200" />

            {/* ── File Upload ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Supplier Invoice / Timesheet (optional)
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                PDF or image up to 20 MB. Upload does not block submission.
              </p>
              {!uploadedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Drop document here or{" "}
                    <span className="text-blue-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, PNG, JPG up to 20 MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <File className="w-8 h-8 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
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
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200" />

            {/* ── Cost ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Invoice Cost
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approved Cost
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {roleType} labour ({workers} worker
                        {Number(workers) !== 1 ? "s" : ""})
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(projectedCost)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={effectiveInvoiceAmount}
                          onChange={(e) => {
                            setInvoiceAmount(e.target.value);
                            setDiscrepancyAck(false);
                          }}
                          disabled={isSubmitting || isDetailsLoading}
                          className="w-36 ml-auto block px-2.5 py-1.5 border border-gray-200 rounded text-right text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {hasDiscrepancy && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-900">
                    <p className="font-medium mb-1">
                      Amount differs from approved projected cost (
                      {formatCurrency(projectedCost)} vs{" "}
                      {formatCurrency(invoiceNum)})
                    </p>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={discrepancyAck}
                        onChange={(e) => setDiscrepancyAck(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300 text-blue-600"
                      />
                      <span>
                        I acknowledge this discrepancy and wish to submit
                        anyway.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200" />

            {/* ── Payment Details ── */}
            <div className="space-y-5">
              {/* Vendor */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Vendor
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  The vendor this labour bill will be issued to.
                </p>
                {isVendorsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading vendors…
                  </div>
                ) : labourVendors.length === 0 ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <span>
                      No labour vendors found. Create a Labour vendor first.
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        router.push("/invoice/vendor/new?vendor_type=labour")
                      }
                      className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm underline"
                    >
                      Create Labour vendor
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={effectiveVendorId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setVendorId(newId);
                        const newVendor = labourVendors.find(
                          (v: any) => v.id === Number(newId),
                        );
                        if (
                          newVendor?.payment_term &&
                          paymentTerms.length > 0
                        ) {
                          setPaymentTermId(String(newVendor.payment_term));
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    >
                      <option value="">Select vendor</option>
                      {labourVendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.vendor_name} — {v.vendor_type || "—"}
                        </option>
                      ))}
                    </select>
                    {vendorStale && (
                      <p className="text-red-500 text-xs mt-1.5">
                        The previously selected vendor is no longer a labour
                        vendor. Please select a labour vendor.
                      </p>
                    )}
                  </>
                )}
              </div>

{/* Bank Account (commented out - no longer required)
               <div>
                 <h3 className="text-sm font-semibold text-gray-700 mb-1">
                   Company Bank Account
                 </h3>
                 <p className="text-xs text-gray-500 mb-3">
                   Account the payment will be drawn from.
                 </p>
                 {isBanksLoading ? (
                   <div className="flex items-center gap-2 text-sm text-gray-500">
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Loading accounts…
                   </div>
                 ) : bankAccounts.length === 0 ? (
                   <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                     No active company bank accounts found. Add one under Invoice
                     settings before submitting.
                   </div>
                 ) : (
                   <select
                     value={bankAccountId}
                     onChange={(e) => setBankAccountId(e.target.value)}
                     disabled={isSubmitting}
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                   >
                     <option value="">Select bank account</option>
                     {bankAccounts.map((b: any) => (
                       <option key={b.id} value={b.id}>
                         {b.bank_name} — {b.account_name} (
                         {b.account_number_display || b.account_number})
                       </option>
                     ))}
                   </select>
                 )}
               </div>
             */}

               {/* Accounts Payable Account */}
               <div>
                 <h3 className="text-sm font-semibold text-gray-700 mb-1">
                   Accounts Payable Account
                 </h3>
                 <p className="text-xs text-gray-500 mb-3">
                   The liability account to record this vendor bill against.
                 </p>
                 {isAccountsPayableLoading ? (
                   <div className="flex items-center gap-2 text-sm text-gray-500">
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Loading accounts…
                   </div>
                 ) : accountsPayableAccounts.length === 0 ? (
                   <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                     No accounts payable accounts found. Configure accounts under
                     Chart of Accounts before submitting.
                   </div>
                 ) : (
                   <select
                     value={accountsPayableAccountId}
                     onChange={(e) => setAccountsPayableAccountId(e.target.value)}
                     disabled={isSubmitting}
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                   >
                     <option value="">Select accounts payable account</option>
                     {accountsPayableAccounts.map((a: any) => (
                       <option key={a.id} value={a.id}>
                         {a.label}
                       </option>
                     ))}
                   </select>
                 )}
               </div>

              {/* Payment Term */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Payment Term
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {effectivePaymentTermId
                    ? `Selected: ${selectedPaymentTermName || `Term #${effectivePaymentTermId}`}`
                    : "Choose the due-date terms for this vendor bill."}
                </p>
                {isPaymentTermsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading terms…
                  </div>
                ) : paymentTerms.length === 0 ? (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    No active payment terms found. Configure payment terms under
                    Invoice settings before submitting.
                  </div>
                ) : (
                  <select
                    value={
                      paymentTermId ||
                      (vendorPaymentTermId ? String(vendorPaymentTermId) : "")
                    }
                    onChange={(e) => setPaymentTermId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    <option value="">Select payment term</option>
                    {paymentTerms.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.days_until_due != null
                          ? ` (${t.days_until_due} days)`
                          : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <InfoBanner>
              After submit, the bill enters the <strong>Payment Queue</strong>.
              Only a user with the Payer permission can complete payment.
            </InfoBanner>
          </div>

          {/* ─── Footer ── */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isDetailsLoading}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
<button
              ref={submitButtonRef}
              type="button"
              onClick={handleSubmit}
               disabled={
                 isSubmitting ||
                 isDetailsLoading ||
                 accountsPayableAccounts.length === 0 ||
                 labourVendors.length === 0 ||
                !vendorId ||
                !selectedVendor ||
                vendorStale ||
                paymentTerms.length === 0
               }
               className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Vendor Bill"
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
