"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { InvoiceRow } from "./types";
import { StatusPill } from "./StatusPill";

interface InvoiceRowProps {
  request: InvoiceRow;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function InvoiceRow({
  request,
  isSelected,
  onToggleSelect,
}: InvoiceRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/invoice/${request.id}`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onToggleSelect(request.id);
  };

  return (
    <motion.div
      className={cn(
        "grid grid-cols-[48px_0.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr_0.5fr] items-center px-4 py-4 text-sm text-slate-700 border-b hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer",
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
          id={`cb-${request.id}`}
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 transition-all duration-200"
        />
      </div>

      <div className="truncate">
        <motion.div
          className="text-sm text-slate-800 font-medium"
          whileHover={{ color: "#1e293b" }}
          transition={{ duration: 0.2 }}
        >
          {request.id}
        </motion.div>
      </div>

      <div className="truncate">
        <motion.div
          className="text-sm text-slate-800"
          whileHover={{ color: "#1e293b" }}
          transition={{ duration: 0.2 }}
        >
          {request.vendor}
        </motion.div>
      </div>

      <motion.div
        className="text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.dateCreated}
      </motion.div>

      <motion.div
        className="text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.dueDate}
      </motion.div>

      <motion.div
        className="text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.amount}
      </motion.div>

      <motion.div
        className="text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.due}
      </motion.div>

      <motion.div
        className="text-slate-600 font-medium"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.totalAmount}
      </motion.div>

      <motion.div
        className="flex items-center"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <StatusPill status={request.status} />
      </motion.div>
    </motion.div>
  );
}
