"use client";

import React, { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import {
  Download,
  ExternalLink,
  AlertTriangle,
  Building2,
  FileText,
  CreditCard,
  User,
  Calendar,
  Loader2,
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
import BankSelectModal from "@/components/invoice/payment-queue/BankSelectModal";
import SuccessModal from "@/components/invoice/payment-queue/SuccessModal";
import { ToastNotification } from "@/components/shared/ToastNotification";
import {
  useGetVendorBillByIdQuery,
  usePayVendorBillMutation,
  useApproveVendorBillMutation,
  useRejectVendorBillMutation,
  useSubmitVendorBillMutation,
  useCancelVendorBillMutation,
  type CreateVendorBillRequest,
} from "@/api/invoice/vendorBillsApi";
import { useGetCompanyQuery } from "@/api/settings/companyApi";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageGuard } from "@/components/auth/PageGuard";
import { VendorBillDocumentTemplate } from "@/components/invoice/export/VendorBillDocumentTemplate";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const getDaysUntilDue = (dueDate: string | null): number | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const statusBadgeStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-800",
  partial: "bg-indigo-100 text-indigo-800",
};

const sourceTypeBadgeStyles: Record<string, string> = {
  SUBCONTRACTOR: "bg-purple-100 text-purple-800",
  LABOUR: "bg-teal-100 text-teal-800",
  PURCHASE: "bg-blue-100 text-blue-800",
  PROJECT_PO: "bg-blue-100 text-blue-800",
  PLANT_AND_EQUIPMENT: "bg-orange-100 text-orange-800",
  PETTY_CASH: "bg-amber-100 text-amber-800",
  default: "bg-gray-100 text-gray-700",
};

const getSourceTypeBadgeClass = (type?: string | null) => {
  if (!type) return sourceTypeBadgeStyles.default;
  const key = type.toUpperCase().replace(/\s+/g, "_");
  return sourceTypeBadgeStyles[key] || sourceTypeBadgeStyles.default;
};

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

const extractErrorMessage = (
  err: any,
  fallback = "An unexpected error occurred",
): string => {
  if (!err) return fallback;
  const data = err?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if (Array.isArray(data.error)) {
      return data.error
        .map((e: any) =>
          typeof e === "string"
            ? e
            : e?.error || e?.detail || e?.message || JSON.stringify(e),
        )
        .join("; ");
    }
    if (typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((d: any) =>
          typeof d === "string"
            ? d
            : d?.message || d?.error || JSON.stringify(d),
        )
        .join("; ");
    }
  }
  return err?.data?.error || err?.data?.detail || err?.message || fallback;
};

