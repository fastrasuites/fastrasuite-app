"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MenuIcon,
  DashboardIcon,
  AccountIcon,
  SalesIcon,
  FinanceIcon,
  InventoryIcon,
  HRIcon,
  LogisticsIcon,
  ContactIcon,
  AppIcon,
  SettingsIcon,
} from "./icons";
import { ClipboardList, Coins, ShieldCheck, Lock } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useGetSubscriptionStatusQuery } from "@/api/settings/subscriptionApi";

// Navigation items grouped into sections
const topItems = [{ id: "menu", icon: MenuIcon, label: "Menu", route: "/" }];

const middleItems = [
  // --- Functional Modules ---
  { id: "dashboard", icon: DashboardIcon, label: "Dashboard", route: "/" },
  {
    id: "account",
    icon: AccountIcon,
    label: "Invoice",
    route: "/invoice/approved-requests",
  },
  {
    id: "inventory",
    icon: InventoryIcon,
    label: "Inventory",
    route: "/inventory/operation",
  },
  {
    id: "project-request",
    icon: ClipboardList,
    label: "Project Request",
    route: "/project-request",
  },
  {
    id: "project-costing",
    icon: Coins,
    label: "Project Costing",
    route: "/project-costing",
  },
  // { id: "contact", icon: ContactIcon, label: "Contact", route: "/contact" },
  // --- Non-Functional Modules (Coming Soon) ---
  /*
  { id: "sales", icon: SalesIcon, label: "Sales", route: "/sales" },
  { id: "finance", icon: FinanceIcon, label: "Finance", route: "/finance" },
  { id: "hr", icon: HRIcon, label: "HR", route: "/hr" },
  {
    id: "logistics",
    icon: LogisticsIcon,
    label: "Logistics",
    route: "/logistics",
  */
];

