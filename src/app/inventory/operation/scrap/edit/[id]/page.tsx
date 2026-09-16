"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StatusModal, { extractErrorMessage, useStatusModal } from "@/components/shared/StatusModal";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/types/purchase";
import { Button } from "@/components/ui/button";
import { Plus, Trash, ArrowLeft, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import { useGetInventoryProductsQuery } from "@/api/inventory/productsApi";
import {
  useGetScrapQuery,
  useUpdateScrapMutation,
  useValidateScrapMutation,
} from "@/api/inventory/scrapApi";
import {
  useGetStockLocationsQuery,
  useGetStockLocationsByLocationQuery,
} from "@/api/inventory/stockLocationApi";
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

interface ScrapLineItem {
  id: string;
  product: string;
  product_description: string;
  unit_of_measure: string;
  current_quantity: string;
  scrap_quantity: string;
}

const scrapSchema = z.object({
  adjustment_type: z.enum(["DAMAGE", "LOSS"], {
    message: "Cause is required",
  }),
  project: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
});

type ScrapFormData = z.infer<typeof scrapSchema>;

export default function EditScrapPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const statusModal = useStatusModal();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: scrapData, isLoading: isLoadingScrap } = useGetScrapQuery(id, { skip: !id });
  const [updateScrap] = useUpdateScrapMutation();
  const [validateScrap, { isLoading: isValidating }] = useValidateScrapMutation();

  const { data: rawProjects, isLoading: isLoadingProjects } = useGetProjectCostingProjectsQuery({});
  const { data: rawLocations, isLoading: isLoadingLocations } = useGetLocationsQuery({});
  const { data: rawProducts, isLoading: isLoadingProducts } = useGetInventoryProductsQuery({});

  const [items, setItems] = useState<ScrapLineItem[]>([
    {
      id: "1",
      product: "",
      product_description: "",
      unit_of_measure: "",
      current_quantity: "0",
      scrap_quantity: "",
    },
  ]);

  const [toastState, setToastState] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "error",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ScrapFormData>({
    resolver: zodResolver(scrapSchema) as Resolver<ScrapFormData>,
    defaultValues: {
      adjustment_type: "DAMAGE",
      project: "",
      location: "",
      notes: "",
    },
  });

  // Extract arrays safely
  const projects = useMemo(() => {
    const list = Array.isArray(rawProjects)
      ? rawProjects
      : (rawProjects as any)?.results || (rawProjects as any)?.data || [];
    return list.filter((p: any) => {
      const st = String(p.status || "").toUpperCase();
      return st === "APPROVED" || st === "ACTIVE" || p.is_approved === true || !p.status;
    });
  }, [rawProjects]);

  const locations = useMemo(() => {
    return Array.isArray(rawLocations)
      ? rawLocations
      : (rawLocations as any)?.results || (rawLocations as any)?.data || [];
  }, [rawLocations]);

  const products = useMemo(() => {
    return Array.isArray(rawProducts)
      ? rawProducts
      : (rawProducts as any)?.results || (rawProducts as any)?.data || [];
  }, [rawProducts]);

  const selectedLocation = watch("location");
  const { data: rawStockLevels } = useGetStockLocationsByLocationQuery(selectedLocation, {
    skip: !selectedLocation,
  });
  const { data: rawStockLocationsList } = useGetStockLocationsQuery(
    selectedLocation ? { location__id: selectedLocation } : undefined,
    { skip: !selectedLocation }
  );

  const stockByProductId = useMemo(() => {
    const rawList = [
      ...(Array.isArray(rawStockLevels) ? rawStockLevels : (rawStockLevels as any)?.results || (rawStockLevels as any)?.data || []),
      ...(Array.isArray(rawStockLocationsList) ? rawStockLocationsList : (rawStockLocationsList as any)?.results || (rawStockLocationsList as any)?.data || []),
    ];
    const map: Record<string, string> = {};
    rawList.forEach((item: any) => {
      const pId = String(item.product?.id || item.product_id || item.product || item.id || "");
      if (pId && item.quantity !== undefined) {
        map[pId] = String(item.quantity ?? item.current_stock ?? item.available_quantity ?? "0");
      }
    });
    return map;
  }, [rawStockLevels, rawStockLocationsList]);

  // Prepopulate existing scrap data when loaded
  useEffect(() => {
    if (!scrapData) return;
    const causeVal = (scrapData.adjustment_type || (scrapData as any).cause || "DAMAGE").toUpperCase() === "LOSS" ? "LOSS" : "DAMAGE";
    const locVal = String(scrapData.warehouse_location_details?.id || scrapData.warehouse_location || "");
    const projVal = String((scrapData as any).project || "");
    const notesVal = scrapData.notes || "";

    reset({
      adjustment_type: causeVal,
      location: locVal,
      project: projVal,
      notes: notesVal,
    });

    const lines = (scrapData as any).items || scrapData.scrap_items || [];
    if (Array.isArray(lines) && lines.length > 0) {
      setItems(
        lines.map((it: any, idx: number) => ({
          id: String(it.id || idx + 1),
          product: String(it.product || it.product_details?.id || ""),
          product_description: it.product_description || it.product_details?.description || "",
          unit_of_measure: it.unit_symbol || it.unit_of_measure || it.product_details?.unit_of_measure_details?.unit_symbol || "Units",
          current_quantity: String(it.current_quantity || "0"),
          scrap_quantity: String(it.scrap_quantity || it.quantity || ""),
        }))
      );
    }
  }, [scrapData, reset]);

  // Sync stock levels for line items
  useEffect(() => {
    if (!selectedLocation) return;
    setItems((prev) =>
      prev.map((it) => {
        if (!it.product) return it;
        const stock = stockByProductId[it.product] ?? it.current_quantity ?? "0";
        return { ...it, current_quantity: stock };
      })
    );
  }, [stockByProductId, selectedLocation]);

  const productOptions: Option[] = useMemo(() => {
    return products.map((p: any) => {
      const uom =
        p.unit_of_measure_details?.unit_symbol ||
        p.unit_of_measure_details?.unit_name ||
        p.unit_of_measure?.unit_symbol ||
        "Unit";
      const stock = stockByProductId[String(p.id)];
      const stockLabel = stock !== undefined ? ` • ${stock} in stock` : "";
      return {
        value: String(p.id),
        label: `${p.product_name || p.name || `Product #${p.id}`} (${uom})${stockLabel}`,
      };
    });
  }, [products, stockByProductId]);

  const projectOptions: Option[] = useMemo(() => {
    return projects.map((p: any) => ({
      value: String(p.id),
      label: p.name || p.project_name || p.project_code || `Project #${p.id}`,
    }));
  }, [projects]);

  const locationOptions: Option[] = useMemo(() => {
    return locations.map((l: any) => ({
      value: String(l.id),
      label: l.location_name || l.location_code || `Location #${l.id}`,
    }));
  }, [locations]);

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        product: "",
        product_description: "",
        unit_of_measure: "",
        current_quantity: "0",
        scrap_quantity: "",
      },
    ]);

  const removeRow = (itemId: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((p) => p.id !== itemId));
    }
  };

  const updateItemWithProductDetails = (itemId: string, productId: string) => {
    if (items.some((it) => it.id !== itemId && it.product === productId)) {
      setToastState({ show: true, message: "Product already selected in another line.", type: "error" });
      return;
    }
    const p = products.find((item: any) => String(item.id) === productId);
    const stockVal = stockByProductId[productId] ?? "0";
    const uomVal =
      p?.unit_of_measure_details?.unit_symbol ||
      p?.unit_of_measure_details?.unit_name ||
      p?.unit_of_measure?.unit_symbol ||
      "Units";

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              product: productId,
              product_description: p?.description || p?.product_description || "",
              unit_of_measure: uomVal,
              current_quantity: String(stockVal),
            }
          : it
      )
    );
  };

  const updateScrapQty = (itemId: string, qty: string) => {
    if (qty.startsWith("-") || Number(qty) < 0) {
      setToastState({ show: true, message: "Quantity cannot be negative.", type: "error" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, scrap_quantity: qty } : it))
    );
  };

  async function onSave(data: ScrapFormData): Promise<void> {
    const validItems = items.filter(
      (item) => item.product && item.scrap_quantity && Number(item.scrap_quantity) > 0
    );

    if (validItems.length === 0) {
      setToastState({
        message: "Please add at least one valid item with product and scrap quantity > 0",
        type: "error",
        show: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        cause: data.adjustment_type,
        adjustment_type: data.adjustment_type,
        warehouse_location: data.location,
        notes: data.notes || "",
        items: validItems.map((item) => ({
          product: Number(item.product) || item.product,
          scrap_quantity: item.scrap_quantity,
        })),
        scrap_items: validItems.map((item) => ({
          product: Number(item.product) || item.product,
          scrap_quantity: item.scrap_quantity,
        })),
      };

      if (data.project) {
        payload.project = isNaN(Number(data.project)) ? data.project : Number(data.project);
      }

      await updateScrap({ id, data: payload }).unwrap();
      statusModal.showSuccess("Success", "Scrap record updated successfully!");

      setTimeout(() => {
        router.push(`/inventory/operation/scrap/${id}`);
      }, 1000);
    } catch (error: any) {
      statusModal.showError("Error", extractErrorMessage(error, "Failed to update scrap."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    { label: "Scrap Recording", href: "/inventory/operation/scrap" },
    { label: `Edit Scrap ${id}`, href: `/inventory/operation/scrap/edit/${id}`, current: true },
  ];

  if (isLoadingScrap) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <Skeleton className="h-48 w-full bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <PageGuard module="inventory" entitlement="change_scrap">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-28">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs
            items={breadcrumbsItem}
            action={
              <Button
                variant="ghost"
                className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
              >
                Autosaved <AutoSaveIcon />
              </Button>
            }
          />

          {/* Top Bar Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#FCE8E6] text-[#E43D2B]">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#32325D]">
                  Edit Scrap Record: {id}
                </h1>
                <p className="text-xs text-[#8898AA] mt-0.5">
                  Update scrap quantities, cause, or destination location before final validation.
                </p>
              </div>
            </div>
          </div>

          <form ref={formRef} className="flex flex-col gap-6">
            {/* Scrap & Accounting Allocation Card */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
                Scrap & Accounting Allocation
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Cause <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Select
                    value={watch("adjustment_type")}
                    onValueChange={(value) =>
                      setValue("adjustment_type", value as any, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAMAGE">Damage</SelectItem>
                      <SelectItem value="LOSS">Loss</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.adjustment_type && (
                    <p className="text-[11px] text-[#E43D2B]">
                      {errors.adjustment_type.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Location <span className="text-[#E43D2B]">*</span>
                  </Label>
                  <Select
                    value={watch("location")}
                    onValueChange={(value) =>
                      setValue("location", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder={isLoadingLocations ? "Loading locations..." : "Select location"} />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-[11px] text-[#E43D2B]">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Project (Optional)
                  </Label>
                  <Select
                    value={watch("project") || ""}
                    onValueChange={(value) =>
                      setValue("project", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                      <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select project (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.project && (
                    <p className="text-[11px] text-[#E43D2B]">
                      {errors.project.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:col-span-3">
                  <Label className="text-xs font-semibold text-[#525F7F]">
                    Notes / Reason
                  </Label>
                  <Input
                    {...register("notes")}
                    placeholder="Enter explanation for scrap..."
                    className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  />
                </div>
              </div>
            </div>

            {/* Scrapped Items Table Card */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">
                  Scrapped Items & Stock Deduction
                </h2>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[700px] table-fixed">
                  <TableHeader className="bg-[#F6F7F8]">
                    <TableRow>
                      <TableHead className="w-64 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Product Name
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Unit of Measure
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Scrap Quantity
                      </TableHead>
                      <TableHead className="w-16 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {items.map((it) => {
                      return (
                        <TableRow
                          key={it.id}
                          className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150"
                        >
                          <TableCell className="border border-gray-200 align-middle p-0">
                            <Select
                              value={it.product}
                              onValueChange={(value) =>
                                updateItemWithProductDetails(it.id, value)
                              }
                            >
                              <SelectTrigger className="h-11 w-full rounded-none border-0 focus:ring-0 focus:ring-offset-0 px-4">
                                <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select product"} />
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

                          <TableCell className="border border-gray-200 px-4 align-middle text-center text-sm text-gray-700">
                            {it.unit_of_measure || "—"}
                          </TableCell>

                          <TableCell className="border border-gray-200 align-middle text-center p-0">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.scrap_quantity}
                              onChange={(e) =>
                                updateScrapQty(it.id, e.target.value)
                              }
                              placeholder="0"
                              className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0 bg-red-50/30 text-[#E43D2B] font-medium"
                            />
                          </TableCell>

                          <TableCell className="border border-gray-200 px-4 align-middle text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(it.id)}
                              disabled={items.length === 1}
                              className="h-8 w-8 text-gray-400 hover:text-[#E43D2B] hover:bg-red-50 mx-auto"
                              title="Remove line"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-white border-t border-gray-200">
                    <TableRow>
                      <TableCell colSpan={4} className="py-3 px-4 border-b border-gray-200">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={addRow}
                          className="text-[#3B7CED] hover:bg-blue-50 text-sm font-medium h-9 px-4"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Product Line
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </form>
        </main>

        {/* Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
          <Link href={`/inventory/operation/scrap/${id}`}>
            <Button
              variant="outline"
              type="button"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm h-9 px-4"
            >
              Cancel
            </Button>
          </Link>
          <PermissionGuard module="inventory" entitlement="change_scrap">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSave)}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white text-sm h-9 px-4 font-semibold shadow-2xs"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </PermissionGuard>
        </div>

        {/* Status Modal */}
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onAction={statusModal.close}
        />

        <ToastNotification
          show={toastState.show}
          message={toastState.message}
          type={toastState.type}
          onClose={() => setToastState((prev) => ({ ...prev, show: false }))}
        />
      </div>
    </PageGuard>
  );
}
