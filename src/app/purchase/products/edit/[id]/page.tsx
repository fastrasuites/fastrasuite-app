"use client";

import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import { ProductFormActions } from "@/components/purchase/products/ProductFormActions";
import { BreadcrumbItem } from "@/types/purchase";
import { EditProductImageUpload } from "@/components/purchase/products/EditProductImageUpload";
import { EditProductFormFields } from "@/components/purchase/products/EditProductFormFields";
import {
  useGetProductQuery,
  usePatchProductMutation,
} from "@/api/purchase/productsApi";
import { useGetUnitOfMeasuresQuery } from "@/api/purchase/unitOfMeasureApi";
import { extractErrorMessage } from "@/lib/utils";
import { ToastNotification } from "@/components/shared/ToastNotification";

type Option = { value: string; label: string };

const CATEGORY_OPTIONS: Option[] = [
  { value: "consumable", label: "Consumable" },
  { value: "stockable", label: "Stockable" },
  { value: "service-product", label: "Service Product" },
];

type ProductFormData = {
  name: string;
  description: string;
  available: number | "";
  totalPurchased: number | "";
  category: string;
  unit: string;
};

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const formRef = useRef<HTMLFormElement>(null);

  // API hooks
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useGetProductQuery(parseInt(productId));
  const [patchProduct, { isLoading: isUpdating }] = usePatchProductMutation();

  // Unit of measure data
  const {
    data: unitOfMeasures,
    isLoading: isLoadingUnits,
    error: unitsError,
  } = useGetUnitOfMeasuresQuery({});

  // Transform unit of measures to options format
  const UNIT_OPTIONS: Option[] =
    unitOfMeasures?.map((unit) => ({
      value: unit.unit_name,
      label: `${unit.unit_name} (${unit.unit_symbol})`,
    })) || [];

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    available: 0,
    totalPurchased: 0,
    category: "",
    unit: "",
  });

  // Notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });

  const showNotification =
    notification.type !== "" && notification.message !== "";

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Products", href: "/purchase/products", current: true },
    { label: "Edit Product", href: "", current: true },
  ];

  // Avatar upload state
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      // Use a microtask to avoid the synchronous setState warning
      Promise.resolve().then(() => {
        setFormData({
          name: product.product_name,
          description: product.product_description,
          available: parseInt(product.available_product_quantity) || 0,
          totalPurchased: parseInt(product.total_quantity_purchased) || 0,
          category: product.product_category,
          unit: product.unit_of_measure_details?.unit_name || "",
        });
      });
    }
  }, [product, unitOfMeasures]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
  }

  function handleFormChange(field: string, value: string | number | "") {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!product) {
      setNotification({ type: "error", message: "Product data not loaded" });
      return;
    }

    try {
      // Prepare the update data
      const updateData = {
        product_name: formData.name,
        product_description: formData.description,
        product_category: formData.category as "consumable" | string,
        unit_of_measure: product.unit_of_measure, // Keep the same unit of measure
      };

      await patchProduct({
        id: parseInt(productId),
        data: updateData,
      }).unwrap();

      setNotification({
        type: "success",
        message: "Product updated successfully!",
      });

      // Navigate back to products page after a short delay
      setTimeout(() => {
        router.push("/purchase/products");
      }, 1500);
    } catch (error) {
      setNotification({
        type: "error",
        message: extractErrorMessage(error, "Failed to update product. Please try again."),
      });
    }
  }

  // Show loading state while fetching product
  if (isLoadingProduct) {
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
          <PageHeader items={items} title="Edit Product" />
        </motion.div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </motion.div>
    );
  }

  // Show loading state while fetching unit of measures
  if (isLoadingUnits) {
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
          <PageHeader items={items} title="Edit Product" />
        </motion.div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </motion.div>
    );
  }

  // Show error state if unit of measures failed to load
  if (unitsError) {
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
          <PageHeader items={items} title="Edit Product" />
        </motion.div>
        <div className="flex items-center justify-center h-64 text-center px-4">
          <div className="text-red-500">
            <p className="font-semibold text-lg">Error Loading Units</p>
            <p className="text-sm mt-1">{extractErrorMessage(unitsError, "Failed to load unit of measures")}</p>
            <button
              onClick={() => router.push("/purchase/products")}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors pointer-cursor"
            >
              Back to Products
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show error state if product failed to load
  if (productError) {
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
          <PageHeader items={items} title="Edit Product" />
        </motion.div>
        <div className="flex items-center justify-center h-64 text-center px-4">
          <div className="text-red-500">
            <p className="font-semibold text-lg">Error Loading Product</p>
            <p className="text-sm mt-1">{extractErrorMessage(productError, "Failed to load product details")}</p>
            <button
              onClick={() => router.push("/purchase/products")}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors pointer-cursor"
            >
              Back to Products
            </button>
          </div>
        </div>
      </motion.div>
    );
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
        <PageHeader items={items} title="Edit Product" />
      </motion.div>

      {/* Main form area */}
      <motion.main
        className="h-full mx-auto px-6 py-8 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        {/* Notification */}
        <ToastNotification
          message={notification.message}
          type={notification.type as "success" | "error"}
          show={showNotification}
          onClose={() => setNotification({ type: "", message: "" })}
        />

        <form ref={formRef} onSubmit={handleUpdate} className="bg-white">
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
            <EditProductImageUpload
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
            <EditProductFormFields
              formData={formData}
              onChange={handleFormChange}
              categoryOptions={CATEGORY_OPTIONS}
              unitOptions={UNIT_OPTIONS}
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
              submitText={isUpdating ? "Updating..." : "Update Product"}
              isLoading={isUpdating}
            />
          </motion.div>
        </form>
      </motion.main>
    </motion.div>
  );
}
