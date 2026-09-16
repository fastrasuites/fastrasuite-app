export type StockAdjustmentStatus = "draft" | "done" | "validated" | "pending" | "unknown";

export interface StatusInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const mapLegacyStatus = (
  status: string | null | undefined,
): StockAdjustmentStatus => {
  if (!status) return "draft";

  const s = status
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");

  // direct mappings and common legacy synonyms
  const mapping: Record<string, StockAdjustmentStatus> = {
    draft: "draft",
    pending: "draft",
    in_progress: "draft",
    done: "done",
    validated: "done",
    complete: "done",
    completed: "done",
    approved: "done",
  };

  return mapping[s] ?? (s.includes("draft") ? "draft" : s.includes("done") || s.includes("valid") ? "done" : "draft");
};

export const getStatusInfo = (
  status: string | null | undefined,
): StatusInfo => {
  const mappedStatus = mapLegacyStatus(status);

  const statusMap: Record<StockAdjustmentStatus, StatusInfo> = {
    draft: {
      label: "Draft",
      description: "Draft",
      color: "text-[#3B7CED]",
      bgColor: "bg-[#3B7CED]",
    },
    pending: {
      label: "Pending",
      description: "Pending",
      color: "text-[#3B7CED]",
      bgColor: "bg-[#3B7CED]",
    },
    done: {
      label: "Validated",
      description: "Validated",
      color: "text-[#2BA24D]",
      bgColor: "bg-[#2BA24D]",
    },
    validated: {
      label: "Validated",
      description: "Validated",
      color: "text-[#2BA24D]",
      bgColor: "bg-[#2BA24D]",
    },
    unknown: {
      label: "Draft",
      description: "Draft",
      color: "text-[#3B7CED]",
      bgColor: "bg-[#3B7CED]",
    },
  };

  return statusMap[mappedStatus];
};

export type StockAdjustmentRow = {
  id: string;
  adjustmentType: string;
  location: string;
  adjustedDate: string;
  status: StockAdjustmentStatus;
  product?: string;
  quantity?: number;
  amount?: string;
  requester?: string;
};
