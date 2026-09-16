"use client";

import { ReactNode } from "react";
import { usePermission } from "../../hooks/usePermission";
import { CanParamsV2 } from "../../types/permissions";

interface PermissionGuardProps extends CanParamsV2 {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Specialized guard for protecting specific UI components (buttons, sections, etc).
 * Does not render anything if the user lacks the required permission (or renders fallback).
 */
export function PermissionGuard({
  application,
  module,
  action,
  entitlement,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can, isAdmin, isLoading } = usePermission();

  if (isLoading) {
    return null; // Do not render guarded components while resolving permissions
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  const hasAccess = can({ application, module, action, entitlement });

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
