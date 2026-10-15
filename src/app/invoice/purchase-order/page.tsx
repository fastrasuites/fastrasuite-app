"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import {
  Search,
  Eye,
  RefreshCw,
  FileText,
  Filter,
  X,
  Loader2,
  FileEdit,
  Send,
  PackageOpen,
  PackageCheck,
  Receipt,
  Ban,
  Download,
  ChevronDown,
  ImageIcon,
  type LucideIcon,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import {
  useGetPurchaseOrdersQuery,
  useLazyGetPurchaseOrderByIdQuery,
} from "@/api/invoice/projectPurchaseOrdersApi";
import { useGetCompanyQuery } from "@/api/settings/companyApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PurchaseOrderDocumentTemplate } from "@/components/invoice/export/PurchaseOrderDocumentTemplate";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatToSentenceCase = (text?: string | null) => {
  if (!text) return "—";
  return text
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** UI-only labels for source_request_type (API values unchanged) */
function formatRequestTypeLabel(type?: string | null): string {
  if (!type) return "—";
  const key = type.toLowerCase().trim();

  const labels: Record<string, string> = {
    project_purchase_request: "Purchase Request",
  };

  if (labels[key]) return labels[key];

  return formatToSentenceCase(type);
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

function resolveWbsLabel(order: any): string | null {
  const details =
    order.wbs_element_details ||
    order.wbs_details ||
    order.activity_details ||
    null;

  if (details && typeof details === "object") {
    const name = details.name || details.code || details.label;
    if (name) return String(name);
  }

  const raw = order.wbs_element;
  if (typeof raw === "string" && raw.trim()) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        raw.trim(),
      );
    if (!isUuid) return raw;
  }

  return null;
}

const getTypeColor = (type?: string | null) => {
  const t = (type || "").toLowerCase();
  if (t.includes("subcontractor")) return "bg-purple-50 text-purple-700";
  if (t.includes("plant") || t.includes("equipment"))
    return "bg-emerald-50 text-emerald-700";
  if (t.includes("purchase") || t.includes("material"))
    return "bg-blue-50 text-blue-700";
  return "bg-gray-50 text-gray-700";
};

