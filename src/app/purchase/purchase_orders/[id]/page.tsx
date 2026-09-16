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
import { StatusPill } from "@/components/purchase/purchaseOrder";
import ProductItemsTable from "@/components/purchase/purchaseOrder/ProductItemsTable";
import {
  useGetPurchaseOrderQuery,
  usePatchPurchaseOrderMutation,
} from "@/api/purchase/purchaseOrderApi";
import { useParams } from "next/navigation";
import { LoadingDots } from "@/components/shared/LoadingComponents";
import { extractErrorMessage } from "@/lib/utils";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

const Page = () => {
  const params = useParams();
  const purchaseOrderId = params.id as string;
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  const {
    data: purchaseOrder,
    isLoading,
    error,
    refetch,
  } = useGetPurchaseOrderQuery(purchaseOrderId);

  const [updateStatus, { isLoading: isUpdatingStatus }] =
    usePatchPurchaseOrderMutation();

  const isOwnOrder =
    purchaseOrder?.created_by_details?.user?.id === loggedInUserId;

  const creatorName = isOwnOrder
    ? "YOU"
    : purchaseOrder?.created_by_details?.user?.first_name &&
        purchaseOrder?.created_by_details?.user?.last_name
      ? `${purchaseOrder?.created_by_details.user.first_name} ${purchaseOrder?.created_by_details.user.last_name}`
      : "Unknown Creator";

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
                Loading purchase order details...
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  // Error state
  if (error) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg font-semibold mb-2">
                Error Loading Purchase Order
              </div>
              <p className="text-gray-600">{extractErrorMessage(error, "Unable to load purchase order details")}</p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  // If no data
  if (!purchaseOrder) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-500 text-lg font-semibold mb-2">
                Purchase Order Not Found
              </div>
              <p className="text-gray-600">
                The requested purchase order could not be found.
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
    { label: "Purchase Orders", href: "/purchase/purchase_orders" },
    {
      label: purchaseOrder.id,
      href: `/purchase/purchase_orders/${purchaseOrder.id}`,
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
    newStatus: "awaiting" | "completed" | "cancelled",
  ) => {
    try {
      await updateStatus({
        id: purchaseOrderId,
        data: { status: newStatus },
      }).unwrap();

      // Refetch the data to get updated purchase order
      await refetch();

      // Show success notification
      const statusMessages = {
        awaiting: "Purchase order sent for approval successfully!",
        completed: "Purchase order completed successfully!",
        cancelled: "Purchase order cancelled successfully!",
      };

      setNotification({
        message: statusMessages[newStatus as keyof typeof statusMessages],
        type: "success",
        show: true,
      });
    } catch (error: unknown) {
      setNotification({
        message: extractErrorMessage(error, "Failed to update purchase order status. Please try again."),
        type: "error",
        show: true,
      });
    }
  };

  const handleEdit = () => {
    window.location.href = `/purchase/purchase_orders/edit/${purchaseOrderId}`;
  };

  const handleSendForApproval = () => {
    handleStatusUpdate("awaiting");
  };

  const handleActivateOrder = async () => {
    try {
      // TODO: Implement activate order functionality
      console.log("Activate order clicked");

      // For now, show a success message
      setNotification({
        message: "Purchase order activated successfully!",
        type: "success",
        show: true,
      });

      // In a real implementation, you would make an API call here
      // and then refetch the data
      // await activateOrder({ id: purchaseOrderId }).unwrap();
      // await refetch();
    } catch (error: unknown) {
      setNotification({
        message: extractErrorMessage(error, "Failed to activate order. Please try again."),
        type: "error",
        show: true,
      });
    }
  };

  const handleConvertToIncomingProduct = () => {
    try {
      // For now, show a success message
      setNotification({
        message: "Purchase order converted to incoming product successfully!",
        type: "success",
        show: true,
      });

      // Navigate to the fromPO page with the purchase order ID
      window.location.href = `/inventory/operation/incoming_product/fromPO?poId=${purchaseOrderId}`;
    } catch (error: unknown) {
      setNotification({
        message: extractErrorMessage(error, "Failed to convert to incoming product. Please try again."),
        type: "error",
        show: true,
      });
    }
  };

  return (
    <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <PageHeader
        items={items}
        title="Purchase Order"
        isEdit={
          purchaseOrder.status === "draft"
            ? `/purchase/purchase_orders/edit/${purchaseOrder.id}`
            : undefined
        }
      />

      <div className="h-full mx-auto px-6 py-8 bg-white">
        <FadeIn delay={0.2}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-blue-500 ">
              Basic Information
            </h2>

            <StatusPill status={purchaseOrder.status} />
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
                      <p className="text-gray-700">{purchaseOrder.id}</p>
                    </div>
                  </FadeIn>

                  {/* Email */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Date Created
                      </h3>
                      <p className="text-gray-700">
                        {formatDate(purchaseOrder.date_created)}
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
                        {purchaseOrder.currency_details?.currency_name} (
                        {purchaseOrder.currency_details?.currency_symbol})
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
                        {formatDate(purchaseOrder.date_updated)}
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
                        {purchaseOrder.vendor_details?.company_name || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Payment Terms
                      </h3>
                      <p className="text-gray-700">
                        {purchaseOrder.payment_terms || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Purchase Policy
                      </h3>
                      <p className="text-gray-700">
                        {purchaseOrder.purchase_policy || "N/A"}
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
                        Destination Location
                      </h3>
                      <p className="text-gray-700">
                        {purchaseOrder.destination_location_details
                          ?.location_name || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Delivery Terms
                      </h3>
                      <p className="text-gray-700">
                        {purchaseOrder.delivery_terms || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Created By
                      </h3>
                      <p className="text-gray-700">{creatorName}</p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>
          </div>
        </div>

        <ProductItemsTable items={purchaseOrder.items} />

        {/* Status-based Action Buttons */}
        <div>
          <SlideUp>
            <div className="h-24"></div>
          </SlideUp>

          {/* Render buttons based on purchase order status */}
          {purchaseOrder.status === "draft" && (
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

          {purchaseOrder.status === "awaiting" && (
            <SlideUp delay={0.2}>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={() => handleStatusUpdate("completed")}
                  variant="ghost"
                  disabled={isUpdatingStatus}
                  className="text-white bg-[#2BA24D] hover:bg-[#248d40] hover:text-gray-50"
                >
                  {isUpdatingStatus ? "Processing..." : "Approve"}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("cancelled")}
                  variant="outline"
                  disabled={isUpdatingStatus}
                  className="text-[#E43D2B] border-[#E43D2B] hover:bg-[#E43D2B] hover:text-white"
                >
                  {isUpdatingStatus ? "Processing..." : "Reject"}
                </Button>
              </div>
            </SlideUp>
          )}

          {purchaseOrder.status === "approved" && (
            <SlideUp delay={0.2}>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={handleActivateOrder}
                  variant="contained"
                  className="text-white bg-[#3B7CED] hover:bg-[#3065c3]"
                >
                  Activate Order
                </Button>
              </div>
            </SlideUp>
          )}

          {(purchaseOrder.status === "rejected" ||
            purchaseOrder.status === "cancelled") && (
            <SlideUp delay={0.2}>
              <div className="flex justify-end gap-4">
                {/* No action buttons for rejected/cancelled status */}
              </div>
            </SlideUp>
          )}

          {purchaseOrder.status === "completed" && (
            <SlideUp delay={0.2}>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={handleConvertToIncomingProduct}
                  variant="contained"
                  className="text-white bg-[#3B7CED] hover:bg-[#3065c3]"
                >
                  Convert to Incoming Product
                </Button>
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
