"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/purchase/products";
import { BreadcrumbItem } from "@/types/purchase";
import { Button } from "@/components/ui/button";
import {
  useGetLocationQuery,
  useToggleLocationHiddenStatusMutation,
  useDeleteLocationMutation,
} from "@/api/inventory/locationApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  Interactive,
} from "@/components/shared/AnimatedWrapper";
import { LoadingDots } from "@/components/shared/LoadingComponents";
import { useStatusModal, StatusModal } from "@/components/shared/StatusModal";
import { MapPin, Eye, EyeOff, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, extractErrorMessage } from "@/lib/utils";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;

  const {
    data: location,
    isLoading,
    error,
    refetch,
  } = useGetLocationQuery(locationId);

  const [toggleHiddenStatus, { isLoading: isTogglingStatus }] =
    useToggleLocationHiddenStatusMutation();
  const [deleteLocation, { isLoading: isDeleting }] =
    useDeleteLocationMutation();

  const statusModal = useStatusModal();

  // Memoized manager name
  const managerName = useMemo(() => {
    if (!location?.location_manager_details?.user) return "Not assigned";
    const { first_name, last_name } = location.location_manager_details.user;
    return first_name && last_name
      ? `${first_name} ${last_name}`
      : "Not assigned";
  }, [location]);

  // Memoized store keeper name
  const storeKeeperName = useMemo(() => {
    if (!location?.store_keeper_details?.user) return "Not assigned";
    const { first_name, last_name } = location.store_keeper_details.user;
    return first_name && last_name
      ? `${first_name} ${last_name}`
      : "Not assigned";
  }, [location]);

  // Loading state
  if (isLoading) {
    return (
      <PageGuard module="inventory" entitlement="view_location">
        <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingDots />
              <p className="mt-4 text-gray-600">Loading location details...</p>
            </div>
          </div>
        </div>
      </FadeIn>
      </PageGuard>
    );
  }

  // Error state
  if (error) {
    const errorMessage =
      "data" in error
        ? (error.data as { detail?: string; message?: string })?.detail ||
          (error.data as { message?: string })?.message ||
          "Unable to load location details"
        : "Unable to load location details";
    return (
      <PageGuard module="inventory" entitlement="view_location">
        <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg font-semibold mb-2">
                Error Loading Location
              </div>
              <p className="text-gray-600">{errorMessage}</p>
            </div>
          </div>
        </div>
      </FadeIn>
      </PageGuard>
    );
  }

  // If no data
  if (!location) {
    return (
      <PageGuard module="inventory" entitlement="view_location">
        <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-500 text-lg font-semibold mb-2">
                Location Not Found
              </div>
              <p className="text-gray-600">
                The requested location could not be found.
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
      </PageGuard>
    );
  }

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Configuration", href: "/inventory/configuration" },
    { label: "Locations", href: "/inventory/configuration/locations" },
    {
      label: location.location_name,
      href: `/inventory/configuration/locations/${location.id}`,
      current: true,
    },
  ];

  // Action handlers
  const handleToggleHiddenStatus = async () => {
    try {
      await toggleHiddenStatus({ id: locationId }).unwrap();
      await refetch();

      statusModal.showSuccess(
        "Status Updated",
        location.is_hidden ? "Location is now visible!" : "Location is now hidden!"
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      statusModal.showError(
        "Update Failed",
        extractErrorMessage(err, "Failed to update location status. Please try again.")
      );
    }
  };

  const handleDelete = async () => {
    statusModal.showConfirm(
      "Delete Location",
      "Are you sure you want to delete this location?",
      async () => {
        try {
          await deleteLocation(locationId).unwrap();
          statusModal.showSuccess(
            "Location Deleted",
            "Location deleted successfully!",
            "Go to Locations",
            () => router.push("/inventory/configuration/locations")
          );
        } catch (err) {
          console.error("Failed to delete location:", err);
          statusModal.showError(
            "Delete Failed",
            extractErrorMessage(err, "Failed to delete location. Please try again.")
          );
        }
      },
      "Delete",
      "Cancel",
      "destructive"
    );
  };

  return (
    <PageGuard module="inventory" entitlement="view_location">
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <PageHeader
        items={items}
        title="Location Details"
        isEdit={`/inventory/configuration/locations/${location.id}/edit`}
      />

      <div className="h-full mx-auto px-6 py-8 bg-white">
        <FadeIn delay={0.2}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-blue-500">
              Basic Information
            </h2>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                  location.location_type === "internal"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                )}
              >
                {location.location_type === "internal" ? "Internal" : "Partner"}
              </span>
              {location.is_hidden && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  Hidden
                </span>
              )}
            </div>
          </div>
        </FadeIn>

        <div className="flex items-start gap-8">
          {/* Avatar with scale animation */}
          <ScaleIn delay={0.3} className="shrink-0">
            <Interactive effect="subtle">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
                <MapPin size={40} className="text-[#3B7CED]" />
              </div>
            </Interactive>
          </ScaleIn>

          {/* Content: rows with separators */}
          <div className="flex-1">
            {/* Row 1 (first 3 fields) */}
            <SlideUp delay={0.4}>
              <div className="py-4 border-b border-gray-200">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4"
                  staggerDelay={0.15}
                >
                  {/* Location Name */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Location Name
                      </h3>
                      <p className="text-gray-700">{location.location_name}</p>
                    </div>
                  </FadeIn>

                  {/* Location Code */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Location Code
                      </h3>
                      <p className="text-gray-700 font-mono">
                        {location.location_code}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Location Type */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Location Type
                      </h3>
                      <p className="text-gray-700 capitalize">
                        {location.location_type}
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>

            {/* Row 2 (Address and Contact) */}
            <SlideUp delay={0.6}>
              <div className="py-4 border-b border-gray-200 my-4">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  staggerDelay={0.15}
                >
                  {/* Address */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Address
                      </h3>
                      <p className="text-gray-700">{location.address}</p>
                    </div>
                  </FadeIn>

                  {/* Contact Information */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Contact Information
                      </h3>
                      <p className="text-gray-700">
                        {location.contact_information || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Status */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Visibility Status
                      </h3>
                      <p className="text-gray-700">
                        {location.is_hidden ? "Hidden" : "Visible"}
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>

            {/* Row 3 (Personnel) */}
            <SlideUp delay={0.8}>
              <div className="py-4 last:border-b-0 my-4">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  staggerDelay={0.15}
                >
                  {/* Location Manager */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Location Manager
                      </h3>
                      <p className="text-gray-700">{managerName}</p>
                      {location.location_manager_details?.user?.email && (
                        <p className="text-sm text-gray-500 mt-1">
                          {location.location_manager_details.user.email}
                        </p>
                      )}
                    </div>
                  </FadeIn>

                  {/* Store Keeper */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Store Keeper
                      </h3>
                      <p className="text-gray-700">{storeKeeperName}</p>
                      {location.store_keeper_details?.user?.email && (
                        <p className="text-sm text-gray-500 mt-1">
                          {location.store_keeper_details.user.email}
                        </p>
                      )}
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>
          </div>
        </div>

        {/* Action Buttons */}
        <div>
          <SlideUp>
            <div className="h-24"></div>
          </SlideUp>

          <SlideUp delay={0.2}>
            <div className="flex justify-end gap-4">
              <PermissionGuard module="inventory" entitlement="change_location">
                <Button
                  onClick={handleToggleHiddenStatus}
                  variant="outline"
                  disabled={isTogglingStatus}
                  className="text-[#3B7CED] border-[#3B7CED] hover:bg-[#3B7CED] hover:text-white"
                >
                  {isTogglingStatus ? (
                    "Processing..."
                  ) : location.is_hidden ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Location
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Location
                    </>
                  )}
                </Button>
              </PermissionGuard>

              <PermissionGuard module="inventory" entitlement="change_location">
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  disabled={isDeleting}
                  className="text-[#E43D2B] border-[#E43D2B] hover:bg-[#E43D2B] hover:text-white"
                >
                  {isDeleting ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Location
                    </>
                  )}
                </Button>
              </PermissionGuard>
            </div>
          </SlideUp>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        actionText={statusModal.actionText}
        onAction={statusModal.onAction}
        secondaryText={statusModal.secondaryText}
        onSecondary={statusModal.onSecondary}
      />
    </FadeIn>
    </PageGuard>
  );
};

export default Page;
