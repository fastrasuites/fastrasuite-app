"use client";

import React, { useMemo } from "react";

import { motion } from "framer-motion";
import { StockAdjustmentRow as StockAdjustmentRowType } from "../types";
import { StockAdjustmentRow } from "./StockAdjustmentRow";

export function StockAdjustmentTable({
  rows,
  query,
}: {
  rows: StockAdjustmentRowType[];
  query: string;
}) {
  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.adjustmentType.toLowerCase().includes(query.toLowerCase()) ||
        r.location.toLowerCase().includes(query.toLowerCase()) ||
        r.adjustedDate.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  return (
    <section className="mx-auto mt-6 mr-4">
      <motion.div
        className="px-6 bg-white h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mt-2 pt-4 bg-white rounded-lg overflow-hidden">
          <motion.div
            className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_0.5fr] items-center bg-gray-100 rounded-md px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div>Stock Adjustment ID</div>
            <div>Adjustment Type</div>
            <div>Location</div>
            <div>Adjusted Date</div>
            <div>Status</div>
          </motion.div>

          {/* Desktop Table */}
          <div className="">
            {filtered.map((v, index) => (
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
                <StockAdjustmentRow
                  request={v}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <motion.div
            className="p-8 text-center text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            No stock adjustments found
          </motion.div>
        )}

        <div className="px-6 py-4 flex items-center justify-between text-sm text-gray-500">
          <div>{filtered.length} results</div>
          <nav aria-label="Pagination">
            <ul className="inline-flex items-center gap-2">
              <li>
                <button className="px-3 py-1 rounded-md border border-gray-200">
                  Prev
                </button>
              </li>
              <li>
                <button className="px-3 py-1 rounded-md border border-gray-200">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </motion.div>
    </section>
  );
}
