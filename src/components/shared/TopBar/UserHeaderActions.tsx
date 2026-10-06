"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
} from "lucide-react";
import { useSelector, useDispatch, ReactReduxContext } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { clearAuthData } from "@/lib/store/authSlice";
import { useGetUserByIdQuery } from "@/api/settings/usersApi";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { WizardGuideButton, ModuleWizard } from "@/components/shared/wizard/ModuleWizard";

interface UserHeaderActionsProps {
  showNotify?: boolean;
  wizardModuleId?: string;
  className?: string;
}

export function UserHeaderActions(props: UserHeaderActionsProps) {
  const reduxContext = React.useContext(ReactReduxContext);
  if (!reduxContext || !reduxContext.store) {
    return (
      <div className={`flex items-center gap-2 md:gap-4 ${props.className || ""}`}>
        {props.wizardModuleId && <WizardGuideButton moduleId={props.wizardModuleId} />}
        {props.showNotify !== false && (
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="w-5 h-5 block" />
          </button>
        )}
        <div className="w-8 h-8 bg-[#ffcdd2] rounded-full flex items-center justify-center">
          <User size={18} className="text-red-900" />
        </div>
      </div>
    );
  }

  return <UserHeaderActionsContent {...props} />;
}

function UserHeaderActionsContent({
  showNotify = true,
  wizardModuleId,
  className = "",
}: UserHeaderActionsProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const tenant_user_id = useSelector((state: RootState) => state.auth.tenant_user_id);
  const { data: tenantUserData } = useGetUserByIdQuery(
    tenant_user_id ? Number(tenant_user_id) : 0,
    { skip: !tenant_user_id || Number(tenant_user_id) <= 0 }
  );

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const username = user?.username ?? "";
  const isEffectiveAdmin = Boolean(isAdmin || username.toLowerCase().includes("admin"));

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

  return (
    <>
      <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
        {/* Module Guide Button */}
        {wizardModuleId && (
          <WizardGuideButton moduleId={wizardModuleId} />
        )}

        {/* Notification Bell with interactive popover */}
        {showNotify && <NotificationBell />}

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer select-none"
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
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
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

              {isEffectiveAdmin && (
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
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full cursor-pointer text-left"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {wizardModuleId && <ModuleWizard moduleId={wizardModuleId} />}
    </>
  );
}
