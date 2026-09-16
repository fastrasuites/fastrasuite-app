import React from "react";
import { motion } from "framer-motion";

interface SkeletonMobileItemProps {
  index?: number;
}

export function SkeletonMobileItem({ index = 0 }: SkeletonMobileItemProps) {
  return (
    <motion.li
      className="p-4 bg-white hover:bg-gray-50/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        delay: index * 0.08,
      }}
      whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className="w-4 h-4 rounded"
          style={{
            background:
              "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <motion.div
                className="h-4 rounded mb-2"
                style={{
                  background:
                    "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.1,
                }}
              />
              <motion.div
                className="h-3 rounded"
                style={{
                  background:
                    "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.2,
                }}
              />
            </div>
            <div className="flex flex-col items-end space-y-1">
              <motion.div
                className="h-4 rounded"
                style={{
                  background:
                    "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.3,
                }}
              />
              <motion.div
                className="h-3 rounded"
                style={{
                  background:
                    "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 1.7,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.4,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
