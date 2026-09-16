import React from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { VendorRow } from "./VendorRow";
import { Vendor } from "../../../types/purchase";
import { MobileVendorItem } from "./MobileVendorItem";

interface VendorTableProps {
  vendors: Vendor[];
}

export function VendorTable({ vendors }: VendorTableProps) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const allSelected =
    vendors.length > 0 && vendors.every((v) => selected[v.id]);

  function toggleAll() {
    if (allSelected) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    vendors.forEach((v) => (map[v.id] = true));
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
          className="hidden md:grid grid-cols-[48px_1.5fr_1.5fr_1fr_1.5fr] items-center bg-gray-100 rounded-md px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center">
            <Checkbox
              id="select-all"
              aria-label="Select all vendors"
              checked={allSelected}
              onCheckedChange={() => toggleAll()}
              className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 transition-all duration-200"
            />
          </div>
          <div>Vendor Name</div>
          <div>Email</div>
          <div>Phone Number</div>
          <div>Address</div>
        </motion.div>

        {/* Mobile List */}
        <ul className="md:hidden divide-y divide-gray-100">
          {vendors.map((v, index) => (
            <motion.li
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: index * 0.1,
              }}
            >
              <MobileVendorItem
                vendor={v}
                isSelected={!!selected[v.id]}
                onToggleSelect={toggleOne}
              />
            </motion.li>
          ))}
        </ul>

        {/* Desktop Table */}
        <div className="hidden md:block">
          {vendors.map((v, index) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: index * 0.1,
              }}
            >
              <VendorRow
                vendor={v}
                isSelected={!!selected[v.id]}
                onToggleSelect={toggleOne}
              />
            </motion.div>
          ))}
        </div>

        {vendors.length === 0 && (
          <motion.div
            className="p-8 text-center text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            No vendors found
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