const bottomItems = [
  {
    id: "audit-trail",
    icon: ShieldCheck,
    label: "Audit Trail",
    route: "/settings/audit-trail",
  },
  {
    id: "settings",
    icon: SettingsIcon,
    label: "Settings",
    route: "/settings/company/1",
  },
  // { id: "app", icon: AppIcon, label: "App", route: "/app" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  isExpanded = false,
  onToggleExpanded,
}) => {
  const pathname = usePathname();
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const router = useRouter();
  const { isAdmin } = usePermission();
  const { hasAccess } = useModulePermissions();
  const { data: subStatus } = useGetSubscriptionStatusQuery();
  const isExpired =
    subStatus?.status === "expired" ||
    (subStatus &&
      subStatus.is_access_granted === false &&
      subStatus.status !== "trialing" &&
      subStatus.status !== "past_due");

  const visibleMiddleItems = middleItems.filter((item) => {
    if (!isAdmin && ["sales", "finance", "hr", "logistics"].includes(item.id)) {
      return false;
    }

    if (!isAdmin) {
      switch (item.id) {
        case "dashboard":
          return true;
        case "account":
          return hasAccess("invoice");
        case "inventory":
          return hasAccess("inventory");
        case "project-request":
          return hasAccess("projectRequest");
        case "project-costing":
          return hasAccess("projectCosting");
        // case "contact":
        //   return hasAccess("contact");
        default:
          return true;
      }
    }

    return true;
  });

  const visibleBottomItems = bottomItems.filter((item) => {
    if (!isAdmin && item.id === "app") return false;
    if (!isAdmin && item.id === "settings") return hasAccess("settings");
    return true;
  });

  const handleNavigation = (item: {
    id: string;
    icon: any;
    label: string;
    route: string;
  }) => {
    if (onClose) onClose();
    if (isExpired && !item.route.startsWith("/settings")) {
      router.push("/settings/billing?expired=true");
      return;
    }
    router.push(item.route);
  };

  const isActiveItem = (item: { id: string; route: string }) => {
    if (item.route === "/") {
      return pathname === "/";
    }
    if (item.id === "account") {
      return pathname?.startsWith("/invoice");
    }
    if (item.id === "inventory") {
      return pathname?.startsWith("/inventory");
    }
    if (item.id === "audit-trail") {
      return pathname?.startsWith("/settings/audit-trail") || pathname?.startsWith("/audit-trail");
    }
    if (item.id === "settings") {
      return pathname?.startsWith("/settings") && !pathname?.startsWith("/settings/audit-trail");
    }
    return pathname?.startsWith(item.route);
  };

  const handleMouseEnter = (
    event: React.MouseEvent<HTMLButtonElement>,
    label: string,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      text: label,
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 h-screen bg-white shadow-xs border-r border-gray-100 flex flex-col py-4 z-40 overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 w-64 ${isExpanded ? "md:w-64" : "md:w-16"}`}
        aria-label="Main navigation"
      >
        {/* Top section: Menu Toggle */}
        <div
          className={`mb-8 flex items-center ${isExpanded ? "px-4 justify-start" : "justify-center px-4 md:px-0"}`}
        >
          <button
            onClick={onToggle}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg transition-colors duration-300 ease-in-out text-[#B8B8B8] hover:text-[#3B7CED] hover:bg-[#3B7CED]/5"
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>
          <button
            onClick={onToggleExpanded}
            className="hidden md:flex w-11 h-11 items-center justify-center rounded-lg transition-colors duration-300 ease-in-out text-[#B8B8B8] hover:text-[#3B7CED] hover:bg-[#3B7CED]/5"
            aria-label="Toggle sidebar expansion"
          >
            <MenuIcon />
          </button>
        </div>

        {/* Middle section: Main options */}
        <div
          className={`flex-1 flex flex-col space-y-2 ${isExpanded ? "px-4" : "px-4 md:px-0 md:items-center"}`}
        >
          {visibleMiddleItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = isActiveItem(item);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                onMouseEnter={(e) => {
                  if (!isExpanded)
                    handleMouseEnter(
                      e,
                      isExpired ? `${item.label} (Subscription Expired)` : item.label
                    );
                }}
                onMouseLeave={() => {
                  if (!isExpanded) handleMouseLeave();
                }}
                className={`w-full h-11 flex items-center rounded-lg transition-colors duration-300 ease-in-out
                ${isExpanded ? "px-3 gap-3" : "px-3 gap-3 md:w-11 md:px-0 md:justify-center md:gap-0"}
                ${isExpired ? "opacity-55 hover:opacity-80" : ""}
                ${isActive ? "text-[#3B7CED] bg-[#3B7CED]/10" : "text-[#B8B8B8] hover:text-[#3B7CED] hover:bg-[#3B7CED]/5"}
              `}
                aria-label={item.label}
              >
                <div
                  className={`flex items-center justify-center ${isExpanded ? "w-5" : "w-5 md:w-auto"}`}
                >
                  <IconComponent color={isActive ? "#3B7CED" : undefined} />
                </div>
                <span
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis ${!isExpanded ? "md:hidden" : ""} ${isActive ? "text-[#3B7CED]" : "text-gray-600"}`}
                >
                  {item.label}
                </span>
                {isExpired && isExpanded && (
                  <Lock className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom section: App and Settings */}
        <div
          className={`mt-auto pb-4 pt-8 flex flex-col space-y-2 ${isExpanded ? "px-4" : "px-4 md:px-0 md:items-center"}`}
        >
          {visibleBottomItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = isActiveItem(item);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                onMouseEnter={(e) => {
                  if (!isExpanded) handleMouseEnter(e, item.label);
                }}
                onMouseLeave={() => {
                  if (!isExpanded) handleMouseLeave();
                }}
                className={`w-full h-11 flex items-center rounded-lg transition-colors duration-300 ease-in-out
                ${isExpanded ? "px-3 gap-3" : "px-3 gap-3 md:w-11 md:px-0 md:justify-center md:gap-0"}
                ${isActive ? "text-[#3B7CED] bg-[#3B7CED]/10" : "text-[#B8B8B8] hover:text-[#3B7CED] hover:bg-[#3B7CED]/5"}
              `}
                aria-label={item.label}
              >
                <div
                  className={`flex items-center justify-center ${isExpanded ? "w-5" : "w-5 md:w-auto"}`}
                >
                  <IconComponent color={isActive ? "#3B7CED" : undefined} />
                </div>
                <span
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis ${!isExpanded ? "md:hidden" : ""} ${isActive ? "text-[#3B7CED]" : "text-gray-600"}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Custom Tooltip */}
      {tooltip && (
        <div
          className="fixed z-100 px-3 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 20,
            transform: "translateY(-50%)",
          }}
        >
          {tooltip.text}
          <div
            className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"
            style={{
              left: "-8px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          ></div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
