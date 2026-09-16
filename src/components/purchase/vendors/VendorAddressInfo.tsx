"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  UseFormRegisterReturn,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VendorFormData } from "@/schemas/vendorSchema";

interface VendorAddressInfoProps {
  streetRegister: UseFormRegisterReturn<"address_street">;
  countryRegister: UseFormRegisterReturn<"country">;
  selectedState: string;
  availableLgas: string[];
  availableStates: string[];
  setSelectedState: (state: string) => void;
  handleStateChange: (state: string) => void;
  handleLgaChange: (lga: string) => void;
  localGovernmentValue: string;
  setValue: UseFormSetValue<VendorFormData>;
  errors: FieldErrors<VendorFormData>;
}

export function VendorAddressInfo({
  streetRegister,
  countryRegister,
  selectedState,
  availableLgas,
  availableStates,
  setSelectedState,
  handleStateChange,
  handleLgaChange,
  localGovernmentValue,
  setValue,
  errors,
}: VendorAddressInfoProps) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
    >
      {/* Address Street and Number */}
      <div>
        <label
          htmlFor="address_street"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Address Street and Number *
        </label>
        <motion.div whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <input
            id="address_street"
            type="text"
            placeholder="Enter street address"
            {...streetRegister}
            className="w-full h-11 px-4 bg-white border border-gray-400 rounded shadow-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
          {errors.address_street && (
            <p className="text-sm text-red-600 mt-1">
              {errors.address_street.message}
            </p>
          )}
        </motion.div>
      </div>

      {/* Local Government */}
      <div>
        <label
          htmlFor="local_government"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Local Government *
        </label>
        <motion.div whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Select
            value={selectedState ? localGovernmentValue || "" : ""}
            onValueChange={handleLgaChange}
            disabled={!selectedState}
          >
            <SelectTrigger
              className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              size="md"
            >
              <SelectValue
                placeholder={
                  !selectedState
                    ? "Select a state first"
                    : "Select local government"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableLgas.map((lga) => (
                <SelectItem key={lga} value={lga}>
                  {lga}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.local_government && (
            <p className="text-sm text-red-600 mt-1">
              {errors.local_government.message}
            </p>
          )}
        </motion.div>
      </div>

      {/* State */}
      <div>
        <label
          htmlFor="state"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          State *
        </label>
        <motion.div whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger
              className="w-full h-11 border border-gray-400 rounded bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              size="md"
            >
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {availableStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
