"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  ClipboardPenLine,
  Clipboard,
  ChevronDown,
  Zap,
  Settings,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Lock,
  X,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useGetSubscriptionStatusQuery } from "@/api/settings/subscriptionApi";

// Custom receipt/invoice icon matching design
const InvoiceIcon: React.FC<{ className?: string; color?: string; size?: number }> = ({
  className,
  color = "currentColor",
  size = 20,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 3a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 3v18l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2.5-1.5L4 21V3z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="13" y2="15" />
  </svg>
);

// Custom warehouse/inventory building icon matching design
const InventoryWarehouseIcon: React.FC<{ className?: string; color?: string; size?: number }> = ({
  className,
  color = "currentColor",
  size = 20,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="7" y1="15" x2="17" y2="15" />
    <line x1="7" y1="18" x2="17" y2="18" />
  </svg>
);

interface NavSubItem {
  id: string;
  label: string;
  route: string;
  entitlement?: string;
}

interface NavSectionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; color?: string; size?: number }>;
  route?: string;
  moduleKey?: string;
  children?: NavSubItem[];
}

const navSections: NavSectionItem[] = [
  {
    id: "project-costing",
    label: "Project Costing",
    icon: Clipboard,
    route: "/project-costing",
    moduleKey: "projectCosting",
  },
  {
    id: "project-request",
    label: "Project Request",
    icon: ClipboardPenLine,
    route: "/project-request",
    moduleKey: "projectRequest",
    children: [
      {
        id: "make-a-request",
        label: "Make a Request",
        route: "/project-request/make-request",
        entitlement: "create",
      },
      {
        id: "approved-request",
        label: "Approved Request",
        route: "/project-request/approve",
        entitlement: "approve",
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: InventoryWarehouseIcon,
    route: "/inventory/operation",
    moduleKey: "inventory",
    children: [
      {
        id: "incoming-product",
        label: "Incoming Product",
        route: "/inventory/operation/incoming_product",
        entitlement: "view_incoming_product",
      },
      {
        id: "material-consumption",
        label: "Material Consumption",
        route: "/inventory/operation/material-consumption",
        entitlement: "view_material_consumption",
      },
      {
        id: "stock-on-hand",
        label: "Stock on Hand",
        route: "/inventory/stock-on-hand",
        entitlement: "view_stock_on_hand",
      },
      {
        id: "stock-adjustment",
        label: "Stock Adjustment",
        route: "/inventory/stocks/adjustment",
        entitlement: "view_stock_adjustment",
      },
      {
        id: "scrap",
        label: "Scrap",
        route: "/inventory/operation/scrap",
        entitlement: "view_scrap",
      },
    ],
  },
  {
    id: "invoice",
    label: "Invoices",
    icon: InvoiceIcon,
    route: "/invoice/approved-requests",
    moduleKey: "invoice",
    children: [
      {
        id: "approved-request",
        label: "Approved request",
        route: "/invoice/approved-requests",
        entitlement: "view_approved_requests",
      },
      {
        id: "purchase-order",
        label: "Purchase Order",
        route: "/invoice/purchase-order",
        entitlement: "view_purchase_orders",
      },
      {
        id: "payment-queue",
        label: "Payment Queue",
        route: "/invoice/payment-queue",
        entitlement: "view_accounts_payable_queue",
      },
      {
        id: "charts-of-account",
        label: "Charts of Account",
        route: "/invoice/chart-of-account",
        entitlement: "view_cash_flow",
      },
      {
        id: "account-ledger",
        label: "Account Ledger",
        route: "/invoice/account-ledger",
        entitlement: "view_cash_flow",
      },
    ],
  },
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
  isExpanded = true,
  onToggleExpanded,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, can } = usePermission();
  const { hasAccess, canDo } = useModulePermissions();
  const { data: subStatus } = useGetSubscriptionStatusQuery();

  const isExpired =
    subStatus?.status === "expired" ||
    (subStatus &&
      subStatus.is_access_granted === false &&
      subStatus.status !== "trialing" &&
      subStatus.status !== "past_due");

  // Accordion state: default all sections open as depicted in design
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    invoice: true,
    inventory: true,
    "project-request": true,
  });

  // Tooltip state for collapsed icon-only mode
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Flyout menu state for collapsed mode
  const [flyout, setFlyout] = useState<{
    section: NavSectionItem;
    top: number;
    left: number;
  } | null>(null);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-expand relevant section if user navigates to a child route
  useEffect(() => {
    if (pathname.startsWith("/invoice")) {
      setOpenSections((prev) => ({ ...prev, invoice: true }));
    } else if (pathname.startsWith("/inventory")) {
      setOpenSections((prev) => ({ ...prev, inventory: true }));
    } else if (pathname.startsWith("/project-request")) {
      setOpenSections((prev) => ({ ...prev, "project-request": true }));
    }
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleNavigate = (route: string) => {
    setFlyout(null);
    if (onClose) onClose();
    if (isExpired && !route.startsWith("/settings")) {
      router.push("/settings/billing?expired=true");
      return;
    }
    router.push(route);
  };

  const isDashboardActive = pathname === "/";

  const isSubItemActive = (route: string) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  const isSectionActive = (section: NavSectionItem) => {
    if (section.id === "invoice") return pathname.startsWith("/invoice");
    if (section.id === "inventory") return pathname.startsWith("/inventory");
    if (section.id === "project-request") return pathname.startsWith("/project-request");
    if (section.id === "project-costing") return pathname.startsWith("/project-costing");
    return false;
  };

  const isSettingsActive =
    pathname.startsWith("/settings") && !pathname.startsWith("/settings/billing");
  const isUpgradePlanActive = pathname.startsWith("/settings/billing");

  // Granular entitlement check for sub-items
  const isChildVisible = (section: NavSectionItem, child: NavSubItem): boolean => {
    if (isAdmin) return true;
    if (!child.entitlement) return true;
    if (!section.moduleKey) return true;

    // Check both through usePermission can() and useModulePermissions canDo()
    return (
      can({
        module: section.moduleKey,
        entitlement: child.entitlement,
        action: child.entitlement,
      }) ||
      canDo(section.moduleKey, child.entitlement)
    );
  };

  // Filter sections by permissions and subscription rules (Hidden Not Disabled)
  const visibleSections = navSections
    .filter((section) => {
      if (isAdmin) return true;
      if (!section.moduleKey) return true;
      return hasAccess(section.moduleKey);
    })
    .map((section) => {
      if (!section.children) return section;
      const visibleChildren = section.children.filter((child) =>
        isChildVisible(section, child)
      );
      return {
        ...section,
        children: visibleChildren,
      };
    })
    .filter((section) => {
      if (isAdmin) return true;
      // If a section has children originally, but none are visible to this user, hide section
      const original = navSections.find((s) => s.id === section.id);
      if (
        original?.children &&
        original.children.length > 0 &&
        section.children?.length === 0
      ) {
        return false;
      }
      return true;
    });

  const canAccessSettings = isAdmin || hasAccess("settings");

  // Collapsed Mode Hover Handlers
  const handleCollapsedMouseEnter = (
    event: React.MouseEvent<HTMLElement>,
    section: NavSectionItem
  ) => {
    if (isExpanded) return;
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current);
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (section.children && section.children.length > 0) {
      setTooltip(null);
      setFlyout({
        section,
        top: Math.max(16, rect.top - 8),
        left: rect.right + 8,
      });
    } else {
      setFlyout(null);
      setTooltip({
        text: isExpired ? `${section.label} (Subscription Expired)` : section.label,
        x: rect.right + 10,
        y: rect.top + rect.height / 2,
      });
    }
  };

  const handleCollapsedMouseLeave = () => {
    if (isExpanded) return;
    flyoutTimeoutRef.current = setTimeout(() => {
      setFlyout(null);
      setTooltip(null);
    }, 150);
  };

  const showSimpleTooltip = (
    event: React.MouseEvent<HTMLElement>,
    label: string
  ) => {
    if (isExpanded) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setFlyout(null);
    setTooltip({
      text: label,
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    });
  };

  const hideSimpleTooltip = () => {
    setTooltip(null);
  };

  // On mobile devices (when opened as drawer), always show expanded full view
  const effectiveExpanded = isExpanded || isOpen;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col py-6 z-50 overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out select-none
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        md:translate-x-0 w-72 max-w-[85vw] ${isExpanded ? "md:w-64 px-4.5" : "md:w-16 px-4.5 md:px-2"}`}
        aria-label="Main navigation"
      >
        {/* Mobile Header with Brand & Close Button */}
        <div className="flex md:hidden items-center justify-between px-1 pb-4 mb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3B7CED] flex items-center justify-center text-white font-bold text-base shadow-xs">
              F
            </div>
            <span className="font-bold text-gray-900 text-base">Fastra Suite</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        {/* Navigation Content */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Dashboard */}
          <div>
            <button
              onClick={() => handleNavigate("/")}
              onMouseEnter={(e) => showSimpleTooltip(e, "Dashboard")}
              onMouseLeave={hideSimpleTooltip}
              className={`w-full flex items-center py-2 px-2.5 rounded-lg transition-colors group cursor-pointer ${
                !effectiveExpanded ? "justify-center" : ""
              } ${
                isDashboardActive
                  ? "text-[#2563EB]"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              aria-label="Dashboard"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <LayoutGrid
                  size={20}
                  color={isDashboardActive ? "#2563EB" : "#9CA3AF"}
                  className="transition-colors group-hover:text-gray-700"
                />
              </div>
              {effectiveExpanded && (
                <span
                  className={`text-[15px] font-medium ml-3 whitespace-nowrap overflow-hidden text-ellipsis ${
                    isDashboardActive
                      ? "text-[#2563EB]"
                      : "text-gray-400 group-hover:text-gray-700"
                  }`}
                >
                  Dashboard
                </span>
              )}
            </button>
          </div>

          {/* Collapsible Sections & Direct Items */}
          {visibleSections.map((section) => {
            const IconComp = section.icon;
            const hasChildren = section.children && section.children.length > 0;
            const isSectionOpen = !!openSections[section.id];
            const active = isSectionActive(section);

            // Collapsed (icon-only mode)
            if (!effectiveExpanded) {
              return (
                <div
                  key={section.id}
                  className="relative flex justify-center"
                  onMouseEnter={(e) => handleCollapsedMouseEnter(e, section)}
                  onMouseLeave={handleCollapsedMouseLeave}
                >
                  <button
                    onClick={() => {
                      if (section.route) {
                        handleNavigate(section.route);
                      } else if (section.children?.[0]?.route) {
                        handleNavigate(section.children[0].route);
                      }
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors group cursor-pointer ${
                      isExpired ? "opacity-60" : ""
                    } ${
                      active
                        ? "text-[#2563EB] bg-blue-50/60"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-50/80"
                    }`}
                    aria-label={section.label}
                  >
                    <IconComp
                      size={20}
                      color={active ? "#2563EB" : "#9CA3AF"}
                      className="transition-colors"
                    />
                  </button>
                </div>
              );
            }

            // Expanded Mode
            return (
              <div key={section.id} className="flex flex-col">
                {/* Section Header Row */}
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(section.id);
                    } else if (section.route) {
                      handleNavigate(section.route);
                    }
                  }}
                  className={`w-full flex items-center py-2 px-2.5 rounded-lg transition-colors group cursor-pointer ${
                    isExpired ? "opacity-60" : ""
                  } ${
                    active
                      ? "text-gray-700 font-medium"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                  aria-label={section.label}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <IconComp
                      size={20}
                      color={active ? "#374151" : "#9CA3AF"}
                      className="transition-colors group-hover:text-gray-700"
                    />
                  </div>
                  <span
                    className={`text-[15px] font-medium ml-3 transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                      active
                        ? "text-gray-700"
                        : "text-gray-400 group-hover:text-gray-700"
                    }`}
                  >
                    {section.label}
                  </span>

                  {isExpired && (
                    <Lock className="w-3.5 h-3.5 text-gray-400 ml-auto shrink-0" />
                  )}

                  {hasChildren && !isExpired && (
                    <span className="ml-auto flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={`transition-transform duration-200 ${
                          isSectionOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </span>
                  )}
                </button>

                {/* Sub-items Tree with Animated Accordion */}
                <AnimatePresence initial={false}>
                  {hasChildren && isSectionOpen && (
                    <motion.div
                      key={`content-${section.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[19px] pl-3.5 border-l border-gray-200 flex flex-col space-y-1.5 my-2">
                        {section.children?.map((child) => {
                          const childActive = isSubItemActive(child.route);
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleNavigate(child.route)}
                              className={`relative text-left text-[13.5px] py-1.5 px-2.5 rounded-md transition-all duration-150 leading-tight cursor-pointer ${
                                childActive
                                  ? "text-[#2563EB] bg-blue-50/70 font-medium"
                                  : "text-gray-400 hover:text-gray-800 hover:bg-gray-50/70 font-normal"
                              }`}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom section: Upgrade plan, Settings, and Sidebar collapse toggle */}
        <div className="mt-auto pt-6 flex flex-col space-y-4">
          {/* Upgrade plan */}
          <button
            onClick={() => handleNavigate("/settings/billing")}
            onMouseEnter={(e) => showSimpleTooltip(e, "Upgrade plan")}
            onMouseLeave={hideSimpleTooltip}
            className={`w-full flex items-center py-2 px-2.5 rounded-lg transition-colors group cursor-pointer ${
              !effectiveExpanded ? "justify-center" : ""
            } ${
              isUpgradePlanActive
                ? "text-[#2563EB]"
                : "text-gray-400 hover:text-gray-700"
            }`}
            aria-label="Upgrade plan"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Zap
                size={20}
                color={isUpgradePlanActive ? "#2563EB" : "#9CA3AF"}
                className="transition-colors group-hover:text-gray-700"
              />
            </div>
            {effectiveExpanded && (
              <span className="text-[15px] font-medium ml-3 text-gray-400 group-hover:text-gray-700 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                Upgrade plan
              </span>
            )}
          </button>

          {/* Settings */}
          {canAccessSettings && (
            <button
              onClick={() => handleNavigate("/settings/company/1")}
              onMouseEnter={(e) => showSimpleTooltip(e, "Settings")}
              onMouseLeave={hideSimpleTooltip}
              className={`w-full flex items-center py-2 px-2.5 rounded-lg transition-colors group cursor-pointer ${
                !effectiveExpanded ? "justify-center" : ""
              } ${
                isSettingsActive
                  ? "text-[#2563EB]"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              aria-label="Settings"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Settings
                  size={20}
                  color={isSettingsActive ? "#2563EB" : "#9CA3AF"}
                  className="transition-colors group-hover:text-gray-700"
                />
              </div>
              {effectiveExpanded && (
                <span className="text-[15px] font-medium ml-3 text-gray-400 group-hover:text-gray-700 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                  Settings
                </span>
              )}
            </button>
          )}

          {/* Collapse/Expand Toggle Button at bottom */}
          <div className="pt-2 hidden md:block">
            <button
              onClick={onToggleExpanded}
              onMouseEnter={(e) =>
                showSimpleTooltip(
                  e,
                  isExpanded ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"
                )
              }
              onMouseLeave={hideSimpleTooltip}
              className={`flex items-center py-2 px-2.5 rounded-lg transition-colors text-gray-400 hover:text-gray-700 cursor-pointer ${
                !isExpanded ? "w-full justify-center" : ""
              }`}
              aria-label={isExpanded ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isExpanded ? (
                  <ArrowLeftFromLine size={20} strokeWidth={2} />
                ) : (
                  <ArrowRightFromLine size={20} strokeWidth={2} />
                )}
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Collapsed Mode Flyout Popover Menu */}
      {!isExpanded && flyout && (
        <div
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-xl py-2 px-1 w-52 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: flyout.top,
            left: flyout.left,
          }}
          onMouseEnter={() => {
            if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
          }}
          onMouseLeave={handleCollapsedMouseLeave}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
            {flyout.section.label}
          </div>
          <div className="flex flex-col space-y-0.5">
            {flyout.section.children?.map((child) => {
              const childActive = isSubItemActive(child.route);
              return (
                <button
                  key={`flyout-${child.id}`}
                  onClick={() => handleNavigate(child.route)}
                  className={`w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    childActive
                      ? "text-[#2563EB] bg-blue-50/70 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {child.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Simple Tooltip */}
      {!isExpanded && !flyout && tooltip && (
        <div
          className="fixed z-100 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-100"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateY(-50%)",
          }}
        >
          {tooltip.text}
          <div
            className="absolute w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800"
            style={{
              left: "-4px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      )}
    </>
  );
};

export default Sidebar;
