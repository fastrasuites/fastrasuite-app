import React from "react";
import { motion } from "framer-motion";
import { SearchBar } from "./SearchBar";
import { ActionButtons } from "./ActionButtons";
import { ViewToggle } from "./ViewToggle";
import { ViewType } from "@/types/purchase";

interface ActionBarProps {
  href: string;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  searchTerm?: string;
  onSearchChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ActionBar({
  href,
  currentView,
  onViewChange,
  searchTerm,
  onSearchChange,
}: ActionBarProps) {
  return (
    <motion.div
      className="bg-white px-6 rounded mb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
        <motion.div
          className="w-full md:w-1/3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          <SearchBar
            placeholder="Search products..."
            value={searchTerm}
            onChange={onSearchChange}
          />
        </motion.div>

        <motion.div
          className="flex items-center gap-3 ml-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        >
          <ActionButtons href={href} />
          <ViewToggle currentView={currentView} onViewChange={onViewChange} />
        </motion.div>
      </div>
    </motion.div>
  );
}
