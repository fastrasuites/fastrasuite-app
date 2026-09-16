"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockMove } from "@/types/stockMove";

interface StockMoveCardsProps {
  moves: StockMove[];
}

export function StockMoveCards({ moves }: StockMoveCardsProps) {
  return (
    <div className="w-full font-open-sans">
      {moves.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-2">
          {moves.map((move, index) => {
            const qty = Number(move.quantity) || 0;
            const isPositive = qty >= 0;
            return (
              <motion.div
                key={move.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border border-gray-100 shadow-2xs hover:shadow-xs transition-all duration-200 rounded-xl overflow-hidden font-open-sans bg-white">
                  <CardHeader className="pb-3 border-b border-gray-100 bg-[#F8FAFC]/50">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          move.move_type === "INCOMING" || move.move_type === "Receipt"
                            ? "bg-[#E8F8EE] text-[#1E8E3E]"
                            : move.move_type === "CONSUMPTION" || move.move_type === "Consumption"
                            ? "bg-[#E8F0FE] text-[#1A73E8]"
                            : move.move_type === "SCRAP" || move.move_type === "Scrap"
                            ? "bg-[#FCE8E6] text-[#D93025]"
                            : "bg-[#FEF7E6] text-[#B06000]"
                        }`}
                      >
                        {move.move_type || "Move"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(move.date_moved || move.created_at || "").toLocaleDateString() || move.date_moved}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-900 mt-2 line-clamp-1">
                      {move.product_details?.product_name || "Unknown Product"}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-3 text-xs space-y-2 font-open-sans">
                    <div className="flex justify-between">
                      <span className="text-gray-500">User:</span>
                      <span className="text-gray-700 font-medium truncate max-w-[150px]">
                        {move.moved_by_details?.first_name ? `${move.moved_by_details.first_name} ${move.moved_by_details.last_name || ''}` : "System Admin"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">In / Out Qty:</span>
                      <span className={`font-semibold ${isPositive ? "text-[#1E8E3E]" : "text-[#D93025]"}`}>
                        {isPositive ? `+${qty}` : qty}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Running Bal:</span>
                      <span className="font-medium text-gray-800">
                        {move.running_balance !== undefined && move.running_balance !== null ? move.running_balance.toLocaleString() : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Ref Document:</span>
                      <span className="text-[#3B7CED] font-medium">{move.reference || "N/A"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Unit Cost:</span>
                      <span className="text-gray-800">{move.unit_cost !== undefined ? `₦${move.unit_cost.toLocaleString()}` : "—"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Value:</span>
                      <span className="font-semibold text-gray-900">{move.total_value !== undefined ? `₦${move.total_value.toLocaleString()}` : "—"}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 mt-2">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Locations</span>
                      <span className="text-gray-700 font-medium line-clamp-1">
                        {move.source_location_details?.location_name || "Ext."} &rarr; {move.destination_location_details?.location_name || "Ext."}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-500 text-sm font-open-sans">
          No inventory ledger records found matching your query.
        </div>
      )}
    </div>
  );
}
