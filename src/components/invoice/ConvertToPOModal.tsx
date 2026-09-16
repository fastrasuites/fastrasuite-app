"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CalendarIcon,
  MapPin,
  InfoIcon,
  Loader2,
} from "lucide-react";
import { Input } from "../ui/input";
import PaymentTermsSelect from "../shared/PaymentTermsSelect";
import { useGetVendorsQuery } from "@/api/invoice/vendorsApi";
import { useGetActiveCurrenciesQuery } from "@/api/invoice/invoiceCurrencyApi";
import { useGetPaymentTermsQuery } from "@/api/invoice/paymentTermsApi";
import {
  useGetApprovedProjectRequestDetailsQuery,
  useGetApprovedProjectRequestByIdQuery,
} from "@/api/invoice/approvedProjectRequestsApi";
import { ToastNotification } from "../shared/ToastNotification";

interface Product {
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface Request {
  id: string;
  backendId?: number;
  sourceId?: number;
  type: string;
  wbs: string;
  approvalDate: string;
  requestedAmount: number;
  products: Product[];
  originalType?: string;
  [key: string]: any;
}

interface ConvertToPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  currentStep: number;
  onNextStep: () => void;
  onBackStep: () => void;
  onIssuePO: (payload: {
    vendor: number;
    payment_term: number | null;
    expected_delivery_date: string;
    currency: number;
    source_id: number;
  }) => Promise<void>;
  formatCurrency: (amount: number) => string;
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

export default function ConvertToPOModal({
  isOpen,
  onClose,
  request,
  currentStep,
  onNextStep,
  onBackStep,
  onIssuePO,
  formatCurrency,
  isIssuing = false,
}: ConvertToPOModalProps) {
  const { data: vendorsResponse } = useGetVendorsQuery({});
  const vendors = Array.isArray(vendorsResponse)
    ? vendorsResponse
    : (vendorsResponse as any)?.results || [];

  const { data: activeCurrenciesResponse } = useGetActiveCurrenciesQuery();
  const activeCurrencies = Array.isArray(activeCurrenciesResponse)
    ? activeCurrenciesResponse
    : (activeCurrenciesResponse as any)?.results || [];
  const defaultCurrencyId =
    activeCurrencies.length > 0 ? activeCurrencies[0].id : 1;

  const { data: paymentTermsResponse } = useGetPaymentTermsQuery({});
  const paymentTermsList = Array.isArray(paymentTermsResponse)
    ? paymentTermsResponse
    : (paymentTermsResponse as any)?.results || [];

  // ---------- Details query ----------
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
  } = useGetApprovedProjectRequestDetailsQuery(requestId as number, {
    skip: !isOpen || !requestId,
  });

  // print detailsData --------------------------
  useEffect(() => {
    if (!detailsData) return;
    console.log("detailsData", detailsData);
  }, [detailsData]);

