import React from "react";
import { motion } from "framer-motion";

export function PurchaseRequestLoadingState() {
  return (
    <motion.div
      className="h-full text-gray-900 font-sans antialiased flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading purchase request...</p>
      </div>
    </motion.div>
  );
}
