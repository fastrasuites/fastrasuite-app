import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { PermissionDetail } from "@/utils/normalizePermissions";

export interface User {
  id: number;
  username: string;
  email: string;
  user_image: string | null;
  first_name?: string;
  last_name?: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  /** The TenantUser profile ID — used to fetch the user's role/company_role. */
  tenant_user_id: number | null;
  tenant_id: number | null;
  tenant_schema_name: string | null;
  tenant_company_name: string | null;
  isOnboarded: boolean | null;
  /**
   * New backend permission format with expanded entitlements per permission type.
   */
  user_permissions: PermissionDetail[];
  /**
   * Detailed permissions from backend with expanded entitlements per permission type.
   * Used for permission checking and UI rendering.
   */
  permission_details: PermissionDetail[];
  /**
   * Whether this user is an admin/owner of the tenant.
   * Derived after login by checking company_role from the tenant-user profile endpoint.
   * true = full access to all modules.
   */
  isAdmin: boolean;
}

const initialState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  tenant_user_id: null,
  tenant_id: null,
  tenant_schema_name: null,
  tenant_company_name: null,
  isOnboarded: null,
  user_permissions: [],
  permission_details: [],
  isAdmin: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<Partial<AuthState>>) => {
      return { ...state, ...action.payload };
    },
    clearAuthData: () => {
      return initialState;
    },
    /** Called after fetching the tenant-user profile to confirm admin status. */
    setIsAdmin: (state, action: PayloadAction<boolean>) => {
      state.isAdmin = action.payload;
    },
  },
});

export const { setAuthData, clearAuthData, setIsAdmin } = authSlice.actions;
export default authSlice.reducer;
