import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Vendor } from "../../../types/purchase";

interface VendorRowProps {
  vendor: Vendor;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function VendorRow({
  vendor,
  isSelected,
  onToggleSelect,
}: VendorRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/purchase/vendors/${vendor.id}`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onToggleSelect(vendor.id);
  };

  return (
    <motion.div
      className={cn(
        "grid grid-cols-[48px_1.5fr_1.5fr_1fr_1.5fr] items-center px-4 py-4 text-sm text-slate-700 border-b hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer",
        ""
      )}
      role="row"
      onClick={handleRowClick}
      whileHover={{
        backgroundColor: "rgba(249, 250, 251, 1)",
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-center">
        <Checkbox
          id={`cb-${vendor.id}`}
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 transition-all duration-200"
        />
      </div>

      <div className="truncate">
        <motion.div
          className="text-sm text-slate-800"
          whileHover={{ color: "#1e293b" }}
          transition={{ duration: 0.2 }}
        >
          {vendor.name}
        </motion.div>
      </div>

      <motion.div
        className="truncate text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {vendor.email}
      </motion.div>

      <motion.div
        className="text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {vendor.phone}
      </motion.div>

      <motion.div
        className="truncate text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {vendor.address}
      </motion.div>
    </motion.div>
  );
}