const isDev = process.env.NODE_ENV === "development";

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
              <div className="h-5 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="h-24 bg-gray-50 rounded-xl border border-gray-100" />
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 h-12" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 border-t border-gray-100 bg-white" />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <div className="h-10 w-24 bg-gray-100 rounded-lg" />
        <div className="h-10 w-28 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 wrap-break-word">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function PaymentQueueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const billId = Number(params?.id);

  const {
    data: invoice,
    isLoading,
    isFetching,
    refetch,
  } = useGetVendorBillByIdQuery(billId, { skip: isNaN(billId) });

  const [approveVendorBill, { isLoading: isApproving }] =
    useApproveVendorBillMutation();
  const [rejectVendorBill, { isLoading: isRejecting }] =
    useRejectVendorBillMutation();
  const [submitVendorBill, { isLoading: isSubmitting }] =
    useSubmitVendorBillMutation();
  const [payVendorBill, { isLoading: isPaying }] = usePayVendorBillMutation();
  const [cancelVendorBill, { isLoading: isCancelling }] =
    useCancelVendorBillMutation();

  const [showBankModal, setShowBankModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const { data: companyData } = useGetCompanyQuery();
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

  const handleExportBill = async (format: "pdf" | "png" = "pdf") => {
    if (isExporting || !invoice) return;

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

      const cleanBillNumber = (
        invoice.bill_number || `VB-${invoice.id || "document"}`
      ).replace(/[^a-zA-Z0-9_-]/g, "_");

      if (format === "png") {
        const dataUrl = await captureElementToDataUrl(element, "png");
        setExportStatusText("Downloading...");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${cleanBillNumber}_Vendor_Bill.png`;
        link.click();
        showToast(
          `Vendor Bill ${invoice.bill_number || invoice.id} downloaded as an image.`,
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
        pdf.save(`${cleanBillNumber}_Vendor_Bill.pdf`);
        showToast(
          `Vendor Bill ${invoice.bill_number || invoice.id} downloaded as a PDF.`,
          "success",
        );
      }
    } catch (err: any) {
      console.error("Vendor bill export error:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Failed to export vendor bill.";
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
  const hideToast = () => setToast((prev) => ({ ...prev, show: false }));

  const isActionLoading =
    isApproving || isRejecting || isPaying || isSubmitting || isCancelling;

  const currentStatus = (localStatus || invoice?.status || "").toLowerCase();

  const showSubmit = currentStatus === "draft";
  const showApprove = currentStatus === "submitted";
  const showReject = ["draft", "submitted"].includes(currentStatus);
  const showCancel = ["draft", "submitted", "approved", "partial"].includes(
    currentStatus,
  );
  const showPay = ["approved", "partial"].includes(currentStatus);
  const isReadOnlyStatus = ["paid", "rejected", "cancelled"].includes(
    currentStatus,
  );

  const optimisticUpdate = (newStatus: string) => {
    setActionPending(true);
    setLocalStatus(newStatus);
  };

  const revertStatus = () => {
    if (invoice) setLocalStatus(invoice.status);
    setActionPending(false);
  };

  const finalizeStatusChange = async (newStatus: string) => {
    setActionPending(false);
    setLocalStatus(newStatus);
    await refetch();
  };

  const handleSubmit = async () => {
    if (!invoice) return;
    const billNumber = invoice.bill_number || String(invoice.id);
    optimisticUpdate("submitted");
    try {
      await submitVendorBill({ id: invoice.id }).unwrap();
      await finalizeStatusChange("submitted");
      showToast(`Bill ${billNumber} submitted`, "success");
    } catch (err: any) {
      if (isDev) console.error("[payment-queue] submit failed", err);
      if (err?.status === 409) refetch();
      else if (err?.status === 403)
        showToast("You no longer have permission to act on this bill", "error");
      else {
        revertStatus();
        showToast(
          extractErrorMessage(err, "Failed to submit bill. Please try again."),
          "error",
        );
      }
    }
  };

  const handleApprove = async () => {
    if (!invoice) return;
    const billNumber = invoice.bill_number || String(invoice.id);
    optimisticUpdate("approved");
    try {
      await approveVendorBill({ id: invoice.id }).unwrap();
      await finalizeStatusChange("approved");
      showToast(`Bill ${billNumber} approved`, "success");
    } catch (err: any) {
      if (isDev) console.error("[payment-queue] approve failed", err);
      if (err?.status === 409) refetch();
      else if (err?.status === 403)
        showToast("You no longer have permission to act on this bill", "error");
      else {
        revertStatus();
        showToast(
          extractErrorMessage(err, "Failed to approve bill. Please try again."),
          "error",
        );
      }
    }
  };

  const handleReject = async () => {
    if (!invoice) return;
    const reason = window.prompt(
      "Enter a reason for rejecting this bill (optional):",
    );
    if (reason === null) return;

    const billNumber = invoice.bill_number || String(invoice.id);
    optimisticUpdate("rejected");
    try {
      await rejectVendorBill({
        id: invoice.id,
        data: reason
          ? ({ reason } as unknown as CreateVendorBillRequest)
          : undefined,
      }).unwrap();
      await finalizeStatusChange("rejected");
      showToast(`Bill ${billNumber} rejected`, "success");
    } catch (err: any) {
      if (isDev) console.error("[payment-queue] reject failed", err);
      if (err?.status === 409) refetch();
      else if (err?.status === 403)
        showToast("You no longer have permission to act on this bill", "error");
      else {
        revertStatus();
        showToast(
          extractErrorMessage(err, "Failed to reject bill. Please try again."),
          "error",
        );
      }
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    const confirmed = window.confirm(
      `Are you sure you want to cancel bill ${invoice.bill_number || invoice.id}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    const billNumber = invoice.bill_number || String(invoice.id);
    optimisticUpdate("cancelled");
    try {
      await cancelVendorBill({ id: invoice.id }).unwrap();
      await finalizeStatusChange("cancelled");
      showToast(`Bill ${billNumber} cancelled`, "success");
    } catch (err: any) {
      if (isDev) console.error("[payment-queue] cancel failed", err);
      if (err?.status === 409) refetch();
      else if (err?.status === 403)
        showToast("You no longer have permission to act on this bill", "error");
      else {
        revertStatus();
        showToast(
          extractErrorMessage(err, "Failed to cancel bill. Please try again."),
          "error",
        );
      }
    }
  };

  const handlePayBill = () => setShowBankModal(true);

  const handleConfirmPayment = async (
    bankId: string | null,
    amountToPay: number,
  ) => {
    if (!invoice) return;

    const resolvedBankId = bankId
      ? Number(bankId)
      : invoice.company_bank_account != null
        ? Number(invoice.company_bank_account)
        : null;

    if (resolvedBankId == null || Number.isNaN(resolvedBankId)) {
      showToast("Please select a company bank account", "error");
      return;
    }

    if (!Number.isFinite(amountToPay) || amountToPay <= 0) {
      showToast("Enter a valid amount to pay", "error");
      return;
    }

    const billNumber = invoice.bill_number || String(invoice.id);
    const balanceNum = Number(invoice.balance ?? invoice.amount ?? 0);
    // Soft guard (modal already validates); still protect API
    if (balanceNum > 0 && amountToPay > balanceNum + 0.001) {
      showToast(
        `Amount cannot exceed the outstanding balance (${formatCurrency(balanceNum)})`,
        "error",
      );
      return;
    }

    const willFullyPay =
      balanceNum > 0 && Math.abs(amountToPay - balanceNum) < 0.005;
    optimisticUpdate(willFullyPay ? "paid" : "partial");

    try {
      const payload = {
        amount: String(amountToPay),
        company_bank_account: resolvedBankId,
      };

      await payVendorBill({
        id: invoice.id,
        data: payload as unknown as CreateVendorBillRequest,
      }).unwrap();

      await finalizeStatusChange(willFullyPay ? "paid" : "partial");
      setShowBankModal(false);
      setShowSuccessModal(true);
      showToast(
        willFullyPay
          ? `Bill ${billNumber} paid successfully`
          : `Partial payment recorded for ${billNumber}`,
        "success",
      );
    } catch (err: any) {
      if (isDev) console.error("[payment-queue] pay failed", err);
      if (err?.status === 409) refetch();
      else if (err?.status === 403)
        showToast("You no longer have permission to act on this bill", "error");
      else {
        revertStatus();
        showToast(
          extractErrorMessage(err, "Failed to pay bill. Please try again."),
          "error",
        );
      }
      setShowBankModal(false);
    }
  };

  const handleDone = () => {
    setShowSuccessModal(false);
    router.push("/invoice/payment-queue");
  };

  const inv = invoice as any;

  const vendorName =
    inv?.vendor_details?.vendor_name || inv?.vendor_name || "—";
  const vendorCode = inv?.vendor_details?.vendor_code;
  const vendorContact = inv?.vendor_details?.contact_name;
  const vendorEmail = inv?.vendor_details?.email;
  const vendorPhone = inv?.vendor_details?.phone_number;

  const vendorBank = inv?.vendor_details?.bank_account;
  const vendorBankLabel = vendorBank
    ? `${vendorBank.bank_name} • ${vendorBank.bank_account_number}${
        vendorBank.confirmed ? "" : " (unconfirmed)"
      }`
    : null;

  const paymentTermName =
    inv?.payment_term_details?.name ||
    (inv?.payment_term ? `Term #${inv.payment_term}` : "—");

  const accountsPayableAccount = inv?.accounts_payable_account_details;
  const accountsPayableAccountLabel = accountsPayableAccount
    ? `${accountsPayableAccount.account_name || "Accounts Payable"}`
    : null;

  const projectName = inv?.source_details?.project?.name;
  const projectCode = inv?.source_details?.project?.project_code;
  const wbsName =
    inv?.source_details?.activity?.name ||
    inv?.source_details?.project_purchase_order?.wbs_element?.name;
  const sourceTypeDisplay =
    inv?.source_type_display === "Project Purchase Order"
      ? "Purchase Order"
      : inv?.source_type_display || inv?.source_type || "—";

  const approvedByName = inv?.approved_by_details
    ? `${inv.approved_by_details.first_name || ""} ${
        inv.approved_by_details.last_name || ""
      }`.trim() || inv.approved_by_details.email
    : null;

  const daysUntilDue = getDaysUntilDue(inv?.due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  const documentUrl = inv?.document_url || inv?.document;

  return (
    <PageGuard module="invoice" entitlement="view_accounts_payable_queue">
      <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
        <div className="fixed bottom-6 right-6 z-60 max-w-sm">
          <ToastNotification
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <button
              type="button"
              onClick={() => router.push("/invoice/payment-queue")}
              className="hover:text-gray-700"
              aria-label="Back to Payment Queue"
            >
              ←
            </button>
            <span>Home</span>
            <span className="text-gray-300">›</span>
            <span>Invoice</span>
            <span className="text-gray-300">›</span>
            <button
              type="button"
              onClick={() => router.push("/invoice/payment-queue")}
              className="hover:text-gray-700"
            >
              Payment Queue
            </button>
            <span className="text-gray-300">›</span>
            <span className="text-gray-800 font-medium truncate max-w-40">
              {inv?.bill_number || "Vendor Bill"}
            </span>
          </nav>
          {isLoading || isFetching ? (
            <DetailSkeleton />
          ) : !invoice ? (
            <div className="text-center py-20 text-gray-500">
              Vendor bill not found.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                    {inv.bill_number || `VB-${inv.id}`}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm text-gray-500">Vendor Bill</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceTypeBadgeClass(
                        inv?.source_type || inv?.source_type_display,
                      )}`}
                    >
                      {sourceTypeDisplay}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Export Bill Dropdown with Animated Loading UI */}
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
                        aria-label="Export vendor bill"
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

                        {/* Clean animated hairline progress bar */}
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
                        onClick={() => handleExportBill("pdf")}
                        disabled={isExporting}
                        className="flex items-center gap-2.5 cursor-pointer px-2.5 py-2 rounded-lg hover:bg-blue-50 focus:bg-blue-50 text-xs font-medium text-gray-700"
                      >
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            Export as PDF
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Formal printable document
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExportBill("png")}
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
                    className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                      statusBadgeStyles[currentStatus] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {inv.status_display || currentStatus}
                  </span>
                  {inv.payment_status && (
                    <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-medium capitalize bg-gray-50 text-gray-700 border border-gray-200">
                      {inv.payment_status_display || inv.payment_status}
                    </span>
                  )}
                </div>
              </div>
              {isReadOnlyStatus && (
                <div
                  className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
                    currentStatus === "paid"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  This bill is{" "}
                  <span className="capitalize">{currentStatus}</span>. No
                  further actions are available.
                </div>
              )}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-xs text-gray-500 mb-1">Amount</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(inv.amount)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-xs text-gray-500 mb-1">
                        Amount Paid
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(inv.amount_paid)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-xs text-gray-500 mb-1">Balance</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(inv.balance)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-xs text-gray-500 mb-1">
                        Days Until Due
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isOverdue ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {daysUntilDue === null
                          ? "—"
                          : isOverdue
                            ? `${Math.abs(daysUntilDue)}d overdue`
                            : `${daysUntilDue}d`}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-blue-500 mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      Vendor & Source
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <InfoField
                        label="Vendor"
                        value={
                          <span>
                            {vendorName}
                            {vendorCode && (
                              <span className="text-gray-400 font-normal">
                                {" "}
                                ({vendorCode})
                              </span>
                            )}
                          </span>
                        }
                        icon={<User className="w-3.5 h-3.5" />}
                      />
                      <InfoField
                        label="Contact"
                        value={
                          vendorContact || vendorEmail || vendorPhone
                            ? [vendorContact, vendorEmail, vendorPhone]
                                .filter(Boolean)
                                .join(" · ")
                            : "—"
                        }
                      />
                      <InfoField
                        label="Vendor Bank A/C"
                        value={
                          vendorBankLabel || (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Not confirmed
                            </span>
                          )
                        }
                        icon={<CreditCard className="w-3.5 h-3.5" />}
                      />
                      {(projectName || projectCode) && (
                        <InfoField
                          label="Project"
                          value={
                            projectCode ? `${projectName || ""}` : projectName
                          }
                        />
                      )}
                      {wbsName && (
                        <InfoField label="WBS / Activity" value={wbsName} />
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-blue-500 mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Dates & Payment Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <InfoField
                        label="Invoice Date"
                        value={formatDate(inv.invoice_date)}
                      />
                      <InfoField
                        label="Due Date"
                        value={formatDate(inv.due_date)}
                      />
                      <InfoField
                        label="Payment Terms"
                        value={paymentTermName}
                      />
                      <InfoField
                        label="Account"
                        value={accountsPayableAccountLabel || "Not selected"}
                        icon={<CreditCard className="w-3.5 h-3.5" />}
                      />
                      {approvedByName && (
                        <InfoField label="Approved By" value={approvedByName} />
                      )}
                      {inv.approved_at && (
                        <InfoField
                          label="Approved At"
                          value={formatDateTime(inv.approved_at)}
                        />
                      )}
                      {inv.paid_at && (
                        <InfoField
                          label="Paid At"
                          value={formatDateTime(inv.paid_at)}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-blue-500 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      Uploaded Document
                    </h2>
                    {documentUrl ? (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-3xl shrink-0">📄</div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              Invoice Document
                            </div>
                            <div className="text-xs text-gray-500">
                              Attached to this vendor bill
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-gray-600 hover:text-blue-700 hover:bg-white transition-colors"
                            title="View in new tab"
                            aria-label="View document"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                          <a
                            href={documentUrl}
                            download
                            className="p-2 rounded-lg text-gray-600 hover:text-blue-700 hover:bg-white transition-colors"
                            title="Download"
                            aria-label="Download document"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-500">
                        <div className="text-3xl">📄</div>
                        <div>
                          <div className="font-medium">No document</div>
                          <div className="text-xs">
                            No document was attached to this bill
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Line items — Qty Received removed */}
                  <div>
                    <h2 className="text-sm font-semibold text-blue-500 mb-3">
                      Cost Items
                    </h2>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-130">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit Price
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(inv.lines || []).length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-sm text-gray-500"
                                >
                                  No line items
                                </td>
                              </tr>
                            ) : (
                              inv.lines.map((line: any, idx: number) => {
                                const qty = Number(line.quantity || 0);
                                const price = Number(line.unit_price || 0);
                                const total =
                                  line.line_total != null
                                    ? Number(line.line_total)
                                    : qty * price;

                                const description =
                                  line.source?.item_name ||
                                  line.source?.product?.product_name ||
                                  line.description ||
                                  line.source?.name ||
                                  "—";

                                const needsTruncate = description.length > 52;
                                const displayDescription = needsTruncate
                                  ? `${description.slice(0, 52)}…`
                                  : description;

                                return (
                                  <tr
                                    key={line.id || idx}
                                    className="hover:bg-gray-50/60"
                                  >
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-65]">
                                      <span
                                        className="block truncate"
                                        title={
                                          needsTruncate
                                            ? description
                                            : undefined
                                        }
                                      >
                                        {displayDescription}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                      {line.quantity ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                      {line.unit_price
                                        ? formatCurrency(line.unit_price)
                                        : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                      {formatCurrency(total)}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-gray-200">
                              <td
                                colSpan={3}
                                className="px-4 py-3 text-sm font-semibold text-gray-900"
                              >
                                Total
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                {formatCurrency(inv.amount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 mt-6">
                {!isReadOnlyStatus && (
                  <>
                    {showSubmit && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="edit_invoice"
                      >
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          disabled={actionPending || isActionLoading}
                          aria-label="Submit bill"
                        >
                          {isSubmitting || actionPending
                            ? "Submitting…"
                            : "Submit Bill"}
                        </Button>
                      </PermissionGuard>
                    )}
                    {showApprove && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="approve_invoice_for_payment_processing"
                      >
                        <Button
                          variant="contained"
                          onClick={handleApprove}
                          disabled={actionPending || isActionLoading}
                          aria-label="Approve bill"
                        >
                          {isApproving || actionPending
                            ? "Approving…"
                            : "Approve Bill"}
                        </Button>
                      </PermissionGuard>
                    )}
                    {showReject && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="approve_invoice_for_payment_processing"
                      >
                        <Button
                          variant="outline"
                          onClick={handleReject}
                          disabled={actionPending || isActionLoading}
                          aria-label="Reject bill"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          {isRejecting || actionPending
                            ? "Rejecting…"
                            : "Reject Bill"}
                        </Button>
                      </PermissionGuard>
                    )}
                    {showCancel && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="edit_invoice"
                      >
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={actionPending || isActionLoading}
                          aria-label="Cancel bill"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {isCancelling || actionPending
                            ? "Cancelling…"
                            : "Cancel Bill"}
                        </Button>
                      </PermissionGuard>
                    )}
                    {showPay && (
                      <PermissionGuard
                        module="invoice"
                        entitlement="execute_payment"
                      >
                        <Button
                          variant="contained"
                          onClick={handlePayBill}
                          disabled={actionPending || isActionLoading}
                          aria-label="Pay bill"
                        >
                          {isPaying || actionPending
                            ? "Processing…"
                            : "Pay Bill"}
                        </Button>
                      </PermissionGuard>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push("/invoice/payment-queue")}
                  disabled={actionPending || isActionLoading}
                  aria-label="Back to queue"
                >
                  Back
                </Button>
              </div>
            </>
          )}
          <BankSelectModal
            isOpen={showBankModal}
            onClose={() => setShowBankModal(false)}
            onConfirm={handleConfirmPayment}
            currentBankAccountId={invoice?.company_bank_account}
            currentBankLabel={
              invoice?.company_bank_account_details?.bank_name ?? undefined
            }
            totalAmount={invoice?.amount}
            balance={invoice?.balance ?? invoice?.amount}
          />
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            onDone={handleDone}
          />
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
            {invoice && (
              <VendorBillDocumentTemplate
                bill={invoice}
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
