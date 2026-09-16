import React from "react";
import { motion } from "framer-motion";

interface SkeletonRowProps {
  index?: number;
}

/**
 * SkeletonRow
 * - Visible shimmer using CSS gradients
 * - Accessible: role="status" + visually-hidden text
 * - Staggered entrance via `index` prop
 */
export function SkeletonRow({ index = 0 }: SkeletonRowProps) {
  // shared shimmer animation (backgroundPosition)
  const shimmerAnim = {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
  };

  const shimmerTransition = (delay = 0, duration = 1.6) => ({
    duration,
    ease: "linear" as const,
    repeat: Infinity,
    delay,
  });

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="grid grid-cols-[48px_1fr_1fr_120px] items-center text-sm border-b border-gray-200 bg-white"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1],
        delay: index * 0.06,
      }}
      whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
    >
      {/* visually hidden label for screen-readers */}
      <span className="sr-only">Loading…</span>

      {/* Checkbox Cell */}
      <div className="flex items-center px-4 py-4 h-16">
        <motion.div
          aria-hidden="true"
          className="w-4 h-4 rounded"
          style={{
            background:
              "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={shimmerAnim}
          transition={shimmerTransition(0, 1.4)}
        />
      </div>

      {/* Product Name Cell */}
      <div className="px-4 py-4 h-16 flex items-center">
        <motion.div
          aria-hidden="true"
          className="h-4 rounded w-24"
          style={{
            background:
              "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={shimmerAnim}
          transition={shimmerTransition(0.08, 1.8)}
        />
      </div>

      {/* Category Cell */}
      <div className="px-4 py-4 h-16 flex items-center">
        <motion.div
          aria-hidden="true"
          className="h-4 rounded w-24"
          style={{
            background:
              "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={shimmerAnim}
          transition={shimmerTransition(0.16, 1.6)}
        />
      </div>

      {/* Quantity Cell */}
      <div className="px-4 py-4 h-16 flex items-center">
        <motion.div
          aria-hidden="true"
          className="h-4 rounded w-12"
          style={{
            background:
              "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={shimmerAnim}
          transition={shimmerTransition(0.24, 1.4)}
        />
      </div>
    </motion.div>
  );
}

export default SkeletonRow;
