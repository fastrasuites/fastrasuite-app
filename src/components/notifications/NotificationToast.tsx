"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AppNotification } from "@/types/notification";
import { getModuleConfig, formatTimeAgo, resolveNotificationUrl } from "@/utils/notificationHelpers";

interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onNavigate?: (url: string) => void;
  duration?: number;
}

export function NotificationToast({
  notification,
  onClose,
  onNavigate,
  duration = 6000,
}: NotificationToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (notification && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [notification, duration, onClose]);

  if (!notification) return null;

  const config = getModuleConfig(notification.module);
  const Icon = config.Icon;

  const handleClick = () => {
    if (notification.action_url) {
      const resolvedUrl = resolveNotificationUrl(notification);
      if (onNavigate) {
        onNavigate(resolvedUrl);
      } else {
        router.push(resolvedUrl);
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-5 right-5 z-50 max-w-sm w-full shadow-xl rounded-lg bg-white border border-gray-100 overflow-hidden font-sans"
        >
          <div className="p-4 flex items-start gap-3.5">
            <div
              className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor} shrink-0 mt-0.5 shadow-2xs flex items-center justify-center`}
            >
              <Icon size={18} />
            </div>

            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={handleClick}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}
                >
                  {config.label}
                </span>
                <span className="text-[11.5px] text-[#8898AA]">
                  {formatTimeAgo(notification.created_at)}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-[#32325D] line-clamp-1">
                {notification.title || "New Notification"}
              </h4>

              <p className="text-xs text-[#8898AA] line-clamp-2 mt-0.5 leading-relaxed">
                {notification.message}
              </p>

              {notification.actor_name && (
                <p className="text-[11px] text-[#8898AA] mt-1">
                  By <span className="font-medium text-[#32325D]">{notification.actor_name}</span>
                </p>
              )}

              {notification.action_url && (
                <div className="flex items-center gap-1 text-xs font-semibold text-[#3B7CED] mt-2 group">
                  <span>View Details</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-md text-[#8898AA] hover:text-[#32325D] hover:bg-gray-100 transition-colors shrink-0 -mr-1 -mt-1"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Progress bar */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className="h-0.5 bg-[#3B7CED]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
