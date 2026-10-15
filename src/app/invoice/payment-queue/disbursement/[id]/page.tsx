"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import {
  Download,
  ExternalLink,
  Loader2,
  Landmark,
  Banknote,
  User,
  FileText,
  X,
  AlertTriangle,
  ChevronDown,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastNotification } from "@/components/shared/ToastNotification";
import {
  useGetDisbursementByIdQuery,
  useSubmitDisbursementMutation,
  useApproveDisbursementMutation,
  useRejectDisbursementMutation,
  useCancelDisbursementMutation,
  usePayDisbursementMutation,
  useDeleteDisbursementMutation,
} from "@/api/invoice/disbursementApi";
import { useGetCompanyQuery } from "@/api/settings/companyApi";
import { useGetPettyCashRequestQuery } from "@/api/requests/pettyCashRequestApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { DisbursementDocumentTemplate } from "@/components/invoice/export/DisbursementDocumentTemplate";

const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

function formatPersonName(raw?: string | null): string {
  if (!raw) return "—";
  return String(raw)
    .split(/[_\s.-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-800",
};

function statusLabel(status?: string | null) {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  const data = (err as any)?.data ?? err;
  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error === "string") return data.error;
  if (Array.isArray(data?.error) && data.error.length > 0) {
    const first = data.error[0];
    if (typeof first === "string") return first;
    if (typeof first?.detail === "string") return first.detail;
    if (typeof first?.message === "string") return first.message;
  }
  return (err as any)?.message || fallback;
}

type ConfirmVariant = "default" | "danger" | "primary";

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : variant === "primary"
        ? "bg-blue-600 hover:bg-blue-700 text-white"
        : "bg-gray-900 hover:bg-gray-800 text-white";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start gap-3">
          {variant === "danger" && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h3>
            <div className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {description}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${confirmClass}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectReasonModal({
  open,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3
              id="reject-title"
              className="text-lg font-semibold text-gray-900"
            >
              Reject disbursement
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Optionally provide a reason. This will be recorded with the
              rejection.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          ref={inputRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason (optional)"
          disabled={loading}
          className="mb-4 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="break-words text-sm font-medium text-gray-900">
        {value ?? "—"}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-gray-100" />
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-3 w-20 rounded bg-gray-100" />
              <div className="h-5 w-32 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ConfirmAction = "pay" | "cancel" | "delete" | null;

export default function DisbursementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const {
    data: d,
    isLoading,
    isFetching,
    refetch,
  } = useGetDisbursementByIdQuery(id, { skip: isNaN(id) });

  const [submitDisbursement, { isLoading: isSubmitting }] =
    useSubmitDisbursementMutation();
  const [approveDisbursement, { isLoading: isApproving }] =
    useApproveDisbursementMutation();
  const [rejectDisbursement, { isLoading: isRejecting }] =
    useRejectDisbursementMutation();
  const [cancelDisbursement, { isLoading: isCancelling }] =
    useCancelDisbursementMutation();
  const [payDisbursement, { isLoading: isPaying }] =
    usePayDisbursementMutation();
  const [deleteDisbursement, { isLoading: isDeleting }] =
    useDeleteDisbursementMutation();

  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: companyData } = useGetCompanyQuery();
  const { data: pcrData } = useGetPettyCashRequestQuery(
    (d?.petty_cash_request as number) || 0,
    { skip: !d?.petty_cash_request }
  );

  const user = useSelector((state: RootState) => (state as any).auth?.user);
  const tenant_company_name =
    useSelector((state: RootState) => (state as any).auth?.tenant_company_name) ||
    user?.company_name ||
    user?.tenant_name;

  const companyName =
    tenant_company_name ||
    (companyData as any)?.name ||
    (companyData as any)?.company_name ||
    "FastraSuite";
  const companyAddress = companyData?.street_address
    ? [companyData.street_address, companyData.city, companyData.state, companyData.country]
        .filter(Boolean)
        .join(", ")
    : (companyData as any)?.address || "";
  const companyPhone = companyData?.phone || "";
  const companyLogo = companyData?.logo || "";

  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "png" | null>(null);
  const [exportStatusText, setExportStatusText] = useState("Export");
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const captureElementToDataUrl = async (
    el: HTMLElement,
    format: "jpeg" | "png" = "jpeg",
  ): Promise<string> => {
    const blankPlaceholder =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAEDEB1CQAAAElFTkSuQmCC";

    const width = el.offsetWidth || 820;
    const height = el.offsetHeight || 1160;

    try {
      const options = {
        width,
        height,
        canvasWidth: width * 2,
        canvasHeight: height * 2,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
        fontEmbedCSS: "",
        cacheBust: false,
        imagePlaceholder: blankPlaceholder,
        style: {
          transform: "none",
          position: "relative",
          top: "0px",
          left: "0px",
          right: "auto",
          bottom: "auto",
          opacity: "1",
          visibility: "visible",
          display: "block",
        },
        onImageErrorHandler: (err: any) => {
          console.warn("Handled image load failure in export capture:", err);
        },
      };

      if (format === "png") {
        return await toPng(el, options);
      } else {
        return await toJpeg(el, { ...options, quality: 0.95 });
      }
    } catch (primaryErr) {
      console.warn("Primary html-to-image capture encountered an issue, running fallback:", primaryErr);
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width,
          height,
          windowWidth: width,
          windowHeight: height,
        });
        return canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.95);
      } catch (fallbackErr: any) {
        console.error("html2canvas fallback also failed:", fallbackErr);
        throw new Error(
          fallbackErr?.message ||
            (primaryErr instanceof Error ? primaryErr.message : "Document rendering failed. Please retry.")
        );
      }
    }
  };

  const handleExportDisbursement = async (format: "pdf" | "png" = "pdf") => {
    if (isExporting || !d) return;

    setIsExporting(true);
    setExportFormat(format);
    setExportStatusText("Preparing...");

    try {
      setExportStatusText(format === "pdf" ? "Generating PDF..." : "Capturing visual...");

      let element: HTMLElement | null = null;
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        element = exportContainerRef.current;
        if (element && element.offsetHeight > 200) {
          break;
        }
      }

      if (!element || element.offsetHeight < 100) {
        throw new Error("Document template could not be rendered for export.");
      }

      const cleanRef = (
        d.reference_number || `DIS-${d.id || "document"}`
      ).replace(/[^a-zA-Z0-9_-]/g, "_");

      if (format === "png") {
        const dataUrl = await captureElementToDataUrl(element, "png");
        setExportStatusText("Downloading...");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${cleanRef}_Petty_Cash_Disbursement.png`;
        link.click();
        showToast(
          `Disbursement ${d.reference_number || d.id} downloaded as an image.`,
          "success",
        );
      } else {
        const dataUrl = await captureElementToDataUrl(element, "jpeg");
        setExportStatusText("Formatting PDF...");

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 6;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        const elWidth = element.offsetWidth || 820;
        const elHeight = element.offsetHeight || 1160;

        let finalWidth = usableWidth;
        let finalHeight = (elHeight * usableWidth) / elWidth;

        if (finalHeight > usableHeight && finalHeight <= usableHeight * 1.15) {
          const scale = usableHeight / finalHeight;
          finalWidth = finalWidth * scale;
          finalHeight = usableHeight;
          const xOffset = margin + (usableWidth - finalWidth) / 2;
          pdf.addImage(dataUrl, "JPEG", xOffset, margin, finalWidth, finalHeight);
        } else if (finalHeight > usableHeight) {
          let position = margin;
          let remainingHeight = finalHeight;

          while (remainingHeight > 0) {
            pdf.addImage(dataUrl, "JPEG", margin, position, finalWidth, finalHeight);
            remainingHeight -= usableHeight;
            position -= usableHeight;
            if (remainingHeight > 0) {
              pdf.addPage();
            }
          }
        } else {
          pdf.addImage(dataUrl, "JPEG", margin, margin, finalWidth, finalHeight);
        }

        setExportStatusText("Downloading...");
        pdf.save(`${cleanRef}_Petty_Cash_Disbursement.pdf`);
        showToast(
          `Disbursement ${d.reference_number || d.id} downloaded as a PDF.`,
          "success",
        );
      }
    } catch (err: any) {
      console.error("Disbursement export error:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Failed to export disbursement.";
      showToast(errorMsg, "error");
    } finally {
      setIsExporting(false);
      setExportFormat(null);
      setExportStatusText("Export");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };
  const hideToast = () => setToast((p) => ({ ...p, show: false }));

  const isActionLoading =
    isSubmitting ||
    isApproving ||
    isRejecting ||
    isCancelling ||
    isPaying ||
    isDeleting;

  const currentStatus = (localStatus || d?.status || "").toLowerCase();

  const showSubmit = currentStatus === "draft";
  const showApprove = currentStatus === "submitted";
  const showReject = ["draft", "submitted"].includes(currentStatus);
  const showCancel = ["draft", "submitted", "approved"].includes(currentStatus);
  const showPay = currentStatus === "approved";
  const showDelete = currentStatus === "draft";
  const isReadOnly = ["paid", "rejected", "cancelled"].includes(currentStatus);

  const optimisticUpdate = (s: string) => {
    setActionPending(true);
    setLocalStatus(s);
  };
  const revertStatus = () => {
    if (d) setLocalStatus(d.status);
    setActionPending(false);
  };
  const finalize = async (s: string) => {
    setActionPending(false);
    setLocalStatus(s);
    await refetch();
  };

  const handleSubmit = async () => {
    if (!d) return;
    optimisticUpdate("submitted");
    try {
      await submitDisbursement({ id: d.id }).unwrap();
      await finalize("submitted");
      showToast(`Disbursement ${d.reference_number} submitted`, "success");
    } catch (err) {
      revertStatus();
      showToast(extractErrorMessage(err, "Failed to submit."), "error");
    }
  };

  const handleApprove = async () => {
    if (!d) return;
    optimisticUpdate("approved");
    try {
      await approveDisbursement({ id: d.id }).unwrap();
      await finalize("approved");
      showToast(`Disbursement ${d.reference_number} approved`, "success");
    } catch (err) {
      revertStatus();
      showToast(extractErrorMessage(err, "Failed to approve."), "error");
    }
  };

  const executeReject = async (reason: string) => {
    if (!d) return;
    setRejectOpen(false);
    optimisticUpdate("rejected");
    try {
      await rejectDisbursement({
        id: d.id,
        data: reason ? { notes: reason } : undefined,
      }).unwrap();
      await finalize("rejected");
      showToast(`Disbursement ${d.reference_number} rejected`, "success");
    } catch (err) {
      revertStatus();
      showToast(extractErrorMessage(err, "Failed to reject."), "error");
    }
  };

  const executeCancel = async () => {
    if (!d) return;
    setConfirmAction(null);
    optimisticUpdate("cancelled");
    try {
      await cancelDisbursement({ id: d.id }).unwrap();
      await finalize("cancelled");
      showToast(`Disbursement ${d.reference_number} cancelled`, "success");
    } catch (err) {
      revertStatus();
      showToast(extractErrorMessage(err, "Failed to cancel."), "error");
    }
  };

  const executePay = async () => {
    if (!d) return;
    setConfirmAction(null);
    optimisticUpdate("paid");
    try {
      await payDisbursement({
        id: d.id,
        data: {
          amount: d.amount,
          company_bank_account: d.company_bank_account,
        },
      }).unwrap();
      await finalize("paid");
      showToast(`Disbursement ${d.reference_number} paid`, "success");
    } catch (err) {
      revertStatus();
      showToast(extractErrorMessage(err, "Failed to pay."), "error");
    }
  };

  const executeDelete = async () => {
    if (!d) return;
    setConfirmAction(null);
    try {
      await deleteDisbursement(d.id).unwrap();
      showToast("Disbursement deleted", "success");
      router.push("/invoice/payment-queue/disbursement");
    } catch (err) {
      showToast(extractErrorMessage(err, "Failed to delete."), "error");
    }
  };

  const isCash = (d?.disbursement_method || "").toUpperCase() === "CASH";
  const isBank =
    (d?.disbursement_method || "").toUpperCase() === "BANK_TRANSFER";

  return (
    <PageGuard module="invoice" entitlement="view_accounts_payable_queue">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm">
          <ToastNotification
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>

        <ConfirmModal
          open={confirmAction === "pay"}
          title="Confirm payment"
          description={
            d ? (
              <>
                Pay{" "}
                <strong className="text-gray-900">
                  {formatCurrency(d.amount)}
                </strong>{" "}
                for{" "}
                <strong className="text-gray-900">{d.reference_number}</strong>?
                This will mark the disbursement as paid.
              </>
            ) : (
              "Confirm payment?"
            )
          }
          confirmLabel={isPaying || actionPending ? "Paying…" : "Pay now"}
          variant="primary"
          loading={isPaying || actionPending}
          onConfirm={executePay}
          onClose={() => setConfirmAction(null)}
        />

        <ConfirmModal
          open={confirmAction === "cancel"}
          title="Cancel disbursement"
          description={
            d ? (
              <>
                Cancel{" "}
                <strong className="text-gray-900">{d.reference_number}</strong>?
                This action cannot be undone.
              </>
            ) : (
              "Cancel this disbursement?"
            )
          }
          confirmLabel={
            isCancelling || actionPending
              ? "Cancelling…"
              : "Cancel disbursement"
          }
          variant="danger"
          loading={isCancelling || actionPending}
          onConfirm={executeCancel}
          onClose={() => setConfirmAction(null)}
        />

        <ConfirmModal
          open={confirmAction === "delete"}
          title="Delete draft"
          description={
            d ? (
              <>
                Permanently delete draft{" "}
                <strong className="text-gray-900">{d.reference_number}</strong>?
                This cannot be undone.
              </>
            ) : (
              "Delete this draft?"
            )
          }
          confirmLabel={isDeleting ? "Deleting…" : "Delete"}
          variant="danger"
          loading={isDeleting}
          onConfirm={executeDelete}
          onClose={() => setConfirmAction(null)}
        />

        <RejectReasonModal
          open={rejectOpen}
          loading={isRejecting || actionPending}
          onConfirm={executeReject}
          onClose={() => setRejectOpen(false)}
        />

        <div className="mx-auto max-w-4xl">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <button
              type="button"
              onClick={() => router.push("/invoice/payment-queue/disbursement")}
              className="hover:text-gray-700"
            >
              ← Disbursements
            </button>
            <span className="text-gray-300">›</span>
            <span className="max-w-[180px] truncate font-medium text-gray-800">
              {d?.reference_number || "Detail"}
            </span>
          </nav>

          {isLoading || isFetching ? (
            <DetailSkeleton />
          ) : !d ? (
            <div className="py-20 text-center text-gray-500">
              Disbursement not found.
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {d.reference_number || `DIS-${d.id}`}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Petty Cash Disbursement
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Export Disbursement Dropdown with Animated Loading UI */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isExporting}
                        className={cn(
                          "relative overflow-hidden h-9 px-3.5 text-xs font-semibold rounded-lg border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs transition-all",
                          isExporting &&
                            "border-blue-300 bg-blue-50/60 text-blue-700 pointer-events-none",
                        )}
                        aria-label="Export petty cash disbursement"
                      >
                        <AnimatePresence mode="wait">
                          {isExporting ? (
                            <motion.div
                              key="exporting"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-2"
                            >
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                              <span className="font-semibold text-blue-700 text-xs tracking-tight">
                                {exportStatusText}
                              </span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="idle"
                              initial={{ opacity: 0, y: 1 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -1 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <span>Export</span>
                              <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Hairline animated progress bar */}
                        {isExporting && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-100 overflow-hidden">
                            <motion.div
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.15,
                                ease: "easeInOut",
                              }}
                              className="h-full w-2/5 bg-blue-600 rounded-full"
                            />
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 rounded-xl shadow-xl border-gray-200 p-1.5"
                    >
                      <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Export Options
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleExportDisbursement("pdf")}
                        disabled={isExporting}
                        className="flex items-center gap-2.5 cursor-pointer px-2.5 py-2 rounded-lg hover:bg-blue-50 focus:bg-blue-50 text-xs font-medium text-gray-700"
                      >
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            Export as PDF
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Printable disbursement voucher
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExportDisbursement("png")}
                        disabled={isExporting}
                        className="flex items-center gap-2.5 cursor-pointer px-2.5 py-2 rounded-lg hover:bg-blue-50 focus:bg-blue-50 text-xs font-medium text-gray-700"
                      >
                        <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            Export as Image
                          </span>
                          <span className="text-[10px] text-gray-400">
                            High-resolution PNG
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <span
                    className={`inline-flex self-start rounded-full px-3 py-1.5 text-sm font-medium ${
                      statusStyles[currentStatus] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusLabel(currentStatus)}
                  </span>
                </div>
              </div>

              {isReadOnly && (
                <div
                  className={`mb-6 rounded-xl border p-4 text-sm font-medium ${
                    currentStatus === "paid"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  This disbursement is{" "}
                  <span className="capitalize">{currentStatus}</span>. No
                  further actions are available.
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="space-y-8 p-5 sm:p-6">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {formatCurrency(d.amount)}
                    </p>
                  </div>

                  <div>
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-600">
                      <User className="h-4 w-4 text-gray-400" />
                      Details
                    </h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <InfoField
                        label="Reference"
                        value={d.reference_number || `DIS-${d.id}`}
                      />
                      <InfoField
                        label="Requester"
                        value={formatPersonName(d.created_by_name)}
                      />
                      <InfoField
                        label="Method"
                        value={
                          isCash ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <Banknote className="h-3.5 w-3.5" />
                              Cash
                            </span>
                          ) : isBank ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              <Landmark className="h-3.5 w-3.5" />
                              Bank Transfer
                            </span>
                          ) : (
                            d.disbursement_method || "—"
                          )
                        }
                      />
                      <InfoField
                        label="Source"
                        value={(d.source_type || "PETTY_CASH").replace(
                          /_/g,
                          " ",
                        )}
                      />
                      {d.approved_by_name && (
                        <InfoField
                          label="Approved By"
                          value={formatPersonName(d.approved_by_name)}
                        />
                      )}
                      {d.approved_at && (
                        <InfoField
                          label="Approved At"
                          value={formatDateTime(d.approved_at)}
                        />
                      )}
                      {d.paid_at && (
                        <InfoField
                          label="Paid At"
                          value={formatDateTime(d.paid_at)}
                        />
                      )}
                      {d.payment_date && (
                        <InfoField
                          label="Payment Date"
                          value={formatDate(d.payment_date)}
                        />
                      )}
                      {d.payment_reference && (
                        <InfoField
                          label="Payment Reference"
                          value={d.payment_reference}
                        />
                      )}
                      {d.notes && <InfoField label="Notes" value={d.notes} />}
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-600">
                      {isCash ? (
                        <Banknote className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Landmark className="h-4 w-4 text-gray-400" />
                      )}
                      {isCash ? "Cash Recipient" : "Recipient Bank Details"}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {isCash && (
                        <>
                          <InfoField
                            label="Recipient Name"
                            value={d.recipient_name || "—"}
                          />
                          <InfoField
                            label="Cash Received"
                            value={
                              d.cash_received === true
                                ? "Yes"
                                : d.cash_received === false
                                  ? "No"
                                  : "—"
                            }
                          />
                        </>
                      )}
                      {isBank && (
                        <>
                          <InfoField
                            label="Account Name"
                            value={d.recipient_account_name || "—"}
                          />
                          <InfoField
                            label="Bank Name"
                            value={d.recipient_bank_name || "—"}
                          />
                          <InfoField
                            label="Account Number"
                            value={d.recipient_account_number || "—"}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-600">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Supporting Document
                    </h2>
                    {d.document ? (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            Signed voucher / document
                          </p>
                          <p className="text-xs text-gray-500">
                            Attached to this disbursement
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <a
                            href={d.document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-white hover:text-blue-700"
                            title="View"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                          <a
                            href={d.document}
                            download
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-white hover:text-blue-700"
                            title="Download"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        No document attached
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                {!isReadOnly && (
                  <>
                    {showSubmit && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="edit_invoice"
                      >
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={actionPending || isActionLoading}
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSubmitting || actionPending
                            ? "Submitting…"
                            : "Submit"}
                        </button>
                      </PermissionGuard>
                    )}
                    {showApprove && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="approve_invoice_for_payment_processing"
                      >
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={actionPending || isActionLoading}
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isApproving || actionPending
                            ? "Approving…"
                            : "Approve"}
                        </button>
                      </PermissionGuard>
                    )}
                    {showPay && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="execute_payment"
                      >
                        <button
                          type="button"
                          onClick={() => setConfirmAction("pay")}
                          disabled={actionPending || isActionLoading}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {(isPaying || actionPending) && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {isPaying || actionPending ? "Paying…" : "Pay"}
                        </button>
                      </PermissionGuard>
                    )}
                    {showReject && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="approve_invoice_for_payment_processing"
                      >
                        <button
                          type="button"
                          onClick={() => setRejectOpen(true)}
                          disabled={actionPending || isActionLoading}
                          className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isRejecting || actionPending
                            ? "Rejecting…"
                            : "Reject"}
                        </button>
                      </PermissionGuard>
                    )}
                    {showCancel && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="edit_invoice"
                      >
                        <button
                          type="button"
                          onClick={() => setConfirmAction("cancel")}
                          disabled={actionPending || isActionLoading}
                          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {isCancelling || actionPending
                            ? "Cancelling…"
                            : "Cancel"}
                        </button>
                      </PermissionGuard>
                    )}
                    {showDelete && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="edit_invoice"
                      >
                        <button
                          type="button"
                          onClick={() => setConfirmAction("delete")}
                          disabled={actionPending || isActionLoading}
                          className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                      </PermissionGuard>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() =>
                    router.push("/invoice/payment-queue/disbursement")
                  }
                  disabled={actionPending || isActionLoading}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>

        {/* Off-screen document container for high-fidelity export capture */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "820px",
            height: "0px",
            overflow: "visible",
            pointerEvents: "none",
            zIndex: -9999,
          }}
        >
          <div
            ref={exportContainerRef}
            style={{
              position: "relative",
              top: 0,
              left: 0,
              width: "820px",
              minHeight: "1160px",
              backgroundColor: "#ffffff",
              boxSizing: "border-box",
            }}
          >
            {d && (
              <DisbursementDocumentTemplate
                disbursement={d}
                pettyCashRequest={pcrData}
                companyName={companyName}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                companyLogo={companyLogo}
              />
            )}
          </div>
        </div>
      </div>
    </PageGuard>
  );
}
