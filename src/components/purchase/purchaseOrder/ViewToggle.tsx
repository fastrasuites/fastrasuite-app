import React from "react";
import { motion } from "framer-motion";

import { ViewType } from "@/types/purchase";

import { IoGrid as GridIcon } from "react-icons/io5";
import { LuMenu } from "react-icons/lu";
import { SlMenu as ListIcon } from "react-icons/sl";

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <motion.div
      className="flex items-center border border-gray-300 rounded h-full"
      whileHover={{ borderColor: "#d1d5db" }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        aria-label="Grid view"
        className={`py-2.5 px-3 rounded ${
          currentView === "grid"
            ? "text-[#3B7CED] hover:text-[#3B7CED]/90 hover:bg-gray-50 border-none rounded"
            : "border-none hover:bg-gray-50 text-gray-400"
        }`}
        title="Grid view"
        onClick={() => onViewChange("grid")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <GridIcon className="w-4 h-4 transition-colors duration-200" />
      </motion.button>
      <div className="h-7 border-l border-gray-300" />
      <motion.button
        aria-label="List view"
        className={`py-2.5 px-3 rounded ${
          currentView === "list"
            ? "text-[#3B7CED] hover:text-[#3B7CED]/90 hover:bg-gray-50 border-none"
            : "border-none hover:bg-gray-50 text-gray-400"
        }`}
        title="List view"
        onClick={() => onViewChange("list")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <ListIcon className="w-4 h-4 transition-colors duration-200" />
      </motion.button>
    </motion.div>
  );
}
