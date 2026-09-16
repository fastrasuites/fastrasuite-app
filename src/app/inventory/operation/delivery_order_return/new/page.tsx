"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/purchase/products/PageHeader";
import { BreadcrumbItem } from "@/types/purchase";
import { useCreateDeliveryOrderReturnMutation } from "@/api/inventory/deliveryOrderReturnApi";
import { useGetDeliveryOrdersQuery } from "@/api/inventory/deliveryOrderApi";
import { useGetDeliveryOrderQuery } from "@/api/inventory/deliveryOrderApi";
import { ToastNotification } from "@/components/shared/ToastNotification";

import { Button } from "@/components/ui/button";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { DeliveryOrderReturnItem } from "@/types/deliveryOrderReturn";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { usePermission } from "@/hooks/usePermission";
import { PageGuard } from "@/components/auth/PageGuard";

// Form schema for delivery order return creation
const deliveryOrderReturnSchema = z.object({
  source_document: z.string().min(1, "Source document is required"),
  source_location: z.string().min(1, "Source location is required"),
  return_warehouse_location: z
    .string()
    .min(1, "Return warehouse location is required"),
  date_of_return: z.string().min(1, "Date of return is required"),
  reason_for_return: z.string().min(1, "Reason for return is required"),
});

type DeliveryOrderReturnFormData = {
  source_document: string;
  source_location: string;
  return_warehouse_location: string;
  date_of_return: string;
  reason_for_return: string;
};

type DeliveryOrderReturnLineItem = {
  id: string;
  returned_product_item: number;
  product_name: string;
  initial_quantity: number;
  returned_quantity: string;
};

const initialItems: DeliveryOrderReturnLineItem[] = [];

