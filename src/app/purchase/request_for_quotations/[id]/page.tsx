"use client";

import React from "react";
import { FadeIn } from "@/components/shared/AnimatedWrapper";
import { PageHeader } from "@/components/purchase/products";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { useParams } from "next/navigation";

// Custom hooks
import { useRfqData } from "@/hooks/useRfqData";
import { useNotification } from "@/hooks/useNotification";

// Components
import { RfqLoadingView } from "@/components/purchase/requestForQuotation/RfqLoadingView";
import { RfqErrorView } from "@/components/purchase/requestForQuotation/RfqErrorView";
import { RfqMetadataCard } from "@/components/purchase/requestForQuotation/RfqMetadataCard";
import { RfqItemsViewTable } from "@/components/purchase/requestForQuotation/RfqItemsViewTable";
import { RfqActionButtons } from "@/components/purchase/requestForQuotation/RfqActionButtons";

// Services
import { RfqService } from "@/services/rfqService";

const Page = () => {
  const params = useParams();
  const rfqId = params.id as string;

  // Custom hooks
  const { rfq, isLoading, error, refetch, isUpdatingStatus, updateStatus } =
    useRfqData(rfqId);
  const { notification, hideNotification, showError } = useNotification();

  // Handle status updates with error handling
  const handleStatusUpdate = async (
    status: "approved" | "rejected" | "pending"
  ) => {
    try {
      await updateStatus(status);
    } catch (error) {
      const errorMessages = RfqService.getErrorMessages();
      showError(errorMessages.updateFailed);
    }
  };

  // Loading state
  if (isLoading) {
    return <RfqLoadingView />;
  }

  // Error state
  if (error) {
    return <RfqErrorView error={error} />;
  }

  // If no data
  if (!rfq) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-500 text-lg font-semibold mb-2">
                RFQ Not Found
              </div>
              <p className="text-gray-600">
                {RfqService.getErrorMessages().notFound}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  // Get navigation data
  const { items, editUrl } = RfqService.createNavigationItems(rfq);

  return (
    <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <PageHeader
        items={items}
        title="Request for Quotation"
        isEdit={editUrl}
      />

      <div className="h-full mx-auto px-6 py-8 bg-white">
        {/* RFQ Metadata Card */}
        <RfqMetadataCard rfq={rfq} />

        {/* RFQ Items Section */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-blue-500 mb-4">RFQ Items</h2>
          <RfqItemsViewTable
            items={rfq.items}
            totalPrice={rfq.rfq_total_price}
          />
        </div>

        {/* Action Buttons */}
        <RfqActionButtons
          rfq={rfq}
          isUpdatingStatus={isUpdatingStatus}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      {/* Notification */}
      <ToastNotification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={hideNotification}
      />
    </FadeIn>
  );
};

export default Page;
