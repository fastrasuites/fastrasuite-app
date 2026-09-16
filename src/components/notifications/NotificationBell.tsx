"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useGetNotificationsQuery } from "@/api/notificationApi";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { NotificationSlideout } from "./NotificationSlideout";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000,
  });

  const { isConnected } = useNotificationContext();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Open notifications slideout (${unreadCount} unread)`}
        className="relative p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B7CED] transition-colors flex items-center justify-center text-gray-700 cursor-pointer"
      >
        <Bell size={22} className="text-gray-700" />

        {/* Badge count indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-[#E43D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Live WS connection pulsing dot indicator */}
        {isConnected && unreadCount === 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      {/* Slideout Panel from the Right */}
      <NotificationSlideout
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
