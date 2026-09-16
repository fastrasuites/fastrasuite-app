"use client";

import React from "react";
import { motion } from "framer-motion";
import { UseFormRegisterReturn, FieldErrors } from "react-hook-form";
import type { VendorFormData } from "@/schemas/vendorSchema";

interface VendorContactInfoProps {
  emailRegister: UseFormRegisterReturn<"email">;
  phoneRegister: UseFormRegisterReturn<"phone_number">;
  errors: FieldErrors<VendorFormData>;
}

export function VendorContactInfo({
  emailRegister,
  phoneRegister,
  errors,
}: VendorContactInfoProps) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:max-w-2/3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
    >
      {/* Email Address */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Email Address *
        </label>
        <motion.div whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <input
            id="email"
            type="email"
            placeholder="Enter email address"
            {...emailRegister}
            className="w-full h-11 px-4 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </motion.div>
      </div>

      {/* Phone Number */}
      <div>
        <label
          htmlFor="phone_number"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Phone Number *
        </label>
        <motion.div whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <input
            id="phone_number"
            type="tel"
            placeholder="Enter phone number"
            {...phoneRegister}
            className="w-full h-11 px-4 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
          {errors.phone_number && (
            <p className="text-sm text-red-600 mt-1">
              {errors.phone_number.message}
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
