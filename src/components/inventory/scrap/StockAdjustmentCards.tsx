"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "./StatusPill";
import { StockAdjustmentRow } from "../types";
import { cn } from "@/lib/utils";

interface StockAdjustmentCardsProps {
  stockAdjustments: StockAdjustmentRow[];
}

interface StockAdjustmentCardProps {
  request: StockAdjustmentRow;
  index: number;
}

function StockAdjustmentCard({ request, index }: StockAdjustmentCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/inventory/operation/scrap/${request.id}`);
  };

  const formattedCause =
    request.adjustmentType?.toUpperCase() === "DAMAGE"
      ? "Damage / Spoilage"
      : request.adjustmentType?.toUpperCase() === "LOSS"
      ? "Loss"
      : request.adjustmentType || "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: index * 0.05,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-[#3B7CED] bg-white rounded-lg overflow-hidden"
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="p-4 pb-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold text-[#32325D] truncate">
              {request.id}
            </CardTitle>
            <StatusPill status={request.status} />
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {/* Product */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-xs text-[#8898AA] font-medium">Product:</span>
            <span className="font-semibold text-[#32325D] text-right truncate max-w-[170px]">
              {request.product || "Multiple Products"}
            </span>
          </div>

          {/* Cause */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-xs text-[#8898AA] font-medium">Cause:</span>
            <span className="font-medium text-[#E43D2B] text-xs">
              {formattedCause}
            </span>
          </div>

          {/* Location */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-xs text-[#8898AA] font-medium">Location:</span>
            <span className="text-sm font-medium text-[#525F7F] truncate max-w-[150px]">
              {request.location}
            </span>
          </div>

          {/* Scrapped Quantity */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-xs text-[#8898AA] font-medium">Scrapped Qty:</span>
            <span className="text-sm font-bold text-[#E43D2B] font-mono">
              -{request.quantity || 0}
            </span>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
            <span className="text-[#8898AA]">Recorded:</span>
            <span className="text-[#525F7F] font-medium">
              {request.adjustedDate}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StockAdjustmentCards({
  stockAdjustments,
}: StockAdjustmentCardsProps) {
  return (
    <motion.div
      className="bg-transparent h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {stockAdjustments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stockAdjustments.map((scrap, index) => (
            <StockAdjustmentCard
              key={scrap.id}
              request={scrap}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-center">
          <p className="text-gray-400 text-sm">No scrap records found</p>
        </div>
      )}
    </motion.div>
  );
}
