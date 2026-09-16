"use client";

import React from "react";
import { MoveLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem } from "@/components/shared/types";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { motion } from "framer-motion";

interface UnitOfMeasureHeaderProps {
  breadcrumbItems: BreadcrumbItem[];
  onBack: () => void;
  onAddUnit?: () => void;
}

export function UnitOfMeasureHeader({
  breadcrumbItems,
  onBack,
  onAddUnit,
}: UnitOfMeasureHeaderProps) {
  return (
    <>
      <Breadcrumbs
        items={breadcrumbItems}
        action={
          <Button
            variant="ghost"
            className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
          >
            Autosaved <AutoSaveIcon />
          </Button>
        }
      />

      {/* Header */}
      <div className="bg-white h-16 border-b border-gray-200 flex justify-between items-center px-6 rounded-lg">
        <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
          <Button
            aria-label="Go back"
            onClick={onBack}
            className="flex items-center gap-3 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded cursor-pointer border-none hover:border-none hover:bg-transparent transition-all duration-200"
          >
            <motion.div whileHover={{ x: -2 }} transition={{ duration: 0.2 }}>
              <MoveLeft size={20} />
            </motion.div>
            <span className="text-base font-medium">Units of Measure</span>
          </Button>
        </motion.div>

        {onAddUnit && (
          <Button
            onClick={onAddUnit}
            className="bg-[#3B7CED] hover:bg-[#3B7CED]/90 text-white px-4 h-10 rounded-md font-medium transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Add Unit
          </Button>
        )}
      </div>
    </>
  );
}
