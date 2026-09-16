"use client";

import React from "react";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
} from "@/components/shared/AnimatedWrapper";
import { StatusPill } from "@/components/purchase/purchaseRequest";
import { RequestForQuotation } from "@/api/purchase/requestForQuotationApi";

export interface RfqMetadataCardProps {
  rfq: RequestForQuotation;
  className?: string;
}

export function RfqMetadataCard({ rfq, className = "" }: RfqMetadataCardProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!rfq) {
    return null;
  }

  return (
    <div className={className}>
      <FadeIn delay={0.2}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-blue-500">
            Basic Information
          </h2>
          <StatusPill status={rfq?.status || "draft"} />
        </div>
      </FadeIn>

      <div className="flex items-start gap-8">
        <div className="flex-1">
          {/* Row 1 (first 3 fields) */}
          <SlideUp delay={0.4}>
            <div className="py-4 border-b border-gray-200">
              <StaggerContainer
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4"
                staggerDelay={0.15}
              >
                <FadeIn>
                  <div className="p-4 transition-colors border-r border-gray-300">
                    <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                      ID
                    </h3>
                    <p className="text-gray-700">{rfq?.id}</p>
                  </div>
                </FadeIn>

                <FadeIn>
                  <div className="p-4 transition-colors border-r border-gray-300">
                    <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                      Purchase Request ID
                    </h3>
                    <p className="text-gray-700">
                      {rfq?.purchase_request || "N/A"}
                    </p>
                  </div>
                </FadeIn>

                <FadeIn>
                  <div className="p-4 transition-colors border-r border-gray-300">
                    <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                      Date Opened
                    </h3>
                    <p className="text-gray-700">
                      {formatDate(rfq?.date_created || "")}
                    </p>
                  </div>
                </FadeIn>
              </StaggerContainer>
            </div>
          </SlideUp>

          {/* Row 2 (remaining fields) */}
          <SlideUp delay={0.6}>
            <div className="py-4 last:border-b-0 my-4">
              <StaggerContainer
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                staggerDelay={0.15}
              >
                <FadeIn>
                  <div className="p-4 transition-colors border-r border-gray-300">
                    <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                      Currency
                    </h3>
                    <p className="text-gray-700">
                      {rfq?.currency_details?.currency_name} (
                      {rfq?.currency_details?.currency_symbol})
                    </p>
                  </div>
                </FadeIn>
                <FadeIn>
                  <div className="p-4 transition-colors border-r border-gray-300">
                    <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                      Vendor
                    </h3>
                    <p className="text-gray-700">
                      {rfq?.vendor_details?.company_name || "N/A"}
                    </p>
                  </div>
                </FadeIn>

                <FadeIn>
                  <div className="p-4 transition-colors border-r border-gray-300">
                    <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                      Expiry Date
                    </h3>
                    <p className="text-gray-700">
                      {rfq?.expiry_date ? formatDate(rfq.expiry_date) : "N/A"}
                    </p>
                  </div>
                </FadeIn>
              </StaggerContainer>
            </div>
          </SlideUp>
        </div>
      </div>
    </div>
  );
}
