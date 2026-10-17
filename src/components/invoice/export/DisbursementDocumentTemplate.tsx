import * as React from "react";
import { FASTRASUITE_LOGO_BASE64 } from "@/components/project-costing/export/ExecutiveProjectReportTemplate";
import { Disbursement } from "@/api/invoice/disbursementApi";
import { PettyCashRequest } from "@/api/requests/pettyCashRequestApi";

export interface DisbursementDocumentTemplateProps {
  disbursement?: Disbursement | any | null;
  pettyCashRequest?: PettyCashRequest | any | null;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
}

const formatCurrency = (amount: number | string): string => {
  const num = Number(amount || 0);
  if (isNaN(num)) return "₦0";
  return `₦${Math.round(num).toLocaleString("en-US")}`;
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

const formatDateTimeFormatted = (dateStr?: string | null): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} · ${hours}:${minutes}`;
  } catch {
    return String(dateStr);
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

export const DisbursementDocumentTemplate: React.FC<
  DisbursementDocumentTemplateProps
> = ({
  disbursement,
  pettyCashRequest,
  companyName = "Prorad Health Center",
  companyAddress = "Level 1, 12 Sample St, Sydney NSW 2000",
  companyPhone = "+234 801 234 5679",
  companyLogo = "",
}) => {
  const d = disbursement;
  const pcr = pettyCashRequest;

  // 1. Resolve header fields
  const projectName =
    (d as any)?.project_name ||
    pcr?.project_details?.name ||
    (pcr as any)?.project?.name ||
    "Meridian Heights";

  const paymentDate = formatDateDDMMYYYY(
    d?.payment_date || d?.paid_at || d?.created_at || new Date().toISOString(),
  );

  const amountPaid = Number(d?.amount || pcr?.amount_requested || 0);
  const amountRequested = Number(
    pcr?.amount_requested || pcr?.amount || d?.amount || 0,
  );

  const paymentReference =
    d?.payment_reference ||
    d?.reference_number ||
    (d?.id ? `TRF-${d.id}` : "TRF-240625-8831");

  const pettyCashReference =
    d?.petty_cash_reference ||
    pcr?.reference_id ||
    (d?.petty_cash_request ? `PCR-${d.petty_cash_request}` : "PCR-2025-00142");

  const requesterName = formatPersonName(
    d?.created_by_name ||
      pcr?.created_by_name ||
      pcr?.created_by_details?.first_name ||
      "Chinedu Eze",
  );

  const recipientName = formatPersonName(
    d?.recipient_name ||
      d?.recipient_account_name ||
      requesterName ||
      "Chinedu Eze",
  );

  const paymentMethod = React.useMemo(() => {
    const raw = (d?.disbursement_method || "BANK_TRANSFER").toUpperCase();
    if (raw === "CASH") return "Cash";
    if (raw === "BANK_TRANSFER") return "Bank transfer";
    return formatPersonName(d?.disbursement_method);
  }, [d?.disbursement_method]);

  const requestDate = formatDateDDMMYYYY(
    pcr?.created_at || (pcr as any)?.date_created || d?.created_at,
  );

  const requestDateTime = formatDateTimeFormatted(
    pcr?.created_at || (pcr as any)?.date_created || d?.created_at,
  );

  const wbsActivity = React.useMemo(() => {
    if (pcr?.activity_details) {
      const serial = pcr.activity_details.serial_number;
      const name = pcr.activity_details.name;
      if (serial && name) return `${serial} · ${name}`;
      if (name) return name;
    }
    if ((d as any)?.wbs_activity) return (d as any).wbs_activity;
    if ((d as any)?.wbs_name) return (d as any).wbs_name;
    return "1.8 · Site operations";
  }, [pcr, d]);

  const purpose =
    d?.notes ||
    pcr?.purpose ||
    pcr?.description ||
    "Purchase of urgent site safety supplies, generator diesel and courier charges for permit documentation.";

  const status = (d?.status || "paid").toLowerCase();
  const isPaid = status === "paid";
  const isApproved = ["approved", "paid"].includes(status);

  const approverName = formatPersonName(
    d?.approved_by_name ||
      (d as any)?.approved_by_details?.first_name ||
      "Tunde Adebayo",
  );
  const approvedDateTime = formatDateTimeFormatted(d?.approved_at);

  const payerName = formatPersonName(
    (d as any)?.paid_by_name ||
      (d as any)?.paid_by_details?.first_name ||
      d?.approved_by_name ||
      "Kemi Balogun",
  );
  const paidDateTime = formatDateTimeFormatted(d?.paid_at || d?.payment_date);

  return (
    <div
      style={{
        width: "820px",
        minHeight: "1080px",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily:
          "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "40px 48px",
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
                crossOrigin="anonymous"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : companyName ? (
              <div className="h-10 px-3 bg-[#4F634A] text-white rounded-md flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
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
              {companyName}
            </h2>
            {companyAddress ? (
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                {companyAddress}
              </p>
            ) : null}
            {companyPhone ? (
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Contact : {companyPhone}
              </p>
            ) : null}
          </div>
        </div>

        {/* Title & Project Meta */}
        <div className="mt-6">
          <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">
            Petty Cash Disbursement
          </h1>
          <div className="flex items-center gap-6 mt-2.5 text-[12.5px] text-gray-700">
            <div>
              <span className="font-bold text-gray-900">Project:</span>{" "}
              <span>{projectName}</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">Payment date:</span>{" "}
              <span>{paymentDate}</span>
            </div>
          </div>
        </div>

        {/* Solid Blue Horizontal Divider */}
        <div className="w-full h-[2.5px] bg-[#0D3C8C] mt-3.5 mb-5" />

        {/* ================= 2. BLUE CALLOUT BANNER ================= */}
        <div className="bg-[#0D3C8C] rounded-md px-6 py-4 flex items-center justify-between text-white shadow-xs">
          {/* Left: AMOUNT PAID, Value & • Paid status on the same horizontal row */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              AMOUNT PAID
            </span>
            <span className="text-[23px] font-extrabold text-white tracking-tight leading-none">
              {formatCurrency(amountPaid)}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#4ADE80]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="capitalize">{status}</span>
            </span>
          </div>

          {/* Right: PAYMENT REFERENCE & Value stacked, right-aligned */}
          <div className="text-right">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-blue-200">
              PAYMENT REFERENCE
            </div>
            <div className="text-[13.5px] font-bold text-white tracking-wide mt-0.5">
              {paymentReference}
            </div>
          </div>
        </div>

        {/* ================= 3. 4-COLUMN KEY METRICS GRID ================= */}
        <div className="grid grid-cols-4 divide-x divide-gray-200 mt-6 pt-1 pb-1">
          {/* Column 1 */}
          <div className="pr-4">
            <div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                PETTY CASH REQUEST
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1 truncate">
                {pettyCashReference}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                RECIPIENT
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1 truncate">
                {recipientName}
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="px-4">
            <div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                REQUESTER
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1 truncate">
                {requesterName}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                PAYMENT METHOD
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1 truncate">
                {paymentMethod}
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="px-4">
            <div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                REQUEST DATE
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1">
                {requestDate}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                AMOUNT REQUESTED
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1">
                {formatCurrency(amountRequested)}
              </div>
            </div>
          </div>

          {/* Column 4 */}
          <div className="pl-4">
            <div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                WBS ACTIVITY
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1 truncate">
                {wbsActivity}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                AMOUNT PAID
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-1">
                {formatCurrency(amountPaid)}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4. PURPOSE CARD ================= */}
        <div className="rounded-r-md bg-[#F5F8FF] border-l-2 border-[#3B7CED] p-4 mt-6">
          <h3 className="text-[10px] font-bold text-[#0D3C8C] tracking-wider uppercase mb-1.5">
            PURPOSE
          </h3>
          <p className="text-[11.5px] leading-relaxed text-gray-600">
            {purpose}
          </p>
        </div>

        {/* ================= 5. AUTHORIZATION TRAIL ================= */}
        <div className="mt-8">
          <h3 className="text-[10.5px] font-bold text-[#0D3C8C] tracking-wider uppercase mb-6">
            AUTHORIZATION TRAIL
          </h3>

          <div className="relative flex items-start justify-between px-10 sm:px-14">
            {/* Connecting Green Line spanning between center of Step 1 and Step 3 */}
            <div className="absolute top-5.5 left-[17%] right-[17%] h-px bg-[#C2E4CC]" />

            {/* Step 1: Requested By */}
            <div className="relative z-10 flex flex-col items-center text-center w-44">
              <div className="w-11 h-11 rounded-full bg-[#D7F4DF] border border-[#5FBA79] flex items-center justify-center text-[#16A34A] shadow-xs">
                <svg
                  className="w-5 h-5 text-[#22C55E]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mt-3">
                REQUESTED BY
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-0.5 truncate max-w-40">
                {requesterName}
              </div>
              <div className="text-[10.5px] text-gray-400 mt-0.5">
                {requestDateTime}
              </div>
            </div>

            {/* Step 2: Approved By */}
            <div className="relative z-10 flex flex-col items-center text-center w-44">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs ${
                  isApproved
                    ? "bg-[#D7F4DF] border border-[#5FBA79] text-[#16A34A]"
                    : "bg-gray-100 border border-gray-300 text-gray-400"
                }`}
              >
                <svg
                  className="w-5 h-5 text-[#22C55E]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mt-3">
                APPROVED BY
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-0.5 truncate max-w-40">
                {isApproved ? approverName : "Pending"}
              </div>
              <div className="text-[10.5px] text-gray-400 mt-0.5">
                {isApproved ? approvedDateTime : "—"}
              </div>
            </div>

            {/* Step 3: Paid By */}
            <div className="relative z-10 flex flex-col items-center text-center w-44">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs ${
                  isPaid
                    ? "bg-[#D7F4DF] border border-[#5FBA79] text-[#16A34A]"
                    : "bg-gray-100 border border-gray-300 text-gray-400"
                }`}
              >
                <svg
                  className="w-5 h-5 text-[#22C55E]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mt-3">
                PAID BY
              </div>
              <div className="text-[13px] font-bold text-gray-900 mt-0.5 truncate max-w-40">
                {isPaid ? payerName : "Pending"}
              </div>
              <div className="text-[10.5px] text-gray-400 mt-0.5">
                {isPaid ? paidDateTime : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 6. GREEN CONFIRMATION BANNER ================= */}
        <div className="rounded-md bg-[#D7F4DF] px-5 py-3.5 flex items-center gap-2.5 mt-8 text-[#14532D] text-[11.5px] font-semibold">
          <svg
            className="w-4 h-4 text-[#16A34A] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            {isPaid
              ? "This disbursement has been fully authorized and paid."
              : isApproved
                ? "This disbursement has been approved and is queued for payment."
                : "This disbursement is currently pending approval and authorization."}
          </span>
        </div>
      </div>

      {/* ================= 7. FOOTER ================= */}
      <div className="border-t border-gray-200 pt-3 mt-8 flex items-center justify-between text-[8.5px] text-gray-400">
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
