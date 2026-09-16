"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SlideUp } from "@/components/shared/AnimatedWrapper";
import { RequestForQuotation } from "@/api/purchase/requestForQuotationApi";
import Link from "next/link";

export interface RfqActionButtonsProps {
  rfq: RequestForQuotation;
  isUpdatingStatus: boolean;
  onStatusUpdate: (
    status: "approved" | "rejected" | "pending",
  ) => Promise<void>;
  className?: string;
}

export function RfqActionButtons({
  rfq,
  isUpdatingStatus,
  onStatusUpdate,
  className = "",
}: RfqActionButtonsProps) {
  const handleSendForApproval = () => {
    onStatusUpdate("pending");
  };

  const handleApprove = () => {
    onStatusUpdate("approved");
  };

  const handleReject = () => {
    onStatusUpdate("rejected");
  };

  return (
    <div className={className}>
      <SlideUp>
        <div className="h-24"></div>
      </SlideUp>

      {/* Render buttons based on RFQ status */}
      {rfq?.status === "draft" && (
        <SlideUp delay={0.2}>
          <div className="flex justify-end gap-4">
            <Button
              onClick={handleSendForApproval}
              variant="ghost"
              disabled={isUpdatingStatus}
              className="text-white bg-[#2BA24D] hover:bg-[#248d40] hover:text-gray-50"
            >
              {isUpdatingStatus ? "Processing..." : "Send for Approval"}
            </Button>
          </div>
        </SlideUp>
      )}

      {rfq?.status === "pending" && (
        <SlideUp delay={0.2}>
          <div className="flex justify-end gap-4">
            <Button
              onClick={handleApprove}
              variant="ghost"
              disabled={isUpdatingStatus}
              className="text-white bg-[#2BA24D] hover:bg-[#248d40] hover:text-gray-50"
            >
              {isUpdatingStatus ? "Processing..." : "Approve"}
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              disabled={isUpdatingStatus}
              className="text-[#E43D2B] border-[#E43D2B] hover:bg-[#E43D2B] hover:text-white"
            >
              {isUpdatingStatus ? "Processing..." : "Reject"}
            </Button>
          </div>
        </SlideUp>
      )}

      {rfq?.status === "approved" && (
        <SlideUp delay={0.2}>
          <Link
            href={`/purchase/purchase_orders/convert/${rfq.id}`}
            className="flex justify-end gap-4"
          >
            <Button variant={"contained"}>Convert to PO</Button>
          </Link>
        </SlideUp>
      )}

      {rfq?.status === "rejected" && (
        <SlideUp delay={0.2}>
          <div className="flex justify-end gap-4">
            {/* No action buttons for rejected status */}
          </div>
        </SlideUp>
      )}
    </div>
  );
}
