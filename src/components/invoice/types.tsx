export type InvoiceStatus = "paid" | "partial" | "unpaid";

export type Status = InvoiceStatus;

export interface StatusInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const mapLegacyStatus = (status: string): InvoiceStatus => {
  const statusMapping: Record<string, InvoiceStatus> = {
    // Map incoming status to our 3 status types
    paid: "paid",
    partial: "partial",
    unpaid: "unpaid",
    overdue: "unpaid",
    cancelled: "unpaid",
  };

  const mappedStatus = statusMapping[status];
  return mappedStatus ?? "unpaid";
};

export const getStatusInfo = (
  status: string | null | undefined
): StatusInfo => {
  // Map legacy status to new standardized status
  const mappedStatus = status ? mapLegacyStatus(status) : null;

  const statusMap: Record<string, StatusInfo> = {
    paid: {
      label: "Paid",
      description: "Paid",
      color: "text-[#2BA24D]",
      bgColor: "bg-[#2BA24D]",
    },
    partial: {
      label: "Partially Paid",
      description: "Partially Paid",
      color: "text-[#F0B401]",
      bgColor: "bg-[#F0B401]",
    },
    unpaid: {
      label: "Unpaid",
      description: "Unpaid",
      color: "text-[#E43D2B]",
      bgColor: "bg-[#E43D2B]",
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

export type InvoiceRow = {
  id: string;
  vendor: string;
  dateCreated: string;
  dueDate: string;
  amount: string;
  due: string;
  totalAmount: string;
  status: Status;
};
