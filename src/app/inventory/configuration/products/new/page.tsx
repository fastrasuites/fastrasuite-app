"use client";

import React, { useState, useRef } from "react";
import { ArrowLeft, Loader2, CheckSquare, Square, Save, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateInventoryProductMutation,
  useGetInventoryProductsQuery,
} from "@/api/inventory/productsApi";
import { useGetInventoryUnitOfMeasuresQuery } from "@/api/inventory/unitOfMeasureApi";
import { useGetProductCategoriesQuery } from "@/api/inventory/productCategoryApi";
import { StatusModal, useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";

export default function NewProductPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [standardCost, setStandardCost] = useState("0");
  const [reorderPoint, setReorderPoint] = useState("");
  const [isReorderFocused, setIsReorderFocused] = useState(false);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [checkForDuplicates, setCheckForDuplicates] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status modal hook
  const statusModal = useStatusModal();

  // API hooks
  const [createProduct, { isLoading: isCreating }] =
    useCreateInventoryProductMutation();
  const { data: unitMeasures, isLoading: isLoadingUnits } =
    useGetInventoryUnitOfMeasuresQuery({});
  const { data: activeProducts, isLoading: isLoadingProducts } =
    useGetInventoryProductsQuery({});
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetProductCategoriesQuery();

  const unitsList = (unitMeasures as any)?.results || (Array.isArray(unitMeasures) ? unitMeasures : []);
  const categoriesList = (categoriesData as any)?.results || (Array.isArray(categoriesData) ? categoriesData : []);

  // Helper to extract UOM ID cleanly
  const getUnitId = (uom: any): number => {
    if (uom?.id !== undefined && !isNaN(Number(uom.id))) {
      return Number(uom.id);
    }
    if (uom?.url) {
      const parts = uom.url.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (!isNaN(Number(lastPart))) {
        return Number(lastPart);
      }
    }
    return 0;
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      "Product Name": "Sample Product",
      "Description": "Sample notes",
      "Category Name": categoriesList?.[0]?.category_name || "General",
      "Unit Symbol": unitsList?.[0]?.unit_symbol || "kg",
      "Standard Cost": 500,
      "Reorder Point": 10
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Products_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let errorCount = 0;

        for (const row of data as any[]) {
          const productName = row["Product Name"] || row["product_name"] || row["name"];
          const desc = row["Description"] || row["description"] || "";
          const catName = row["Category Name"] || row["category"] || "";
          const unitSym = row["Unit Symbol"] || row["Unit of Measure"] || row["unit"] || "";
          const stdCost = row["Standard Cost"] || 0;
          const reorderPt = row["Reorder Point"] || 0;
          
          if (!productName) continue;
          
          const cat = categoriesList.find((c: any) => c.category_name.toLowerCase() === String(catName).toLowerCase());
          const uom = unitsList.find((u: any) => 
            String(u.unit_symbol || "").toLowerCase() === String(unitSym).toLowerCase() || 
            String(u.unit_name || "").toLowerCase() === String(unitSym).toLowerCase()
          );

          if (!cat || !uom) {
            errorCount++;
            continue;
          }

          try {
            await createProduct({
              product_name: String(productName),
              description: String(desc),
              product_category: String(cat.id),
              unit_of_measure: Number(getUnitId(uom)),
              standard_cost: String(stdCost),
              reorder_point: String(reorderPt),
              is_active: true,
              check_for_duplicates: checkForDuplicates
            }).unwrap();
            successCount++;
          } catch (err) {
            errorCount++;
          }
        }
        
        if (errorCount > 0 && successCount === 0) {
          statusModal.showError("Import Failed", "Failed to import products. Ensure Category and Unit match existing ones.");
        } else {
          statusModal.showSuccess(
            "Import Complete",
            `${successCount} imported${errorCount > 0 ? `, ${errorCount} failed (Check matching categories/units)` : ''}.`,
            "Done"
          );
        }
      } catch (error) {
        statusModal.showError("Import Error", "Failed to parse Excel file.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      statusModal.showError(
        "Validation Error",
        "Product Name is required to proceed."
      );
      return;
    }

    if (!unit) {
      statusModal.showError(
        "Validation Error",
        "Please select a Unit of Measure."
      );
      return;
    }

    try {
      const payload: any = {
        product_name: name.trim(),
        description: description.trim(),
        product_category: Number(category),
        unit_of_measure: Number(unit),
        standard_cost: standardCost ? String(standardCost) : "0",
        reorder_point: reorderPoint !== "" && reorderPoint !== undefined && reorderPoint !== null ? Number(reorderPoint) : null,
        is_active: isActive,
      };

      await createProduct(payload).unwrap();
      statusModal.showSuccess(
        "Product Created",
        `${name} has been successfully added to products.`
      );
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, "Failed to create product.");
      statusModal.showError("Creation Failed", errorMsg);
    }
  };

  const handleModalClose = () => {
    statusModal.close();
    if (statusModal.type === "success") {
      router.push("/inventory/configuration/products");
    }
  };

  return (
    <PageGuard module="inventory" entitlement="add_products">
      {/* Two-tone: gray page canvas */}
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={handleModalClose}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.type === "success" ? "Go to Products" : "Try again"}
        />

        {/* Clean Header Card */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href="/inventory/configuration/products">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#32325D]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[#32325D]">New Product</h1>
              <p className="text-xs text-[#8898AA] mt-0.5">Create a new item in products.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {process.env.NODE_ENV === "development" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  className="h-9 px-4 rounded-md font-medium text-sm border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 text-gray-600"
                >
                  <Download className="h-4 w-4" /> Template
                </Button>
                
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="h-9 px-4 rounded-md font-medium text-sm border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 text-gray-600"
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isImporting ? "Importing..." : "Import Excel"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Layout Container */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex items-start overflow-x-hidden">
          {/* Main Form */}
          <div className="flex-1 transition-all duration-500 ease-in-out bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">
                Basic Information & Classification
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label className="text-xs font-semibold text-[#525F7F]">
                  Product Name <span className="text-[#E43D2B]">*</span>
                </Label>
                <Input
                  placeholder="Enter unique product name e.g. Premium Portland Cement"
                  className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setIsReorderFocused(false)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-[#525F7F]">
                  Unit of Measure <span className="text-[#E43D2B]">*</span>
                </Label>
                <Select
                  value={unit}
                  onValueChange={setUnit}
                  disabled={isLoadingUnits}
                >
                  <SelectTrigger 
                    className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                    onFocus={() => setIsReorderFocused(false)}
                  >
                    <SelectValue
                      placeholder={
                        isLoadingUnits
                          ? "Loading units..."
                          : "Select unit of measure"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsList?.map((uom: any, index: number) => {
                      const uomId = getUnitId(uom) || index + 1;
                      return (
                        <SelectItem key={uomId} value={String(uomId)}>
                          {uom.unit_name}{" "}
                          {uom.unit_symbol ? `(${uom.unit_symbol})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-[#525F7F]">
                  Product Category <span className="text-[#E43D2B]">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} disabled={isLoadingCategories}>
                  <SelectTrigger 
                    className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                    onFocus={() => setIsReorderFocused(false)}
                  >
                    <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesList?.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-[#525F7F]">
                  Standard Cost (₦)
                </Label>
                <Input
                  type="text"
                  placeholder="0.00"
                  className="bg-white border-gray-200 rounded-md h-9 font-mono text-sm font-semibold text-[#32325D] focus:ring-[#3B7CED]"
                  value={standardCost}
                  onChange={(e) => setStandardCost(e.target.value)}
                  onFocus={() => setIsReorderFocused(false)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-[#525F7F]">
                  Reorder Point
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  className="bg-white border-gray-200 rounded-md h-9 font-mono text-sm font-semibold text-[#32325D] focus:ring-[#3B7CED]"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  onFocus={() => setIsReorderFocused(true)}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-3">
                <Label className="text-xs font-semibold text-[#525F7F]">Description / Notes</Label>
                <Textarea
                  placeholder="Enter additional product specifications, grades, or handling instructions..."
                  className="bg-white border-gray-200 rounded-md min-h-[90px] text-sm text-[#32325D] focus:ring-[#3B7CED]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onFocus={() => setIsReorderFocused(false)}
                />
              </div>
            </div>

            <div className="bg-gray-50/60 p-6 border-t border-gray-100 flex flex-wrap items-center gap-8">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2.5 text-sm font-semibold focus:outline-none cursor-pointer ${isActive ? 'text-[#32325D] hover:text-[#3B7CED]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {isActive ? (
                  <CheckSquare className="h-4 w-4 text-[#3B7CED]" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
                {isActive ? "Product is Active" : "Product is Inactive"}
              </button>

              <button
                type="button"
                onClick={() => setCheckForDuplicates(!checkForDuplicates)}
                className="flex items-center gap-2.5 text-sm font-semibold text-[#32325D] hover:text-[#3B7CED] focus:outline-none cursor-pointer"
              >
                {checkForDuplicates ? (
                  <CheckSquare className="h-4 w-4 text-[#3B7CED]" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
                Check for Duplicates
              </button>
            </div>
          </div>

          {/* Side Reference Panel */}
          <div className={`transition-all duration-500 ease-in-out sticky top-6 overflow-hidden ${isReorderFocused ? 'w-[320px] ml-6 opacity-100' : 'w-0 ml-0 opacity-0'}`}>
             <div className="w-[320px] bg-white rounded-lg shadow-2xs border border-gray-100 flex flex-col max-h-[calc(100vh-100px)]">
               <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                 <h3 className="text-sm font-semibold text-[#32325D]">Reference: Existing Products</h3>
                 <p className="text-xs text-[#8898AA] mt-1">Typical reorder points for your current inventory.</p>
               </div>
               <div className="p-4 overflow-y-auto flex flex-col flex-1">
                 {isLoadingProducts ? (
                    <div className="text-xs text-gray-500 py-4 text-center">Loading products...</div>
                 ) : !activeProducts || activeProducts.length === 0 ? (
                    <div className="text-xs text-gray-500 py-4 text-center">No products found.</div>
                 ) : (
                    activeProducts.map((prod: any) => (
                      <div key={prod.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                         <span className="text-sm text-[#32325D] font-medium truncate pr-3" title={prod.product_name}>
                            {prod.product_name}
                         </span>
                         <span className="text-xs font-mono bg-[#F6F9FC] border border-gray-100 px-2 py-0.5 rounded text-[#525F7F] whitespace-nowrap">
                            RP: {prod.reorder_point || 0}
                         </span>
                      </div>
                    ))
                 )}
               </div>
             </div>
          </div>
        </main>

        {/* Fixed Sticky Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
          <Link href="/inventory/configuration/products">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm font-medium"
            >
              Cancel
            </Button>
          </Link>
          <PermissionGuard module="inventory" entitlement="add_products">
            <Button
              onClick={handleSubmit}
              disabled={isCreating}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 text-sm font-semibold shadow-2xs flex items-center gap-1.5"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Product
                </>
              )}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </PageGuard>
  );
}
