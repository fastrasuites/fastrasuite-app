import { BreadcrumbItem } from "@/types/purchase";
import { RequestForQuotation } from "@/api/purchase/requestForQuotationApi";

export interface RfqNavigationData {
  items: BreadcrumbItem[];
  editUrl?: string;
}

export interface RfqStatusMessages {
  pending: string;
  approved: string;
  rejected: string;
}

export class RfqService {
  static createNavigationItems(rfq: RequestForQuotation): RfqNavigationData {
    const items: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      { label: "Purchase", href: "/purchase" },
      {
        label: "Request for Quotations",
        href: "/purchase/request_for_quotations",
      },
      {
        label: rfq?.id || "",
        href: `/purchase/request_for_quotations/${rfq?.id || ""}`,
        current: true,
      },
    ];

    const editUrl =
      rfq?.status === "draft"
        ? `/purchase/request_for_quotations/edit/${rfq?.id}`
        : undefined;

    return { items, editUrl };
  }

  static getStatusMessages(): RfqStatusMessages {
    return {
      pending: "RFQ sent for approval successfully!",
      approved: "RFQ approved successfully!",
      rejected: "RFQ rejected successfully!",
    };
  }

  static getErrorMessages(): {
    loading: string;
    general: string;
    updateFailed: string;
    notFound: string;
  } {
    return {
      loading: "Loading RFQ details...",
      general: "Unable to load RFQ details",
      updateFailed: "Failed to update RFQ status. Please try again.",
      notFound: "The requested RFQ could not be found.",
    };
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  static canUserEditRfq(rfq: RequestForQuotation, userId?: string): boolean {
    return rfq?.status === "draft" && !!userId;
  }

  static getNextStatusActions(currentStatus: string): string[] {
    switch (currentStatus) {
      case "draft":
        return ["pending"];
      case "pending":
        return ["approved", "rejected"];
      case "approved":
      case "rejected":
        return [];
      default:
        return [];
    }
  }
}
