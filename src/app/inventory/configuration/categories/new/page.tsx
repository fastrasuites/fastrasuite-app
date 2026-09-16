"use client";

import React, { useState, useRef } from "react";
import { ArrowLeft, Save, Upload, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateProductCategoryMutation } from "@/api/inventory/productCategoryApi";
import { StatusModal, useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";

export default function NewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const statusModal = useStatusModal();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [createCategory, { isLoading: isSubmitting }] = useCreateProductCategoryMutation();

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ "Category Name": "Sample Category", "Description": "Sample description" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Product_Categories_Template.xlsx");
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
          const categoryName = row["Category Name"] || row["category_name"] || row["CategoryName"] || row["name"];
          const description = row["Description"] || row["description"] || "";
          
          if (categoryName) {
            try {
              await createCategory({
                category_name: String(categoryName),
                description: String(description),
                is_active: true,
                is_hidden: false,
              }).unwrap();
              successCount++;
            } catch (err) {
              errorCount++;
            }
          }
        }
        
        if (errorCount > 0 && successCount === 0) {
          statusModal.showError("Import Failed", "Failed to import any categories.");
        } else {
          statusModal.showSuccess(
            "Import Complete",
            `${successCount} imported${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
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
    if (!name) {
      statusModal.showError("Validation Error", "Category name is required.");
      return;
    }
    
    try {
      const response = await createCategory({
        category_name: name,
        description,
        is_active: true,
        is_hidden: false,
      }).unwrap();
      
      statusModal.showSuccess("Success", "Category created successfully", "Go to Categories", () => {
        statusModal.close();
        router.push("/inventory/configuration/categories");
      });
    } catch (error: any) {
      console.error(error);
      statusModal.showError("Creation Failed", extractErrorMessage(error, "Failed to create category"));
    }
  };

  const handleModalClose = () => {
    statusModal.close();
    if (statusModal.type === "success") {
      router.push("/inventory/configuration/categories");
    }
  };

  return (
    <PageGuard module="inventory" entitlement="add_productcategory">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={handleModalClose}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={statusModal.actionText || (statusModal.type === "success" ? "Go to Categories" : "Try again")}
          onAction={statusModal.onAction || handleModalClose}
          secondaryText={statusModal.secondaryText}
          onSecondary={statusModal.onSecondary}
          actionVariant={statusModal.actionVariant}
        />
        {/* Clean Header Card */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href="/inventory/configuration/categories">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#32325D]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[#32325D]">New Category</h1>
              <p className="text-xs text-[#8898AA] mt-0.5">Create a new product classification category.</p>
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

        {/* Main Form Container */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">Category Attributes</h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">
                  Category Name <span className="text-[#E43D2B]">*</span>
                </Label>
                <Input
                  placeholder="e.g. Electrical & Wiring Components"
                  className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED] max-w-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">Description</Label>
                <Textarea
                  placeholder="Enter detailed explanation of what products are classified under this category..."
                  className="bg-white border-gray-200 rounded-md min-h-[110px] text-sm text-[#32325D] focus:ring-[#3B7CED] max-w-2xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Fixed Sticky Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
          <Link href="/inventory/configuration/categories">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm font-medium">
              Cancel
            </Button>
          </Link>
          <PermissionGuard module="inventory" entitlement="add_productcategory">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 text-sm font-semibold shadow-2xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Category"}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </PageGuard>
  );
}
