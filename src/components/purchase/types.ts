// Shared types for purchase components
export type PurchaseRequestStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "draft";
export type PurchaseOrderStatus =
  | "draft"
  | "awaiting"
  | "approved"
  | "rejected"
  | "active"
  | "completed"
  | "cancelled"
  | "partially_received";
export type Status = PurchaseRequestStatus | PurchaseOrderStatus;

// Status info type for consistent status display
export interface StatusInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

// Map old API statuses to new standardized statuses
const mapLegacyStatus = (status: string): PurchaseOrderStatus => {
  const statusMapping: Record<string, PurchaseOrderStatus> = {
    // Legacy purchase order statuses -> new purchase order statuses
    awaiting: "awaiting",
    pending: "awaiting",
    pending_approval: "awaiting",
    // Direct mappings
    draft: "draft",
    approved: "approved",
    rejected: "rejected",
    active: "active",
    completed: "completed",
    cancelled: "cancelled",
    partially_received: "partially_received",
  };

  return statusMapping[status] || "draft";
};

// Get status info for purchase order statuses
export const getStatusInfo = (
  status: string | null | undefined,
): StatusInfo => {
  // Map legacy status to new standardized status
  const mappedStatus = status ? mapLegacyStatus(status) : null;

  const statusMap: Record<string, StatusInfo> = {
    draft: {
      label: "Draft",
      description: "Draft",
      color: "text-[#3B7CED]",
      bgColor: "bg-[#3B7CED]",
    },
    awaiting: {
      label: "Awaiting",
      description: "Awaiting Approval",
      color: "text-[#F0B401]",
      bgColor: "bg-[#F0B401]",
    },
    approved: {
      label: "Approved",
      description: "Approved",
      color: "text-[#2BA24D]",
      bgColor: "bg-[#2BA24D]",
    },
    rejected: {
      label: "Rejected",
      description: "Rejected",
      color: "text-[#E43D2B]",
      bgColor: "bg-[#E43D2B]",
    },
    active: {
      label: "Active",
      description: "Active",
      color: "text-[#3B7CED]",
      bgColor: "bg-[#3B7CED]",
    },
    completed: {
      label: "Completed",
      description: "Completed",
      color: "text-[#2BA24D]",
      bgColor: "bg-[#2BA24D]",
    },
    cancelled: {
      label: "Cancelled",
      description: "Cancelled",
      color: "text-[#E43D2B]",
      bgColor: "bg-[#E43D2B]",
    },
    partially_received: {
      label: "Partially Received",
      description: "Partially Received",
      color: "text-[#F0B401]",
      bgColor: "bg-[#F0B401]",
    },
  };

  // Default for null, undefined, or unknown statuses
  const defaultStatus: StatusInfo = {
    label: "Unknown",
    description: "Unknown Status",
    color: "text-gray-500",
    bgColor: "bg-gray-500",
  };

  if (!mappedStatus) return defaultStatus;
  return statusMap[mappedStatus] || defaultStatus;
};

export type RequestRow = {
  id: string;
  product: string;
  quantity: number;
  amount: string;
  requester: string;
  status: Status;
};
