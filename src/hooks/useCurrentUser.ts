"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useGetUserByIdQuery } from "@/api/settings/usersApi";

/**
 * Hook to retrieve the current logged-in user's details and full name.
 * Resolves preferring the live TenantUser profile (which contains first_name & last_name for tenants),
 * falling back to Redux auth user, username, email, or "Current User".
 */
export function useCurrentUser() {
  const user = useSelector((state: RootState) => state.auth.user);
  const tenant_user_id = useSelector((state: RootState) => state.auth.tenant_user_id);

  const { data: tenantUserData } = useGetUserByIdQuery(
    tenant_user_id ? Number(tenant_user_id) : 0,
    { skip: !tenant_user_id || Number(tenant_user_id) <= 0 }
  );

  const fullName = useMemo(() => {
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
    const name = `${firstName} ${lastName}`.trim();

    return (
      name ||
      user?.name ||
      tenantUserData?.user?.username ||
      user?.username ||
      user?.email ||
      "Current User"
    );
  }, [tenantUserData, user]);

  return {
    user,
    tenant_user_id,
    tenantUserData,
    fullName,
    requesterId: tenant_user_id ? Number(tenant_user_id) : (user?.id || 1),
  };
}

export function useCurrentUserName(): string {
  return useCurrentUser().fullName;
}

