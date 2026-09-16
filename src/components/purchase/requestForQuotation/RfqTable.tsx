"use client";

import React, { useMemo } from "react";

import { Checkbox } from "../../ui/checkbox";
import { motion } from "framer-motion";
import { RequestRow } from "../types";
import { MobileRfqItem } from "./MobileRfqItem";
import { RfqRow } from "./RfqRow";

export function RfqTable({
  rows,
  query,
}: {
  rows: RequestRow[];
  query: string;
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.product.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const allSelected =
    paginatedData.length > 0 && paginatedData.every((r) => selected[r.id]);

  function toggleAll() {
    if (allSelected) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    paginatedData.forEach((r) => (map[r.id] = true));
    setSelected(map);
  }

  function toggleOne(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

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
            className="hidden md:grid grid-cols-[48px_2fr_1fr_1.5fr_1.5fr_1fr] items-center bg-gray-100 rounded-md px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center">
              <Checkbox
                id="select-all"
                aria-label="Select all request for quotations"
                checked={allSelected}
                onCheckedChange={() => toggleAll()}
                className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 transition-all duration-200"
              />
            </div>
            <div>Request ID (purchase request id)</div>
            <div>Product Name</div>
            <div>Quantity</div>
            <div>Amount</div>
            <div>Status</div>
          </motion.div>

          <ul className="md:hidden divide-y divide-gray-100">
            {paginatedData.map((v, index) => (
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
                <MobileRfqItem
                  request={v}
                  isSelected={!!selected[v.id]}
                  onToggleSelect={toggleOne}
                />
              </motion.li>
            ))}
          </ul>

          {/* Desktop Table */}
          <div className="hidden md:block">
            {paginatedData.map((v, index) => (
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
                <RfqRow
                  request={v}
                  isSelected={!!selected[v.id]}
                  onToggleSelect={toggleOne}
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
            No request for quotations found
          </motion.div>
        )}

        <div className="px-6 py-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, filtered.length)} of{" "}
            {filtered.length} results
          </div>
          <nav aria-label="Pagination">
            <ul className="inline-flex items-center gap-2">
              <li>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Prev
                </button>
              </li>
              <li className="px-3 py-1 text-gray-600">
                Page {currentPage} of {totalPages}
              </li>
              <li>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
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
