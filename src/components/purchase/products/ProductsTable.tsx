import React from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductRow } from "./ProductRow";
import { MobileProductItem } from "./MobileProductItem";
import { Product } from "../../../types/purchase";

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const allSelected =
    products.length > 0 && products.every((p) => selected[p.id]);

  function toggleAll() {
    if (allSelected) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    products.forEach((p) => (map[p.id] = true));
    setSelected(map);
  }

  function toggleOne(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <motion.div
      className="px-6 bg-white h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mt-2 pt-4 bg-white rounded-lg overflow-hidden">
        {/* Desktop Header */}
        <motion.div
          className="hidden md:grid grid-cols-[48px_1fr_1fr_120px] items-center bg-gray-100 rounded-md px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center">
            <Checkbox
              id="select-all"
              aria-label="Select all products"
              checked={allSelected}
              onCheckedChange={() => toggleAll()}
              className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 transition-all duration-200"
            />
          </div>
          <div>Product Name</div>
          <div>Category</div>
          <div className="text-left">Quantity</div>
        </motion.div>

        {/* Mobile List */}
        <ul className="md:hidden divide-y divide-gray-100">
          {products.map((p, index) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: index * 0.1,
              }}
            >
              <MobileProductItem
                product={p}
                isSelected={!!selected[p.id]}
                onToggleSelect={toggleOne}
              />
            </motion.li>
          ))}
        </ul>

        {/* Desktop Table */}
        <div className="hidden md:block">
          {products.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: index * 0.1,
              }}
            >
              <ProductRow
                product={p}
                isSelected={!!selected[p.id]}
                onToggleSelect={toggleOne}
              />
            </motion.div>
          ))}
        </div>

        {products.length === 0 && (
          <motion.div
            className="p-8 text-center text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            No products found
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
