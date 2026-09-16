"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import {
  VendorBasicInfo,
  VendorContactInfo,
  VendorAddressInfo,
  VendorCountryInfo,
  VendorFormActions,
} from "@/components/purchase/vendors";
import { BreadcrumbItem } from "@/types/purchase";
import {
  useGetVendorQuery,
  usePatchVendorMutation,
} from "@/api/purchase/vendorsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { vendorSchema, type VendorFormData } from "@/schemas/vendorSchema";
import type { Resolver } from "react-hook-form";
import type { PatchVendorRequest } from "@/api/purchase/vendorsApi";
import stateLgaData from "@/lib/data/state_lga.json";

// Helper function to parse address string into components
const parseAddress = (address: string) => {
  if (!address) {
    return {
      address_street: "",
      local_government: "",
      state: "",
      country: "Nigeria",
    };
  }

  // Try to parse address assuming format: "street, lga, state, country"
  const parts = address.split(",").map((part) => part.trim());

  if (parts.length >= 4) {
    return {
      address_street: parts[0] || "",
      local_government: parts[1] || "",
      state: parts[2] || "",
      country: parts[3] || "Nigeria",
    };
  } else if (parts.length === 3) {
    return {
      address_street: parts[0] || "",
      local_government: parts[1] || "",
      state: parts[2] || "",
      country: "Nigeria",
    };
  } else if (parts.length === 2) {
    return {
      address_street: parts[0] || "",
      local_government: "",
      state: parts[1] || "",
      country: "Nigeria",
    };
  } else {
    return {
      address_street: address,
      local_government: "",
      state: "",
      country: "Nigeria",
    };
  }
};

