import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "./StatusPill";
import { RequestRow } from "@/components/purchase/types";
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
    router.push(`/inventory/stocks/adjustment/${request.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: index * 0.1,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow border-2 border-gray-200 hover:border-gray-300 shadow-none rounded"
        )}
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {request.product}
              </CardTitle>
              <StatusPill status={request.status} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Adjustment Type */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm font-medium text-gray-900">
                {request.adjustmentType}
              </span>
            </div>

            {/* Location */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Location:</span>
              <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                {request.location}
              </span>
            </div>

            {/* Adjusted Date */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Date:</span>
              <span className="text-sm font-medium text-gray-900">
                {request.adjustedDate}
              </span>
            </div>

            {/* Stock Adjustment ID */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Adjustment ID:</span>
              <span className="text-xs font-mono text-gray-600">
                {request.id}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StockAdjustmentCards({
  stockAdjustments,
  isLoading,
}: StockAdjustmentCardsProps & { isLoading?: boolean }) {
  return (
    <motion.div
      className="px-6 bg-white h-full mt-6 rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Stock Adjustment Cards Grid */}
      {isLoading ? (
        <motion.div
          className="flex items-center justify-center h-64 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-gray-400 text-sm">Loading stock adjustments...</div>
        </motion.div>
      ) : stockAdjustments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6">
          {stockAdjustments.map((stockAdjustment, index) => (
            <StockAdjustmentCard
              key={stockAdjustment.id}
              request={stockAdjustment}
              index={index}
            />
          ))}
        </div>
      ) : (
        <motion.div
          className="flex items-center justify-center h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No stock adjustments found</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
