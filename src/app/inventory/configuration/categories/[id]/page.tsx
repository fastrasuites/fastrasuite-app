"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useGetProductCategoryQuery, 
  useUpdateProductCategoryMutation,
  useDeleteProductCategoryMutation
} from "@/api/inventory/productCategoryApi";
import { StatusModal, useStatusModal, extractErrorMessage } from "@/components/shared/StatusModal";
import { Skeleton } from "@/components/ui/skeleton";
export default function CategoryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { data: category, isLoading, isFetching } = useGetProductCategoryQuery(id, {
    skip: !id,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const statusModal = useStatusModal();
  
  const [updateCategory, { isLoading: isUpdating }] = useUpdateProductCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteProductCategoryMutation();

  useEffect(() => {
    if (category) {
      setName(category.category_name || "");
      setDescription(category.description || "");
      setIsActive(category.is_active);
    }
  }, [category]);

  const handleSubmit = async () => {
    if (!name) {
      statusModal.showError("Validation Error", "Category name is required.");
      return;
    }
    
    try {
      await updateCategory({
        id,
        data: {
          category_name: name,
          description,
          is_active: isActive,
        },
      }).unwrap();
      
      statusModal.showSuccess("Success", "Category updated successfully", "Done");
    } catch (error: any) {
      console.error(error);
      statusModal.showError("Update Failed", extractErrorMessage(error, "Failed to update category"));
    }
  };

  const handleDelete = async () => {
    statusModal.showConfirm("Delete Category", "Are you sure you want to delete this category? This action cannot be undone.", async () => {
      try {
        await deleteCategory(id).unwrap();
        statusModal.showSuccess("Deleted", "Category deleted successfully", "Go to Categories", () => {
          statusModal.close();
          router.push("/inventory/configuration/categories");
        });
      } catch (error: any) {
        console.error(error);
        statusModal.showError("Deletion Failed", extractErrorMessage(error, "Failed to delete category"));
      }
    });
  };

  const handleModalClose = () => {
    statusModal.close();
    if (statusModal.type === "success" && statusModal.title === "Deleted") {
      router.push("/inventory/configuration/categories");
    }
  };

  const isSubmitting = isUpdating || isDeleting;

  if (isLoading || isFetching) {
    return (
      <PageGuard module="inventory" entitlement="view_productcategory">
        <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-2xs">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
              <div>
                <Skeleton className="h-5 w-40 mb-1.5 bg-gray-200" />
                <Skeleton className="h-3 w-64 bg-gray-200" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-24 rounded-md bg-gray-200" />
            </div>
          </div>
          <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <Skeleton className="h-5 w-40 bg-gray-200" />
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2.5 md:col-span-2">
                  <Skeleton className="h-4 w-28 bg-gray-200" />
                  <Skeleton className="h-9 w-full bg-gray-200" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                  <Skeleton className="h-9 w-full bg-gray-200" />
                </div>
                <div className="flex flex-col gap-2.5 md:col-span-3">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-[110px] w-full bg-gray-200" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </PageGuard>
    );
  }

  if (!category) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F6F9FC]">
        <p className="text-gray-500">Category not found</p>
      </div>
    );
  }

  const status = isActive ? "active" : "inactive";

  return (
    <PageGuard module="inventory" entitlement="view_productcategory">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={handleModalClose}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          actionText={
            statusModal.actionText ||
            (statusModal.type === "success" ? "Done" : "Close")
          }
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
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-semibold text-[#32325D]">{category.category_name}</h1>
                <Badge className={`px-2.5 py-0.5 font-semibold text-xs rounded-md shadow-none ${status === "active" ? "bg-green-50 text-green-700 border border-green-200/60" : "bg-red-50 text-red-700 border border-red-200/60"}`}>
                  {status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-[#8898AA] mt-0.5">{category.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <PermissionGuard module="inventory" entitlement="change_productcategory">
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm h-9 px-4 font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Main Form Container */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">Category Attributes</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2.5 md:col-span-2">
                <Label className="text-sm font-semibold text-[#32325D]">Category Name <span className="text-[#E43D2B]">*</span></Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-sm font-semibold text-[#32325D]">Status</Label>
                <Select value={isActive ? "true" : "false"} onValueChange={(val) => setIsActive(val === "true")}>
                  <SelectTrigger className="bg-white border-gray-200 rounded-md h-9 text-sm text-[#32325D] focus:ring-[#3B7CED]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2.5 md:col-span-3">
                <Label className="text-sm font-semibold text-[#32325D]">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white border-gray-200 rounded-md min-h-[110px] text-sm text-[#32325D] focus:ring-[#3B7CED] max-w-2xl"
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
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 text-sm font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </PageGuard>
  );
}
