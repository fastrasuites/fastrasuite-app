"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { clearAuthData } from "@/lib/store/authSlice";
import { useGetUserByIdQuery } from "@/api/settings/usersApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProtectedComponent } from "@/components/ProtectedComponent";
import { useSidebarContext } from "@/app/AppWrapper";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { WizardGuideButton, ModuleWizard } from "@/components/shared/wizard/ModuleWizard";

interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
  module?: string;
  application?: string;
  action?: string;
}

interface TopNavProps {
  title: string;
  items: NavItem[];
  showNotify?: boolean;
  onMenuToggle?: () => void;
  backUrl?: string;
  activeHref?: string;
  wizardModuleId?: string;
}

export function NavBar({
  title,
  items,
  showNotify = true,
  onMenuToggle,
  backUrl,
  activeHref,
  wizardModuleId,
}: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const tenant_user_id = useSelector((state: RootState) => state.auth.tenant_user_id);
  const { data: tenantUserData } = useGetUserByIdQuery(
    tenant_user_id ? Number(tenant_user_id) : 0,
    { skip: !tenant_user_id || Number(tenant_user_id) <= 0 }
  );

  // Derive full name preferring live tenant user query, then Redux auth user
  const firstName =
    tenantUserData?.first_name ||
    user?.first_name ||
    (user as any)?.user?.first_name ||
    "";
  const lastName =
    tenantUserData?.last_name ||
    user?.last_name ||
    (user as any)?.user?.last_name ||
    "";
  const fullName = `${firstName} ${lastName}`.trim();

  // Primary display name: Full name (if present), else username, else email, else "User"
  const displayName =
    fullName ||
    user?.name ||
    tenantUserData?.user?.username ||
    user?.username ||
    user?.email ||
    "User";

  const displayEmail =
    tenantUserData?.email ||
    user?.email ||
    "";

  const avatarImage =
    tenantUserData?.user_image ||
    user?.user_image ||
    null;

  const roleName = tenantUserData?.company_role_details?.name;

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (displayName && displayName !== "User") {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return displayName.slice(0, 2).toUpperCase();
    }
    return null;
  };
  const initials = getInitials();

  const permissions = usePermissionContext();
  const { toggleSidebar } = useSidebarContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href?: string) => {
    if (!href) return false;

    // If activeHref is explicitly provided (e.g., from parent), use it for comparison
    if (activeHref !== undefined) {
      return href === activeHref;
    }

    if (href === "/" || href.endsWith("/")) {
      return pathname === href || pathname === href.slice(0, -1);
    }
    // Exact match for the href, or match with a slash for sub-paths
    // BUT NOT if another href is more specific and matches
    return pathname === href || pathname.startsWith(href + "/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    dispatch(clearAuthData());
    router.push("/auth/login");
  };

  const isHome =
    title.toLowerCase() === "home" || title.toLowerCase() === "dashboard";
  const showBackButton = !!backUrl || !isHome;

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30">
      <div className="max-w-360 mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
          )}
          {!showBackButton && (
            <button
              onClick={onMenuToggle || toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
              aria-label="Toggle menu"
            >
              <Menu size={24} className="text-gray-600" />
            </button>
          )}
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl truncate font-bold text-gray-900">
              {title}
            </h1>
            {items && items.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="md:hidden ml-1.5 p-1 rounded hover:bg-gray-100 text-gray-600 flex items-center focus:outline-none"
                  aria-label="Module navigation"
                >
                  <ChevronDown size={20} />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-2 mt-2 max-h-[75vh] overflow-y-auto z-50"
                >
                  {items.map((item, idx) => (
                    <div
                      key={`mob-nav-${idx}`}
                      className="py-1.5 border-b border-gray-100 last:border-none"
                    >
                      {item.children && item.children.length > 0 ? (
                        <>
                          <div className="px-3 py-1 text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
                            {item.label}
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {item.children.map((child) => {
                              const Wrapper =
                                child.module && child.application
                                  ? ({
                                      children,
                                    }: {
                                      children: React.ReactNode;
                                    }) => (
                                      <ProtectedComponent
                                        key={child.href}
                                        application={child.application! as any}
                                        module={child.module!}
                                        action={(child.action as any) || "view"}
                                      >
                                        {children}
                                      </ProtectedComponent>
                                    )
                                  : ({
                                      children,
                                    }: {
                                      children: React.ReactNode;
                                    }) => <>{children}</>;

                              return (
                                <Wrapper key={child.href}>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={child.href!}
                                      className={`w-full px-3 py-2 text-sm rounded block cursor-pointer ${
                                        isActive(child.href)
                                          ? "bg-blue-50 text-[#3B7CED] font-semibold"
                                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                      }`}
                                    >
                                      {child.label}
                                    </Link>
                                  </DropdownMenuItem>
                                </Wrapper>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link
                            href={item.href!}
                            className={`w-full px-3 py-2 text-sm font-medium rounded block cursor-pointer ${
                              isActive(item.href)
                                ? "bg-blue-50 text-[#3B7CED] font-semibold"
                                : "text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm text-gray-600 h-full"
        >
          {items.map((item, index) => {
            // Dropdown menu item
            if (item.children && item.children.length > 0) {
              const hasActiveChild = item.children.some((child) =>
                isActive(child.href),
              );

              // Check if any child matches known wizard target for the dropdown trigger
              const triggerWizardTarget = item.children.find((c) =>
                c.href?.includes("incoming_product") ||
                c.href?.includes("stock-on-hand") ||
                c.href?.includes("material-consumption")
              ) ? (
                item.label.toLowerCase().includes("operation") ? "inventory-nav-incoming" :
                item.label.toLowerCase().includes("stock") ? "inventory-nav-stock-on-hand" : undefined
              ) : undefined;

              return (
                <DropdownMenu key={`dropdown-${index}`}>
                  <DropdownMenuTrigger
                    data-wizard={triggerWizardTarget}
                    className={`h-full flex items-center text-base font-medium transition-all duration-200 hover:text-[#3B7CED] hover:border-b-2 hover:border-[#3B7CED] focus:outline-none focus:text-[#3B7CED] focus:border-b-2 focus:border-[#3B7CED] group ${
                      hasActiveChild
                        ? "text-[#3B7CED] border-b-2 border-[#3B7CED]"
                        : ""
                    }`}
                  >
                    <span className="flex items-center">
                      {item.label}
                      <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg py-2 mt-1"
                  >
                    {item.children.map((option, childIndex) => {
                      const Wrapper =
                        option.module && option.application
                          ? ({ children }: { children: React.ReactNode }) => (
                              <ProtectedComponent
                                key={option.href}
                                application={option.application! as any}
                                module={option.module!}
                                action={(option.action as any) || "view"}
                              >
                                {children}
                              </ProtectedComponent>
                            )
                          : ({ children }: { children: React.ReactNode }) => (
                              <>{children}</>
                            );

                      const optionWizardTarget =
                        option.href?.includes("incoming_product") ? "inventory-nav-incoming" :
                        option.href?.includes("material-consumption") ? "inventory-nav-consumption" :
                        option.href?.includes("stock-on-hand") ? "inventory-nav-stock-on-hand" :
                        option.href?.includes("adjustment") ? "inventory-nav-adjustments" : undefined;

                      return (
                        <Wrapper key={option.href}>
                          <DropdownMenuItem asChild>
                            <Link
                              href={option.href!}
                              data-wizard={optionWizardTarget}
                              className={`w-full px-3 py-2.5 text-sm cursor-pointer transition-colors duration-150 border-l-2 ${
                                isActive(option.href)
                                   ? "text-[#3B7CED] bg-blue-50 border-l-[#3B7CED] font-medium"
                                  : "text-gray-700 hover:text-[#3B7CED] hover:bg-gray-50 hover:border-l-gray-300"
                              } ${
                                childIndex === item.children!.length - 1
                                  ? "rounded-b-lg"
                                  : ""
                              }`}
                            >
                              {option.label}
                            </Link>
                          </DropdownMenuItem>
                        </Wrapper>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            // Regular link item with optional permission check
            const Wrapper =
              item.module && item.application
                ? ({ children }: { children: React.ReactNode }) => (
                    <ProtectedComponent
                      key={item.href}
                      application={item.application! as any}
                      module={item.module!}
                      action={(item.action as any) || "view"}
                    >
                      {children}
                    </ProtectedComponent>
                  )
                : ({ children }: { children: React.ReactNode }) => (
                    <>{children}</>
                  );

            const linkWizardTarget =
              item.href?.includes("approved-requests") ? "inv-nav-approved-requests" :
              item.href?.includes("purchase-order") ? "inv-nav-purchase-order" :
              item.href?.includes("payment-queue") ? "inv-nav-payment-queue" : undefined;

            return (
              <Wrapper key={item.href}>
                <Link
                  href={item.href!}
                  data-wizard={linkWizardTarget}
                  className={`h-full flex items-center text-base transition-colors duration-200 ${
                    isActive(item.href)
                      ? "text-[#3B7CED] border-b-2 border-[#3B7CED]"
                      : "hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              </Wrapper>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Module Guide Button */}
          {wizardModuleId && (
            <WizardGuideButton moduleId={wizardModuleId} />
          )}

          {/* Notification Bell with interactive popover */}
          {showNotify && <NotificationBell />}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : initials ? (
                <div className="w-8 h-8 bg-blue-100 text-blue-700 font-semibold text-xs rounded-full flex items-center justify-center border border-blue-200 shrink-0">
                  {initials}
                </div>
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <User size={18} className="text-blue-600" />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[140px] truncate text-left">
                {displayName}
              </span>
              <ChevronDown
                size={16}
                className="hidden md:block text-gray-500"
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayName}
                  </p>
                  {displayEmail && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {displayEmail}
                    </p>
                  )}
                  {fullName && user?.username && user.username !== fullName && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      @{user.username}
                    </p>
                  )}
                  {roleName && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-md">
                      {roleName}
                    </span>
                  )}
                </div>

                {permissions.isAdmin && (
                  <Link
                    href="/settings/company/1"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Building2 size={16} />
                    Company Profile
                  </Link>
                )}

                <Link
                  href={`/settings/users/${tenant_user_id || user?.id}`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={16} />
                  My Profile
                </Link>

                <Link
                  href="/settings/change-password"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={16} />
                  Change Password
                </Link>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {wizardModuleId && <ModuleWizard moduleId={wizardModuleId} />}
    </header>
  );
}
