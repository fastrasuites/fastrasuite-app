"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Mail, FileText, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import CreateVendorBillModal from "@/components/invoice/CreateVendorBillModal";
import ReturnHiredEquipmentModal from "@/components/invoice/ReturnHiredEquipmentModal";
import { ToastNotification } from "@/components/shared/ToastNotification";

import {
  useGetPurchaseOrderByIdQuery,
  useIssuePurchaseOrderMutation,
  useReturnHiredEquipmentMutation,
  type PurchaseOrderLine,
  type ProjectPurchaseOrder,
} from "@/api/invoice/projectPurchaseOrdersApi";
import { useGetAccountingSettingsQuery } from "@/api/invoice/accountingSettingsApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

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
    try {
      return JSON.stringify(first).slice(0, 180);
    } catch {
      /* ignore */
    }
  }
  return (err as any)?.message || fallback;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatToSentenceCase = (text: string) =>
  text
    .split("_")
    .join(" ")
    .replace(/^./, (char) => char.toUpperCase());

const statusBadgeClass = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "draft") return "bg-gray-100 text-gray-700";
  if (s === "issued") return "bg-blue-100 text-blue-800";
  if (s.includes("received")) return "bg-teal-100 text-teal-800";
  if (s.includes("billed")) return "bg-indigo-100 text-indigo-800";
  if (s === "cancelled" || s === "canceled") return "bg-red-100 text-red-800";
  if (s === "closed") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-700";
};

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const poId = Number(params?.id);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const {
    data: poDetail,
    isLoading,
    error,
    refetch,
  } = useGetPurchaseOrderByIdQuery(poId, {
    skip: !poId || isNaN(poId),
  });

  const [issuePurchaseOrder, { isLoading: isIssuing }] =
    useIssuePurchaseOrderMutation();

  const [returnHiredEquipment, { isLoading: isReturning }] =
    useReturnHiredEquipmentMutation();

  const { data: settingsList, isLoading: isSettingsLoading } =
    useGetAccountingSettingsQuery();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const status = (poDetail?.status || "").toLowerCase();
  const isDraft = status === "draft";
  const isCancelled = status === "cancelled" || status === "canceled";
  const isFullybilled = status === "fully_billed";

  const isPlantAndEquipment =
    poDetail?.source_request_type === "plant_and_equipment";
  const isHire = !!poDetail?.equipment_hire;
  const equipmentHire = poDetail?.equipment_hire;

  const canPayWithoutReceived =
    !!settingsList && !!settingsList[0]?.can_pay_without_receiving;

  const hasReceivedQuantity = !!poDetail?.lines?.some(
    (line) => Number(line.quantity_received) > 0,
  );

  const canCreateBill = !isDraft && !isCancelled && !isFullybilled;

  const isCreateBillEnabled = isPlantAndEquipment
    ? !isSettingsLoading && canCreateBill
    : !isSettingsLoading &&
      canCreateBill &&
      (canPayWithoutReceived || hasReceivedQuantity);

  const showCreateBillHelper =
    canCreateBill &&
    !isSettingsLoading &&
    !canPayWithoutReceived &&
    !hasReceivedQuantity &&
    !isPlantAndEquipment;
  const showSettingNotice =
    canCreateBill &&
    !isSettingsLoading &&
    canPayWithoutReceived &&
    !hasReceivedQuantity &&
    !isPlantAndEquipment;

  const showReceivedColumn = !isDraft && !isPlantAndEquipment;

  const showEquipmentHireSection = isPlantAndEquipment && !!poDetail;

  /* ------------------------------- Issue PO -------------------------------- */

  const handleIssuePO = async () => {
    if (!poId) return;

    try {
      await issuePurchaseOrder(poId).unwrap();
      showToast("Purchase Order issued successfully.", "success");
      await refetch();
    } catch (err: unknown) {
      showToast(
        extractErrorMessage(err, "Failed to issue Purchase Order."),
        "error",
      );
      console.error("[PO Issue]", err);
    }
  };

  const handleReturnEquipment = async () => {
    if (!poId) return;

    try {
      await returnHiredEquipment(poId).unwrap();
      showToast("Hired equipment marked as returned successfully.", "success");
      await refetch();
      setIsReturnModalOpen(false);
    } catch (err: unknown) {
      showToast(
        extractErrorMessage(err, "Failed to mark equipment as returned."),
        "error",
      );
      console.error("[Return Hired Equipment]", err);
    }
  };

  const totalAmount = Number(poDetail?.total_amount || 0);

  /* -------------------------------- Render -------------------------------- */

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!poDetail || error) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading Purchase Order or it does not exist.
        <div className="mt-4">
          <Link
            href="/invoice/purchase-order"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="fixed bottom-6 right-6 z-60 max-w-sm">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      </div>

      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link
          href="/invoice/purchase-order"
          className="inline-flex items-center gap-1 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Purchase Orders
        </Link>
        <span className="text-gray-300">›</span>
        <span className="font-medium text-gray-900">{poDetail.po_number}</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Purchase Order — {poDetail.po_number}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadgeClass(
                poDetail.status,
              )}`}
            >
              {(poDetail.status || "—").replace(/_/g, " ")}
            </span>
            {poDetail.source_request_type && (
              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {formatToSentenceCase(poDetail.source_request_type)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Mail className="h-4 w-4" />
            Send Via Email
          </button>

          {isDraft && (
            <PermissionGuard
              module="invoice"
              entitlement="issue_purchase_orders"
            >
              <button
                type="button"
                onClick={handleIssuePO}
                disabled={isIssuing}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isIssuing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Issuing…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Issue PO
                  </>
                )}
              </button>
            </PermissionGuard>
          )}

          {equipmentHire &&
            equipmentHire.status !== "returned" &&
            status === "issued" && (
              <PermissionGuard
                module="invoice"
                entitlement="receive_purchase_orders"
              >
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  disabled={isReturning || !equipmentHire}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isReturning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  )}
                  Mark Returned
                </button>
              </PermissionGuard>
            )}

          {canCreateBill && (
            <PermissionGuard module="invoice" entitlement="edit_invoice">
              <button
                type="button"
                onClick={() => setIsBillModalOpen(true)}
                disabled={!isCreateBillEnabled}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Create Bill
              </button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {showSettingNotice && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bills can be created without goods receipt (setting enabled).
        </div>
      )}

      {showCreateBillHelper && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Receive quantity on at least one line or enable &quot;Can Pay Without
          Received&quot; in Accounting Settings.
        </div>
      )}

      {/* Basic Information */}
      <div className="mb-4 rounded border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-blue-600">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
              Vendor
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poDetail.vendor_name || "—"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
              WBS Element
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poDetail?.wbs_element_details?.name || "—"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
              Status
            </p>
            <p className="text-sm font-medium capitalize text-gray-900">
              {(poDetail.status || "—").replace(/_/g, " ")}
            </p>
          </div>
          {poDetail.expected_delivery_date && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                Expected Delivery
              </p>
              <p className="text-sm font-medium text-gray-900">
                {poDetail.expected_delivery_date
                  ? new Date(
                      poDetail.expected_delivery_date,
                    ).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
              Issued Date
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poDetail.issued_at
                ? new Date(poDetail.issued_at).toLocaleDateString()
                : "Not issued"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
              Created Date
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poDetail.created_at
                ? new Date(poDetail.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
              Total Amount
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Equipment Hire Section - Plant & Equipment only */}
      {showEquipmentHireSection && equipmentHire && (
        <div className="mb-4 rounded border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-blue-600">
            Equipment Hire Tracking
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                Equipment Description
              </p>
              <p className="text-sm font-medium text-gray-900">
                {equipmentHire.equipment_description || "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                Hire Start Date
              </p>
              <p className="text-sm font-medium text-gray-900">
                {equipmentHire.hire_start_date
                  ? new Date(equipmentHire.hire_start_date).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                Expected Return Date
              </p>
              <p className="text-sm font-medium text-gray-900">
                {equipmentHire.expected_return_date
                  ? new Date(
                      equipmentHire.expected_return_date,
                    ).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                Status
              </p>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  equipmentHire.status === "returned"
                    ? "bg-green-100 text-green-800"
                    : equipmentHire.status === "overdue"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {equipmentHire.status?.replace(/_/g, " ") || "—"}
              </span>
            </div>
            {equipmentHire.returned_at && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                  Returned At
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(equipmentHire.returned_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Line items */}
      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-blue-600">Line Items</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            All line items on this purchase order.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product / Description
                </th>
                {!isPlantAndEquipment && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Unit
                  </th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Qty
                </th>
                {showReceivedColumn && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Quantity received
                  </th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {poDetail.lines?.map((line: PurchaseOrderLine) => (
                <tr
                  key={line.id}
                  className="transition-colors hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {line.item_name || line.description || "—"}
                  </td>
                  {!isPlantAndEquipment && (
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {line.unit || "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {line.qty ?? "—"}
                  </td>
                  {showReceivedColumn && (
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {line.quantity_received ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {formatCurrency(Number(line.unit_price || 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(Number(line.line_total || 0))}
                  </td>
                </tr>
              ))}
              {(!poDetail.lines || poDetail.lines.length === 0) && (
                <tr>
                  <td
                    colSpan={
                      showReceivedColumn
                        ? isPlantAndEquipment
                          ? 5
                          : 6
                        : isPlantAndEquipment
                          ? 4
                          : 5
                    }
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No line items on this purchase order.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr>
                <td
                  colSpan={
                    showReceivedColumn
                      ? isPlantAndEquipment
                        ? 4
                        : 5
                      : isPlantAndEquipment
                        ? 3
                        : 4
                  }
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-900"
                >
                  Total
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <CreateVendorBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        sourceType="PROJECT_PO"
        sourceId={poDetail.id}
        vendorId={poDetail.vendor}
        paymentTerm={poDetail.payment_term}
        lines={poDetail.lines.map((line: PurchaseOrderLine) => ({
          id: line.id,
          description: line.description || line.item_name || "",
          qty: line.qty,
          quantity_received: line.quantity_received,
          unit_price: line.unit_price,
          line_total: line.line_total,
          item_name: line.item_name,
        }))}
        formatCurrency={formatCurrency}
        subtitle={`PO ${poDetail.po_number}`}
        onCreated={() => {
          refetch();
        }}
      />

      <ReturnHiredEquipmentModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleReturnEquipment}
        equipmentDescription={equipmentHire?.equipment_description || ""}
        expectedReturnDate={equipmentHire?.expected_return_date || undefined}
        hireStatus={equipmentHire?.status || "on_hire"}
        isReturning={isReturning}
      />
    </div>
  );
}
