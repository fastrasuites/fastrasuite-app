"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StatusModal, { extractErrorMessage } from "@/components/shared/StatusModal";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { PageGuard } from "@/components/auth/PageGuard";
import { Button } from "@/components/ui/button";
import { Plus, Trash, ArrowLeft, Save, CheckCircle } from "lucide-react";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import { useGetInventoryProductsQuery } from "@/api/inventory/productsApi";
import { 
  useGetStockAdjustmentQuery, 
  useUpdateStockAdjustmentMutation, 
  useValidateStockAdjustmentMutation 
} from "@/api/inventory/stockAdjustmentApi";
import { useGetStockLocationsByLocationQuery } from "@/api/inventory/stockLocationApi";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { z } from "zod";

type Option = { value: string; label: string };

interface StockAdjustmentLineItem {
  id: string;
  product: string;
  product_description: string;
  unit_of_measure: string;
  current_quantity: string;
  new_quantity: string;
}

const stockAdjustmentSchema = z.object({
  warehouse_location: z.string().min(1, "Warehouse location is required"),
  notes: z.string().min(1, "Mandatory reason is required "),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;



export default function EditStockAdjustmentPage() {
  const params = useParams();
  const id = (params?.id as string) || "WH-MAIN-ADJ-0002";
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<StockAdjustmentLineItem[]>([]);

  const { data: record, isLoading: isLoadingRecord } = useGetStockAdjustmentQuery(id);
  const { data: rawLocations, isLoading: isLoadingLocations } = useGetLocationsQuery({ location_type: "internal" });
  const { data: rawProducts, isLoading: isLoadingProducts } = useGetInventoryProductsQuery({});

  const locations = React.useMemo(() => {
    return Array.isArray(rawLocations)
      ? rawLocations
      : (rawLocations as any)?.results || (rawLocations as any)?.data || [];
  }, [rawLocations]);

  const products = React.useMemo(() => {
    return Array.isArray(rawProducts)
      ? rawProducts
      : (rawProducts as any)?.results || (rawProducts as any)?.data || [];
  }, [rawProducts]);
  
  const [updateStockAdjustment] = useUpdateStockAdjustmentMutation();
  const [validateStockAdjustment] = useValidateStockAdjustmentMutation();

  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const [toastState, setToastState] = React.useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "error",
  });

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        product: "",
        product_description: "",
        unit_of_measure: "",
        current_quantity: "0",
        new_quantity: "",
      },
    ]);

  const removeRow = (itemId: string) =>
    setItems((prev) => prev.filter((p) => p.id !== itemId));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(
      stockAdjustmentSchema,
    ) as Resolver<StockAdjustmentFormData>,
    values: record ? {
      warehouse_location: String((record.warehouse_location as any)?.id || record.warehouse_location || ""),
      notes: record.notes || record.reason || "",
    } : {
      warehouse_location: "",
      notes: "",
    },
  });

  const selectedLocation = watch("warehouse_location");
  const { data: rawStockLevels } = useGetStockLocationsByLocationQuery(selectedLocation, {
    skip: !selectedLocation,
  });

  const stockByProductId = React.useMemo(() => {
    const list = Array.isArray(rawStockLevels)
      ? rawStockLevels
      : (rawStockLevels as any)?.results || (rawStockLevels as any)?.data || [];
    const map: Record<string, string> = {};
    list.forEach((item: any) => {
      const pId = typeof item.product === "object"
        ? String(item.product?.id || item.product?.product_id || "")
        : String(item.product || item.product_id || "");
      if (pId) {
        const qty = item.quantity !== undefined && item.quantity !== null
          ? item.quantity
          : (item.current_stock ?? item.available_quantity ?? "0");
        map[pId] = String(qty);
      }
    });
    return map;
  }, [rawStockLevels]);

  useEffect(() => {
    if (record) {
      const apiItems = record.stock_adjustment_items || (record as any).items || [];
      if (apiItems.length > 0) {
        setItems(
          apiItems.map((item: any) => {
            const pId = String(item.product?.id || item.product);
            const liveStock = stockByProductId[pId];
            return {
              id: String(item.id),
              product: pId,
              product_description: item.product_details?.description || item.product_description || "",
              unit_of_measure: item.unit_of_measure?.unit_symbol || item.product_details?.unit_of_measure_details?.unit_symbol || (typeof item.unit_of_measure === "string" ? item.unit_of_measure : ""),
              current_quantity: String(liveStock ?? item.current_quantity ?? "0"),
              new_quantity: String(item.new_quantity || "0"),
            };
          })
        );
      }
    }
  }, [record, stockByProductId]);

  const productOptions: Option[] = products.map((p: any) => ({
    value: String(p.id),
    label: p.product_name || p.name || `Product #${p.id}`,
  }));

  const locationOptions: Option[] = locations.map((l: any) => ({
    value: String(l.id),
    label: l.location_name || l.location_code || `Location #${l.id}`,
  }));

  const updateItemWithProductDetails = (itemId: string, productId: string) => {
    if (items.some((it) => it.id !== itemId && it.product === productId)) {
      setToastState({ show: true, message: "Product already selected.", type: "error" });
      return;
    }
    const foundProduct = products.find((p: any) => String(p.id) === productId);
    const stockVal = stockByProductId[productId] ?? "0";
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              product: productId,
              product_description: foundProduct?.description || foundProduct?.product_description || "",
              unit_of_measure: foundProduct?.unit_of_measure_details?.unit_symbol || foundProduct?.unit_of_measure?.unit_symbol || "",
              current_quantity: String(stockVal),
              new_quantity: "0",
            }
          : it,
      ),
    );
  };

  const updateAdjustedQty = (itemId: string, val: string) => {
    if (val.startsWith('-') || Number(val) < 0) {
      setToastState({ show: true, message: "Quantity cannot be negative.", type: "error" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, new_quantity: val } : it)),
    );
  };

  async function submitForm(data: StockAdjustmentFormData, isValidate: boolean) {
    const validItems = items.filter(
      (item) => item.product && item.new_quantity !== ""
    );

    if (validItems.length === 0) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "Please add at least one valid item.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        warehouse_location: data.warehouse_location,
        notes: data.notes,
        reason: data.notes,
        stock_adjustment_items: validItems.map((item) => ({
          product: Number(item.product) || 1,
          new_quantity: item.new_quantity,
        })),
      };

      if (isValidate) {
        await validateStockAdjustment({ id, data: payload }).unwrap();
      } else {
        await updateStockAdjustment({ id, data: payload }).unwrap();
      }

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: isValidate 
          ? "Stock adjustment validated & inventory ledger updated."
          : "Stock adjustment draft updated successfully.",
      });
    } catch (error: any) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message: extractErrorMessage(error, "Failed to update stock adjustment."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSave(data: StockAdjustmentFormData) {
    await submitForm(data, false);
  }

  async function onValidate(data: StockAdjustmentFormData) {
    for (const it of items) {
      if (!it.product || it.new_quantity === "") {
        setModalState({
          isOpen: true,
          type: "error",
          title: "Validation Error",
          message: "Please select a product and provide a new physical count for all lines.",
        });
        return;
      }
    }
    await submitForm(data, true);
  }

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.type === "success") {
      router.push(`/inventory/stocks/adjustment/${id}`);
    }
  };

  const closeToast = () => setToastState((prev) => ({ ...prev, show: false }));

  return (
    <PageGuard application="inventory" module="adjustment">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        {/* Clean Header Card */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href={`/inventory/stocks/adjustment/${id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-[#32325D]"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[#32325D]">
                Edit Stock Adjustment: {id}
              </h1>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          <form ref={formRef} className="flex flex-col gap-6">
            {/* Adjustment Details Card */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">
                  Adjustment Details & Reason
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2.5">
                  <Label className="text-sm font-semibold text-[#32325D]">
                    Location{" "}
                    <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Select
                    value={watch("warehouse_location")}
                    onValueChange={(val) =>
                      setValue("warehouse_location", val, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.warehouse_location && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.warehouse_location.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label className="text-sm font-semibold text-[#32325D]">
                    Notes <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Input
                    {...register("notes")}
                    placeholder="Mandatory reason for physical vs system discrepancy..."
                    className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  />
                  {errors.notes && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Lines Card */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">
                  Count & Variance Table
                </h2>
              </div>
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[900px] w-full">
                  <TableHeader>
                    <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                      <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                        Product
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                        Description
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center">
                        Unit
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-right">
                        Current System QTY
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center">
                        New Physical Count
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-right">
                        Variance
                      </TableHead>
                      <TableHead className="py-3.5 pr-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => {
                      const current = Number(it.current_quantity) || 0;
                      const adjusted = Number(it.new_quantity) || 0;
                      const variance = adjusted - current;
                      return (
                        <TableRow
                          key={it.id}
                          className="group hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                          <TableCell className="px-6 py-3.5 align-middle whitespace-nowrap">
                            <Select
                              value={it.product}
                              onValueChange={(value) =>
                                updateItemWithProductDetails(it.id, value)
                              }
                            >
                              <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED] min-w-[200px]">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {productOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="px-6 py-3.5 align-middle whitespace-nowrap">
                            <span className="text-sm text-[#525F7F]">
                              {it.product_description || "Select a product"}
                            </span>
                          </TableCell>

                          <TableCell className="px-6 py-3.5 align-middle text-center whitespace-nowrap">
                            <span className="text-sm font-semibold text-[#525F7F]">
                              {it.unit_of_measure || "N/A"}
                            </span>
                          </TableCell>

                          <TableCell className="px-6 py-3.5 align-middle text-right font-mono font-semibold text-sm text-[#32325D] whitespace-nowrap">
                            {it.current_quantity}
                          </TableCell>

                          <TableCell className="px-6 py-3.5 align-middle text-center whitespace-nowrap">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.new_quantity}
                              onChange={(e) =>
                                updateAdjustedQty(it.id, e.target.value)
                              }
                              placeholder="0"
                              className="bg-white border-gray-200 rounded-md h-9 font-mono font-bold text-sm text-[#3B7CED] text-center w-28 mx-auto"
                            />
                          </TableCell>

                          <TableCell className="px-6 py-3.5 align-middle text-right font-mono font-bold text-sm whitespace-nowrap">
                            <span
                              className={
                                variance < 0
                                  ? "text-[#E43D2B]"
                                  : variance > 0
                                    ? "text-[#2BA24D]"
                                    : "text-[#525F7F]"
                              }
                            >
                              {it.product
                                ? variance > 0
                                  ? `+${variance.toFixed(2)}`
                                  : variance.toFixed(2)
                                : "—"}
                            </span>
                          </TableCell>

                          <TableCell className="pr-6 py-3.5 align-middle text-center whitespace-nowrap">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(it.id)}
                              disabled={items.length === 1}
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                              title="Remove line"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-gray-50/60 border-t border-gray-100">
                    <TableRow>
                      <TableCell colSpan={7} className="py-3 px-6">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={addRow}
                          className="text-[#3B7CED] hover:bg-blue-50/50 text-sm font-semibold h-9 px-4 flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Add Product Line
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </form>
        </main>

        {/* Fixed Signature Sticky Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
          <Link href={`/inventory/stocks/adjustment/${id}`}>
            <Button
              variant="outline"
              type="button"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm font-medium"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onSave)}
            className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 text-sm font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Draft"}
          </Button>
        </div>

        {/* Status Modal */}
        <StatusModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          onAction={handleModalClose}
        />

        <ToastNotification
          show={toastState.show}
          message={toastState.message}
          type={toastState.type}
          onClose={closeToast}
        />
      </div>
    </PageGuard>
  );
}