export default function Page() {
  const router = useRouter();

  const { isAdmin, permissions } = usePermissionContext();
  const { can } = usePermission();



  const hasCreatePermission = React.useMemo(() => {
    return (
      can({
        application: "inventory",
        module: "deliveryorderreturn",
        action: "create",
      }) || isAdmin
    );
  }, [can, isAdmin]);

  const formRef = useRef<HTMLFormElement>(null);

  // API mutations and queries
  const [createDeliveryOrderReturn, { isLoading: isCreating }] =
    useCreateDeliveryOrderReturnMutation();
  const { data: deliveryOrders, isLoading: isLoadingDeliveryOrders } =
    useGetDeliveryOrdersQuery({ status: "done" });

  // Form state
  const [items, setItems] =
    useState<DeliveryOrderReturnLineItem[]>(initialItems);
  const [selectedSourceDocument, setSelectedSourceDocument] =
    useState<string>("");
  const [returnWarehouseLocationId, setReturnWarehouseLocationId] =
    useState<string>("");

  // Get selected delivery order details
  const { data: selectedDeliveryOrder, isLoading: isLoadingSelectedOrder } =
    useGetDeliveryOrderQuery(selectedSourceDocument, {
      skip: !selectedSourceDocument,
    });

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        returned_product_item: 0,
        product_name: "",
        initial_quantity: 0,
        returned_quantity: "",
      },
    ]);

  const removeRow = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const updateItem = (
    id: string,
    patch: Partial<DeliveryOrderReturnLineItem>,
  ) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<DeliveryOrderReturnFormData>({
    resolver: zodResolver(
      deliveryOrderReturnSchema,
    ) as Resolver<DeliveryOrderReturnFormData>,
    defaultValues: {
      source_document: "",
      source_location: "",
      return_warehouse_location: "",
      date_of_return: new Date().toISOString().split("T")[0],
      reason_for_return: "",
    },
  });

  // const loggedInUser = useSelector((state: RootState) => state.auth.user);

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

  // Convert API data to option format
  const sourceDocumentOptions = useMemo(() => {
    if (!deliveryOrders) return [];
    const doneDeliveryOrders = deliveryOrders.filter(
      (order) => order.status === "done",
    );
    return doneDeliveryOrders.map((order) => ({
      value: order.id.toString(),
      label: order.order_unique_id,
    }));
  }, [deliveryOrders]);

  const breadcrumsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    {
      label: "Delivery Order Return",
      href: "/inventory/operation/delivery_order_return",
    },
    {
      label: "New",
      href: "/inventory/operation/delivery_order_return/new",
      current: true,
    },
  ];

  // Effect to populate form when delivery order is selected
  React.useEffect(() => {
    if (selectedDeliveryOrder) {
      setValue("source_location", selectedDeliveryOrder.delivery_address);
      setValue(
        "return_warehouse_location",
        selectedDeliveryOrder.source_location_details?.location_name || "",
      );
      setReturnWarehouseLocationId(
        selectedDeliveryOrder.source_location_details?.id || "",
      );

      // Populate items from delivery order items
      const returnItems: DeliveryOrderReturnLineItem[] =
        selectedDeliveryOrder.delivery_order_items.map(
          (item: any, index: number) => ({
            id: `item-${index}`,
            returned_product_item: item.product_details.id,
            product_name: item.product_details.product_name,
            initial_quantity: item.quantity_to_deliver,
            returned_quantity: "",
          }),
        );
      setItems(returnItems);
    }
  }, [selectedDeliveryOrder, setValue]);

  // Helper function to validate and prepare data
  const prepareSubmissionData = (
    data: DeliveryOrderReturnFormData,
  ): any | null => {
    const validItems = items.filter(
      (item) =>
        item.returned_quantity && parseFloat(item.returned_quantity) > 0,
    );

    if (validItems.length === 0) {
      return null;
    }

    return {
      source_document: parseInt(data.source_document),
      date_of_return: data.date_of_return,
      source_location: data.source_location,
      return_warehouse_location: returnWarehouseLocationId,
      reason_for_return: data.reason_for_return,
      delivery_order_return_items: validItems.map((item) => ({
        returned_product_item: item.returned_product_item,
        initial_quantity: item.initial_quantity,
        returned_quantity: parseFloat(item.returned_quantity),
      })),
    };
  };

  // Save delivery order return
  async function onSave(data: DeliveryOrderReturnFormData): Promise<void> {
    const deliveryOrderReturnData = prepareSubmissionData(data);

    if (!deliveryOrderReturnData) {
      setNotification({
        message: "Please add at least one valid item with quantity to return",
        type: "error",
        show: true,
      });
      return;
    }

    try {
      console.log("Delivery Order Return Data:", deliveryOrderReturnData);
      const result = await createDeliveryOrderReturn(
        deliveryOrderReturnData,
      ).unwrap();

      setNotification({
        message: "Delivery order return created successfully!",
        type: "success",
        show: true,
      });

      setTimeout(() => {
        reset();
        setItems(initialItems);
        router.push(
          `/inventory/operation/delivery_order_return/${
            result.prev + 1 || result.id || result.unique_record_id
          }`,
        );
      }, 1500);
    } catch (error: unknown) {
      let errorMessage =
        "Failed to create delivery order return. Please try again.";

      if (error && typeof error === "object" && "data" in error) {
        const apiData = (error as any).data;

        // ── Handle your specific format ────────────────────────────────────────
        if (apiData && apiData.error && Array.isArray(apiData.error)) {
          const firstError = apiData.error[0];

          if (firstError && typeof firstError === "object") {
            // Extract the actual message string (most likely under "source_document")
            const message =
              firstError.source_document ||
              firstError.message ||
              firstError.detail ||
              Object.values(firstError)[0]; // fallback: first value

            if (typeof message === "string" && message.trim()) {
              errorMessage = message.trim();
            } else {
              errorMessage = "Validation error: " + JSON.stringify(firstError);
            }
          }
          // rare case: array of plain strings
          else if (typeof firstError === "string") {
            errorMessage = apiData.error.join(" • ");
          }
        }

        // ── Fallback for other common Django/DRF shapes ────────────────────────
        else if (apiData && typeof apiData === "object") {
          const parts: string[] = [];

          for (const [field, value] of Object.entries(apiData)) {
            if (typeof value === "string") {
              parts.push(`${field}: ${value}`);
            } else if (Array.isArray(value)) {
              parts.push(`${field}: ${value.filter(Boolean).join(" • ")}`);
            }
          }

          if (parts.length > 0) {
            errorMessage = parts.join("\n");
          } else if (typeof apiData.detail === "string") {
            errorMessage = apiData.detail;
          } else if (typeof apiData.message === "string") {
            errorMessage = apiData.message;
          }
        }

        // Very last resort — show raw data (but as string!)
        else if (apiData) {
          errorMessage = `Server error: ${JSON.stringify(apiData)}`;
        }
      }

      // Debug (remove later if you want)
      console.log("Final displayed message:", errorMessage);

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
    <PageGuard application="inventory" module="deliveryorderreturn">
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
        <PageHeader items={breadcrumsItem} title="New Delivery Order Return" />
      </motion.div>

      {/* Main form area */}
      <motion.main
        className="h-full mx-auto px-6 py-8 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        <form ref={formRef} className="bg-white">
          <motion.h2
            className="text-lg font-medium text-blue-500 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            Basic Information
          </motion.h2>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Document *
              </label>
              <select
                {...register("source_document")}
                onChange={(e) => {
                  setValue("source_document", e.target.value);
                  setSelectedSourceDocument(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Source Document</option>
                {sourceDocumentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.source_document && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.source_document.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Location
              </label>
              <input
                {...register("source_location")}
                type="text"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Warehouse Location
              </label>
              <input
                {...register("return_warehouse_location")}
                type="text"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Return *
              </label>
              <input
                {...register("date_of_return")}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.date_of_return && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.date_of_return.message}
                </p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Return *
            </label>
            <textarea
              {...register("reason_for_return")}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for return"
            />
            {errors.reason_for_return && (
              <p className="text-red-500 text-sm mt-1">
                {errors.reason_for_return.message}
              </p>
            )}
          </div>

          {/* Items table */}
          <motion.h2
            className="text-lg font-medium text-blue-500 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
          >
            Items to Return
          </motion.h2>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Product Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Initial Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Quantity to Return
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-300">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.initial_quantity}
                    </td>
                    {/* <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.returned_quantity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            returned_quantity: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max={item.initial_quantity}
                        aria-label={`Quantity to return for ${item.product_name}`}
                      />
                      {Number(item.returned_quantity) >
                        Number(item.initial_quantity) && (
                        <p className="text-red-500 text-sm mt-1">
                          cannot be greater than initial qty
                        </p>
                      )}
                    </td> */}

                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.returned_quantity}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow empty string (user is typing), otherwise convert to number
                          const numValue =
                            inputValue === "" ? "" : Number(inputValue);

                          // Cap at initial_quantity if it's a valid number > initial
                          const safeValue =
                            typeof numValue === "number" &&
                            numValue > item.initial_quantity
                              ? item.initial_quantity
                              : numValue;

                          updateItem(item.id, {
                            returned_quantity: String(safeValue), // always store as string
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        // you can keep max — it helps on mobile / shows the limit
                        max={item.initial_quantity}
                        step="any" // or "1" if you only want integers
                        aria-label={`Quantity to return for ${item.product_name}`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
            className="flex justify-end gap-4 mt-8"
          >
            {hasCreatePermission ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => {
                    // Optional: add confirmation dialog later
                    router.back();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="default" // or "contained" / your primary style
                  disabled={isCreating}
                  onClick={handleSubmit(onSave)}
                >
                  {isCreating ? "Processing..." : "Create"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="default"
                disabled={isCreating}
                onClick={handleSubmit(onSave)}
              >
                {isCreating ? "Creating..." : "Save"}
              </Button>
            )}
          </motion.div>
          {/* Form actions */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
            className="flex justify-end gap-4 mt-8"
          >
            {isAdmin ? (
              <>
                <Button
                  type="button"
                  disabled={isCreating}
                  onClick={handleSubmit(onSave)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isCreating}
                  onClick={handleSubmit(onSave)}
                  variant="contained"
                >
                  {isCreating ? "Creating..." : "Validate"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={isCreating}
                onClick={handleSubmit(onSave)}
                variant="contained"
              >
                {isCreating ? "Creating..." : "Save"}
              </Button>
            )}
          </motion.div> */}
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
    </PageGuard>
  );
}
