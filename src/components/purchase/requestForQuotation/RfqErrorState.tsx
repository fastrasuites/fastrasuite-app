"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function RfqErrorState() {
  const router = useRouter();

  return (
    <motion.div
      className="h-full text-gray-900 font-sans antialiased flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="text-center">
        <p className="text-gray-600 mb-4">Purchase request not found.</p>
        <Button onClick={() => router.push("/purchase/purchase_requests")}>
          Back to Purchase Requests
        </Button>
      </div>
    </motion.div>
  );
}
