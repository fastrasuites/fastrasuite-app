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
      className={`rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 ${className}`}
    >
      <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
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
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-blue-100 bg-blue-50 text-blue-800";
  const Icon = type === "warning" ? AlertTriangle : InfoIcon;
  return (
    <div className={`flex gap-2 rounded-lg border px-4 py-3 ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
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
  formatCurrency,
  request,
  isIssuing = false,
}: ConvertToPOSubcontractorModalProps) {
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [accountsPayableAccountId, setAccountsPayableAccountId] = useState("");
  const [paymentTermId, setPaymentTermId] = useState("");
  const [markingMilestoneId, setMarkingMilestoneId] = useState<number | null>(
    null,
  );
  /** Milestone selected for Create Bill (per-milestone billing) */
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestId = (() => {
    if (request?.backendId) return Number(request.backendId);
    if (request?.sourceId) return Number(request.sourceId);
    const match = String(request?.id || "").match(/(\d+)$/);
    return match ? Number(match[1]) : undefined;
  })();

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
  const startDate = detailsData?.start_date || "—";
  const endDate = detailsData?.end_date || "—";
  const referenceId = detailsData?.reference_id || request?.id || "—";
  const milestones = detailsData?.milestones ?? [];
  const justification = detailsData?.justification_notes || "";

  const rawPaymentType = detailsData?.payment_type || "lump_sum";
  const isMilestoneType = rawPaymentType === "milestone";

  const selectedMilestone = milestones.find(
    (m: any) => m.id === selectedMilestoneId,
  );
  const billAmount = isMilestoneType
    ? Number(selectedMilestone?.amount) || 0
    : contractValue;

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
    // Milestone: must have selected an unbilled completed milestone
    (!isMilestoneType ||
      (selectedMilestoneId != null &&
        selectedMilestone?.is_completed === true &&
        selectedMilestone?.is_billed !== true));

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
      setToast(null);
      setUploadedFile(null);
      setVendorId("");
      setAccountsPayableAccountId("");
      setPaymentTermId("");
      setMarkingMilestoneId(null);
      setSelectedMilestoneId(null);
    }
  }, [isOpen]);

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
      await refetchDetails();
    } catch (err: unknown) {
      showToast("error", extractErrorMessage(err));
    } finally {
      setMarkingMilestoneId(null);
    }
  };

  /** Per-milestone: open step 2 to bill this completed milestone */
  const handleCreateBillForMilestone = (milestoneId: number) => {
    const m = milestones.find((x: any) => x.id === milestoneId);
    if (!m?.is_completed) {
      showToast("error", "Milestone must be completed before creating a bill.");
      return;
    }
    if (m.is_billed) {
      showToast("error", "A bill has already been created for this milestone.");
      return;
    }
    setSelectedMilestoneId(milestoneId);
    onNextStep();
  };

  const handleBack = () => {
    setSelectedMilestoneId(null);
    onBackStep();
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

    if (isMilestoneType) {
      if (selectedMilestoneId == null) {
        showToast("error", "No milestone selected for billing.");
        return;
      }
      const m = milestones.find((x: any) => x.id === selectedMilestoneId);
      if (!m?.is_completed) {
        showToast("error", "Selected milestone is not completed.");
        return;
      }
      if (m.is_billed) {
        showToast(
          "error",
          "A bill has already been created for this milestone.",
        );
        return;
      }
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

    if (isMilestoneType) {
      // One bill per milestone — send only the selected milestone id
      formData.append(
        "lines",
        JSON.stringify([
          {
            subcontractor_milestone: Number(selectedMilestoneId),
          },
        ]),
      );
    } else {
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

  const renderStepIndicator = () => (
    <div className="mb-6 flex items-center gap-4" aria-label="Progress">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
            currentStep === 1
              ? "bg-blue-600 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {currentStep === 1 ? 1 : <CheckCircle className="h-4 w-4" />}
        </div>
        <span
          className={`text-sm ${
            currentStep === 1 ? "font-medium text-gray-900" : "text-gray-500"
          }`}
        >
          Review Details
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300" aria-hidden />
      <div className="flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
            currentStep === 2
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          2
        </div>
        <span
          className={`text-sm ${
            currentStep === 2 ? "font-medium text-gray-900" : "text-gray-500"
          }`}
        >
          Confirm & Convert
        </span>
      </div>
    </div>
  );

  const getMilestoneStatus = (milestone: any, index: number) => {
    if (milestone.is_completed) return "completed";
    const firstIncompleteIndex = milestones.findIndex(
      (m: any) => !m.is_completed,
    );
    if (index === firstIncompleteIndex) return "in_progress";
    return "locked";
  };

  const renderMilestonesStep1 = () => {
    if (!milestones.length) {
      return (
        <div className="rounded-lg border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          No milestones defined
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
        {milestones.map((m: any, index: number) => {
          const status = getMilestoneStatus(m, index);
          const isMarking = markingMilestoneId === m.id;
          const isBilled = m.is_billed === true;

          return (
            <div
              key={m.id ?? index}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {status === "locked" ? (
                    <Lock className="h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <Unlock className="h-4 w-4 shrink-0 text-amber-500" />
                  )}

                  <span className="text-sm font-medium text-gray-900">
                    {m.name || `Milestone ${index + 1}`}
                  </span>

                  {status === "completed" && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Completed
                    </span>
                  )}
                  {status === "in_progress" && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      In progress
                    </span>
                  )}
                  {status === "locked" && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      Locked
                    </span>
                  )}
                  {isBilled && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Billed
                    </span>
                  )}
                </div>

                {(m.completion_criteria || m.description) && (
                  <p className="ml-6 mt-0.5 text-xs text-gray-500">
                    {m.completion_criteria || m.description}
                  </p>
                )}

                {status === "completed" && m.completion_record && (
                  <div className="ml-6 mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                    <p className="mb-0.5 font-medium">PM Completion Record</p>
                    <p>{String(m.completion_record)}</p>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3 sm:ml-4">
                {status === "in_progress" && (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(m.id)}
                    disabled={isMarking || isSubmitting}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isMarking ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Marking…
                      </>
                    ) : (
                      "Mark as Complete"
                    )}
                  </button>
                )}

                {status === "completed" &&
                  (isBilled ? (
                    <span
                      className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500"
                      title="A vendor bill has already been created for this milestone"
                    >
                      Bill created
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCreateBillForMilestone(m.id)}
                      disabled={isSubmitting}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Create Bill
                    </button>
                  ))}

                <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
                  {formatCurrency(Number(m.amount) || 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMilestonesStep2 = () => {
    if (!isMilestoneType) {
      return (
        <div className="rounded-lg border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          No milestones defined (Lump Sum contract)
        </div>
      );
    }

    if (!selectedMilestone) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          No milestone selected. Go back and choose <strong>Create Bill</strong>{" "}
          on a completed milestone.
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Unlock className="h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900">
                  {selectedMilestone.name ||
                    `Milestone #${selectedMilestone.id}`}
                </span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Completed
                </span>
              </div>
              {(selectedMilestone.completion_criteria ||
                selectedMilestone.description) && (
                <p className="mt-0.5 text-xs text-gray-500">
                  <TruncateWithTooltip
                    text={String(
                      selectedMilestone.completion_criteria ||
                        selectedMilestone.description,
                    )}
                    maxLength={60}
                  />
                </p>
              )}
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-gray-900">
            {formatCurrency(Number(selectedMilestone.amount) || 0)}
          </span>
        </div>
      </div>
    );
  };

  const renderFileUpload = () => (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-gray-700">
        Supplier Invoice / Timesheet (optional)
      </h3>
      <p className="mb-3 text-xs text-gray-500">
        PDF or image up to 20 MB. Upload does not block submission.
      </p>
      {!uploadedFile ? (
        <div
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
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
          <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drop document here or{" "}
            <span className="font-medium text-blue-600">browse</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
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
            onClick={() => {
              setUploadedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <>
      <div className="space-y-6">
        {isDetailsLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading subcontractor details…
          </div>
        ) : isDetailsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load details. Please close and try again.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <InfoCard label="Scope of Work" value={scopeOfWork} />
              <InfoCard
                label="Contract Value"
                value={formatCurrency(contractValue)}
              />
              <InfoCard label="Project Name" value={projectName} />
              <InfoCard label="WBS Element" value={wbsLabel} />
              <InfoCard label="Payment Type" value={paymentType} />
              <InfoCard label="Start Date" value={startDate} />
              <InfoCard label="End Date" value={endDate} />
            </div>

            {justification && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                  Justification Notes
                </p>
                <p className="text-sm text-gray-900">{justification}</p>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                Milestones
              </h3>
              {isMilestoneType ? (
                renderMilestonesStep1()
              ) : (
                <div className="rounded-lg border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                  No milestones defined (Lump Sum contract)
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mb-6 flex flex-col-reverse items-center justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          disabled={isIssuing}
          className="w-full rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          Cancel
        </button>

        {/* Lump sum only: Review & Confirm. Milestone uses per-row Create Bill. */}
        {!isMilestoneType && (
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={onNextStep}
            disabled={isIssuing || isDetailsLoading || isDetailsError}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Review & Confirm
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="space-y-6">
        <InfoBanner type="warning">
          Once confirmed, a <strong>Vendor Bill</strong> will be created
          {isMilestoneType && selectedMilestone ? (
            <>
              {" "}
              for milestone{" "}
              <strong>
                {selectedMilestone.name || `#${selectedMilestone.id}`}
              </strong>{" "}
              (<strong>{formatCurrency(billAmount)}</strong>)
            </>
          ) : (
            <>
              . The Committed Amount of{" "}
              <strong>{formatCurrency(contractValue)}</strong>
            </>
          )}{" "}
          remains locked against{" "}
          <strong>
            <TruncateWithTooltip text={wbsLabel} maxLength={36} />
          </strong>{" "}
          until payment is confirmed or the bill is cancelled.
        </InfoBanner>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoCard label="Scope of Work" value={scopeOfWork} />
          <InfoCard
            label={isMilestoneType ? "Milestone Amount" : "Contract Value"}
            value={formatCurrency(billAmount)}
          />
          <InfoCard label="Project Name" value={projectName} />
          <InfoCard label="Payment Type" value={paymentType} />
          <InfoCard label="WBS Element" value={wbsLabel} />
          <InfoCard label="Start Date" value={startDate} />
          <InfoCard label="End Date" value={endDate} />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            {isMilestoneType ? "Milestone to bill" : "Milestones"}
          </h3>
          {renderMilestonesStep2()}
        </div>

        {renderFileUpload()}

        <div>
          <h3 className="mb-1 text-sm font-semibold text-gray-700">
            Subcontractor Vendor
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            Select the subcontractor this vendor bill will be issued to.
          </p>
          {isVendorsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading vendors…
            </div>
          ) : subcontractorVendors.length === 0 ? (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 sm:flex-row sm:items-center">
              <span>
                No subcontractor vendors found. Create a Subcontractor vendor
                first.
              </span>
              <button
                type="button"
                onClick={() =>
                  router.push("/invoice/vendor/new?vendor_type=subcontractor")
                }
                className="text-xs font-medium text-blue-600 underline hover:text-blue-700 sm:text-sm"
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
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="">Select vendor</option>
                {subcontractorVendors.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} — {v.vendor_type || "—"}
                  </option>
                ))}
              </select>
              {vendorStale && (
                <p className="mt-1.5 text-xs text-red-500">
                  The previously selected vendor is no longer a subcontractor
                  vendor. Please select a subcontractor vendor.
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-gray-700">
            Accounts Payable Account
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            The liability account to record this vendor bill against.
          </p>
          {isAccountsPayableLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading accounts…
            </div>
          ) : accountsPayableAccounts.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No accounts payable accounts found. Configure accounts under Chart
              of Accounts before submitting.
            </div>
          ) : (
            <select
              value={accountsPayableAccountId}
              onChange={(e) => setAccountsPayableAccountId(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
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

        <div>
          <h3 className="mb-1 text-sm font-semibold text-gray-700">
            Payment Term
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            {effectivePaymentTermId
              ? `Selected: ${selectedPaymentTermName || `Term #${effectivePaymentTermId}`}`
              : "Choose the due-date terms for this vendor bill."}
          </p>
          {isPaymentTermsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading terms…
            </div>
          ) : paymentTerms.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No active payment terms found. Configure payment terms under
              Invoice settings before submitting.
            </div>
          ) : (
            <select
              value={effectivePaymentTermId}
              onChange={(e) => setPaymentTermId(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
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

      <div className="my-6 flex flex-col-reverse items-center justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          <span className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back
          </span>
        </button>

        <button
          ref={primaryButtonRef}
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Vendor Bill…
            </>
          ) : (
            "Create Vendor Bill"
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
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
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2
                id="convert-sub-po-title"
                className="text-xl font-semibold text-gray-900"
              >
                Convert to Vendor Bill
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Originating Request:{" "}
                <TruncateWithTooltip text={referenceId} maxLength={30} />
              </p>
            </div>
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
