"use client";

import { ReactNode } from "react";
import { usePermission } from "../hooks/usePermission";
import { CanParamsV2 } from "../types/permissions";

interface ProtectedComponentProps extends CanParamsV2 {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * If true, the component will show nothing while permissions are loading.
   * If false, it will show the fallback (default: null).
   */
  hideWhileLoading?: boolean;
}

/**
 * Declarative component for protecting UI elements based on user permissions.
 *
 * Supports two APIs:
 * 1. Legacy: <PermissionGuard application="settings" module="user" action="edit">
 * 2. New:    <PermissionGuard module="project_costing" entitlement="view_project">
 */
export function ProtectedComponent({
  application,
  module,
  action,
  entitlement,
  children,
  fallback = null,
  hideWhileLoading = true,
}: ProtectedComponentProps) {
  const { can, isLoading } = usePermission();

  if (isLoading && hideWhileLoading) {
    return null;
  }

  if (can({ application, module, action, entitlement })) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Export as PermissionGuard for better semantic naming
export { ProtectedComponent as PermissionGuard };
