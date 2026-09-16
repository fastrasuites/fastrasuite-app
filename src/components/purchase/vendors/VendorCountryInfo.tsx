"use client";

import React from "react";
import { motion } from "framer-motion";
import { UseFormRegisterReturn, FieldErrors } from "react-hook-form";
import type { VendorFormData } from "@/schemas/vendorSchema";

interface VendorCountryInfoProps {
  countryRegister: UseFormRegisterReturn<"country">;
  errors: FieldErrors<VendorFormData>;
}

export function VendorCountryInfo({
  countryRegister,
  errors,
}: VendorCountryInfoProps) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }}
    >
      <div className="max-w-md">
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Country *
        </label>
        <motion.div whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <input
            id="country"
            type="text"
            placeholder="Enter country"
            {...countryRegister}
            className="w-full h-11 px-4 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
          {errors.country && (
            <p className="text-sm text-red-600 mt-1">
              {errors.country.message}
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
