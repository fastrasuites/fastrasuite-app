"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateLocationMutation } from "@/api/inventory/locationApi";
import { useGetTenantUsersQuery } from "@/api/settings/tenantUserApi";
import { extractErrorMessage } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  ExternalLink,
  RotateCw,
  UserX,
} from "lucide-react";

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (locationId: string) => void;
}

const generateLocationCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function CreateLocationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateLocationModalProps) {
  const [createLocation, { isLoading: isCreating }] = useCreateLocationMutation();
  const {
    data: tenantUsers,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useGetTenantUsersQuery({});

  const [locationCode, setLocationCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [locationManager, setLocationManager] = useState<string>("");
  const [storeKeeper, setStoreKeeper] = useState<string>("");
  const [contactInformation, setContactInformation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMaxLocationsError, setIsMaxLocationsError] = useState(false);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refetchUsers();
      setLocationCode(generateLocationCode());
      setLocationName("");
      setAddress("");
      setLocationManager("");
      setStoreKeeper("");
      setContactInformation("");
      setErrorMessage("");
      setIsMaxLocationsError(false);
    }
  }, [isOpen, refetchUsers]);

  const userOptions = useMemo(() => {
    if (!tenantUsers || !Array.isArray(tenantUsers)) return [];
    return tenantUsers
      .map((tenantUser) => {
        if (!tenantUser) return null;
        const id = tenantUser.id || tenantUser.user_id;
        if (!id) return null;
        const firstName =
          tenantUser.user?.first_name || tenantUser.first_name || "";
        const lastName = tenantUser.user?.last_name || tenantUser.last_name || "";
        const email = tenantUser.user?.email || tenantUser.email || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return {
          value: id.toString(),
          label: fullName || email || `User #${id}`,
        };
      })
      .filter((opt): opt is { value: string; label: string } => opt !== null && !!opt.value);
  }, [tenantUsers]);

  const hasNoUsers = !isLoadingUsers && userOptions.length === 0;

  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      await refetchUsers();
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (hasNoUsers || userOptions.length === 0) {
      setErrorMessage(
        "Cannot create location: at least one user is required to assign as Location Manager and Store Keeper. Please create a user in Settings first."
      );
      return;
    }
    if (!locationCode || locationCode.length !== 4) {
      setErrorMessage("Location code must be exactly 4 uppercase alphanumeric characters.");
      return;
    }
    if (!locationName.trim()) {
      setErrorMessage("Location name is required.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Address is required.");
      return;
    }
    if (!locationManager) {
      setErrorMessage("Please select a Location Manager.");
      return;
    }
    if (!storeKeeper) {
      setErrorMessage("Please select a Store Keeper.");
      return;
    }

    try {
      const payload = {
        location_code: locationCode.toUpperCase(),
        location_name: locationName.trim(),
        location_type: "internal" as const,
        address: address.trim(),
        location_manager: parseInt(locationManager, 10),
        store_keeper: parseInt(storeKeeper, 10),
        contact_information: contactInformation.trim() || undefined,
        is_hidden: false,
      };

      const res = await createLocation(payload as any).unwrap();
      onSuccess(res.id);
      onClose();
    } catch (err: any) {
      const msg = extractErrorMessage(err, "Failed to create location. Please check your inputs.");
      const isMaxLocations =
        typeof msg === "string" &&
        (msg.toLowerCase().includes("max number of locations reached") ||
          msg.toLowerCase().includes("max number") ||
          msg.toLowerCase().includes("multi-location") ||
          msg.toLowerCase().includes("multilocation"));

      if (isMaxLocations) {
        setIsMaxLocationsError(true);
        setErrorMessage(
          "Maximum number of locations reached on single-location mode. To create additional warehouse or site locations, please activate the Multi-Location feature in Settings."
        );
      } else {
        setIsMaxLocationsError(false);
        setErrorMessage(msg);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[580px] bg-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-medium text-gray-800">
            Create Location
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {errorMessage && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded flex flex-col gap-1.5">
              <div>{errorMessage}</div>
              {isMaxLocationsError && (
                <Link
                  href="/settings/multi-location"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B7CED] hover:underline mt-1"
                >
                  <span>Go to Multi-Location Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {hasNoUsers && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-amber-900 flex flex-col gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-amber-900 text-sm">
                    No users available for Manager assignment
                  </p>
                  <p className="text-amber-700 mt-1 leading-relaxed">
                    At least one user is required to assign as Location Manager and Store Keeper.
                    Please add users in the Settings page to continue.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/70 pl-8">
                <Link
                  href="/settings/users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B7CED] hover:underline"
                >
                  <span>Go to User Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleRefreshUsers}
                  disabled={isRefreshingUsers}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw
                    className={`w-3.5 h-3.5 ${
                      isRefreshingUsers ? "animate-spin text-[#3B7CED]" : ""
                    }`}
                  />
                  <span>{isRefreshingUsers ? "Refreshing..." : "Refresh Users"}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-gray-700 font-medium">Location Code</Label>
              <Input
                value={locationCode}
                onChange={(e) =>
                  setLocationCode(e.target.value.toUpperCase().slice(0, 4))
                }
                placeholder="Auto-generated"
                maxLength={4}
                className="bg-white border-gray-300 rounded h-10 font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-gray-700 font-medium">Location Type</Label>
              <Input
                value="Internal"
                disabled
                className="bg-gray-100 border-gray-200 text-gray-500 rounded h-10 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 font-medium">Location Name</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter Location Name"
              className="bg-white border-gray-300 rounded h-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 font-medium">Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Location Address"
              className="bg-white border-gray-300 rounded h-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-medium">Location Manager</Label>
                {hasNoUsers && (
                  <Link
                    href="/settings/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#3B7CED] hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>Create user</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
              <Select
                value={locationManager}
                onValueChange={setLocationManager}
                disabled={hasNoUsers || isLoadingUsers}
              >
                <SelectTrigger
                  className={`bg-white border-gray-300 rounded text-gray-700 h-10 ${
                    hasNoUsers ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""
                  }`}
                >
                  <SelectValue
                    placeholder={
                      isLoadingUsers
                        ? "Loading users..."
                        : hasNoUsers
                        ? "No users available"
                        : "Select Manager"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-52">
                  {hasNoUsers ? (
                    <div className="p-4 text-center text-xs text-gray-500 flex flex-col items-center gap-1.5">
                      <UserX className="w-5 h-5 text-gray-400 mb-1" />
                      <p className="font-semibold text-gray-700">No users found</p>
                      <p className="text-gray-400 text-[11px]">
                        Please create users in Settings first.
                      </p>
                      <Link
                        href="/settings/users"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#3B7CED] hover:underline font-medium inline-flex items-center gap-1 mt-1"
                      >
                        <span>Go to User Settings</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    userOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {hasNoUsers && (
                <p className="text-[11px] text-amber-600">
                  No users available.{" "}
                  <Link
                    href="/settings/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-amber-800"
                  >
                    Create users in Settings &rarr;
                  </Link>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-medium">Store Keeper</Label>
                {hasNoUsers && (
                  <Link
                    href="/settings/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#3B7CED] hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>Create user</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
              <Select
                value={storeKeeper}
                onValueChange={setStoreKeeper}
                disabled={hasNoUsers || isLoadingUsers}
              >
                <SelectTrigger
                  className={`bg-white border-gray-300 rounded text-gray-700 h-10 ${
                    hasNoUsers ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""
                  }`}
                >
                  <SelectValue
                    placeholder={
                      isLoadingUsers
                        ? "Loading users..."
                        : hasNoUsers
                        ? "No users available"
                        : "Select Store Keeper"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-52">
                  {hasNoUsers ? (
                    <div className="p-4 text-center text-xs text-gray-500 flex flex-col items-center gap-1.5">
                      <UserX className="w-5 h-5 text-gray-400 mb-1" />
                      <p className="font-semibold text-gray-700">No users found</p>
                      <p className="text-gray-400 text-[11px]">
                        Please create users in Settings first.
                      </p>
                      <Link
                        href="/settings/users"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#3B7CED] hover:underline font-medium inline-flex items-center gap-1 mt-1"
                      >
                        <span>Go to User Settings</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    userOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {hasNoUsers && (
                <p className="text-[11px] text-amber-600">
                  No users available.{" "}
                  <Link
                    href="/settings/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-amber-800"
                  >
                    Create users in Settings &rarr;
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 font-medium">Contact Information (Optional)</Label>
            <Input
              value={contactInformation}
              onChange={(e) => setContactInformation(e.target.value)}
              placeholder="Enter Contact Information"
              className="bg-white border-gray-300 rounded h-10"
            />
          </div>

          <DialogFooter className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between gap-3">
            <div>
              {hasNoUsers && (
                <span className="text-xs text-amber-600 font-medium">
                  Add a user in Settings before saving
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
                className="border-gray-200 text-gray-600 rounded h-10 px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || hasNoUsers}
                className="bg-[#3B7CED] hover:bg-[#3065c3] text-white rounded h-10 px-5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Location</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

