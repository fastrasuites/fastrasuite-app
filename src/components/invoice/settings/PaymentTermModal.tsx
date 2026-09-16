"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PaymentTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export function PaymentTermModal({ isOpen, onClose, onSave, initialData }: PaymentTermModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    days_until_due: 0,
    description: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || "",
        days_until_due: initialData?.days_until_due || 0,
        description: initialData?.description || "",
        is_active: initialData?.is_active ?? true,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      if (err?.data && typeof err.data === 'object' && !err.data.detail) {
        setErrors(err.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? "Edit Payment Term" : "Add Payment Term"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term Name <span className="text-red-500">*</span></label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Net 30"
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.join(", ")}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days Until Due <span className="text-red-500">*</span></label>
            <Input
              type="number"
              min="0"
              value={formData.days_until_due}
              onChange={(e) => setFormData(prev => ({ ...prev, days_until_due: parseInt(e.target.value) || 0 }))}
              placeholder="e.g., 30"
              required
            />
            {errors.days_until_due && <p className="text-red-500 text-xs mt-1">{errors.days_until_due.join(", ")}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Payment is due 30 days after invoice generation"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.join(", ")}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (available for use)
            </label>
            {errors.is_active && <p className="text-red-500 text-xs mt-1">{errors.is_active.join(", ")}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Payment Term"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
