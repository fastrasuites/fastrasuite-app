"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, MoveLeft } from "lucide-react";
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
import { useStatusModal, StatusModal } from "@/components/shared/StatusModal";
import { PageGuard } from "@/components/auth/PageGuard";
import { extractErrorMessage } from "@/lib/utils";
import {
  locationSchema,
  type LocationFormData,
} from "@/schemas/locationSchema";
import type { Resolver } from "react-hook-form";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/components/shared/types";
import { AutoSaveIcon } from "@/components/shared/icons";

import { motion } from "framer-motion";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
  { label: "Configuration", href: "/inventory/configuration" },
  { label: "Locations", href: "/inventory/configuration/locations" },
  {
    label: "New Location",
    href: "/inventory/configuration/locations/new",
    current: true,
  },
];

// Helper function to generate random 4-character uppercase alphanumeric code
const generateLocationCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper function to format user name consistently across the application
const formatUserName = (
  user?: { first_name?: string; last_name?: string; email?: string } | null,
  fallback: string = "Unknown User",
): string => {
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user?.email || fallback;
};

// Main Component
export default function NewLocationPage() {
  const router = useRouter();

  // API mutations and queries
  const [createLocation, { isLoading: isCreating }] =
    useCreateLocationMutation();
  const { data: tenantUsers, isLoading: isLoadingUsers, isError: isUsersError, error: usersError } =
    useGetTenantUsersQuery({});

  const statusModal = useStatusModal();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema) as Resolver<LocationFormData>,
    defaultValues: {
      location_code: "",
      location_name: "",
      location_type: "internal",
      address: "",
      location_manager: undefined as unknown as number,
      store_keeper: undefined as unknown as number,
      contact_information: "",
    },
  });

  useEffect(() => {
    const generatedCode = generateLocationCode();
    setValue("location_code", generatedCode);
  }, [setValue]);

  // Handle errors from initial data fetching
  useEffect(() => {
    if (isUsersError) {
      statusModal.showError(
        "Failed to load users",
        extractErrorMessage(usersError, "Failed to load users")
      );
    }
  }, [isUsersError, usersError]);

  // Convert tenant users to option format for dropdown
  const userOptions =
    tenantUsers?.map((tenantUser) => {
      // Return early or provide defaults if tenantUser is missing (unlikely but safe)
      if (!tenantUser) return { value: "", label: "Unknown User" };

      // Safely extract names and email using optional chaining
      const firstName =
        tenantUser.user?.first_name || tenantUser.first_name || "";
      const lastName = tenantUser.user?.last_name || tenantUser.last_name || "";
      const email = tenantUser.user?.email || tenantUser.email || "";

      const fullName = (firstName + " " + lastName).trim();

      return {
        value: (tenantUser.id || tenantUser.user_id || "").toString(),
        label: fullName || email || "Unknown User",
      };
    }) || [];

  console.log(userOptions);

  // Handle location code change with validation
  const handleLocationCodeChange = (value: string) => {
    // Convert to uppercase and limit to 4 characters
    const upperValue = value.toUpperCase().slice(0, 4);
    setValue("location_code", upperValue);
  };

  async function onSubmit(data: LocationFormData): Promise<void> {
    try {
      console.log("data", data);
      // Call the API mutation
      await createLocation(data).unwrap();

      // Show success notification
      statusModal.showSuccess(
        "Location Created",
        "Location has been successfully created.",
        "Go to Locations",
        () => {
          reset();
          router.push("/inventory/configuration/locations");
        }
      );
    } catch (error: unknown) {
      // Handle API errors using standardized utility
      const errorMessage = extractErrorMessage(error, "Failed to create location. Please try again.");

      const isMaxLocations =
        typeof errorMessage === "string" &&
        (errorMessage.toLowerCase().includes("max number of locations reached") ||
          errorMessage.toLowerCase().includes("max number") ||
          errorMessage.toLowerCase().includes("multi-location") ||
          errorMessage.toLowerCase().includes("multilocation"));

      if (isMaxLocations) {
        statusModal.showWarning(
          "Multi-Location Required",
          "You have reached the maximum number of locations allowed. To create additional warehouse or site locations, please activate the Multi-Location feature in Settings.",
          "Go to Multi-Location Settings",
          () => {
            router.push("/settings/multi-location");
          },
          "Cancel",
          () => {
            statusModal.close();
          },
          "primary"
        );
      } else {
        statusModal.showError(
          "Failed to create location",
          errorMessage
        );
      }
    }
  }

  return (
    <PageGuard module="inventory" entitlement="add_location">
      <div className="min-h-screen flex-1 flex-col flex">
      {/* Header */}
      <>
        {/* Header */}

        <Breadcrumbs
          items={items}
          action={
            <Button
              variant="ghost"
              className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
            >
              Autosaved <AutoSaveIcon />
            </Button>
          }
        />

        <motion.div
          className="bg-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        >
          <div className="h-16 border-b border-gray-200 flex justify-between items-center px-6">
            <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
              <Button
                aria-label="Go back"
                onClick={() => router.back()}
                className="flex items-center gap-3 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded cursor-pointer border-none hover:border-none hover:bg-transparent transition-all duration-200"
              >
                <motion.div
                  whileHover={{ x: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <MoveLeft size={20} />
                </motion.div>
                <span className="text-base font-medium">Location</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </>

      {/* Form Content */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white pb-4 flex-1 h-full"
      >
        {/* Basic Information Section */}
        <section className="p-6">
          <h2 className="text-lg font-medium text-[#3B7CED] mb-6">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Location Code */}
            <div className="space-y-2">
              <Label htmlFor="location_code">Location Code *</Label>
              <Input
                id="location_code"
                placeholder="Auto-generated"
                value={watch("location_code")}
                onChange={(e) => handleLocationCodeChange(e.target.value)}
                className={`flex-1 w-full h-11 shadow-none ${
                  errors.location_code ? "border-red-500" : ""
                }`}
                maxLength={4}
              />
              {errors.location_code && (
                <p className="text-sm text-red-600">
                  {errors.location_code.message}
                </p>
              )}
            </div>

            {/* Location Name */}
            <div className="space-y-2">
              <Label htmlFor="location_name">Location Name *</Label>
              <Input
                id="location_name"
                placeholder="Enter Location Name"
                {...register("location_name")}
                className={`flex-1 w-full h-11 shadow-none ${
                  errors.location_name ? "border-red-500" : ""
                }`}
              />
              {errors.location_name && (
                <p className="text-sm text-red-600">
                  {errors.location_name.message}
                </p>
              )}
            </div>

            {/* Location Type */}
            <div className="space-y-2">
              <Label htmlFor="location_type">Location Type *</Label>
              <Select
                value={watch("location_type")}
                onValueChange={(value) =>
                  setValue("location_type", value as "internal" | "partner")
                }
              >
                <SelectTrigger
                  className={`flex-1 w-full h-11 shadow-none ${
                    errors.location_type ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select Location Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
              {errors.location_type && (
                <p className="text-sm text-red-600">
                  {errors.location_type.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="Enter Location Address"
                {...register("address")}
                className={`flex-1 w-full h-11 shadow-none ${
                  errors.address ? "border-red-500" : ""
                }`}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            {/* Location Manager */}
            <div className="space-y-2">
              <Label htmlFor="location_manager">Location Manager *</Label>
              <Select
                value={watch("location_manager")?.toString() || ""}
                onValueChange={(value) =>
                  setValue("location_manager", parseInt(value))
                }
                disabled={isLoadingUsers}
              >
                <SelectTrigger
                  className={`flex-1 w-full h-11 shadow-none ${
                    errors.location_manager ? "border-red-500" : ""
                  } ${isLoadingUsers ? "opacity-50" : ""}`}
                >
                  <SelectValue
                    placeholder={
                      isLoadingUsers
                        ? "Loading users..."
                        : "Select Location Manager"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location_manager && (
                <p className="text-sm text-red-600">
                  {errors.location_manager.message}
                </p>
              )}
            </div>

            {/* Store Keeper */}
            <div className="space-y-2">
              <Label htmlFor="store_keeper">Store Keeper *</Label>
              <Select
                value={watch("store_keeper")?.toString() || ""}
                onValueChange={(value) =>
                  setValue("store_keeper", parseInt(value))
                }
                disabled={isLoadingUsers}
              >
                <SelectTrigger
                  className={`flex-1 w-full h-11 shadow-none ${
                    errors.store_keeper ? "border-red-500" : ""
                  } ${isLoadingUsers ? "opacity-50" : ""}`}
                >
                  <SelectValue
                    placeholder={
                      isLoadingUsers
                        ? "Loading users..."
                        : "Select Store Keeper"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.store_keeper && (
                <p className="text-sm text-red-600">
                  {errors.store_keeper.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Contact Information Section */}
        <section className="px-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contact_information">Contact Information</Label>
              <Input
                id="contact_information"
                placeholder="Enter Contact Information"
                {...register("contact_information")}
                className="flex-1 w-full h-11 shadow-none"
              />
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isCreating}
            className="px-8 py-2.5 h-auto"
          >
            {isCreating ? "Creating Location..." : "Create Location"}
          </Button>
        </div>
      </form>

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
      </div>
    </PageGuard>
  );
}
