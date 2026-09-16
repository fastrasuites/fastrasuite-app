import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Vendor } from "../../../types/purchase";

interface MobileVendorItemProps {
  vendor: Vendor;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function MobileVendorItem({
  vendor,
  isSelected,
  onToggleSelect,
}: MobileVendorItemProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/purchase/vendors/${vendor.id}`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onToggleSelect(vendor.id);
  };

  return (
    <motion.li
      className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer"
      role="listitem"
      tabIndex={0}
      onClick={handleRowClick}
      whileHover={{
        backgroundColor: "rgba(249, 250, 251, 1)",
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex-shrink-0">
        <Checkbox
          id={`cb-${vendor.id}`}
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          className="transition-all duration-200"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <motion.div
            className="text-sm font-medium text-slate-800"
            whileHover={{ color: "#1e293b" }}
            transition={{ duration: 0.2 }}
          >
            {vendor.name}
          </motion.div>
          <motion.div
            className="text-sm text-slate-600"
            whileHover={{ color: "#475569" }}
            transition={{ duration: 0.2 }}
          >
            {vendor.email}
          </motion.div>
        </div>
        <motion.div
          className="text-xs text-slate-500"
          whileHover={{ color: "#64748b" }}
          transition={{ duration: 0.2 }}
        >
          {vendor.phone} • {vendor.address}
        </motion.div>
      </div>
    </motion.li>
  );
}