// Helper function to combine address components back into a string
const combineAddress = (data: VendorFormData) => {
  const { address_street, local_government, state, country } = data;
  const addressParts = [];

  if (address_street) addressParts.push(address_street);
  if (local_government) addressParts.push(local_government);
  if (state) addressParts.push(state);
  if (country) addressParts.push(country);

  return addressParts.join(", ");
};

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLFormElement>(null);

  // Get vendor ID from URL params
  const vendorId = parseInt(params.id as string);

  // API queries and mutations
  const {
    data: vendor,
    isLoading: isLoadingVendor,
    error: vendorError,
  } = useGetVendorQuery(vendorId);
  const [patchVendor, { isLoading: isUpdating }] = usePatchVendorMutation();

  // React Hook Form setup
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema) as Resolver<VendorFormData>,
    defaultValues: {
      company_name: "",
      email: "",
      phone_number: "",
      address_street: "",
      local_government: "",
      state: "",
      country: "Nigeria",
    },
  });

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  // State and LGA dropdown data
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableLgas, setAvailableLgas] = useState<string[]>([]);

  // Set up form data when vendor is loaded
  useEffect(() => {
    if (vendor) {
      const addressComponents = parseAddress(vendor.address);

      // Reset form with vendor data
      form.reset({
        company_name: vendor.company_name || "",
        email: vendor.email || "",
        phone_number: vendor.phone_number || "",
        address_street: addressComponents.address_street,
        local_government: addressComponents.local_government,
        state: addressComponents.state,
        country: addressComponents.country,
      });
    }
  }, [vendor, form]);

  // Initialize state and LGA dropdowns when form data is loaded
  useEffect(() => {
    if (vendor) {
      const addressComponents = parseAddress(vendor.address);

      if (
        addressComponents.state &&
        stateLgaData[addressComponents.state as keyof typeof stateLgaData]
      ) {
        setSelectedState(addressComponents.state);
        setAvailableLgas(
          stateLgaData[addressComponents.state as keyof typeof stateLgaData]
        );
      }
    }
  }, [vendor]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = form;

  // Use useWatch to get local_government value
  const localGovernmentValue = useWatch({
    control: form.control,
    name: "local_government",
  });

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

  // Get available states for dropdown
  const allowedStates = [
    "Lagos",
    "Federal Capital Territory", // FCT
    "Ogun",
    "Oyo",
    "Rivers",
    "Ondo",
    "Anambra",
    "Akwa Ibom",
    "Ekiti",
    "Delta",
    "Edo",
    "Osun",
    "Kwara"
  ];

  const availableStates = Object.keys(stateLgaData).filter(state =>
    allowedStates.includes(state)
  );

  // Handle state selection and update available LGAs
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setValue("state", state);

    if (state && stateLgaData[state as keyof typeof stateLgaData]) {
      setAvailableLgas(stateLgaData[state as keyof typeof stateLgaData]);
      // Reset LGA selection when state changes
      setValue("local_government", "");
    } else {
      setAvailableLgas([]);
    }
  };

  // Handle LGA selection
  const handleLgaChange = (lga: string) => {
    setValue("local_government", lga);
  };

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Vendors", href: "/purchase/vendors" },
    {
      label: vendor?.company_name || "Edit Vendor",
      href: `/purchase/vendors/edit/${vendorId}`,
      current: true,
    },
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the actual file for FormData
    setAvatarFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
  }

  async function onSubmit(data: VendorFormData): Promise<void> {
    try {
      // Create FormData object for multipart submission
      const formData = new FormData();

      // Add all form fields
      formData.append("company_name", data.company_name);
      formData.append("email", data.email);
      formData.append("phone_number", data.phone_number);

      // Combine address fields into a single address string for the API
      const address = combineAddress(data);
      formData.append("address", address);

      // Add image file if available
      if (avatarFile) {
        formData.append("profile_picture_image", avatarFile);
      }

      // Call the vendor update API with FormData
      await patchVendor({
        id: vendorId,
        data: formData as unknown as PatchVendorRequest,
      }).unwrap();

      // Show success notification
      setNotification({
        message: "Vendor updated successfully!",
        type: "success",
        show: true,
      });

      // Navigate to vendor details page after a short delay
      setTimeout(() => {
        router.push(`/purchase/vendors/${vendorId}`);
      }, 1500);
    } catch (error: unknown) {
      // Handle API errors
      let errorMessage = "Failed to update vendor. Please try again.";

      if (error && typeof error === "object") {
        // Handle RTK Query error structure
        if ("data" in error) {
          const apiError = error as {
            data?: {
              detail?: string;
              message?: string;
              non_field_errors?: string[];
            };
          };

          // Check for non_field_errors array (like duplicate email)
          if (
            apiError.data?.non_field_errors &&
            Array.isArray(apiError.data.non_field_errors)
          ) {
            errorMessage = apiError.data.non_field_errors[0];
          }
          // Fallback to detail or message
          else {
            errorMessage =
              apiError.data?.detail || apiError.data?.message || errorMessage;
          }
        }
        // Handle other error structures
        else if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        }
      }

      setNotification({
        message: errorMessage,
        type: "error",
        show: true,
      });
    }
  }

  // Close notification
  function closeNotification() {
    setNotification((prev) => ({ ...prev, show: false }));
  }

  // Handle loading state
  if (isLoadingVendor) {
    return (
      <motion.div
        className="h-full text-gray-900 font-sans antialiased"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <PageHeader items={items} title="Edit Vendor" />
        </motion.div>
        <motion.main
          className="h-full mx-auto px-6 py-8 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-lg text-gray-600">
              Loading vendor data...
            </span>
          </div>
        </motion.main>
      </motion.div>
    );
  }

  // Handle error state
  if (vendorError) {
    return (
      <motion.div
        className="h-full text-gray-900 font-sans antialiased"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <PageHeader items={items} title="Edit Vendor" />
        </motion.div>
        <motion.main
          className="h-full mx-auto px-6 py-8 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-red-500 text-lg mb-4">
              Failed to load vendor data
            </div>
            <button
              onClick={() => router.push("/purchase/vendors")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Vendors
            </button>
          </div>
        </motion.main>
      </motion.div>
    );
  }

  // Don't render if vendor data is not available
  if (!vendor) {
    return null;
  }

  return (
    <motion.div
      className="h-full text-gray-900 font-sans antialiased"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <PageHeader items={items} title="Edit Vendor" />
      </motion.div>

      {/* Main form area */}
      <motion.main
        className="h-full mx-auto px-6 py-8 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white"
        >
          <motion.h2
            className="text-xl text-blue-500 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            Basic Information
          </motion.h2>

          {/* Basic vendor info */}
          <VendorBasicInfo
            avatarSrc={vendor?.profile_picture || avatarSrc}
            avatarFile={avatarFile}
            onImageChange={handleFileChange}
            companyNameRegister={register("company_name")}
            companyNameError={errors.company_name}
            isBase64={avatarSrc?.startsWith("data:image") || false}
          />

          {/* Contact Information Row */}
          <div className="py-4 border-y border-gray-100">
            <motion.h2
              className="text-[#3B7CED] text-xl mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
            >
              {" "}
              Contact Information
            </motion.h2>
            <VendorContactInfo
              emailRegister={register("email")}
              phoneRegister={register("phone_number")}
              errors={errors}
            />

            {/* Address Information Row */}
            <VendorAddressInfo
              streetRegister={register("address_street")}
              countryRegister={register("country")}
              selectedState={selectedState}
              availableLgas={availableLgas}
              availableStates={availableStates}
              setSelectedState={setSelectedState}
              handleStateChange={handleStateChange}
              handleLgaChange={handleLgaChange}
              localGovernmentValue={localGovernmentValue}
              setValue={setValue}
              errors={errors}
            />

            {/* Country Row */}
            <VendorCountryInfo
              countryRegister={register("country")}
              errors={errors}
            />
          </div>

          {/* Form actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.8 }}
          >
            <VendorFormActions
              formRef={formRef}
              submitText={isUpdating ? "Updating..." : "Update Vendor"}
              isLoading={isUpdating}
            />
          </motion.div>
        </form>
      </motion.main>

      {/* Notification */}
      <ToastNotification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={closeNotification}
      />
    </motion.div>
  );
}
