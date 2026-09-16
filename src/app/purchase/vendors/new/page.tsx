"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { useCreateVendorMutation } from "@/api/purchase/vendorsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { vendorSchema, type VendorFormData } from "@/schemas/vendorSchema";
import type { Resolver } from "react-hook-form";
import type { CreateVendorFormData } from "@/api/purchase/vendorsApi";
import stateLgaData from "@/lib/data/state_lga.json";

export default function Page() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // API mutations
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();

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

  // State and LGA dropdown data
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableLgas, setAvailableLgas] = useState<string[]>([]);

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
    { label: "Vendors", href: "/purchase/vendors", current: true },
  ];

  // Avatar upload state - need to store the actual file
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

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
      const address = `${data.address_street}, ${data.local_government}, ${data.state}, ${data.country}`;
      formData.append("address", address);

      // Add image file if available
      if (avatarFile) {
        formData.append("profile_picture_image", avatarFile);
      }

      // Call the vendor creation API with FormData
      await createVendor(formData as unknown as CreateVendorFormData).unwrap();

      // Show success notification
      setNotification({
        message: "Vendor created successfully!",
        type: "success",
        show: true,
      });

      // Reset form and navigate to vendors page after a short delay
      setTimeout(() => {
        reset();
        setAvatarFile(null);
        setAvatarSrc(null);
        router.push("/purchase/vendors");
      }, 1500);
    } catch (error: unknown) {
      // Handle API errors
      let errorMessage = "Failed to create vendor. Please try again.";

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
        <PageHeader items={items} title="New Vendor" />
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
            avatarSrc={avatarSrc}
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
              submitText={isCreating ? "Creating..." : "Create Vendor"}
              isLoading={isCreating}
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