const getStatusBadge = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  let color = "bg-gray-100 text-gray-700";

  if (s === "draft") color = "bg-amber-100 text-amber-800";
  else if (s === "issued") color = "bg-blue-100 text-blue-800";
  else if (s === "partially_received") color = "bg-teal-100 text-teal-800";
  else if (s === "fully_received") color = "bg-green-100 text-green-800";
  else if (s === "partially_billed") color = "bg-indigo-100 text-indigo-800";
  else if (s === "fully_billed") color = "bg-violet-100 text-violet-800";
  else if (s === "closed") color = "bg-slate-100 text-slate-700";
  else if (s === "cancelled" || s === "canceled")
    color = "bg-red-100 text-red-800";

  const label = status
    ? status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Unknown";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "partially_received", label: "Partially Received" },
  { value: "fully_received", label: "Fully Received" },
  { value: "partially_billed", label: "Partially Billed" },
  { value: "fully_billed", label: "Fully Billed" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

type SummaryCardConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  countClass: string;
  matchStatuses: string[];
};

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: "draft",
    label: "Draft",
    icon: FileEdit,
    iconClass: "text-amber-500",
    countClass: "text-amber-600",
    matchStatuses: ["draft"],
  },
  {
    key: "issued",
    label: "Issued",
    icon: Send,
    iconClass: "text-blue-600",
    countClass: "text-blue-600",
    matchStatuses: ["issued"],
  },
  {
    key: "partially_received",
    label: "Partially Received",
    icon: PackageOpen,
    iconClass: "text-teal-600",
    countClass: "text-teal-600",
    matchStatuses: ["partially_received"],
  },
  {
    key: "fully_received",
    label: "Fully Received",
    icon: PackageCheck,
    iconClass: "text-emerald-600",
    countClass: "text-emerald-600",
    matchStatuses: ["fully_received"],
  },
  {
    key: "billed",
    label: "Billed",
    icon: Receipt,
    iconClass: "text-violet-600",
    countClass: "text-violet-600",
    matchStatuses: ["partially_billed", "fully_billed"],
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: Ban,
    iconClass: "text-red-500",
    countClass: "text-red-500",
    matchStatuses: ["cancelled", "canceled"],
  },
];

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="h-4 w-28 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-5 w-24 rounded-full bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-36 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-24 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-20 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="h-5 w-24 rounded-full bg-gray-200" />
          </td>
          <td className="px-4 py-4">
            <div className="mx-auto h-8 w-16 rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function PurchaseOrderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const statusModal = useStatusModal();
  const [fetchPoDetail] = useLazyGetPurchaseOrderByIdQuery();
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

  const [exportingPoId, setExportingPoId] = useState<string | number | null>(null);
  const [exportFormat, setExportFormat] = useState<"pdf" | "png" | null>(null);
  const [exportStatusText, setExportStatusText] = useState("Export");
  const [activeExportOrder, setActiveExportOrder] = useState<any>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: purchaseOrders = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetPurchaseOrdersQuery({});

  const orders = Array.isArray(purchaseOrders)
    ? purchaseOrders
    : (purchaseOrders as any)?.results || [];

  const requestTypes = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o: any) => {
      if (o.source_request_type) set.add(o.source_request_type);
    });
    return Array.from(set).sort();
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of SUMMARY_CARDS) {
      counts[card.key] = 0;
    }
    for (const order of orders) {
      const s = (order.status || "").toLowerCase();
      for (const card of SUMMARY_CARDS) {
        if (card.matchStatuses.includes(s)) {
          counts[card.key] = (counts[card.key] || 0) + 1;
          break;
        }
      }
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order: any) => {
      if (statusFilter && (order.status || "").toLowerCase() !== statusFilter) {
        return false;
      }
      if (
        typeFilter &&
        (order.source_request_type || "").toLowerCase() !==
          typeFilter.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;

      const wbsLabel = resolveWbsLabel(order) || "";
      const haystack = [
        order.po_number,
        order.vendor_name,
        order.source_request_type,
        formatRequestTypeLabel(order.source_request_type),
        order.status,
        wbsLabel,
        order.project_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, searchTerm, statusFilter, typeFilter]);

  const hasActiveFilters = Boolean(statusFilter || typeFilter || searchTerm);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
  };

  const handleCardClick = (card: SummaryCardConfig) => {
    if (card.key === "billed") {
      if (
        statusFilter === "partially_billed" ||
        statusFilter === "fully_billed"
      ) {
        setStatusFilter("");
      } else {
        setStatusFilter("fully_billed");
      }
      return;
    }
    const target = card.matchStatuses[0];
    setStatusFilter((prev) => (prev === target ? "" : target));
  };

  const showWbsColumn = useMemo(
    () => filteredOrders.some((o: any) => resolveWbsLabel(o)),
    [filteredOrders],
  );

  const colCount = showWbsColumn ? 7 : 6;

  // Robust DOM to Image capture helper with font-skipping & html2canvas fallback
  const captureElementToDataUrl = async (
    el: HTMLElement,
    format: "jpeg" | "png" = "jpeg"
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

  const handleExportPo = async (order: any, format: "pdf" | "png" = "pdf") => {
    if (exportingPoId !== null) return;
    if (!order) {
      statusModal.showError("Export Error", "No purchase order selected for export.");
      return;
    }

    setExportingPoId(order.id);
    setExportFormat(format);
    setExportStatusText("Preparing...");

    try {
      let fullOrder = order;
      // Fetch full line details if lines are missing or empty
      if (!order.lines || !Array.isArray(order.lines) || order.lines.length === 0) {
        setExportStatusText("Fetching items...");
        try {
          const fetched = await fetchPoDetail(order.id).unwrap();
          if (fetched) {
            fullOrder = fetched;
          }
        } catch (fetchErr) {
          console.warn("Could not fetch full PO detail, proceeding with summary:", fetchErr);
        }
      }

      setActiveExportOrder(fullOrder);

      setExportStatusText(format === "pdf" ? "Generating PDF..." : "Capturing visual...");

      // Wait for DOM paint and confirm the element is rendered and non-empty
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

      const cleanPoNumber = (
        fullOrder.po_number || `PO-${fullOrder.id || "document"}`
      ).replace(/[^a-zA-Z0-9_-]/g, "_");

      if (format === "png") {
        const dataUrl = await captureElementToDataUrl(element, "png");
        setExportStatusText("Downloading...");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${cleanPoNumber}_Purchase_Order.png`;
        link.click();
        statusModal.showSuccess(
          "Export Successful",
          `Purchase Order ${fullOrder.po_number || fullOrder.id} has been downloaded as an image.`
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
        pdf.save(`${cleanPoNumber}_Purchase_Order.pdf`);
        statusModal.showSuccess(
          "Export Successful",
          `Purchase Order ${fullOrder.po_number || fullOrder.id} has been downloaded as a PDF.`
        );
      }
    } catch (err: any) {
      console.error("Purchase order export error:", err);
      let errorMsg = "An unexpected error occurred during export.";
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "string") {
        errorMsg = err;
      } else if (err && typeof err === "object") {
        if ("message" in err && typeof err.message === "string") {
          errorMsg = err.message;
        } else if (err.type || err.target) {
          errorMsg = "Resource rendering error. Please try again.";
        }
      }
      statusModal.showError("Export Failed", `Failed to generate export document: ${errorMsg}`);
    } finally {
      setExportingPoId(null);
      setExportFormat(null);
      setExportStatusText("Export");
    }
  };

  return (
    <PageGuard module="invoice" entitlement="view_purchase_orders">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>Invoice</span>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-gray-900">Purchase Orders</span>
        </nav>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Purchase Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Issued and draft POs converted from approved requests. Filter by
              vendor, status, or type.
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-start">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {filteredOrders.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={exportingPoId !== null}
                    className={cn(
                      "relative overflow-hidden h-9 px-3.5 text-sm font-medium border-[#3B7CED] text-[#3B7CED] transition-all select-none shadow-xs",
                      exportingPoId === filteredOrders[0]?.id
                        ? "border-blue-400 bg-blue-50/80 cursor-wait pointer-events-none"
                        : "hover:bg-blue-50"
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {exportingPoId === filteredOrders[0]?.id ? (
                        <motion.div
                          key="exporting"
                          initial={{ opacity: 0, y: 1 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -1 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-4 h-4 animate-spin text-[#3B7CED] shrink-0" />
                          <span className="text-xs font-semibold text-[#3B7CED] tracking-tight">
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
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-[#3B7CED] shrink-0" />
                          <span className="text-xs font-semibold">Export PO</span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0 ml-0.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {exportingPoId === filteredOrders[0]?.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-100 overflow-hidden">
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.15,
                            ease: "easeInOut",
                          }}
                          className="h-full w-2/5 bg-[#3B7CED] rounded-full"
                        />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 rounded-xl shadow-xl border-gray-200 p-1.5"
                >
                  <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                    {filteredOrders[0]?.po_number
                      ? `Latest: ${filteredOrders[0].po_number}`
                      : "Purchase Order Document"}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleExportPo(filteredOrders[0], "pdf")}
                    disabled={exportingPoId !== null}
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
                    onClick={() => handleExportPo(filteredOrders[0], "png")}
                    disabled={exportingPoId !== null}
                    className="flex items-center gap-2.5 cursor-pointer px-2.5 py-2 rounded-lg hover:bg-blue-50 focus:bg-blue-50 text-xs font-medium text-gray-700"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        Export as Image
                      </span>
                      <span className="text-[10px] text-gray-400">
                        High-resolution PNG graphic
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              const count = statusCounts[card.key] ?? 0;
              const isActive =
                card.key === "billed"
                  ? statusFilter === "partially_billed" ||
                    statusFilter === "fully_billed"
                  : statusFilter === card.matchStatuses[0];

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className={`flex min-h-[96px] flex-col items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                    isActive ? "bg-blue-50/60" : ""
                  }`}
                  aria-pressed={isActive}
                  title={
                    isActive
                      ? "Click to clear status filter"
                      : `Filter by ${card.label}`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${card.iconClass}`} />
                    <span className="text-sm font-medium leading-tight text-gray-600">
                      {card.label}
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-semibold tabular-nums ${card.countClass}`}
                  >
                    {isLoading ? (
                      <span className="inline-block h-7 w-8 animate-pulse rounded bg-gray-200" />
                    ) : (
                      count
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by PO number, vendor, type…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                showFilters || statusFilter || typeFilter
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(statusFilter || typeFilter) && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                  {(statusFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-end">
              <div className="min-w-[160px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Request type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All types</option>
                  {requestTypes.map((t) => (
                    <option key={t} value={t}>
                      {formatRequestTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
          <span>
            {isLoading ? (
              "Loading…"
            ) : (
              <>
                <span className="font-medium text-gray-800">
                  {filteredOrders.length}
                </span>{" "}
                purchase order{filteredOrders.length === 1 ? "" : "s"}
                {hasActiveFilters ? " (filtered)" : ""}
              </>
            )}
          </span>
          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table data-wizard="inv-po-table" className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Request Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Vendor
                  </th>
                  {showWbsColumn && (
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      WBS Element
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="w-48 min-w-[180px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : isError ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-12 text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">
                        Could not load purchase orders
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Check your connection and try again.
                      </p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                      </button>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-12 text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">
                        No purchase orders found
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {hasActiveFilters
                          ? "Try clearing filters or adjusting your search."
                          : "Approved requests converted to POs will appear here."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => {
                    const wbsLabel = resolveWbsLabel(order);
                    const needsWbsTruncate = wbsLabel
                      ? wbsLabel.length > 36
                      : false;
                    const displayWbs = needsWbsTruncate
                      ? `${wbsLabel!.slice(0, 36)}…`
                      : wbsLabel;

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        <td className="px-4 py-3.5 text-sm font-medium">
                          <Link
                            href={`/invoice/purchase-order/${order.id}`}
                            className="text-blue-600 underline underline-offset-4 hover:text-blue-800"
                          >
                            {order.po_number || `PO-${order.id}`}
                          </Link>
                          {order.issued_at && (
                            <p className="mt-0.5 text-xs font-normal text-gray-400">
                              Issued {formatDate(order.issued_at)}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getTypeColor(
                              order.source_request_type,
                            )}`}
                          >
                            {formatRequestTypeLabel(order.source_request_type)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-sm text-gray-800">
                          {order.vendor_name || "—"}
                        </td>

                        {showWbsColumn && (
                          <td className="max-w-[200px] px-4 py-3.5 text-sm text-gray-600">
                            {wbsLabel ? (
                              <span
                                className="block truncate"
                                title={needsWbsTruncate ? wbsLabel : undefined}
                              >
                                {displayWbs}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        )}

                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(order.total_amount || 0))}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5">
                          {getStatusBadge(order.status)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/invoice/purchase-order/${order.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={exportingPoId !== null}
                                  className={cn(
                                    "relative overflow-hidden h-8 px-2.5 text-xs font-medium border-gray-200 text-gray-700 transition-all select-none shadow-2xs",
                                    exportingPoId === order.id
                                      ? "border-blue-400 bg-blue-50/80 text-blue-700 pointer-events-none cursor-wait"
                                      : "hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
                                  )}
                                >
                                  <AnimatePresence mode="wait" initial={false}>
                                    {exportingPoId === order.id ? (
                                      <motion.div
                                        key="exporting"
                                        initial={{ opacity: 0, y: 1 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -1 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex items-center gap-1.5"
                                      >
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                                        <span className="text-[11px] font-semibold text-blue-700 tracking-tight">
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
                                        className="flex items-center gap-1"
                                      >
                                        <Download className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                        <span>Export</span>
                                        <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Hairline animated progress bar along the bottom edge while exporting */}
                                  {exportingPoId === order.id && (
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
                                  onClick={() => handleExportPo(order, "pdf")}
                                  disabled={exportingPoId !== null}
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
                                  onClick={() => handleExportPo(order, "png")}
                                  disabled={exportingPoId !== null}
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
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
            {(activeExportOrder || filteredOrders[0]) && (
              <PurchaseOrderDocumentTemplate
                order={activeExportOrder || filteredOrders[0]}
                companyName={companyName}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                companyLogo={companyLogo}
              />
            )}
          </div>
        </div>

        {/* Global Feedback & Status Modal */}
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.actionText}
          onAction={statusModal.onAction}
          secondaryText={statusModal.secondaryText}
          onSecondary={statusModal.onSecondary}
          actionVariant={statusModal.actionVariant}
        />
      </div>
    </PageGuard>
  );
}
