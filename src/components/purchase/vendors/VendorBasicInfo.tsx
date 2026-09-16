"use client";

import React from "react";
import { motion } from "framer-motion";
import { ProductImageUpload } from "@/components/purchase/products/ProductImageUpload";
import { UseFormRegisterReturn, UseFormSetValue } from "react-hook-form";

interface VendorBasicInfoProps {
  avatarSrc: string | null;
  avatarFile: File | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  companyNameRegister: UseFormRegisterReturn<"company_name">;
  companyNameError?: { message?: string };
  isBase64?: boolean; // true if avatarSrc is a base64 string, false if it's a URL
}

export function VendorBasicInfo({
  avatarSrc,
  avatarFile,
  onImageChange,
  companyNameRegister,
  companyNameError,
  isBase64 = false,
}: VendorBasicInfoProps) {
  return (
    <motion.div
      className="flex flex-col lg:flex-row gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
    >
      {/* Image upload section */}
      <div className="flex-shrink-0">
        <ProductImageUpload
          avatarSrc={avatarSrc}
          onImageChange={onImageChange}
          isBase64={isBase64}
        />
      </div>

      {/* Company name */}
      <div className="flex-1 max-w-lg">
        <div className="mb-6">
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Vendor Name *
          </label>
          <motion.div
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              id="company_name"
              type="text"
              placeholder="Enter vendor name"
              {...companyNameRegister}
              className="w-full h-11 px-4 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
            />
            {companyNameError && (
              <p className="text-sm text-red-600 mt-1">
                {companyNameError.message}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
