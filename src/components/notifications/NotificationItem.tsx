"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import type { AppNotification } from "@/types/notification";
import { useMarkAsReadMutation } from "@/api/notificationApi";
import { getModuleConfig, formatTimeAgo, resolveNotificationUrl } from "@/utils/notificationHelpers";

interface NotificationItemProps {
  notification: AppNotification;
  onItemClick?: () => void;
  compact?: boolean;
  selectionControl?: React.ReactNode;
}

export function NotificationItem({
  notification,
  onItemClick,
  compact = false,
  selectionControl,
}: NotificationItemProps) {
  const router = useRouter();
  const [markAsRead, { isLoading: isMarkingRead }] = useMarkAsReadMutation();
  const config = getModuleConfig(notification.module);
  const Icon = config.Icon;

  const handleCardClick = async () => {
    if (!notification.is_read) {
      markAsRead(notification.id).catch(() => {});
    }

    if (onItemClick) {
      onItemClick();
    }

    if (notification.action_url) {
      const resolvedUrl = resolveNotificationUrl(notification);
      router.push(resolvedUrl);
    }
  };

  const handleMarkAsReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-150 border shadow-2xs ${
        notification.is_read
          ? "bg-white border-gray-100 hover:bg-[#F6F9FC] hover:border-gray-200"
          : "bg-[#E8F0FE]/40 border-[#D0E0FB] hover:bg-[#E8F0FE]/70"
      }`}
    >
      {/* Optional Checkbox / Selection Control */}
      {selectionControl && (
        <div className="pt-2 pr-1" onClick={(e) => e.stopPropagation()}>
          {selectionControl}
        </div>
      )}

      {/* Module Icon Container */}
      <div
        className={`p-2.5 rounded-lg ${config.iconBg} ${config.iconColor} shrink-0 shadow-2xs flex items-center justify-center`}
      >
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}
            >
              {config.label}
            </span>
            {!notification.is_read && (
              <span className="inline-block w-2 h-2 rounded-full bg-[#3B7CED] animate-pulse" />
            )}
          </div>
          <span className="text-[11.5px] text-[#8898AA] shrink-0 font-medium">
            {formatTimeAgo(notification.created_at)}
          </span>
        </div>

        <h5
          className={`text-sm font-semibold truncate ${
            notification.is_read ? "text-[#32325D]" : "text-[#32325D] font-bold"
          }`}
        >
          {notification.title || "Notification"}
        </h5>

        <p
          className={`text-xs mt-1 leading-relaxed ${
            notification.is_read ? "text-[#8898AA]" : "text-[#525F7F]"
          } ${compact ? "line-clamp-2" : "line-clamp-3"}`}
        >
          {notification.message}
        </p>

        <div className="flex items-center justify-between gap-2 mt-2.5 pt-1">
          {notification.actor_name ? (
            <span className="text-[11px] text-[#8898AA]">
              By <span className="font-medium text-[#32325D]">{notification.actor_name}</span>
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5">
            {!notification.is_read && (
              <button
                type="button"
                onClick={handleMarkAsReadClick}
                disabled={isMarkingRead}
                title="Mark as read"
                className="p-1 rounded-md text-[#8898AA] hover:text-[#3B7CED] hover:bg-blue-50 transition-colors opacity-70 group-hover:opacity-100"
              >
                <Check size={14} />
              </button>
            )}

            {notification.action_url && (
              <span className="text-xs text-[#3B7CED] font-medium inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View</span>
                <ExternalLink size={12} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
