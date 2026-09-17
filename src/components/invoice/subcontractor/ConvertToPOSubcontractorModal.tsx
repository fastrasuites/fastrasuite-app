"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  InfoIcon,
  AlertTriangle,
  Loader2,
  Upload,
  File,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { useGetApprovedProjectRequestDetailsQuery } from "@/api/invoice/approvedProjectRequestsApi";
import { useGetActiveCurrenciesQuery } from "@/api/invoice/invoiceCurrencyApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { useGetVendorsByTypeQuery } from "@/api/invoice/vendorsApi";
import { useGetPaymentTermsQuery } from "@/api/invoice/paymentTermsApi";
import {
  useCreateVendorBillMutation,
  useGetAccountsPayableAccountsQuery,
} from "@/api/invoice/vendorBillsApi";
import { useMarkSubcontractorMilestoneCompleteMutation } from "@/api/subcontractorRequestApi";

interface Request {
  id: string;
  backendId?: number | string;
  sourceId?: number | string;
  type?: string;
  originalType?: string;
  [key: string]: any;
}

interface ConvertToPOSubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onNextStep: () => void;
  onBackStep: () => void;
  onConvertToInvoice?: () => void | Promise<void>;
  formatCurrency: (amount: number) => string;
  request: Request | null;
  isIssuing?: boolean;
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
      {needsTruncate && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden max-w-xs rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block"
        >
          {text}
        </span>
      )}
    </span>
  );
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function InfoCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 ${className}`}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900">
        <TruncateWithTooltip text={value} maxLength={42} />
      </p>
    </div>
  );
}

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

export default function ConvertToPOSubcontractorModal({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onBackStep,
  onConvertToInvoice,
  formatCurrency,
  request,
  isIssuing = false,
}: ConvertToPOSubcontractorModalProps) {
  const router = useRouter();

  /* ─── Visibility / toast state ─────────────────── */
  const [isVisible, setIsVisible] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  /* ─── Form state ────────────────────────────────── */
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [accountsPayableAccountId, setAccountsPayableAccountId] = useState("");
  const [paymentTermId, setPaymentTermId] = useState("");
  const [markingMilestoneId, setMarkingMilestoneId] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Request ID ────────────────────────────────── */
  const requestId = (() => {
    if (request?.backendId) return Number(request.backendId);
    if (request?.sourceId) return Number(request.sourceId);
    const match = String(request?.id || "").match(/(\d+)$/);
    return match ? Number(match[1]) : undefined;
  })();

  /* ─── Queries ───────────────────────────────────── */
  const {
    data: detailsData,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    refetch: refetchDetails,
  } = useGetApprovedProjectRequestDetailsQuery(requestId as number, {
    skip: !isOpen || !requestId,
  });

  const { data: activeCurrenciesResponse } = useGetActiveCurrenciesQuery();
  const activeCurrencies = Array.isArray(activeCurrenciesResponse)
    ? activeCurrenciesResponse
    : (activeCurrenciesResponse as any)?.results || [];
  const defaultCurrencyId =
    activeCurrencies.length > 0 ? activeCurrencies[0].id : 1;

  const { data: vendorsResponse, isLoading: isVendorsLoading } =
    useGetVendorsByTypeQuery(undefined, { skip: !isOpen });

  const {
    data: accountsPayableAccountsResponse,
    isLoading: isAccountsPayableLoading,
  } = useGetAccountsPayableAccountsQuery(undefined, { skip: !isOpen });

  const { data: paymentTermsResponse, isLoading: isPaymentTermsLoading } =
    useGetPaymentTermsQuery(undefined, { skip: !isOpen });

  const [createVendorBill, { isLoading: isSubmitting }] =
    useCreateVendorBillMutation();

  const [markMilestoneComplete] =
    useMarkSubcontractorMilestoneCompleteMutation();

  /* ─── Derived data ─────────────────────────────── */
  const vendors = Array.isArray(vendorsResponse) ? vendorsResponse : [];

  const subcontractorVendors = vendors.filter(
    (v: any) => v.vendor_type === "subcontractor",
  );

  const accountsPayableAccounts = Array.isArray(accountsPayableAccountsResponse)
    ? accountsPayableAccountsResponse
    : [];

  const paymentTerms = Array.isArray(paymentTermsResponse)
    ? paymentTermsResponse.filter((t: any) => t.is_active)
    : [];

  /* ─── Vendor & payment-term selection logic ─────── */
  const resolvedVendorId =
    vendorId || (detailsData?.vendor ? String(detailsData.vendor) : "");
  const effectiveVendorId = subcontractorVendors.some(
    (v: any) => v.id === Number(resolvedVendorId),
  )
    ? resolvedVendorId
    : "";
  const vendorStale =
    Boolean(vendorId) &&
    !subcontractorVendors.some((v: any) => v.id === Number(vendorId));
  const selectedVendor = subcontractorVendors.find(
    (v: any) => v.id === Number(effectiveVendorId),
  );
  const vendorPaymentTermId = selectedVendor?.payment_term;
  const effectivePaymentTermId =
    paymentTermId || (vendorPaymentTermId ? String(vendorPaymentTermId) : "");
  const selectedPaymentTermName = paymentTerms.find(
    (t: any) => t.id === Number(effectivePaymentTermId),
  )?.name;

  /* ─── Detail-derived display values ─────────────── */
  const vendorName =
    detailsData?.vendor_name ||
    (detailsData?.vendor ? `Vendor #${detailsData.vendor}` : "Not specified");

  const scopeOfWork = detailsData?.scope_of_work || "—";
  const contractValue = Number(detailsData?.contract_value) || 0;
  const projectName = detailsData?.project_details?.name || "—";
  const wbsLabel = detailsData
    ? `${detailsData.project_details?.name || "—"} › ${detailsData.phase_details?.name || "—"} › ${detailsData.activity_details?.name || "—"}`
    : "—";
  const paymentType = formatLabel(detailsData?.payment_type);
  const paymentTermsText = detailsData?.payment_terms || "—";
  const startDate = detailsData?.start_date || "—";
  const endDate = detailsData?.end_date || "—";
  const referenceId =
    detailsData?.project_request?.reference_id || request?.id || "—";
  const milestones = detailsData?.milestones ?? [];
  const justification = detailsData?.justification_notes || "";

  const rawPaymentType = detailsData?.payment_type || "lump_sum";
  const isMilestoneType = rawPaymentType === "milestone";

  // All milestones must be completed before we can create the bill
  const allMilestonesCompleted =
    milestones.length > 0 &&
    milestones.every((m: any) => m.is_completed === true);

  /* ─── Can submit? ───────────────────────────────── */
  const canSubmit =
    !isSubmitting &&
    !isDetailsLoading &&
    !isDetailsError &&
    subcontractorVendors.length > 0 &&
    accountsPayableAccounts.length > 0 &&
    paymentTerms.length > 0 &&
    Boolean(effectiveVendorId) &&
    Boolean(selectedVendor) &&
    !vendorStale &&
    Boolean(accountsPayableAccountId) &&
    Boolean(effectivePaymentTermId) &&
    // Extra gate for milestone type
    (!isMilestoneType || allMilestonesCompleted);

  /* ─── Focus on open ─────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      setTimeout(() => primaryButtonRef.current?.focus(), 100);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToast(null);
      setUploadedFile(null);
      setVendorId("");
      setAccountsPayableAccountId("");
      setPaymentTermId("");
      setMarkingMilestoneId(null);
    }
  }, [isOpen]);

  // Pre-fill vendor + payment term when details arrive
  useEffect(() => {
    if (!isOpen || !detailsData) return;

    if (detailsData.vendor && !vendorId) {
      const id = String(detailsData.vendor);
      if (subcontractorVendors.some((v: any) => v.id === Number(id))) {
        setVendorId(id);

        const vendor = subcontractorVendors.find(
          (v: any) => v.id === Number(id),
        );
        if (vendor?.payment_term && !paymentTermId) {
          setPaymentTermId(String(vendor.payment_term));
        }
      }
    }
  }, [isOpen, detailsData, subcontractorVendors, vendorId, paymentTermId]);

  if (!isOpen && !isVisible) return null;

  /* ─── Handlers ──────────────────────────────────── */
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
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

  const handleMarkComplete = async (milestoneId: number) => {
    setMarkingMilestoneId(milestoneId);
    try {
      await markMilestoneComplete(milestoneId).unwrap();
      showToast("success", "Milestone marked as completed");
      // Refresh the details so the UI updates immediately
      await refetchDetails();
    } catch (err: unknown) {
      showToast("error", extractErrorMessage(err));
    } finally {
      setMarkingMilestoneId(null);
    }
  };

  const handleSubmit = async () => {
    if (!detailsData?.id && !requestId) {
      showToast("error", "Unable to determine request ID. Please try again.");
      return;
    }
    if (!effectiveVendorId || !selectedVendor) {
      showToast("error", "Please select a subcontractor vendor");
      return;
    }
    if (!accountsPayableAccountId) {
      showToast("error", "Please select an accounts payable account");
      return;
    }
    if (!effectivePaymentTermId) {
      showToast("error", "Please select a payment term");
      return;
    }

    if (isMilestoneType && !allMilestonesCompleted) {
      showToast(
        "error",
        "All milestones must be marked as completed before creating the vendor bill.",
      );
      return;
    }

    const subcontractorRequestId = Number(detailsData?.id ?? requestId);
    const projectRequestId = Number(
      detailsData?.project_request?.id ?? requestId,
    );

    if (!subcontractorRequestId || !projectRequestId) {
      showToast("error", "Invalid request identifiers");
      return;
    }

    const formData = new FormData();
    formData.append("source_type", "SUBCONTRACTOR");
    formData.append("project_request", String(projectRequestId));
    formData.append("vendor", String(effectiveVendorId));
    formData.append("invoice_date", new Date().toISOString().split("T")[0]);
    formData.append("payment_term", String(effectivePaymentTermId));
    formData.append(
      "accounts_payable_account",
      String(accountsPayableAccountId),
    );

    if (uploadedFile) {
      formData.append("document", uploadedFile);
    }

    /* ─── Line mapping based on payment_type ────────────── */
    if (isMilestoneType) {
      const completed = milestones.filter((m: any) => m.is_completed);
      if (completed.length === 0) {
        showToast("error", "No completed milestones found.");
        return;
      }
      formData.append(
        "lines",
        JSON.stringify(
          completed.map((m: any) => ({
            subcontractor_milestone: Number(m.id),
          })),
        ),
      );
    } else {
      // lump_sum – link the entire contract to the subcontractor request
      formData.append(
        "lines",
        JSON.stringify([
          {
            subcontractor_request: subcontractorRequestId,
          },
        ]),
      );
    }

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

  /* ─── Step indicator ─────────────────────────────────── */
  const renderStepIndicator = () => (
    <div className="flex items-center gap-4 mb-6" aria-label="Progress">
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            currentStep === 1
              ? "bg-blue-600 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {currentStep === 1 ? 1 : <CheckCircle className="w-4 h-4" />}
        </div>
        <span
          className={`text-sm ${
            currentStep === 1 ? "text-gray-900 font-medium" : "text-gray-500"
          }`}
        >
          Review Details
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden />
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            currentStep === 2
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          2
        </div>
        <span
          className={`text-sm ${
            currentStep === 2 ? "text-gray-900 font-medium" : "text-gray-500"
          }`}
        >
          Confirm & Convert
        </span>
      </div>
    </div>
  );

  /* ─── Milestone status helpers ───────────────────────── */
  const getMilestoneStatus = (milestone: any, index: number) => {
    if (milestone.is_completed) return "completed";

    // Find the first incomplete milestone → that one is "in progress"
    const firstIncompleteIndex = milestones.findIndex(
      (m: any) => !m.is_completed,
    );
    if (index === firstIncompleteIndex) return "in_progress";

    return "locked";
  };

  /* ─── Milestones UI (Step 1 – with Mark as Complete) ─── */
  const renderMilestonesStep1 = () => {
    if (!milestones.length) {
      return (
        <div className="border border-gray-200 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
          No milestones defined
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
        {milestones.map((m: any, index: number) => {
          const status = getMilestoneStatus(m, index);
          const isMarking = markingMilestoneId === m.id;

          return (
            <div
              key={m.id ?? index}
              className="px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              {/* Left side – icon + name + badge + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {status === "completed" ? (
                    <Unlock className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : status === "in_progress" ? (
                    <Unlock className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  )}

                  <span className="text-sm font-medium text-gray-900">
                    {m.name || `Milestone ${index + 1}`}
                  </span>

                  {status === "completed" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  )}
                  {status === "in_progress" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      In progress
                    </span>
                  )}
                  {status === "locked" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Locked
                    </span>
                  )}
                </div>

                {/* Description / completion criteria */}
                {(m.completion_criteria || m.description) && (
                  <p className="text-xs text-gray-500 mt-0.5 ml-6">
                    {m.completion_criteria || m.description}
                  </p>
                )}

                {/* Optional green completion record box – only when backend later provides richer data */}
                {status === "completed" && m.completion_record && (
                  <div className="mt-2 ml-6 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
                    <p className="font-medium mb-0.5">PM Completion Record</p>
                    <p>{m.completion_record}</p>
                  </div>
                )}
              </div>

              {/* Right side – amount + action */}
              <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                {status === "in_progress" && (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(m.id)}
                    disabled={isMarking || isSubmitting}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isMarking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Marking…
                      </>
                    ) : (
                      "Mark as Complete"
                    )}
                  </button>
                )}

                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(Number(m.amount) || 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── Milestones UI (Step 2 – read-only, all completed) ─ */
  const renderMilestonesStep2 = () => {
    if (!milestones.length) {
      return (
        <div className="border border-gray-200 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
          No milestones defined (Lump Sum contract)
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
        {milestones.map((m: any, index: number) => (
          <div
            key={m.id ?? index}
            className="px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Unlock className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {m.name || `Milestone ${index + 1}`}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>
                {(m.completion_criteria || m.description) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    <TruncateWithTooltip
                      text={String(m.completion_criteria || m.description)}
                      maxLength={60}
                    />
                  </p>
                )}
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-900 shrink-0">
              {formatCurrency(Number(m.amount) || 0)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  /* ─── File upload UI ─────────────────────────────────── */
  const renderFileUpload = () => (
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
  );

  /* ─── Step 1: Review Details ──────────────────────── */
  const renderStep1 = () => (
    <>
      <div className="space-y-6">
        {isDetailsLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading subcontractor details…
          </div>
        ) : isDetailsError ? (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
            Failed to load details. Please close and try again.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <InfoCard label="Scope of Work" value={scopeOfWork} />
              <InfoCard
                label="Contract Value"
                value={formatCurrency(contractValue)}
              />
              <InfoCard label="Project Name" value={projectName} />
              <InfoCard label="WBS Element" value={wbsLabel} />
              <InfoCard label="Payment Type" value={paymentType} />
              <InfoCard label="Payment Terms" value={paymentTermsText} />
              <InfoCard label="Start Date" value={startDate} />
              <InfoCard label="End Date" value={endDate} />
            </div>

            {justification && (
              <div className="rounded-lg px-4 py-3 border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Justification Notes
                </p>
                <p className="text-sm text-gray-900">{justification}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Milestones
              </h3>
              {isMilestoneType ? (
                renderMilestonesStep1()
              ) : (
                <div className="border border-gray-200 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
                  No milestones defined (Lump Sum contract)
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-200 mb-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isIssuing}
          className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          ref={primaryButtonRef}
          type="button"
          onClick={onNextStep}
          disabled={
            isIssuing ||
            isDetailsLoading ||
            isDetailsError ||
            (isMilestoneType && !allMilestonesCompleted)
          }
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMilestoneType && !allMilestonesCompleted
            ? "Complete all milestones first"
            : "Review & Confirm"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  /* ─── Step 2: Confirm & Convert ─────────────────────── */
  const renderStep2 = () => (
    <>
      <div className="space-y-6">
        <InfoBanner type="warning">
          Once confirmed, a <strong>Vendor Bill</strong> will be created for{" "}
          <strong>
            <TruncateWithTooltip text={vendorName} maxLength={28} />
          </strong>
          . The Committed Amount of{" "}
          <strong>{formatCurrency(contractValue)}</strong> remains locked
          against{" "}
          <strong>
            <TruncateWithTooltip text={wbsLabel} maxLength={36} />
          </strong>{" "}
          until payment is confirmed or the bill is cancelled.
        </InfoBanner>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoCard label="Scope of Work" value={scopeOfWork} />
          <InfoCard
            label="Contract Value"
            value={formatCurrency(contractValue)}
          />
          <InfoCard label="Project Name" value={projectName} />
          <InfoCard label="Payment Type" value={paymentType} />
          <InfoCard label="WBS Element" value={wbsLabel} />
          <InfoCard label="Payment Terms" value={paymentTermsText} />
          <InfoCard label="Start Date" value={startDate} />
          <InfoCard label="End Date" value={endDate} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Milestones</h3>
          {isMilestoneType ? (
            renderMilestonesStep2()
          ) : (
            <div className="border border-gray-200 rounded-lg px-4 py-6 text-center text-sm text-gray-500">
              No milestones defined (Lump Sum contract)
            </div>
          )}
        </div>

        {/* File Upload */}
        {renderFileUpload()}

        {/* Vendor */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Subcontractor Vendor
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Select the subcontractor this vendor bill will be issued to.
          </p>
          {isVendorsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading vendors…
            </div>
          ) : subcontractorVendors.length === 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <span>
                No subcontractor vendors found. Create a Subcontractor vendor
                first.
              </span>
              <button
                type="button"
                onClick={() =>
                  router.push("/invoice/vendor/new?vendor_type=subcontractor")
                }
                className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm underline"
              >
                Create Subcontractor vendor
              </button>
            </div>
          ) : (
            <>
              <select
                value={effectiveVendorId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setVendorId(newId);
                  const newVendor = subcontractorVendors.find(
                    (v: any) => v.id === Number(newId),
                  );
                  if (newVendor?.payment_term && paymentTerms.length > 0) {
                    setPaymentTermId(String(newVendor.payment_term));
                  } else {
                    setPaymentTermId("");
                  }
                }}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="">Select vendor</option>
                {subcontractorVendors.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} — {v.vendor_type || "—"}
                  </option>
                ))}
              </select>
              {vendorStale && (
                <p className="text-red-500 text-xs mt-1.5">
                  The previously selected vendor is no longer a subcontractor
                  vendor. Please select a subcontractor vendor.
                </p>
              )}
            </>
          )}
        </div>

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
              No accounts payable accounts found. Configure accounts under Chart
              of Accounts before submitting.
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
              value={effectivePaymentTermId}
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

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-200 my-6">
        <button
          type="button"
          onClick={onBackStep}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
        >
          <span className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </span>
        </button>

        <button
          ref={primaryButtonRef}
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Vendor Bill…
            </>
          ) : (
            "Create Vendor Bill"
          )}
        </button>
      </div>
    </>
  );

  /* ─── Render ──────────────────────────────────────── */
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
        aria-labelledby="convert-sub-po-title"
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* ─── Header ─── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div>
              <h2
                id="convert-sub-po-title"
                className="text-xl font-semibold text-gray-900"
              >
                Convert to Vendor Bill
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Originating Request:{" "}
                <TruncateWithTooltip text={referenceId} maxLength={30} />
              </p>
            </div>
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── Body ─── */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {renderStepIndicator()}
            {currentStep === 1 ? renderStep1() : renderStep2()}

            <InfoBanner>
              After submit, the bill enters the <strong>Payment Queue</strong>.
              Only a user with the Payer permission can complete payment.
            </InfoBanner>
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
