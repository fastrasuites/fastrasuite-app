import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "../../../app/purchase/products/types";

interface MobileProductItemProps {
  product: Product;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function MobileProductItem({
  product,
  isSelected,
  onToggleSelect,
}: MobileProductItemProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/purchase/products/${product.id}`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onToggleSelect(product.id);
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
          id={`cb-${product.id}`}
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
            {product.name}
          </motion.div>
          <motion.div
            className="text-sm text-slate-600"
            whileHover={{ color: "#475569" }}
            transition={{ duration: 0.2 }}
          >
            {product.quantity}
          </motion.div>
        </div>
        <motion.div
          className="text-xs text-slate-500"
          whileHover={{ color: "#64748b" }}
          transition={{ duration: 0.2 }}
        >
          {product.category}
        </motion.div>
      </div>
    </motion.li>
  );
}
