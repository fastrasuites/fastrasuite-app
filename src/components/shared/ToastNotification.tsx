"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface ToastNotificationProps {
  message: string;
  type: "success" | "error";
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export function ToastNotification({
  message,
  type,
  show,
  onClose,
  duration = 5000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const iconColor = type === "success" ? "text-green-600" : "text-red-600";
  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${bgColor}`}
          >
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
            <p className={`text-sm font-medium ${textColor} flex-1`}>
              {message}
            </p>
            <button
              onClick={onClose}
              className={`p-1 rounded-full hover:bg-black/10 transition-colors ${iconColor}`}
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
