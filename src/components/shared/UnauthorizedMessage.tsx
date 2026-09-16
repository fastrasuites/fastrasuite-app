"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface UnauthorizedMessageProps {
  fullScreen?: boolean;
}

export const UnauthorizedMessage = ({
  fullScreen = false,
}: UnauthorizedMessageProps) => {
  const containerVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        ease: "easeOut",
        duration: 0.4,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className={`flex items-center justify-center p-6 ${fullScreen ? "min-h-screen bg-white" : "h-full py-20"}`}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 bg-[#FEECEC] text-[#F04438] rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div variants={itemVariants} className="space-y-3 mb-8">
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">
            Access Denied
          </h1>
          <p className="text-[#7A8A98] text-base leading-relaxed">
            You don't have the required permissions to access this page. If you
            believe this is an error, please contact your administrator.
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.div variants={itemVariants}>
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#3B7CED] text-white font-medium rounded-xs hover:bg-[#2F6DD5] transition-all active:scale-95 shadow-sm">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </button>
          </Link>
        </motion.div>

        {/* Status Code (Subtle) */}
        <motion.p
          variants={itemVariants}
          className="mt-12 text-[10px] text-[#A9B3BC] uppercase tracking-widest font-medium"
        >
          Error 403 • Unauthorized access
        </motion.p>
      </motion.div>
    </div>
  );
};
