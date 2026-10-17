import * as React from "react";
import { FASTRASUITE_LOGO_BASE64 } from "@/components/project-costing/export/ExecutiveProjectReportTemplate";
import {
  ProjectPurchaseOrder,
  PurchaseOrderLine,
} from "@/api/invoice/projectPurchaseOrdersApi";

export interface PurchaseOrderDocumentTemplateProps {
  order?: ProjectPurchaseOrder | null;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
}

const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) return "₦0";
  return `₦${Math.round(amount).toLocaleString("en-US")}`;
};

const formatDateDDMMYYYY = (dateStr?: string | null): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
};

export const PurchaseOrderDocumentTemplate: React.FC<
  PurchaseOrderDocumentTemplateProps
> = ({
  order,
  companyName = "FastraSuite",
  companyAddress = "",
  companyPhone = "",
  companyLogo = "",
}) => {
  // Resolve core header fields
  const projectName =
    (order as any)?.project_name ||
    (order as any)?.project?.name ||
    (order as any)?.project_code ||
    "Project";
  const poDate = formatDateDDMMYYYY(
    order?.issued_at || order?.created_at || new Date().toISOString(),
  );
  const requestDate = formatDateDDMMYYYY(order?.created_at || order?.issued_at);
  const expectedDeliveryDate = formatDateDDMMYYYY(
    order?.expected_delivery_date || order?.required_date,
  );

  const poNumber = order?.po_number || (order?.id ? `PO-${order.id}` : "—");
  const vendorName =
    order?.vendor_name || (order as any)?.vendor_details?.name || "—";

  const vendorDetailsLine = React.useMemo(() => {
    const parts = [
      (order as any)?.vendor_address ||
        (order as any)?.vendor_details?.address ||
        (order as any)?.vendor_details?.city,
      (order as any)?.vendor_email || (order as any)?.vendor_details?.email,
      (order as any)?.vendor_phone || (order as any)?.vendor_details?.phone,
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" · ");
    return "";
  }, [order]);

  const deliveryLocation =
    order?.site_location ||
    (order as any)?.delivery_location ||
    (projectName !== "Project" ? `${projectName} Site` : "Project Site");

  // Line items
  const lines: PurchaseOrderLine[] = React.useMemo(() => {
    if (Array.isArray(order?.lines) && order.lines.length > 0) {
      return order.lines;
    }
    const rawTotal = Number(order?.total_amount || 0);
    if (rawTotal > 0) {
      return [
        {
          id: 1,
          product: 1,
          description:
            (order as any)?.notes ||
            (order as any)?.description ||
            (order as any)?.title ||
            "Purchase Order Items",
          item_name:
            (order as any)?.notes ||
            (order as any)?.description ||
            (order as any)?.title ||
            "Purchase Order Items",
          qty: "1",
          unit: "Lot",
          unit_price: String(rawTotal),
          line_total: String(rawTotal),
          quantity_received: "0",
          quantity_billed: "0",
        } as PurchaseOrderLine,
      ];
    }
    return [];
  }, [order]);

  // Financial calculations
  const rawTotal = Number(order?.total_amount || 0);
  const subtotal =
    lines.length > 0
      ? lines.reduce((acc, l) => {
          const q = Number(l.qty || 1);
          const p = Number(l.unit_price || 0);
          return acc + q * p;
        }, 0)
      : rawTotal;

  const taxRate = 0.075;
  const taxAmount = Math.round(subtotal * taxRate);
  const grandTotal = rawTotal > 0 ? rawTotal : subtotal + taxAmount;

  // Payment & Delivery instructions
  const paymentTerms = order?.payment_term
    ? `${order.payment_term} days after delivery`
    : (order as any)?.payment_terms ||
      "In accordance with agreed contract terms";

  const deliveryInstructions =
    (order as any)?.delivery_instructions ||
    "Deliver to designated project site coordinator during standard working hours.";

  return (
    <div
      style={{
        width: "820px",
        minHeight: "1160px",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily:
          "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "40px 45px",
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* ================= 1. HEADER ================= */}
        <div className="flex items-start justify-between">
          {/* Company Brand Logo / Badge */}
          <div>
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : companyName ? (
              <div className="h-10 px-3 bg-gray-900 text-white rounded-md flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                {companyName}
              </div>
            ) : (
              <div className="h-10 px-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-md flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                FastraSuite
              </div>
            )}
          </div>

          {/* Company Contact Details */}
          <div className="text-right">
            <h2 className="text-[15px] font-bold text-gray-900 leading-snug">
              {companyName || "FastraSuite"}
            </h2>
            {companyAddress ? (
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                {companyAddress}
              </p>
            ) : null}
            {companyPhone ? (
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Contact: {companyPhone}
              </p>
            ) : null}
          </div>
        </div>

        {/* Title & Project Meta */}
        <div className="mt-6">
          <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">
            Purchase Order
          </h1>
          <div className="flex items-center gap-6 mt-2.5 text-[12.5px] text-gray-700">
            <div>
              <span className="font-semibold text-gray-900">Project:</span>{" "}
              <span>{projectName}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">PO date:</span>{" "}
              <span>{poDate}</span>
            </div>
          </div>
        </div>

        {/* Solid Blue Horizontal Divider */}
        <div className="w-full h-[2.5px] bg-[#0D3C8C] mt-3.5 mb-5" />

        {/* ================= 2. VENDOR INFORMATION ================= */}
        <div>
          <h3 className="text-[10px] font-bold text-[#0D3C8C] tracking-wider uppercase mb-1">
            VENDOR INFORMATION
          </h3>
          <h4 className="text-[13.5px] font-bold text-gray-900 leading-tight">
            {vendorName}
          </h4>
          {vendorDetailsLine ? (
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              {vendorDetailsLine}
            </p>
          ) : null}
        </div>

        {/* ================= 3. 4-COLUMN KEY METRICS BAR ================= */}
        <div className="rounded-lg bg-[#F5F8FF] border border-blue-100/60 p-3.5 grid grid-cols-4 divide-x divide-gray-200 mt-5">
          <div className="pr-3">
            <div className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">
              ORDER ID
            </div>
            <div className="text-[12.5px] font-bold text-gray-900 mt-1 truncate">
              {poNumber}
            </div>
          </div>

          <div className="px-3">
            <div className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">
              REQUEST DATE
            </div>
            <div className="text-[12.5px] font-bold text-gray-900 mt-1">
              {requestDate}
            </div>
          </div>

          <div className="px-3">
            <div className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">
              DELIVERY LOCATION
            </div>
            <div className="text-[12.5px] font-bold text-gray-900 mt-1 truncate">
              {deliveryLocation}
            </div>
          </div>

          <div className="pl-3">
            <div className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">
              EXPECTED DELIVERY
            </div>
            <div className="text-[12.5px] font-bold text-gray-900 mt-1">
              {expectedDeliveryDate}
            </div>
          </div>
        </div>

        {/* ================= 4. ORDER DETAILS TABLE ================= */}
        <div className="mt-6">
          <h3 className="text-[10px] font-bold text-[#0D3C8C] tracking-wider uppercase mb-2">
            ORDER DETAILS
          </h3>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F8FF] border-b border-gray-200 text-gray-500 text-[10px] font-semibold">
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-3 text-center font-semibold w-16">
                    Qty
                  </th>
                  <th className="py-2.5 px-3 text-left font-semibold w-20">
                    Unit
                  </th>
                  <th className="py-2.5 px-4 text-right font-semibold w-28">
                    Unit price
                  </th>
                  <th className="py-2.5 px-3 text-center font-semibold w-20">
                    Tax
                  </th>
                  <th className="py-2.5 px-4 text-right font-semibold w-32">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px] text-gray-800">
                {lines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-gray-400 italic"
                    >
                      No line items specified for this purchase order.
                    </td>
                  </tr>
                ) : (
                  lines.map((item, idx) => {
                    const qty = Number(item.qty || 1);
                    const rate = Number(item.unit_price || 0);
                    const lineTotal = Number(
                      item.line_total || qty * rate * (1 + taxRate),
                    );

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {item.description || item.item_name || "—"}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-800 font-medium">
                          {qty}
                        </td>
                        <td className="py-3 px-3 text-left text-gray-600">
                          {item.unit || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-800">
                          {formatCurrency(rate)}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-600">
                          7.5%
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= 5. DELIVERY & PAYMENT + TOTALS ================= */}
        <div className="flex justify-between items-start mt-6 gap-8">
          {/* Left: Delivery & Payment Details */}
          <div className="flex-1 max-w-105">
            <h3 className="text-[10px] font-bold text-[#0D3C8C] tracking-wider uppercase mb-2">
              DELIVERY & PAYMENT
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  PAYMENT TERMS
                </div>
                <div className="text-[12px] font-bold text-gray-900 mt-0.5">
                  {paymentTerms}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  DELIVERY INSTRUCTIONS
                </div>
                <div className="text-[12px] font-bold text-gray-900 mt-0.5">
                  {deliveryInstructions}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary Box with Blue Total Banner */}
          <div className="w-70">
            <div className="flex justify-between items-center text-[12px] py-1 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[12px] py-1 mt-1">
              <span className="text-gray-600 font-medium">Tax (7.5%)</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(taxAmount)}
              </span>
            </div>
            {/* Deep Royal Blue Total Box */}
            <div className="bg-[#0D3C8C] rounded-md px-4 py-3 text-white flex justify-between items-center mt-3 shadow-xs">
              <span className="text-[13px] font-bold uppercase tracking-wider text-white">
                Total
              </span>
              <span className="text-[16px] font-extrabold text-white tracking-tight">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 6. TERMS AND CONDITIONS ================= */}
        <div className="mt-8">
          <h5 className="text-[9px] font-bold text-gray-500 mb-1">
            Terms and Conditions
          </h5>
          <ol className="text-[8px] leading-[1.38] text-gray-400 space-y-0.5 list-decimal pl-3.5">
            <li>
              This order is based on the items, quantities, prices, delivery
              date and payment terms stated on this Purchase Order.
            </li>
            <li>
              The Vendor confirms acceptance of this order by signing and
              returning a copy, or by confirming in writing.
            </li>
            <li>
              Any change to price, quantity, specification or delivery date
              should be agreed with {companyName || "FastraSuite"} in writing
              before it takes effect.
            </li>
            <li>
              Goods or services should be delivered as stated on this order. The
              Vendor should tell {companyName || "FastraSuite"} promptly if
              delivery will be late or if any part of the order cannot be
              supplied as specified.
            </li>
            <li>
              Deliveries are checked on receipt, and any difference from this
              order is raised with the Vendor.
            </li>
            <li>
              Invoices should quote this Purchase Order number and match the
              items, quantities and prices on it. Any difference should be
              explained in writing.
            </li>
            <li>
              Payment is made against this Purchase Order, to the Vendor&apos;s
              bank account on record, in line with the payment terms stated on
              it.
            </li>
          </ol>
        </div>

        {/* ================= 7. SIGN-OFF SIGNATURE LINES ================= */}
        <div className="grid grid-cols-2 gap-8 mt-6 pt-1 text-[9.5px] text-gray-600 font-medium">
          <div className="flex items-center gap-2">
            <span>Approved By</span>
            <span className="border-b border-dotted border-gray-400 flex-1 h-3" />
            <span className="ml-2">Date</span>
            <span className="border-b border-dotted border-gray-400 w-24 h-3" />
          </div>
          <div className="flex items-center gap-2">
            <span>Vendor Signature</span>
            <span className="border-b border-dotted border-gray-400 flex-1 h-3" />
            <span className="ml-2">Date</span>
            <span className="border-b border-dotted border-gray-400 w-24 h-3" />
          </div>
        </div>
      </div>

      {/* ================= 8. FOOTER ================= */}
      <div className="border-t border-gray-200 pt-3 mt-6 flex items-center justify-between text-[8.5px] text-gray-400">
        <div className="flex items-center">
          <img
            src={FASTRASUITE_LOGO_BASE64}
            alt="FastraSuite"
            className="h-5 w-auto object-contain"
          />
        </div>

        <div className="tracking-wider uppercase font-medium text-[8px] text-gray-400">
          GENERATED VIA FASTRASUITE—NIGERIA&apos;S TRUSTED PROJECT COSTING
          PLATFORM.
        </div>

        <div className="font-medium text-gray-400">Page 1 of 1</div>
      </div>
    </div>
  );
};
