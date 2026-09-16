"use client";

import { ReactNode } from "react";
import { usePermission } from "../../hooks/usePermission";
import { CanParamsV2 } from "../../types/permissions";
import { LoadingDots } from "../shared/LoadingComponents";
import { UnauthorizedMessage } from "../shared/UnauthorizedMessage";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";

interface PageGuardProps extends CanParamsV2 {
  children: ReactNode;
}

/**
 * Specialized guard for protecting entire pages.
 * Handles loading states consistently and renders an inline unauthorized message.
 *
 * Supports two APIs:
 * 1. Legacy: <PageGuard application="settings" module="user" action="view">
 * 2. New:    <PageGuard module="project_costing" entitlement="view_project">
 *
 * Permission resolution order:
 * 1. If user is not authenticated at all → show loading (auth rehydration in progress)
 * 2. If user isAdmin → always allow immediately
 * 3. If permissions are ready (isReady=true) → evaluate and show/block
 * 4. If permissions not yet ready → show brief loading spinner
 */
export function PageGuard({
  application,
  module,
  action = "view",
  entitlement,
  children,
}: PageGuardProps) {
  const { can, isAdmin, isLoading } = usePermission();
  const user = useSelector((state: RootState) => state.auth.user);

  // If there is no authenticated user yet, the store is still rehydrating — wait.
  if (!user) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white rounded-lg">
        <LoadingDots count={3} />
        <p className="mt-4 text-sm text-gray-500 animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  // Admin users bypass all permission checks immediately.
  if (isAdmin) {
    return <>{children}</>;
  }

  // Permissions are still being resolved (brief moment after login).
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white rounded-lg">
        <LoadingDots count={3} />
        <p className="mt-4 text-sm text-gray-500 animate-pulse">
          Verifying access rights...
        </p>
      </div>
    );
  }

  const hasAccess = can({ application, module, action, entitlement });

  // If we don't have access and are not loading, show the inline unauthorized message
  if (!hasAccess) {
    return <UnauthorizedMessage />;
  }

  return <>{children}</>;
}
