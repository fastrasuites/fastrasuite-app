"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useStatusModal, StatusModal } from "@/components/shared/StatusModal";
import { PageGuard } from "@/components/auth/PageGuard";
import { extractErrorMessage } from "@/lib/utils";
import {
  useGetMultiLocationStatusQuery,
  usePatchMultiLocationStatusMutation,
} from "@/api/inventory/multilocationApi";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import type { MultiLocationStatusRequest } from "@/types/multilocation";

const MAX_LOCATIONS_FOR_DEACTIVATION = 3;

export default function MultiLocationSettingsPage() {
  const router = useRouter();
  const statusModal = useStatusModal();

  // Fetch current multi-location status
  const {
    data: multiLocationStatus,
    isLoading: isLoadingStatus,
    isError: isStatusError,
    refetch,
  } = useGetMultiLocationStatusQuery();

  // Fetch locations to check active count
  const { data: locations, isLoading: isLoadingLocations } =
    useGetLocationsQuery({});

  // Mutation for updating multi-location status
  const [updateMultiLocationStatus, { isLoading: isUpdating }] =
    usePatchMultiLocationStatusMutation();

  // Track optimistic state separately
  const [optimisticValue, setOptimisticValue] = React.useState<boolean | null>(
    null
  );

  // Determine the displayed value: optimistic value takes precedence during updates
  const isMultiLocationEnabled =
    optimisticValue ?? multiLocationStatus?.is_activated ?? false;

  // Get current active locations count
  const activeLocations = locations || [];
  const locationCount = activeLocations.length;

  // Check if deactivation is allowed
  const canDeactivate = locationCount <= MAX_LOCATIONS_FOR_DEACTIVATION;

  // Handle toggle change
  const handleToggleChange = async (checked: boolean) => {
    // If trying to deactivate, check location count first
    if (!checked && !canDeactivate) {
      statusModal.showWarning(
        "Cannot Deactivate Multi Location",
        `You currently have ${locationCount} active locations. Please reduce to ${MAX_LOCATIONS_FOR_DEACTIVATION} or fewer locations before deactivating Multi Location.`,
        "Go to Locations",
        handleGoToLocations,
        "Cancel",
        statusModal.close
      );
      return;
    }

    // Set optimistic value for immediate UI feedback
    setOptimisticValue(checked);

    try {
      const request: MultiLocationStatusRequest = {
        is_activated: checked,
      };
      await updateMultiLocationStatus(request).unwrap();
      // Force a refetch to ensure we have the latest data from the server
      await refetch();
      // Clear optimistic value on success - API data will be used
      setOptimisticValue(null);

      // Show success message
      statusModal.showSuccess(
        checked ? "Multi Location Activated" : "Multi Location Deactivated",
        checked
          ? "Multi Location has been successfully activated. You can now manage multiple inventory locations."
          : "Multi Location has been successfully deactivated."
      );
    } catch (error) {
      // Revert optimistic value on error
      setOptimisticValue(null);

      // Show error message from API
      const errorMessage = extractErrorMessage(error, "Failed to update. Please try again.");
      statusModal.showError("Update Failed", errorMessage);

      console.error("Failed to update multi-location status:", error);
    }
  };

  // Handle navigation to locations page
  const handleGoToLocations = () => {
    statusModal.close();
    router.push("/inventory/configuration/locations");
  };

  // Determine if the switch should be disabled
  const isSwitchDisabled = isLoadingStatus || isLoadingLocations || isUpdating;

  return (
    <PageGuard module="settings" entitlement="view_location">
      <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden max-w-[800px] mx-auto mt-6 animate-in fade-in-50 duration-150">
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

        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#32325D]">
              Multi Location Settings
            </h2>
            <p className="text-xs text-[#8898AA] mt-0.5">
              Configure system-wide support for multiple warehouses and project sites
            </p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                {isLoadingStatus || isLoadingLocations ? (
                  <Loader2 className="w-5 h-5 text-[#3B7CED] animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5 text-[#3B7CED]" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-medium text-gray-900">
                  Activate Multi Location
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  Allow inventory operations across multiple physical or virtual stores
                </span>
                {isStatusError && (
                  <span className="text-xs text-red-500 mt-1">
                    Failed to load status.{" "}
                    <button
                      onClick={() => refetch()}
                      className="ml-1 underline hover:no-underline font-medium text-red-600"
                    >
                      Retry
                    </button>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-4 h-4 flex items-center justify-center">
                {isUpdating && (
                  <Loader2 className="w-4 h-4 text-[#3B7CED] animate-spin" />
                )}
              </div>
              <Switch
                checked={isMultiLocationEnabled}
                onCheckedChange={handleToggleChange}
                disabled={isSwitchDisabled}
                className="data-[state=checked]:bg-[#3B7CED] disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          {/* Info about current location count when multi-location is enabled */}
          {isMultiLocationEnabled && !isLoadingLocations && locationCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-5 h-5 text-[#3B7CED] shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 leading-relaxed">
                Multi Location is currently active with{" "}
                <span className="font-semibold text-gray-900">
                  {locationCount} configured location{locationCount !== 1 ? "s" : ""}
                </span>. All inventory operations will require selecting a
                specific location for stock management.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageGuard>
  );
}
