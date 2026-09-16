"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import { StockAdjustmentRow as StockAdjustmentRowType } from "../types";

interface StockAdjustmentRowProps {
  request: StockAdjustmentRowType;
}

export function StockAdjustmentRow({
  request,
}: StockAdjustmentRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/inventory/operation/scrap/${request.id}`);
  };



  return (
    <motion.div
      className={cn(
        "grid grid-cols-[1fr_1fr_1fr_1fr_0.5fr] items-center px-4 py-4 text-sm text-slate-700 border-b hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer",
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


      <div className="truncate">
        <motion.div
          className="text-sm text-slate-800"
          whileHover={{ color: "#1e293b" }}
          transition={{ duration: 0.2 }}
        >
          {request.id}
        </motion.div>
      </div>

      <motion.div
        className="text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.adjustmentType}
      </motion.div>

      <motion.div
        className="text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.location}
      </motion.div>

      <motion.div
        className="truncate text-slate-600"
        whileHover={{ color: "#475569" }}
        transition={{ duration: 0.2 }}
      >
        {request.adjustedDate}
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
