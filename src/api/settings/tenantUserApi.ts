import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type { PermissionDetail } from "@/utils/normalizePermissions";

// Company Role interface
export interface CompanyRole {
  id: number;
  name: string;
}

// User interface for nested user details
export interface User {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Tenant User interface
export interface TenantUser {
  id: number;
  user_id: number;
  user: User | null; // Include user details, may be null based on API response
  first_name?: string;
  last_name?: string;
  email?: string;
  company_role: number | null;
  company_role_details: CompanyRole | null;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  temp_password: string | null;
  date_created: string;
  signature: string | null;
  user_image: string | null;
  /** Detailed permissions with entitlements */
  permission_details?: PermissionDetail[];
  /** Legacy flat permissions array */
  permissions?: Array<{ module: string; permission_type: string }>;
}

// Create/Update Tenant User interface
export interface CreateTenantUser {
  user_id: number;
  name: string;
  email: string;
  company_role: number;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  access_codes: string[];
  signature_image: string;
  user_image_image: string;
}

export type UpdateTenantUser = Partial<CreateTenantUser>;

// Password change request interface
export interface ChangePasswordRequest {
  user_id?: number;
  old_password: string;
  new_password: string;
  confirm_password: string;
}

// Reset password request interface
export interface ResetPasswordRequest {
  user_id: number;
  email?: string;
}

// Helper to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState) => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const tenantUserApi = createApi({
  reducerPath: "tenantUserApi",
  baseQuery: async (args, api) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("accept", "application/json");

    let url: string;
    let method = "GET";
    let body: any = undefined;

    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      method = args.method || "GET";
      const params = new URLSearchParams();
      if (args.params) {
        Object.entries(args.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      url = `${baseUrl}${args.url}${queryString ? `?${queryString}` : ""}`;

      if (args.body instanceof FormData) {
        body = args.body;
      } else if (args.body) {
        body = JSON.stringify(args.body);
        headers.set("content-type", "application/json");
      }
    }

    try {
      const response = await fetch(url, { method, headers, body });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        return {
          error: {
            status: response.status,
            data: errorData,
          },
        };
      }
      if (response.status === 204) {
        return { data: null };
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          status: "FETCH_ERROR" as const,
          data: error,
        },
      };
    }
  },
  tagTypes: ["TenantUser"],
  endpoints: (builder) => ({
    // GET /users/tenant-users/ - List/search tenant users
    getTenantUsers: builder.query<TenantUser[], { search?: string } | void>({
      query: (params) => {
        if (params && params.search) {
          return {
            url: "/users/tenant-users/",
            params: { search: params.search },
          };
        }
        return "/users/tenant-users/";
      },
      providesTags: ["TenantUser"],
    }),

    // GET /users/tenant-users/{id}/ - Get specific tenant user
    getTenantUser: builder.query<TenantUser, number>({
      query: (id) => `/users/tenant-users/${id}/`,
      providesTags: (result, error, id) => [{ type: "TenantUser", id }],
    }),

    // POST /users/tenant-users/ - Create new tenant user
    createTenantUser: builder.mutation<TenantUser, CreateTenantUser>({
      query: (newUser) => ({
        url: "/users/tenant-users/",
        method: "POST",
        body: newUser,
      }),
      invalidatesTags: ["TenantUser"],
    }),

    // PUT /users/tenant-users/{id}/ - Update tenant user
    updateTenantUser: builder.mutation<
      TenantUser,
      { id: number; data: UpdateTenantUser }
    >({
      query: ({ id, data }) => ({
        url: `/users/tenant-users/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TenantUser", id },
        "TenantUser",
      ],
    }),

    // PATCH /users/tenant-users/{id}/ - Partial update tenant user
    patchTenantUser: builder.mutation<
      TenantUser,
      { id: number; data: UpdateTenantUser }
    >({
      query: ({ id, data }) => ({
        url: `/users/tenant-users/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TenantUser", id },
        "TenantUser",
      ],
    }),

    // DELETE /users/tenant-users/{id}/ - Delete tenant user
    deleteTenantUser: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/users/tenant-users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "TenantUser", id },
        "TenantUser",
      ],
    }),

    // DELETE /users/tenant-users/{id}/ - Soft delete tenant user (backward compatibility)
    softDeleteTenantUser: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/users/tenant-users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "TenantUser", id },
        "TenantUser",
      ],
    }),

    // PUT /users/tenant-users/{id}/toggle_hidden_status/ - Toggle hidden status
    toggleHiddenStatus: builder.mutation<
      TenantUser,
      { id: number; data: UpdateTenantUser }
    >({
      query: ({ id, data }) => ({
        url: `/users/tenant-users/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TenantUser", id },
        "TenantUser",
      ],
    }),

    // PATCH /users/tenant-users/{id}/toggle_hidden_status/ - Toggle hidden status (PATCH)
    toggleHiddenStatusPatch: builder.mutation<
      TenantUser,
      { id: number; data: UpdateTenantUser }
    >({
      query: ({ id, data }) => ({
        url: `/users/tenant-users/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TenantUser", id },
        "TenantUser",
      ],
    }),

    // GET /users/tenant-users/active_list/ - Get active tenant users
    getActiveTenantUsers: builder.query<TenantUser, void>({
      query: () => "/users/tenant-users/active_list/",
      providesTags: ["TenantUser"],
    }),

    // GET /users/tenant-users/hidden_list/ - Get hidden tenant users
    getHiddenTenantUsers: builder.query<TenantUser, void>({
      query: () => "/users/tenant-users/hidden_list/",
      providesTags: ["TenantUser"],
    }),

    // POST /users/tenant-users/change-password/ - Change password
    changePassword: builder.mutation<
      unknown,
      ChangePasswordRequest | { id?: number | string; data: ChangePasswordRequest }
    >({
      query: (arg) => {
        const body = "data" in arg ? arg.data : arg;
        return {
          url: "/users/tenant-users/change-password/",
          method: "POST",
          body,
        };
      },
    }),

    // PATCH /users/tenant-users/edit/{id}/ - Edit tenant user
    editTenantUser: builder.mutation<
      TenantUser,
      { id: number; data: UpdateTenantUser }
    >({
      query: ({ id, data }) => ({
        url: `/users/tenant-users/edit/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TenantUser", id },
        "TenantUser",
      ],
    }),

    // POST /company/admin/reset-user-password/ - Reset user password
    resetPassword: builder.mutation<unknown, ResetPasswordRequest>({
      query: (resetData) => ({
        url: "/company/admin/reset-user-password/",
        method: "POST",
        body: resetData,
      }),
      invalidatesTags: ["TenantUser"],
    }),
  }),
});

export const {
  // Query hooks
  useGetTenantUsersQuery,
  useGetTenantUserQuery,
  useGetActiveTenantUsersQuery,
  useGetHiddenTenantUsersQuery,

  // Mutation hooks
  useCreateTenantUserMutation,
  useUpdateTenantUserMutation,
  usePatchTenantUserMutation,
  useDeleteTenantUserMutation,
  useSoftDeleteTenantUserMutation,
  useToggleHiddenStatusMutation,
  useToggleHiddenStatusPatchMutation,
  useChangePasswordMutation,
  useEditTenantUserMutation,
  useResetPasswordMutation,
} = tenantUserApi;

export const useResetUserPasswordMutation = useResetPasswordMutation;
