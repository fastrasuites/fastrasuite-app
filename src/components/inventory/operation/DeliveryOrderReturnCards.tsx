import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Calendar, Package } from "lucide-react";
import type { DeliveryOrderReturn } from "@/types/deliveryOrderReturn";
import { cn } from "@/lib/utils";

interface DeliveryOrderReturnCardsProps {
  deliveryOrderReturns: DeliveryOrderReturn[];
  query?: string;
}

interface DeliveryOrderReturnCardProps {
  deliveryOrderReturn: DeliveryOrderReturn;
  index: number;
  query?: string;
}

function DeliveryOrderReturnCard({
  deliveryOrderReturn,
  index,
  query = "",
}: DeliveryOrderReturnCardProps) {
  const router = useRouter();

  // Function to highlight search matches
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-800 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleCardClick = () => {
    router.push(
      `/inventory/operation/delivery_order_return/${
        index + 1 || deliveryOrderReturn.unique_record_id
      }`
    );
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <Truck size={16} className="text-[#3B7CED]" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {highlightText(deliveryOrderReturn.unique_record_id, query)}
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Source Location */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={12} />
                Source:
              </span>
              <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                {highlightText(deliveryOrderReturn.source_location, query)}
              </span>
            </div>

            {/* Return Warehouse */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={12} />
                Warehouse:
              </span>
              <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                {highlightText(
                  deliveryOrderReturn.return_warehouse_location_details
                    ?.location_name || "N/A",
                  query
                )}
              </span>
            </div>

            {/* Items Returned */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Package size={12} />
                Items:
              </span>
              <span className="text-sm font-medium text-gray-900">
                {deliveryOrderReturn.delivery_order_return_items.length}
              </span>
            </div>

            {/* Date of Return */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={10} />
                Return Date:
              </span>
              <span className="text-xs text-gray-600">
                {new Date(
                  deliveryOrderReturn.date_of_return
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DeliveryOrderReturnCards({
  deliveryOrderReturns,
  query = "",
}: DeliveryOrderReturnCardsProps) {
  return (
    <motion.div
      className="bg-white h-full rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Delivery Order Return Cards Grid */}
      {deliveryOrderReturns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6">
          {deliveryOrderReturns.map((deliveryOrderReturn, index) => (
            <DeliveryOrderReturnCard
              key={deliveryOrderReturn.unique_record_id}
              deliveryOrderReturn={deliveryOrderReturn}
              index={index}
              query={query}
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
              <Truck className="w-full h-full" />
            </div>
            <p className="text-gray-400 text-sm">
              No delivery order returns found
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
