"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import { ProductImageUpload } from "@/components/purchase/products/ProductImageUpload";
import { ProductFormFields } from "@/components/purchase/products/ProductFormFields";
import { ProductFormActions } from "@/components/purchase/products/ProductFormActions";
import { BreadcrumbItem } from "@/types/purchase";
import { useCreateProductMutation } from "@/api/purchase/productsApi";
import { useGetUnitOfMeasuresQuery } from "@/api/purchase/unitOfMeasureApi";
import { extractErrorMessage } from "@/lib/utils";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { productSchema, type ProductFormData } from "@/schemas/productSchema";
import type { Resolver } from "react-hook-form";

type Option = { value: string; label: string };

const CATEGORY_OPTIONS: Option[] = [
  { value: "consumable", label: "Consumable" },
  { value: "stockable", label: "Stockable" },
  { value: "service-product", label: "Service Product" },
];

export default function Page() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // API mutations and queries
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const { data: unitMeasures, isLoading: isLoadingUnits, error: unitMeasuresError } =
    useGetUnitOfMeasuresQuery({});

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
      name: "",
      description: "",
      available: 0,
      totalPurchased: 0,
      category: "",
      unit: "",
    },
  });

  // Notification state
  const [notification, setNotification] = React.useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({
    message: "",
    type: "success",
    show: false,
  });

  // Handle unit measures error
  React.useEffect(() => {
    if (unitMeasuresError) {
      setNotification({
        message: extractErrorMessage(unitMeasuresError, "Failed to load unit of measures."),
        type: "error",
        show: true,
      });
    }
  }, [unitMeasuresError]);

  // Convert API data to option format
  const unitOptions: Option[] =
    unitMeasures?.map((unit) => ({
      value: unit.url.split("/").filter(Boolean).pop() || "", // Extract ID from URL
      label: `${unit.unit_name} (${unit.unit_symbol})`,
    })) || [];

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Products", href: "/purchase/products", current: true },
  ];

  // Avatar upload state
  const [avatarSrc, setAvatarSrc] = React.useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
  }

  async function onSubmit(data: ProductFormData): Promise<void> {
    // Find the unit object by the selected unit ID
    const selectedUnit = unitMeasures?.find((unit) => {
      const unitId = unit.url.split("/").filter(Boolean).pop();
      return unitId === data.unit;
    });

    if (!selectedUnit) {
      setNotification({
        message: "Please select a valid unit of measure",
        type: "error",
        show: true,
      });
      return;
    }

    try {
      // Transform form data to match API format
      const productData = {
        product_name: data.name,
        product_description: data.description,
        product_category: data.category as "consumable" | string,
        unit_of_measure: parseInt(
          selectedUnit.url.split("/").filter(Boolean).pop() || ""
        ),
        check_for_duplicates: true,
      };

      // Call the API mutation
      await createProduct(productData).unwrap();

      // Show success notification
      setNotification({
        message: "Product created successfully!",
        type: "success",
        show: true,
      });

      // Reset form and navigate to products page after a short delay
      setTimeout(() => {
        reset();
        router.push("/purchase/products");
      }, 1500);
    } catch (error: unknown) {
      setNotification({
        message: extractErrorMessage(error, "Failed to create product. Please try again."),
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
        <PageHeader items={items} title="New Product" />
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
            className="text-lg font-medium text-blue-500 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            Basic Information
          </motion.h2>

          {/* Avatar / Image upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
          >
            <ProductImageUpload
              avatarSrc={avatarSrc}
              onImageChange={handleFileChange}
            />
          </motion.div>

          {/* Product form fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
          >
            <ProductFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              categoryOptions={CATEGORY_OPTIONS}
              unitOptions={unitOptions}
              isLoadingUnits={isLoadingUnits}
            />
          </motion.div>

          {/* Form actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
          >
            <ProductFormActions
              formRef={formRef}
              submitText={isCreating ? "Creating..." : "Create Product"}
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
