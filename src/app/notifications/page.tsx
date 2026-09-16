"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  Inbox,
  Clock,
  ClipboardList,
  ShoppingCart,
  Package,
  Receipt,
  Briefcase,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/api/notificationApi";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { Button } from "@/components/ui/button";

const MODULE_FILTERS = [
  { id: "all", label: "All Modules" },
  { id: "project_request", label: "Project Request", icon: ClipboardList },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "invoice", label: "Invoice", icon: Receipt },
  { id: "project_costing", label: "Project Costing", icon: Briefcase },
];

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const {
    data: notifications = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetNotificationsQuery();

  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const { isConnected, soundEnabled, setSoundEnabled } = useNotificationContext();

  // Metrics
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const projectReqCount = useMemo(
    () => notifications.filter((n) => (n.module || "").includes("project_request")).length,
    [notifications]
  );

  const purchaseCount = useMemo(
    () => notifications.filter((n) => (n.module || "").includes("purchase")).length,
    [notifications]
  );

  const inventoryCount = useMemo(
    () => notifications.filter((n) => (n.module || "").includes("inventory")).length,
    [notifications]
  );

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Status filter
      if (statusFilter === "unread" && item.is_read) return false;
      if (statusFilter === "read" && !item.is_read) return false;

      // Module filter
      if (selectedModule !== "all") {
        const mod = (item.module || "").toLowerCase();
        if (!mod.includes(selectedModule.toLowerCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesMessage = item.message?.toLowerCase().includes(query);
        const matchesActor = item.actor_name?.toLowerCase().includes(query);
        const matchesModule = item.module_display?.toLowerCase().includes(query);
        const matchesId = String(item.object_id || "").includes(query);
        if (!matchesTitle && !matchesMessage && !matchesActor && !matchesModule && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, statusFilter, selectedModule, searchQuery]);

  // Bulk actions
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMarkSelectedAsRead = async () => {
    const unreadSelected = filteredNotifications
      .filter((n) => selectedIds.includes(n.id) && !n.is_read)
      .map((n) => n.id);

    for (const id of unreadSelected) {
      await markAsRead(id).unwrap().catch(() => {});
    }
    setSelectedIds([]);
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Notifications" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
        {/* Breadcrumb row */}
        <Breadcrumbs
          items={breadcrumbs}
          action={
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isConnected
                    ? "bg-[#E2F2E9] text-[#2BA24D]"
                    : "bg-[#FFF2CC] text-[#D97706]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-[#2BA24D] animate-pulse" : "bg-[#D97706]"
                  }`}
                />
                <span>{isConnected ? "Live Connected" : "Connecting..."}</span>
              </div>
            </div>
          }
        />

        {/* Page Top Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#32325D]">
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#FCE8E6] text-[#E43D2B] rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#8898AA] mt-1">
              Real-time activity notifications and alerts across all organizational modules.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg border border-gray-200 bg-white text-[#8898AA] hover:text-[#32325D] hover:bg-gray-50 transition-colors shadow-2xs"
              title={soundEnabled ? "Mute notification sounds" : "Unmute notification sounds"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg border border-gray-200 bg-white text-[#8898AA] hover:text-[#32325D] hover:bg-gray-50 transition-colors shadow-2xs"
              title="Refresh notifications"
            >
              <RefreshCw size={16} className={isFetching ? "animate-spin text-[#3B7CED]" : ""} />
            </button>

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllAsRead()}
                disabled={isMarkingAll}
                className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all gap-1.5"
              >
                <CheckCheck size={16} />
                <span>Mark all read</span>
              </Button>
            )}
          </div>
        </div>

        {/* Summary Metrics Cards (Inventory Tile Style) */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-2xs overflow-hidden mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-5">
            {[
              {
                title: "Total Alerts",
                count: notifications.length,
                icon: Inbox,
                color: "#3B7CED",
                filter: "all",
              },
              {
                title: "Unread Alerts",
                count: unreadCount,
                icon: Clock,
                color: "#E43D2B",
                filter: "unread",
              },
              {
                title: "Project Requests",
                count: projectReqCount,
                icon: ClipboardList,
                color: "#8E44AD", // Purple
                filter: "project_request",
              },
              {
                title: "Purchases",
                count: purchaseCount,
                icon: ShoppingCart,
                color: "#F0B401", // Yellow/Amber
                filter: "purchase",
              },
              {
                title: "Inventory",
                count: inventoryCount,
                icon: Package,
                color: "#27AE60", // Green
                filter: "inventory",
              },
            ].map((mod, idx, arr) => (
              <button
                key={mod.title}
                type="button"
                onClick={() => {
                  if (mod.filter === "unread" || mod.filter === "all") {
                    setStatusFilter(mod.filter as any);
                    setSelectedModule("all");
                  } else {
                    setSelectedModule(mod.filter);
                    setStatusFilter("all");
                  }
                }}
                className={`p-5 cursor-pointer hover:bg-gray-50 transition-colors group flex flex-col text-left ${
                  idx < arr.length - 1
                    ? "border-b sm:border-b-0 sm:border-r border-gray-100"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <mod.icon
                    className="w-[18px] h-[18px] shrink-0"
                    style={{ color: mod.color }}
                  />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors leading-tight">
                    {mod.title}
                  </span>
                </div>
                <div
                  className="text-[2rem] font-bold"
                  style={{ color: mod.color }}
                >
                  {mod.count}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
            {/* Search Input */}
            <div className="relative flex-1 w-full max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-[#32325D] placeholder:text-[#8898AA] focus:outline-none focus:ring-1 focus:ring-[#3B7CED] focus:border-[#3B7CED] shadow-2xs transition-all"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-[#E8F0FE] text-[#1A73E8] font-semibold"
                    : "bg-[#E9ECEF] text-[#8898AA] font-normal hover:bg-gray-200"
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("unread")}
                className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 cursor-pointer ${
                  statusFilter === "unread"
                    ? "bg-[#E8F0FE] text-[#1A73E8] font-semibold"
                    : "bg-[#E9ECEF] text-[#8898AA] font-normal hover:bg-gray-200"
                }`}
              >
                Unread ({unreadCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("read")}
                className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 cursor-pointer ${
                  statusFilter === "read"
                    ? "bg-[#E8F0FE] text-[#1A73E8] font-semibold"
                    : "bg-[#E9ECEF] text-[#8898AA] font-normal hover:bg-gray-200"
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>
          </div>

          {/* Module Category Pills */}
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap bg-[#F6F9FC]">
            {MODULE_FILTERS.map((mod) => {
              const isSelected = selectedModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setSelectedModule(mod.id)}
                  className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#E8F0FE] text-[#1A73E8] font-semibold"
                      : "bg-white text-[#8898AA] font-normal hover:bg-gray-100 border border-gray-200/60"
                  }`}
                >
                  {mod.icon && <mod.icon size={13} />}
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-[#E8F0FE] border border-[#D0E0FB] rounded-lg flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1A73E8]">
              {selectedIds.length} notification{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleMarkSelectedAsRead}
                className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-8 px-3 rounded-md text-xs font-medium shadow-2xs"
              >
                Mark Selected as Read
              </Button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-xs text-[#8898AA] hover:text-[#32325D]"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Notification List Body */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-20 bg-white rounded-lg border border-gray-100 shadow-2xs flex flex-col items-center justify-center text-[#8898AA] gap-3">
              <Loader2 size={32} className="animate-spin text-[#3B7CED]" />
              <p className="text-sm font-medium">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-20 bg-white rounded-lg border border-gray-100 shadow-2xs flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-semibold text-[#32325D]">No notifications found</h3>
              <p className="text-xs sm:text-sm text-[#8898AA] max-w-sm mt-1">
                {searchQuery || selectedModule !== "all" || statusFilter !== "all"
                  ? "No notifications matching your search or active filter."
                  : "You're all caught up! New alerts and notifications will appear here in real-time."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact={false}
                selectionControl={
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => handleToggleSelect(notification.id)}
                    className="w-4 h-4 rounded text-[#3B7CED] focus:ring-[#3B7CED] border-gray-300 cursor-pointer"
                    aria-label={`Select notification ${notification.title}`}
                  />
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
