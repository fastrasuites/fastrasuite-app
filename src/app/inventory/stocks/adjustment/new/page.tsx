"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StatusModal, { extractErrorMessage } from "@/components/shared/StatusModal";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { PageGuard } from "@/components/auth/PageGuard";
import { Button } from "@/components/ui/button";
import { Plus, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import { useGetInventoryProductsQuery } from "@/api/inventory/productsApi";
import { useCreateStockAdjustmentMutation } from "@/api/inventory/stockAdjustmentApi";
import { useGetStockLocationsByLocationQuery } from "@/api/inventory/stockLocationApi";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
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
  notes: z.string().min(1, "Reason/Notes is required"),
  project: z.string().optional(),
  adjustment_date: z.string().optional(),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;



export default function CreateStockAdjustmentPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<StockAdjustmentLineItem[]>([
    {
      id: "1",
      product: "",
      product_description: "",
      unit_of_measure: "",
      current_quantity: "0",
      new_quantity: "",
    },
  ]);

  const [createStockAdjustment] = useCreateStockAdjustmentMutation();
  const { data: rawLocations, isLoading: isLoadingLocations } = useGetLocationsQuery({ location_type: "internal" });
  const { data: rawProducts, isLoading: isLoadingProducts } = useGetInventoryProductsQuery({});
  const { data: rawProjects, isLoading: isLoadingProjects } = useGetProjectCostingProjectsQuery({});

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

  const projects = React.useMemo(() => {
    return Array.isArray(rawProjects)
      ? rawProjects
      : (rawProjects as any)?.results || (rawProjects as any)?.data || [];
  }, [rawProjects]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      warehouse_location: "",
      notes: "",
      project: "",
      adjustment_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedLocation = watch("warehouse_location");
  const selectedProject = watch("project");

  // Automatically fill location with the project's location
  React.useEffect(() => {
    if (!selectedProject) return;
    const proj = projects.find((p: any) => String(p.id) === selectedProject);
    if (proj) {
      const locId = proj.site_location || proj.location;
      if (locId) {
        setValue("warehouse_location", String(locId), { shouldValidate: true });
      }
    }
  }, [selectedProject, projects, setValue]);

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

  // Keep line items current stock in sync if location or stockByProductId changes
  React.useEffect(() => {
    if (!selectedLocation) return;
    setItems((prev) =>
      prev.map((it) => {
        if (!it.product) return it;
        const stock = stockByProductId[it.product] ?? "0";
        return { ...it, current_quantity: stock };
      })
    );
  }, [stockByProductId, selectedLocation]);

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

  const removeRow = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  };

  const updateItemWithProductDetails = (id: string, productId: string) => {
    if (items.some((it) => it.id !== id && it.product === productId)) {
      setToastState({ show: true, message: "Product already selected.", type: "error" });
      return;
    }
    const foundProduct = products.find((p: any) => String(p.id) === productId);
    const stockVal = stockByProductId[productId] ?? "0";
    const uomVal =
      foundProduct?.unit_of_measure_details?.unit_symbol ||
      foundProduct?.unit_of_measure_details?.unit_name ||
      foundProduct?.unit_of_measure?.unit_symbol ||
      "Units";

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            product: productId,
            product_description: foundProduct
              ? foundProduct.description || foundProduct.product_description || ""
              : "",
            unit_of_measure: uomVal,
            current_quantity: String(stockVal),
          };
        }
        return it;
      }),
    );
  };

  const updateAdjustedQty = (id: string, qty: string) => {
    if (qty.startsWith('-') || Number(qty) < 0) {
      setToastState({ show: true, message: "Quantity cannot be negative.", type: "error" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, new_quantity: qty } : it)),
    );
  };

  const productOptions: Option[] = products.map((p: any) => ({
    value: String(p.id),
    label: p.product_name || p.name || `Product #${p.id}`,
  }));

  const locationOptions: Option[] = locations.map((l: any) => ({
    value: String(l.id),
    label: l.location_name || l.location_code || `Location #${l.id}`,
  }));

  const projectOptions: Option[] = React.useMemo(() => {
    return projects.map((p: any) => ({
      value: String(p.id),
      label: p.name || p.project_name || `Project #${p.id}`,
    }));
  }, [projects]);

  async function onSave(data: StockAdjustmentFormData) {
    await submitForm(data, "draft");
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
    await submitForm(data, "done");
  }

  async function submitForm(data: StockAdjustmentFormData, status: "draft" | "done") {
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
      await createStockAdjustment({
        warehouse_location: data.warehouse_location,
        notes: data.notes,
        reason: data.notes,
        status: status,
        ...(data.project ? { project: Number(data.project) } : {}),
        ...(data.adjustment_date ? { adjustment_date: data.adjustment_date } : {}),
        stock_adjustment_items: validItems.map((item) => ({
          product: Number(item.product) || 1,
          new_quantity: item.new_quantity,
        })),
      }).unwrap();

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: status === "draft" 
          ? "Stock adjustment saved as draft successfully."
          : "Stock adjustment validated & inventory ledger updated.",
      });

    } catch (error: any) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message: extractErrorMessage(error, "Failed to save stock adjustment."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.type === "success") {
      router.push("/inventory/stocks/adjustment");
    }
  };

  const closeToast = () => setToastState((prev) => ({ ...prev, show: false }));

  return (
    <PageGuard application="inventory" module="adjustment">
      {/* Two-tone: gray canvas */}
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        {/* Clean Header */}
        <div className="flex items-center px-6 py-4 bg-white border-b border-gray-100 shadow-2xs">
          <Link href="/inventory/stocks/adjustment">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 h-8 w-8 text-gray-400 hover:text-[#32325D]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-[#32325D]">
            New Stock Adjustment
          </h1>
        </div>

        {/* Main Form Container */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          <form ref={formRef} className="flex flex-col gap-6">
            {/* White Container Card 1: Adjustment Details */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">
                  Adjustment Details
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Adjustment Type (Fixed per PRD) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Adjustment Type
                  </Label>
                  <Input
                    value="Stock Level Update"
                    readOnly
                    className="bg-gray-50 border-gray-200 h-9 text-sm text-[#525F7F] cursor-not-allowed rounded-md font-medium"
                  />
                </div>

                {/* Warehouse Location */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Location <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Select
                    value={watch("warehouse_location")}
                    onValueChange={(value) =>
                      setValue("warehouse_location", value)
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder={isLoadingLocations ? "Loading..." : "Select location"} />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.warehouse_location && (
                    <p className="text-[11px] text-[#E43D2B]">
                      {errors.warehouse_location.message}
                    </p>
                  )}
                </div>

                {/* Project Field */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Project
                  </Label>
                  <Select
                    value={watch("project")}
                    onValueChange={(value) =>
                      setValue("project", value)
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder={isLoadingProjects ? "Loading..." : "Select project (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Adjustment Date */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Adjustment Date
                  </Label>
                  <Input
                    type="date"
                    {...register("adjustment_date")}
                    className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  />
                </div>

                {/* Notes (Mandatory Reason per PRD) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Notes <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Input
                    {...register("notes")}
                    placeholder="Mandatory reason for discrepancy (e.g. Annual stock audit count)..."
                    className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  />
                  {errors.notes && (
                    <p className="text-[11px] text-[#E43D2B]">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* White Container Card 2: Product Lines */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">
                  Product Lines
                </h2>
              </div>
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[900px] w-full">
                  <TableHeader>
                    <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                      <TableHead className="py-3.5 px-6 font-medium text-gray-600 text-sm whitespace-nowrap w-64">
                        Product
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-medium text-gray-600 text-sm whitespace-nowrap w-64">
                        Description
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-medium text-gray-600 text-sm whitespace-nowrap text-center w-24">
                        Unit
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-medium text-gray-600 text-sm whitespace-nowrap text-center w-36">
                        Current Quantity
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-medium text-gray-600 text-sm whitespace-nowrap text-center w-36">
                        New Physical Count
                      </TableHead>
                      <TableHead className="py-3.5 px-6 font-medium text-gray-600 text-sm whitespace-nowrap text-center w-32">
                        Variance
                      </TableHead>
                      <TableHead className="py-3.5 pr-6 font-medium text-gray-600 text-sm whitespace-nowrap text-center w-16"></TableHead>
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
                          className="hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                          <TableCell className="px-6 py-3.5">
                            <Select
                              value={it.product}
                              onValueChange={(value) =>
                                updateItemWithProductDetails(it.id, value)
                              }
                            >
                              <SelectTrigger className="h-11 w-full rounded-none border-0 focus:ring-0 focus:ring-offset-0 px-4">
                                <SelectValue placeholder={isLoadingProducts ? "Loading..." : "Select product"} />
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

                          <TableCell className="px-6 py-3.5 text-sm text-[#525F7F]">
                            {it.product_description || "Select a product"}
                          </TableCell>

                          <TableCell className="px-6 py-3.5 text-center text-sm font-medium text-[#525F7F]">
                            {it.unit_of_measure || "—"}
                          </TableCell>

                          <TableCell className="px-6 py-3.5 text-center text-sm font-mono font-semibold text-[#32325D]">
                            {it.current_quantity}
                          </TableCell>

                          <TableCell className="px-6 py-3.5 text-center">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.new_quantity}
                              onChange={(e) =>
                                updateAdjustedQty(it.id, e.target.value)
                              }
                              placeholder="0"
                              className="bg-white border-gray-200 rounded-md h-8 text-sm text-center font-bold text-[#3B7CED] w-24 mx-auto"
                            />
                          </TableCell>

                          <TableCell className="px-6 py-3.5 text-center">
                            <span
                              className={`text-sm font-mono font-bold ${variance < 0 ? "text-[#E43D2B]" : variance > 0 ? "text-[#2BA24D]" : "text-[#525F7F]"}`}
                            >
                              {it.new_quantity !== ""
                                ? variance > 0
                                  ? `+${variance.toFixed(2)}`
                                  : variance.toFixed(2)
                                : "—"}
                            </span>
                          </TableCell>

                          <TableCell className="pr-6 py-3.5 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(it.id)}
                              disabled={items.length === 1}
                              className="h-8 w-8 text-gray-400 hover:text-[#E43D2B] hover:bg-red-50"
                              title="Remove line"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-[#F6F9FC] border-t border-gray-100">
                    <TableRow>
                      <TableCell colSpan={7} className="py-3.5 px-6">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={addRow}
                          className="text-[#3B7CED] hover:bg-blue-50 text-sm font-semibold h-8 px-3"
                        >
                          <Plus className="w-4 h-4 mr-1.5" /> Add Product Line
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </form>
        </main>

        {/* Signature Sticky Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
          <Link href="/inventory/stocks/adjustment">
            <Button
              variant="outline"
              type="button"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-9 px-4"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onSave)}
            className="bg-[#3B7CED] hover:bg-[#3065c3] text-white text-sm h-9 px-4 font-semibold shadow-2xs"
          >
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
        /></div>
    </PageGuard>
  );
}
