"use client";

import { PageHeader } from "@/components/purchase/products";
import { BreadcrumbItem } from "@/types/purchase";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  Interactive,
} from "@/components/shared/AnimatedWrapper";
import Image from "next/image";
import React from "react";
import { StatusPill } from "@/components/purchase/purchaseRequest";
import ProductItemsTable from "@/components/purchase/purchaseRequest/ProductItemsTable";
import {
  useGetPurchaseRequestQuery,
  usePatchPurchaseRequestMutation,
} from "@/api/purchase/purchaseRequestApi";
import { useParams, useRouter } from "next/navigation";
import { LoadingDots } from "@/components/shared/LoadingComponents";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const purchaseRequestId = params.id as string;
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  const {
    data: purchaseRequest,
    isLoading,
    error,
    refetch,
  } = useGetPurchaseRequestQuery(purchaseRequestId);

  const [updateStatus, { isLoading: isUpdatingStatus }] =
    usePatchPurchaseRequestMutation();

  const isOwnRequest =
    purchaseRequest?.requester_details?.user?.id === loggedInUserId;

  const requesterName = isOwnRequest
    ? "YOU"
    : purchaseRequest?.requester_details?.user?.first_name &&
      purchaseRequest?.requester_details?.user?.last_name
    ? `${purchaseRequest?.requester_details.user.first_name} ${purchaseRequest?.requester_details.user.last_name}`
    : "Unknown Requester";

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({
    message: "",
    type: "success",
    show: false,
  });

  // Close notification
  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  // Loading state
  if (isLoading) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingDots />
              <p className="mt-4 text-gray-600">
                Loading purchase request details...
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  // Error state
  if (error) {
    const errorMessage =
      "data" in error
        ? error.data?.detail ||
          error.data?.message ||
          "Unable to load purchase request details"
        : "Unable to load purchase request details";
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg font-semibold mb-2">
                Error Loading Purchase Request
              </div>
              <p className="text-gray-600">{errorMessage}</p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  // If no data
  if (!purchaseRequest) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-500 text-lg font-semibold mb-2">
                Purchase Request Not Found
              </div>
              <p className="text-gray-600">
                The requested purchase request could not be found.
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Purchase Requests", href: "/purchase/purchase_requests" },
    {
      label: purchaseRequest.id,
      href: `/purchase/purchase_requests/${purchaseRequest.id}`,
      current: true,
    },
  ];

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

  // Action handlers
  const handleStatusUpdate = async (
    newStatus: "approved" | "rejected" | "pending"
  ) => {
    try {
      await updateStatus({
        id: purchaseRequestId,
        data: { status: newStatus },
      }).unwrap();

      // Refetch the data to get updated purchase request
      await refetch();

      // Show success notification
      const statusMessages = {
        pending: "Purchase request sent for approval successfully!",
        approved: "Purchase request approved successfully!",
        rejected: "Purchase request rejected successfully!",
      };

      setNotification({
        message: statusMessages[newStatus],
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      setNotification({
        message: "Failed to update purchase request status. Please try again.",
        type: "error",
        show: true,
      });
    }
  };

  const handleSendForApproval = () => {
    handleStatusUpdate("pending");
  };

  const handleConvertToRFQ = async () => {
    try {
      router.push(
        `/purchase/request_for_quotations/convert_to_rfq?from_pr=${purchaseRequestId}`
      );
    } catch (error) {
      console.error("Failed to convert to RFQ:", error);
      setNotification({
        message: "Failed to convert to RFQ. Please try again.",
        type: "error",
        show: true,
      });
    }
  };
  console.log("Rendering Page with status:", purchaseRequest.status);
  return (
    <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <PageHeader
        items={items}
        title="Purchase Request"
        isEdit={
          purchaseRequest.status === "draft"
            ? `/purchase/purchase_requests/edit/${purchaseRequest.id}`
            : undefined
        }
      />

      <div className="h-full mx-auto px-6 py-8 bg-white">
        <FadeIn delay={0.2}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-blue-500 ">
              Basic Information
            </h2>

            <StatusPill status={purchaseRequest.status} />
          </div>
        </FadeIn>

        <div className="flex items-start gap-8">
          {/* Content: rows with separators */}
          <div className="flex-1">
            {/* Row 1 (first 3 fields) */}
            <SlideUp delay={0.4}>
              <div className="py-4 border-b border-gray-200">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4"
                  staggerDelay={0.15}
                >
                  {/* Company Name */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        ID
                      </h3>
                      <p className="text-gray-700">{purchaseRequest.id}</p>
                    </div>
                  </FadeIn>

                  {/* Email */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Date Opened
                      </h3>
                      <p className="text-gray-700">
                        {formatDate(purchaseRequest.date_created)}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Phone Number */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Currency
                      </h3>
                      <p className="text-gray-700">
                        {purchaseRequest.currency_details?.currency_name} (
                        {purchaseRequest.currency_details?.currency_symbol})
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
                  {/* Address */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Date Updated
                      </h3>
                      <p className="text-gray-700">
                        {formatDate(purchaseRequest.date_updated)}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Status */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Vendor
                      </h3>
                      <p className="text-gray-700">
                        {purchaseRequest.vendor_details?.company_name || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Purpose
                      </h3>
                      <p className="text-gray-700">
                        {purchaseRequest.purpose || "N/A"}
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>

            {/* Row 3 (Additional info) */}
            <SlideUp delay={0.8}>
              <div className="py-4 last:border-b-0 my-4">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                  staggerDelay={0.15}
                >
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Requesting Location
                      </h3>
                      <p className="text-gray-700">
                        {purchaseRequest.requesting_location_details
                          ?.location_name || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Requester
                      </h3>
                      <p className="text-gray-700">{requesterName}</p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>
          </div>
        </div>

        <ProductItemsTable items={purchaseRequest.items} />

        {/* Status-based Action Buttons */}
        <div>
          <SlideUp>
            <div className="h-24"></div>
          </SlideUp>

          {/* Render buttons based on purchase request status */}
          {purchaseRequest.status === "draft" && (
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

          {purchaseRequest.status === "pending" && (
            <SlideUp delay={0.2}>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={() => handleStatusUpdate("approved")}
                  variant="ghost"
                  disabled={isUpdatingStatus}
                  className="text-white bg-[#2BA24D] hover:bg-[#248d40] hover:text-gray-50"
                >
                  {isUpdatingStatus ? "Processing..." : "Approve"}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("rejected")}
                  variant="outline"
                  disabled={isUpdatingStatus}
                  className="text-[#E43D2B] border-[#E43D2B] hover:bg-[#E43D2B] hover:text-white"
                >
                  {isUpdatingStatus ? "Processing..." : "Reject"}
                </Button>
              </div>
            </SlideUp>
          )}

          {purchaseRequest.status === "approved" && (
            <SlideUp delay={0.2}>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={handleConvertToRFQ}
                  variant="contained"
                  className="text-white bg-[#3B7CED] hover:bg-[#3065c3]"
                >
                  Convert to RFQ
                </Button>
              </div>
            </SlideUp>
          )}

          {purchaseRequest.status === "rejected" && (
            <SlideUp delay={0.2}>
              <div className="flex justify-end gap-4">
                {/* No action buttons for rejected status */}
              </div>
            </SlideUp>
          )}
        </div>
      </div>

      {/* Notification */}
      <ToastNotification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={closeNotification}
      />
    </FadeIn>
  );
};

export default Page;
