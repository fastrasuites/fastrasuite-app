"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  HardHat,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useGetApprovedProjectRequestsQuery } from "@/api/invoice/approvedProjectRequestsApi";
import { useConvertRequestToPurchaseOrderMutation } from "@/api/invoice/projectPurchaseOrdersApi";
import ConvertToPOModal from "@/components/invoice/ConvertToPOModal";
import ConvertToPOSubcontractorModal from "@/components/invoice/subcontractor/ConvertToPOSubcontractorModal";
import CreateVendorBillLabourModal from "@/components/invoice/labour-request/CreateVendorBillLabourReqModal";
import CreateDisbursementModal from "@/components/invoice/petty-cash/CreateDisbursementModal";
import ConvertToPOPlantEquipmentModal from "@/components/invoice/plant-and-equipment/ConvertToPOPlantEquipmentModal";
import { useCreateDisbursementMutation } from "@/api/invoice/disbursementApi";
import type { CreateDisbursementBody } from "@/api/invoice/disbursementApi";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/components/shared/types";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

/* -------------------------------------------------------------------------- */
/*                              Type helpers                                  */
/* -------------------------------------------------------------------------- */

const getTypeColor = (type: string) => {
  switch (type) {
    case "Purchase":
    case "Subcontractor":
    case "Plant and Equipment":
      return "bg-blue-50 text-blue-700";
    case "Labour Request":
    case "Petty Cash Request":
      return "bg-green-50 text-green-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Invoicing", href: "/invoice/approved-requests" },
  {
    label: "Approved Requests",
    href: "/invoice/approved-requests",
    current: true,
  },
];

/** Safely extract a human-readable error message from any API shape */
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
    if (first?.error && typeof first.error === "string") return first.error;
    if (first?.message && typeof first.message === "string")
      return first.message;
  }

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first === "string") return first;
    if (first?.detail) return String(first.detail);
    if (first?.error) return String(first.error);
  }

  try {
    return JSON.stringify(data).slice(0, 180);
  } catch {
    return "An unexpected error occurred.";
  }
}

/** Format any date string to yyyy-mm-dd */
function formatDateYYYYMMDD(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return dateStr.slice(0, 10);
  }
}

/** Skeleton rows for the table */
function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="h-7 w-24 bg-gray-200 rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Summary cards config                               */
/* -------------------------------------------------------------------------- */

type SummaryCardConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for icon colour */
  iconClass: string;
  /** Tailwind classes for the count number */
  countClass: string;
  /** Matches the mapped `type` string on each request */
  matchType: string;
};

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: "purchase",
    label: "Purchase",
    icon: ShoppingCart,
    iconClass: "text-blue-600",
    countClass: "text-blue-600",
    matchType: "Purchase",
  },
  {
    key: "subcontractor",
    label: "Subcontractor",
    icon: HardHat,
    iconClass: "text-amber-500",
    countClass: "text-amber-500",
    matchType: "Subcontractor",
  },
  {
    key: "plant_equipment",
    label: "Plant & Equipment",
    icon: Truck,
    iconClass: "text-red-500",
    countClass: "text-red-500",
    matchType: "Plant and Equipment",
  },
  {
    key: "labour",
    label: "Labour Request",
    icon: Users,
    iconClass: "text-purple-600",
    countClass: "text-purple-600",
    matchType: "Labour Request",
  },
  {
    key: "petty_cash",
    label: "Petty Cash",
    icon: Wallet,
    iconClass: "text-emerald-600",
    countClass: "text-emerald-600",
    matchType: "Petty Cash Request",
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function ApprovedRequestsPage() {
  const router = useRouter();

  const [isPlantEquipmentModalOpen, setIsPlantEquipmentModalOpen] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubcontractorModalOpen, setIsSubcontractorModalOpen] =
    useState(false);
  const [isLabourCreateBillModalOpen, setIsLabourCreateBillModalOpen] =
    useState(false);
  const [
    isPettyCashDisbursementModalOpen,
    setIsPettyCashDisbursementModalOpen,
  ] = useState(false);
  const [createDisbursement, { isLoading: isCreatingDisbursement }] =
    useCreateDisbursementMutation();

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    data: apiRequests,
    isLoading,
    isError,
    refetch,
  } = useGetApprovedProjectRequestsQuery();

  const [convertRequestToPurchaseOrder, { isLoading: isIssuing }] =
    useConvertRequestToPurchaseOrderMutation();

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      const safeMessage =
        typeof message === "string" && message.trim()
          ? message.trim()
          : type === "success"
            ? "PO created successfully"
            : "Something went wrong. Please try again.";

      setToast({ type, message: safeMessage });
      setTimeout(() => setToast(null), 4500);
    },
    [],
  );

  // ---------- Petty Cash (PRD 9.3.2) ----------
  const handleProcessDisbursement = (request: any) => {
    setSelectedRequest(request);
    setIsPettyCashDisbursementModalOpen(true);
  };

  const handleClosePettyCashDisbursementModal = () => {
    setIsPettyCashDisbursementModalOpen(false);
    setSelectedRequest(null);
  };

  const handlePettyCashSubmitDisbursement = async (
    payload: CreateDisbursementBody,
  ) => {
    try {
      if (process.env.NODE_ENV === "development")
        console.log("Petty Cash Disbursement payload →", payload);
      await createDisbursement(payload).unwrap();

      showToast(
        "success",
        "Successfully created disbursement. Navigating to Payment Queue.",
      );

      handleClosePettyCashDisbursementModal();
      refetch();

      setTimeout(() => {
        router.push("/invoice/payment-queue");
      }, 900);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Create disbursement error →", err);
      }
      showToast("error", extractErrorMessage(err));
    }
  };

  const handleConvertToPlantEquipment = (request: any) => {
    if (process.env.NODE_ENV === "development")
      console.log("Convert to Plant & Equipment →", request);
    setSelectedRequest(request);
    setCurrentStep(1);
    setIsPlantEquipmentModalOpen(true);
  };

  const handleClosePlantEquipmentModal = () => {
    if (isIssuing) return;
    setIsPlantEquipmentModalOpen(false);
    setSelectedRequest(null);
    setCurrentStep(1);
  };

  // ---------- Purchase ----------
  const handleConvertToPO = (request: any) => {
    setSelectedRequest(request);
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isIssuing) return;
    setIsModalOpen(false);
    setSelectedRequest(null);
    setCurrentStep(1);
  };

  // ---------- Subcontractor → Vendor Bill ----------
  const handleConvertToSubcontractor = (request: any) => {
    setSelectedRequest(request);
    setCurrentStep(1);
    setIsSubcontractorModalOpen(true);
  };

  const handleCloseSubcontractorModal = () => {
    setIsSubcontractorModalOpen(false);
    setSelectedRequest(null);
    setCurrentStep(1);
  };

  // ---------- Labour (PRD 9.3.1) ----------
  const handleConvertToLabourInvoice = (request: any) => {
    setSelectedRequest(request);
    setIsLabourCreateBillModalOpen(true);
  };

  const handleCloseLabourCreateBillModal = () => {
    setIsLabourCreateBillModalOpen(false);
    setSelectedRequest(null);
  };

  // ---------- Shared step nav (Purchase / PE / Subcontractor) ----------
  const handleNextStep = () => setCurrentStep(2);
  const handleBackStep = () => setCurrentStep(1);

  const handleIssuePO = async (payload: {
    vendor: number;
    payment_term: number | null;
    expected_delivery_date?: string;
    expected_return_date?: string;
    currency: number;
    source_id: number;
    source_type?: string;
  }) => {
    const finalPayload = {
      source_type: payload.source_type || "project_purchase_request",
      source_id: payload.source_id,
      vendor: payload.vendor,
      currency: payload.currency,
      payment_term: payload.payment_term,
      expected_delivery_date: payload?.expected_delivery_date,
      expected_return_date: payload?.expected_return_date,
    };
    if (process.env.NODE_ENV === "development") {
      console.log("Convert to PO – final payload sent to API →", finalPayload);
    }

    try {
      const created = await convertRequestToPurchaseOrder({
        data: finalPayload,
      }).unwrap();

      if (process.env.NODE_ENV === "development")
        console.log("Convert to PO response →", created);

      const newId = (created as any)?.purchase_order?.id ?? null;

      handleCloseModal();
      handleClosePlantEquipmentModal();
      refetch();

      showToast("success", "Purchase Order created successfully");

      setTimeout(() => {
        if (newId) {
          router.push(`/invoice/purchase-order/${newId}`);
        } else {
          router.push("/invoice/purchase-order");
        }
      }, 900);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Full Convert-to-PO error response →", err);
      }
      const message = extractErrorMessage(err);
      showToast(
        "error",
        message || "Failed to create Purchase Order. Please try again.",
      );
    }
  };

  // ---------- Data mapping ----------
  const requests = (apiRequests ?? []).map((req: any) => {
    const typeMap: Record<string, string> = {
      purchase: "Purchase",
      subcontractor: "Subcontractor",
      plant_equipment: "Plant and Equipment",
      labour: "Labour Request",
      petty_cash: "Petty Cash Request",
    };
    const amount = parseFloat(req.required_amount);
    return {
      id: req.reference_id || `REQ-${req.id}`,
      backendId: req.id,
      sourceId: req.id,
      requestReference: req.request_reference || req.reference_id,
      originalType: req.request_type,
      type: typeMap[req.request_type] || req.request_type,
      wbs: req.activity_name || req.phase_name || `Project #${req.id}`,
      wbsId: "",
      approvalDate: formatDateYYYYMMDD(req.approval_date),
      requestedAmount: isNaN(amount) ? 0 : amount,
      supplierName: "",
      projectName: req.activity_name || req.phase_name || "General Project",
      paymentTerms: "N/A",
      products: [],
      pettyCashId: "",
      requesterName: "",
      date: formatDateYYYYMMDD(req.approval_date),
      purpose: "",
      accountType: req.cost_category || "",
    };
  });

  /* ---------- Summary counts (from full list, not filtered) ---------- */
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of SUMMARY_CARDS) {
      counts[card.key] = 0;
    }
    for (const req of requests) {
      const card = SUMMARY_CARDS.find((c) => c.matchType === req.type);
      if (card) {
        counts[card.key] = (counts[card.key] || 0) + 1;
      }
    }
    return counts;
  }, [requests]);

  const filteredRequests = requests.filter(
    (request) =>
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestReference
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.wbs.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.approvalDate.includes(searchTerm),
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <PageGuard module="invoice" entitlement="view_approved_requests">
      <div className="p-6">
        <Breadcrumbs items={items} className="pl-0 mb-6" />

        {/* ── Summary cards (mirrors Inventory Operation style) ─────────── */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              const count = typeCounts[card.key] ?? 0;
              return (
                <div
                  key={card.key}
                  className="flex flex-col items-start gap-3 px-5 py-4 min-h-[96px]"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 shrink-0 ${card.iconClass}`} />
                    <span className="text-sm font-medium text-gray-600 leading-tight">
                      {card.label}
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-semibold tabular-nums ${card.countClass}`}
                  >
                    {isLoading ? (
                      <span className="inline-block h-7 w-8 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      count
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Header + search */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center mb-6 bg-white rounded-lg px-4 py-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Approved Requests
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-1 md:justify-end">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search request ID, type, or WBS…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                aria-label="Search approved requests"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table data-wizard="inv-approved-table" className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WBS element
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <TableSkeleton rows={6} />
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm text-red-600 mb-3">
                        Failed to load requests.
                      </p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      {searchTerm
                        ? "No results found"
                        : "No approved requests found"}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request, index) => (
                    <tr
                      key={request.backendId || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {request.requestReference}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTypeColor(
                            request.type,
                          )}`}
                        >
                          {request.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[220px]">
                        <span className="truncate block" title={request.wbs}>
                          {request.wbs}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {request.approvalDate}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(request.requestedAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          data-wizard="inv-convert-action"
                          className="flex items-center justify-start gap-2 flex-wrap"
                        >
                          {request.type === "Purchase" && (
                            <PermissionGuard
                              module="invoice"
                              entitlement="convert_approved_requests_to_purchase_orders"
                            >
                              <button
                                type="button"
                                onClick={() => handleConvertToPO(request)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
                                aria-label={`Convert ${request.id} to Purchase Order`}
                              >
                                Convert to PO
                              </button>
                            </PermissionGuard>
                          )}

                          {request.type === "Subcontractor" && (
                            <PermissionGuard
                              module="invoice"
                              entitlement="convert_approved_requests_to_purchase_orders"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleConvertToSubcontractor(request)
                                }
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
                                aria-label={`Convert ${request.id} to Vendor Bill`}
                              >
                                Convert to Invoice
                              </button>
                            </PermissionGuard>
                          )}

                          {request.type === "Plant and Equipment" && (
                            <PermissionGuard
                              module="invoice"
                              entitlement="convert_approved_requests_to_purchase_orders"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleConvertToPlantEquipment(request)
                                }
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
                                aria-label={`Convert ${request.id} to Plant & Equipment PO`}
                              >
                                Convert to PO
                              </button>
                            </PermissionGuard>
                          )}

                          {request.type === "Labour Request" && (
                            <PermissionGuard
                              module="invoice"
                              entitlement="manage_accounts_payable_queue"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleConvertToLabourInvoice(request)
                                }
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
                                aria-label={`Convert ${request.id} to Invoice`}
                              >
                                Convert to Invoice
                              </button>
                            </PermissionGuard>
                          )}

                          {request.type === "Petty Cash Request" && (
                            <PermissionGuard
                              module="invoice"
                              entitlement="manage_accounts_payable_queue"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleProcessDisbursement(request)
                                }
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
                                aria-label={`Process disbursement for ${request.id}`}
                              >
                                Process Disbursement
                              </button>
                            </PermissionGuard>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase → PO */}
        <ConvertToPOModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
          currentStep={currentStep}
          onNextStep={handleNextStep}
          onBackStep={handleBackStep}
          onIssuePO={handleIssuePO}
          formatCurrency={formatCurrency}
          isIssuing={isIssuing}
        />

        {/* Plant & Equipment → PO */}
        <ConvertToPOPlantEquipmentModal
          isOpen={isPlantEquipmentModalOpen}
          onClose={handleClosePlantEquipmentModal}
          request={selectedRequest}
          currentStep={currentStep}
          onNextStep={handleNextStep}
          onBackStep={handleBackStep}
          onIssuePO={handleIssuePO}
          formatCurrency={formatCurrency}
          isIssuing={isIssuing}
        />

        {/* Subcontractor → Vendor Bill */}
        <ConvertToPOSubcontractorModal
          isOpen={isSubcontractorModalOpen}
          request={selectedRequest}
          onClose={handleCloseSubcontractorModal}
          currentStep={currentStep}
          onNextStep={handleNextStep}
          onBackStep={handleBackStep}
          formatCurrency={formatCurrency}
          isIssuing={false}
        />

        {/* Labour → Vendor Bill */}
        <CreateVendorBillLabourModal
          isOpen={isLabourCreateBillModalOpen}
          onClose={handleCloseLabourCreateBillModal}
          request={selectedRequest}
          formatCurrency={formatCurrency}
        />

        {/* Petty Cash → Disbursement */}
        <CreateDisbursementModal
          isOpen={isPettyCashDisbursementModalOpen}
          onClose={handleClosePettyCashDisbursementModal}
          request={selectedRequest}
          onSubmit={handlePettyCashSubmitDisbursement}
          formatCurrency={formatCurrency}
          isSubmitting={isCreatingDisbursement}
        />

        {/* Global toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[70] max-w-sm">
            <ToastNotification
              show={true}
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          </div>
        )}
      </div>
    </PageGuard>
  );
}
