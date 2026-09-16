import React from "react";
import { motion } from "framer-motion";
import { SkeletonRow } from "./SkeletonRow";
import { SkeletonMobileItem } from "./SkeletonMobileItem";

interface ProductsTableSkeletonProps {
  itemCount?: number;
}

export function ProductsTableSkeleton({
  itemCount = 5,
}: ProductsTableSkeletonProps) {
  const skeletonItems = Array.from({ length: itemCount }, (_, index) => index);

  return (
    <motion.div
      className="px-6 bg-white h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <div className="mt-2 pt-4 bg-white rounded-lg overflow-hidden shadow-sm">
        {/* Desktop Header with shimmer effect */}
        <motion.div
          className="hidden md:grid grid-cols-[48px_1fr_1fr_120px] items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-md px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-200 relative overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        >
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: [-200, 400],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: 0.5,
            }}
            style={{
              width: "100px",
            }}
          />

          <div className="flex items-center relative z-10">
            <motion.div
              className="w-4 h-4 rounded"
              style={{
                background:
                  "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                backgroundSize: "200% 100%",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
          <div className="relative z-10">Product Name</div>
          <div className="relative z-10">Category</div>
          <div className="text-left relative z-10">Quantity</div>
        </motion.div>

        {/* Mobile List */}
        <motion.ul
          className="md:hidden divide-y divide-gray-100 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        >
          {skeletonItems.map((index) => (
            <SkeletonMobileItem key={`mobile-${index}`} index={index} />
          ))}
        </motion.ul>

        {/* Desktop Table */}
        <motion.div
          className="hidden md:block bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        >
          {skeletonItems.map((index) => (
            <SkeletonRow key={`desktop-${index}`} index={index} />
          ))}
        </motion.div>

        {/* Bottom loading indicator */}
        <motion.div
          className="flex justify-center py-4 bg-gray-50/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.6 }}
        >
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
