"use client";

import { createContext, useContext, ReactNode, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAuthData } from "@/lib/store/authSlice";
import type { RootState } from "@/lib/store/store";
import {
  NormalizedPermissions,
  normalizePermissionDetails,
  normalizePermissionsFromBackend,
  PermissionDetail,
} from "../utils/normalizePermissions";

const PermissionContext = createContext<NormalizedPermissions | undefined>(
  undefined
);

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const {
    user_permissions,
    permission_details,
    isAdmin,
    user,
    tenant_user_id,
    tenant_schema_name,
    access_token,
  } = useSelector((state: RootState) => state.auth);
  
  const dispatch = useDispatch();

  const username = user?.username ?? "";
  const usernameContainsAdmin = username.toLowerCase().includes("admin");
  const effectiveIsAdmin = isAdmin || usernameContainsAdmin;

  // Silent refresh of permissions on mount
  useEffect(() => {
    if (effectiveIsAdmin || !tenant_user_id || !tenant_schema_name || !access_token) return;

    const fetchProfile = async () => {
      try {
        const domain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
        const protocol = (domain.includes("localhost") || domain.includes("127.0.0.1")) ? "http" : "https";
        const res = await fetch(
          `${protocol}://${tenant_schema_name}.${domain}/users/tenant-users/${tenant_user_id}/`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.permission_details) {
            dispatch(setAuthData({ permission_details: data.permission_details }));
          }
        }
      } catch (err) {
        // Silent catch for background refresh
      }
    };
    
    fetchProfile();
  }, [tenant_user_id, tenant_schema_name, access_token, effectiveIsAdmin, dispatch]);

  const normalized = useMemo((): NormalizedPermissions => {
    if (effectiveIsAdmin) {
      return { isAdmin: true, permissions: {}, isReady: true };
    }

    // Both permission_details and user_permissions now share the deeply nested structure.
    // Prefer permission_details (as it might be fresher from the profile endpoint),
    // but fall back to user_permissions (from the initial login payload).
    const dataToNormalize = (permission_details && permission_details.length > 0) 
      ? permission_details 
      : user_permissions;

    if (dataToNormalize && Array.isArray(dataToNormalize) && dataToNormalize.length > 0) {
      const isNestedFormat = "permissions" in dataToNormalize[0];
      if (isNestedFormat) {
        return normalizePermissionDetails(dataToNormalize as PermissionDetail[]);
      } else {
        return normalizePermissionsFromBackend(dataToNormalize as any);
      }
    }

    return { isAdmin: false, permissions: {}, isReady: false };
  }, [user_permissions, permission_details, effectiveIsAdmin]);

  return (
    <PermissionContext.Provider value={normalized}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext(): NormalizedPermissions {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "usePermissionContext must be used within a PermissionProvider"
    );
  }
  return context;
}
