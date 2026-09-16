"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateInventoryProductMutation } from "@/api/inventory/productsApi";
import { useGetInventoryUnitOfMeasuresQuery } from "@/api/inventory/unitOfMeasureApi";
import { useGetProductCategoriesQuery } from "@/api/inventory/productCategoryApi";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName: string;
  onSuccess: (product: { id: string | number; name: string; standardCost?: string | number; description?: string }) => void;
}

export function CreateProductModal({
  isOpen,
  onClose,
  initialProductName,
  onSuccess,
}: CreateProductModalProps) {
  const [name, setName] = useState(initialProductName);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("consumable");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [standardCost, setStandardCost] = useState("");

  const [createProduct, { isLoading }] = useCreateInventoryProductMutation();
  const { data: units, isLoading: isUnitsLoading } = useGetInventoryUnitOfMeasuresQuery({});
  const { data: categories, isLoading: isCategoriesLoading } = useGetProductCategoriesQuery({});

  useEffect(() => {
    setName(initialProductName);
  }, [initialProductName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || !unitOfMeasure || !standardCost) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        product_name: name,
        description: description || "No description provided.",
        product_category: category,
        unit_of_measure: Number(unitOfMeasure),
        standard_cost: Number(standardCost),
        is_hidden: false,
      };

      const result = await createProduct(payload).unwrap();
      onSuccess({ 
        id: result.id, 
        name: result.product_name,
        standardCost: result.standard_cost || payload.standard_cost,
        description: result.description || payload.description
      });
      
      // Reset form
      setName("");
      setDescription("");
      setCategory("consumable");
      setUnitOfMeasure("");
      setStandardCost("");
      onClose();
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add a new product to the system directly from this request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold text-gray-700">Product Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium Cement 50kg"
              required
              className="h-11 border-gray-200 focus:ring-[#3B7CED]/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold text-gray-700">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="h-11 border-gray-200 focus:ring-[#3B7CED]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-semibold text-gray-700">Category *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={isCategoriesLoading}
                className="w-full h-11 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7CED]/20 focus:border-[#3B7CED]"
              >
                <option value="">Select Category</option>
                {categories?.map((cat: any) => {
                  const catId = cat.url.split("/").filter(Boolean).pop();
                  return (
                    <option key={catId} value={catId}>
                      {cat.category_name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom" className="text-xs font-semibold text-gray-700">Unit of Measure *</Label>
              <select
                id="uom"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                required
                disabled={isUnitsLoading}
                className="w-full h-11 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7CED]/20 focus:border-[#3B7CED]"
              >
                <option value="">Select Unit</option>
                {units?.map((unit: any) => {
                  const unitId = unit.url.split("/").filter(Boolean).pop();
                  return (
                    <option key={unitId} value={unitId}>
                      {unit.unit_name} ({unit.unit_symbol})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="standardCost" className="text-xs font-semibold text-gray-700">Estimated Unit Cost *</Label>
            <Input
              id="standardCost"
              type="number"
              min="0"
              step="0.01"
              value={standardCost}
              onChange={(e) => setStandardCost(e.target.value)}
              placeholder="e.g. 500"
              required
              className="h-11 border-gray-200 focus:ring-[#3B7CED]/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 text-xs font-semibold text-gray-700 border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 text-xs font-semibold bg-[#3B7CED] hover:bg-[#2d63c7] text-white"
            >
              {isLoading ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