  // ---------- Local state ----------
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const primaryButtonRef = useRef<HTMLButtonElement>(null);

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
      setSelectedVendor("");
      setSelectedPaymentTerms("");
      setDeliveryDate("");
      setDeliveryAddress("");
      setToast(null);
    }
  }, [isOpen]);

  // Autofill delivery address from backend location fields (prefer site_location)
  useEffect(() => {
    if (!detailsData || !isOpen) return;

    const loc =
      (detailsData as any).site_location ??
      (detailsData as any).location ??
      (detailsData as any).delivery_address ??
      (detailsData as any).delivery_location ??
      (detailsData as any).project_details?.site_location ??
      (detailsData as any).project_details?.location ??
      "";

    if (loc && String(loc).trim()) {
      setDeliveryAddress(String(loc).trim());
    }
  }, [detailsData, isOpen]);

  if (!isOpen && !isVisible) return null;

  // ---------- Derived data ----------
  const productsFromDetails: Product[] =
    detailsData?.lines?.map((line) => ({
      productName: line.product_name || line.description || "—",
      unit: line.unit_of_measure_symbol || line.unit_of_measure_name || "—",
      qty: Number(line.quantity) || 0,
      unitPrice: Number(line.estimated_unit_cost) || 0,
      total: Number(line.line_total) || 0,
    })) ?? [];

  const totalAmount = detailsData
    ? Number(detailsData.total_amount) || 0
    : productsFromDetails.reduce((sum, p) => sum + p.total, 0);

  const wbsLabel = detailsData
    ? `${detailsData.project_details?.name || "—"} › ${detailsData.phase_details?.name || "—"} › ${detailsData.activity_details?.name || "—"}`
    : request?.wbs || "—";

  const referenceId =
    detailsData?.project_request?.reference_id || request?.id || "—";

  const vendorObj = vendors.find(
    (v: any) => v.id.toString() === selectedVendor,
  );
  const displayVendorName = vendorObj
    ? vendorObj.vendor_name
    : selectedVendor || "Not selected";

  const paymentTermObj = paymentTermsList.find(
    (t: any) => t.id.toString() === selectedPaymentTerms,
  );
  const displayPaymentTermName = paymentTermObj
    ? paymentTermObj.name
    : selectedPaymentTerms || "Not specified";

  // ---------- Handlers ----------
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const handleNext = () => {
    if (!selectedVendor || !selectedPaymentTerms) {
      showToast("error", "Please select both vendor and payment terms");
      return;
    }
    if (!deliveryDate) {
      showToast("error", "Please select an expected delivery date");
      return;
    }
    if (!deliveryAddress.trim()) {
      showToast("error", "Please enter the delivery address");
      return;
    }
    onNextStep();
  };

  const handleConvert = async () => {
    // Backend rule: source_id = top-level id from details response
    const sourceId = detailsData?.id ?? request?.backendId;

    if (!sourceId) {
      showToast("error", "Unable to determine request ID. Please try again.");
      return;
    }

    const payload = {
      vendor: Number(selectedVendor),
      payment_term: selectedPaymentTerms ? Number(selectedPaymentTerms) : null,
      expected_delivery_date: deliveryDate,
      currency: defaultCurrencyId,
      source_id: Number(sourceId),
    };

    console.log("Convert to PO – final payload →", payload);

    try {
      await onIssuePO(payload);
    } catch (err) {
      console.error("Convert to PO failed inside modal:", err);
    }
  };

  // ---------- Render helpers ----------
  const renderStepIndicator = () => (
    <div className="flex items-center gap-4 mb-6" aria-label="Progress">
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            currentStep === 1
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          aria-current={currentStep === 1 ? "step" : undefined}
        >
          1
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
          aria-current={currentStep === 2 ? "step" : undefined}
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

  const renderProductsTable = (products: Product[]) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product Name
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              QTY
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-sm text-gray-500"
              >
                No products found
              </td>
            </tr>
          ) : (
            products.map((product, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">
                  <TruncateWithTooltip
                    text={product.productName}
                    maxLength={32}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {product.unit}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {product.qty}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {product.unitPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {product.total.toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
            <td
              colSpan={4}
              className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
            >
              Total:
            </td>
            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
              {totalAmount.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderStep1 = () => (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            WBS Element
          </h3>
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
            <TruncateWithTooltip
              text={wbsLabel}
              maxLength={70}
              className="text-sm font-semibold text-gray-900"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Products</h3>
          {isDetailsLoading ? (
            <div className="border border-gray-200 rounded-lg p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading products…
            </div>
          ) : isDetailsError ? (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
              Failed to load product details. You can still proceed.
            </div>
          ) : (
            renderProductsTable(productsFromDetails)
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="vendor-select"
              className="text-sm font-medium text-gray-700 mb-2 block"
            >
              Vendor
            </label>
            <select
              id="vendor-select"
              name="vendor"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              disabled={isIssuing}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white disabled:opacity-60"
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor: any) => (
                <option key={vendor.id} value={vendor.id.toString()}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Payment Terms
            </label>
            <PaymentTermsSelect
              value={selectedPaymentTerms}
              onChange={setSelectedPaymentTerms}
              placeholder="Select payment terms"
            />
          </div>

          <div>
            <label
              htmlFor="delivery-date"
              className="text-sm font-medium text-gray-700 mb-2 block"
            >
              Expected Delivery Date
            </label>
            <div className="relative">
              <Input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                disabled={isIssuing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                min={new Date().toISOString().split("T")[0]}
              />
              <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="delivery-address"
              className="text-sm font-medium text-gray-700 mb-2 block"
            >
              Delivery Full Address
            </label>
            <div className="relative">
              <textarea
                id="delivery-address"
                value={deliveryAddress}
                readOnly
                rows={3}
                placeholder={
                  isDetailsLoading
                    ? "Loading location…"
                    : "Location will be filled from the request"
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800 resize-none cursor-default focus:outline-none focus:ring-0"
                aria-readonly="true"
              />
              <MapPin className="absolute right-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            {deliveryAddress && (
              <p className="mt-1 text-xs text-gray-500">
                Auto-filled from request location (read-only)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-200 mt-6">
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
          onClick={handleNext}
          disabled={isIssuing || isDetailsLoading}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review & Confirm
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 flex items-start gap-2">
          <InfoIcon className="w-4 h-4 text-amber-800 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Once converted, this Purchase Order will be sent to{" "}
            <strong>
              <TruncateWithTooltip text={displayVendorName} maxLength={28} />
            </strong>
            . The Committed Amount of{" "}
            <strong>N{totalAmount.toLocaleString()}</strong> will be locked
            against{" "}
            <strong>
              <TruncateWithTooltip text={wbsLabel} maxLength={36} />
            </strong>{" "}
            until payment is confirmed or the PO is cancelled.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Vendor", value: displayVendorName },
            { label: "WBS Element", value: wbsLabel },
            { label: "Originating Request", value: referenceId },
            { label: "Request Type", value: request?.type || "—" },
            { label: "Payment Terms", value: displayPaymentTermName },
            {
              label: "Expected Delivery Date",
              value: deliveryDate
                ? new Date(deliveryDate).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not specified",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {item.label}
              </p>
              <p className="text-sm font-medium text-gray-900">
                <TruncateWithTooltip text={item.value} maxLength={42} />
              </p>
            </div>
          ))}

          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 col-span-1 sm:col-span-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Delivery Address
            </p>
            <p className="text-sm font-medium text-gray-900">
              <TruncateWithTooltip
                text={deliveryAddress || "Not specified"}
                maxLength={90}
              />
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Products</h3>
          {renderProductsTable(productsFromDetails)}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-200 mt-6">
        <button
          type="button"
          onClick={onBackStep}
          disabled={isIssuing}
          className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <span className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </span>
        </button>
        <button
          ref={primaryButtonRef}
          type="button"
          onClick={handleConvert}
          disabled={isIssuing}
          aria-busy={isIssuing}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isIssuing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Converting to PO…
            </>
          ) : (
            "Convert to PO"
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-50 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={isIssuing ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-po-title"
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div>
              <h2
                id="convert-po-title"
                className="text-xl font-semibold text-gray-900"
              >
                Convert to Purchase Order
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
              disabled={isIssuing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {renderStepIndicator()}
            {currentStep === 1 ? renderStep1() : renderStep2()}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-60 max-w-sm">
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
