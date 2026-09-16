import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
}

function extractAmount(tx: any): number {
  if (!tx) return 0;

  const candidates = [
    tx?.detail?.project_request?.request_amount,
    tx?.detail?.contract_value,
    tx?.detail?.total_amount,
    tx?.detail?.projected_cost,
    tx?.detail?.amount_requested,
    tx?.detail?.estimated_cost,
    tx?.detail?.amount,
    tx?.detail?.total,
    tx?.detail?.subtotal,
    tx?.amount,
    tx?.total_amount,
    tx?.request_amount,
    tx?.actual_amount,
    tx?.cost,
    tx?.total,
    tx?.subtotal,
    tx?.value,
  ];

  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== "") {
      if (typeof val === "number" && !isNaN(val)) {
        return val;
      }
      if (typeof val === "string") {
        const cleaned = val.replace(/[^0-9.-]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
  }

  if (Array.isArray(tx?.detail?.lines) && tx.detail.lines.length > 0) {
    const sum = tx.detail.lines.reduce((acc: number, line: any) => {
      const lineAmt =
        line.total_cost ??
        line.line_total ??
        line.total_amount ??
        line.amount ??
        line.subtotal ??
        Number(line.quantity || line.hours || 0) *
          Number(line.unit_cost || line.estimated_unit_cost || line.unit_price || line.hourly_rate || line.rate || 0);
      const num =
        typeof lineAmt === "number"
          ? lineAmt
          : parseFloat(String(lineAmt).replace(/[^0-9.-]/g, ""));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    if (sum > 0) return sum;
  }

  if (Array.isArray(tx?.lines) && tx.lines.length > 0) {
    const sum = tx.lines.reduce((acc: number, line: any) => {
      const lineAmt =
        line.total_cost ??
        line.line_total ??
        line.total_amount ??
        line.amount ??
        line.subtotal ??
        Number(line.quantity || line.hours || 0) *
          Number(line.unit_cost || line.estimated_unit_cost || line.unit_price || line.hourly_rate || line.rate || 0);
      const num =
        typeof lineAmt === "number"
          ? lineAmt
          : parseFloat(String(lineAmt).replace(/[^0-9.-]/g, ""));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    if (sum > 0) return sum;
  }

  return 0;
}

function formatCategory(cat: string): string {
  if (!cat) return "-";
  return cat
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function TransactionDetailsModal({ isOpen, onClose, transaction }: Props) {
  const amountVal = extractAmount(transaction);
  const amountStr = `₦${Number(amountVal).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatDate = (dateVal: any) => {
    if (!dateVal) return "-";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const dateStr = formatDate(transaction?.date || transaction?.created_at);

  const rawRef =
    transaction?.reference_id ||
    transaction?.detail?.project_request?.reference_id ||
    transaction?.detail?.request_id ||
    transaction?.detail?.reference_id ||
    transaction?.reference_no ||
    transaction?.transaction_number ||
    (transaction?.id ? `PjR-${transaction?.id}` : "");
  const refStr = rawRef ? `#${rawRef.replace("#", "")}` : "-";
  const catStr = formatCategory(transaction?.category || transaction?.request_type || transaction?.type || transaction?.project_type || "-");
  const statusStr = transaction?.status || "Approved";
  const descStr =
    transaction?.detail?.lines?.[0]?.description ||
    transaction?.detail?.scope_of_work ||
    transaction?.detail?.purpose ||
    transaction?.detail?.description ||
    transaction?.detail?.justification_notes ||
    transaction?.detail?.notes ||
    transaction?.description ||
    transaction?.desc ||
    transaction?.name ||
    "-";
  
  const extractWbs = (tx: any) => {
    if (tx?.detail?.phase_details?.name) {
      return tx.detail.activity_details?.name
        ? `${tx.detail.phase_details.name} - ${tx.detail.activity_details.name}`
        : tx.detail.phase_details.name;
    }
    if (tx?.wbs || tx?.phase_name || tx?.phase) {
      return tx.wbs || tx.phase_name || tx.phase;
    }
    const notes = tx?.detail?.notes || "";
    const match = notes.match(/Phase:\s*([^|]+)/i);
    return match ? match[1].trim() : "-";
  };
  const wbsStr = extractWbs(transaction);

  const costCatStr =
    transaction?.cost_category_code ||
    transaction?.cost_category ||
    transaction?.cost_code ||
    transaction?.costCat ||
    "-";

  const getCreatedByName = (tx: any) => {
    if (tx?.created_by_details) {
      const { first_name, last_name, email } = tx.created_by_details;
      const fullName = `${first_name || ""} ${last_name || ""}`.trim();
      if (fullName) return fullName;
      if (email) return email;
    }
    if (tx?.detail?.created_by_name) return tx.detail.created_by_name;
    if (tx?.detail?.requester_details?.user) {
      const u = tx.detail.requester_details.user;
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
      if (fullName) return fullName;
      if (u.username) return u.username;
      if (u.email) return u.email;
    }
    if (tx?.created_by_name) return tx.created_by_name;
    if (tx?.user?.name) return tx.user.name;
    return "-";
  };
  const madeByStr = getCreatedByName(transaction);

  const statusLower = statusStr.toLowerCase();
  let badgeClass = "bg-gray-150 text-gray-700";
  if (statusLower.includes("approv") || statusLower === "done" || statusLower === "success" || statusLower === "released") {
    badgeClass = "bg-[#E2F2E9] text-[#1E8E3E]";
  } else if (statusLower === "paid" || statusLower === "invoice") {
    badgeClass = "bg-[#E8F0FE] text-[#1A73E8]";
  } else if (statusLower.includes("cancel") || statusLower.includes("reject")) {
    badgeClass = "bg-[#FCE8E6] text-[#C5221F]";
  } else if (statusLower.includes("pend")) {
    badgeClass = "bg-[#FFF2CC] text-[#D66011]";
  } else if (statusLower === "draft") {
    badgeClass = "bg-[#E8F0FE] text-[#1A73E8]";
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-900">Transaction Details</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Transaction number {refStr}</p>
        </DialogHeader>
 
        <div className="px-6 py-4 flex flex-col gap-6">
          {/* Amount */}
          <div>
            <p className="text-sm text-gray-400 font-medium mb-1">Transaction Amount</p>
            <p className="text-3xl font-bold text-gray-900">{amountStr}</p>
          </div>
 
          <hr className="border-gray-100" />
 
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Transaction Date</p>
                <p className="text-sm font-semibold text-gray-800">{dateStr}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Transaction Number</p>
                <p className="text-sm font-semibold text-gray-800">{refStr}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Category</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">{catStr}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Status</p>
                <div className="mt-0.5">
                  <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                    {statusStr}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Description</p>
                <p className="text-sm font-semibold text-gray-800">{descStr}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Transaction made by</p>
                <p className="text-sm font-semibold text-gray-800">{madeByStr}</p>
              </div>
            </div>
          </div>
 
          <hr className="border-gray-100" />
 
          {/* Project Category */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Project Category</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">WBS</p>
                <p className="text-sm font-semibold text-gray-800">{wbsStr}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Cost Category</p>
                <p className="text-sm font-semibold text-gray-800 font-mono uppercase">{costCatStr}</p>
              </div>
            </div>
          </div>
 
          <hr className="border-gray-100" />
 
          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="flex flex-col relative pl-2">
              <div className="absolute left-[13px] top-3 bottom-4 w-[3px] bg-[#1E8E3E]"></div>
              
              <div className="flex gap-4 mb-5 relative">
                <div className="w-3.5 h-3.5 rounded-full bg-[#1E8E3E] mt-1 z-10 shrink-0 shadow-[0_0_0_4px_rgba(255,255,255,1)]"></div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Request Created</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {transaction?.created_at
                      ? new Date(transaction.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "Recently"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 relative">
                <div className="w-3.5 h-3.5 rounded-full bg-[#1E8E3E] mt-1 z-10 shrink-0 shadow-[0_0_0_4px_rgba(255,255,255,1)]"></div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 capitalize">
                    {statusStr === "pending" ? "Pending Approval" : `Status: ${statusStr}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {transaction?.updated_at || transaction?.created_at
                      ? new Date(transaction.updated_at || transaction.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex justify-end">
          <Button onClick={onClose} className="bg-[#3B7CED] hover:bg-[#3065c3] text-white px-8">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
