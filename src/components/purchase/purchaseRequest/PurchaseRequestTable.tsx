"use client";

import React, { useMemo, useState } from "react";
import { StatusPill } from "./StatusPill";
import { Status, RequestRow } from "../types";
import { Input } from "../../ui/input";
import { SearchIcon } from "lucide-react";
import { Button } from "../../ui/button";
import Link from "next/link";
import { Checkbox } from "../../ui/checkbox";
import { motion } from "framer-motion";
import { MobilePurchaseRequestItem } from "./MobilePurchaseRequestItem";
import { PurchaseRequestRow } from "./PurchaseRequestRow";

export function PurchaseTable({
  rows,
  query,
}: {
  rows: RequestRow[];
  query: string;
}) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.product.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected[r.id]);

  function toggleAll() {
    if (allSelected) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    filtered.forEach((r) => (map[r.id] = true));
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
                aria-label="Select all purchase requests"
                checked={allSelected}
                onCheckedChange={() => toggleAll()}
                className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 transition-all duration-200"
              />
            </div>
            <div>Product</div>
            <div>Quantity</div>
            <div>Amount</div>
            <div>Requester</div>
            <div>Status</div>
          </motion.div>

          <ul className="md:hidden divide-y divide-gray-100">
            {/*{filtered.map((v, index) => (
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
                <MobilePurchaseRequestItem
                  request={v}
                  isSelected={!!selected[v.id]}
                  onToggleSelect={toggleOne}
                />
              </motion.li>
            ))}*/}
            {filtered.map((v) => (
              <MobilePurchaseRequestItem
                key={v.id} // move key here
                request={v}
                isSelected={!!selected[v.id]}
                onToggleSelect={toggleOne}
              />
            ))}
          </ul>

          {/* Desktop Table */}
          <div className="hidden md:block">
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
                <PurchaseRequestRow
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
            No purchase requests found
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
