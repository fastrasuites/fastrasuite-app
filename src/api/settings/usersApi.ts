import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type { PermissionTemplateItem } from "@/utils/modulePermissionsStore";

// User interface
export interface User {
  id: number;
  url: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}
export interface TenantUser {
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  company_role: number;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  access_codes: string[];
  signature?: string;
  user_image_image?: string;
  user_image?: string;
  company_role_details: { id: number; name: string };
}

export interface ApplicationAccess {
  application: string;      // e.g., "purchase", "sales"
  group_name: string;       // the actual group assigned
  access_code: string;
}

export interface TenantUserWithAccess {
  id: number;
  user_id: number;
  company_role: number | null;
  company_role_details: { id: number; name: string } | null;
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  signature?: string | null;
  user_image?: string | null;
  temp_password?: string;
  date_created: string;
  application_accesses: ApplicationAccess[];
  user_permissions?: PermissionTemplateItem[];
  permissions?: any[];
  permission_details?: any[];
  user?: {
    username?: string;
    [key: string]: any;
  };
  username?: string;
}


export interface NewUserRequest {
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  company_role: number;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  access_codes: string[];
  signature_image?: string;
  user_image_image?: string;
  
}



/*export interface NewUserRequest {
  user_id?: number;
  name: string;
  email: string;
  company_role: number;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  access_codes: string[];
  signature_image?: File;
  user_image_image?: string;
}*/

export interface NewUserResponse {
  id: number;
  user_id: number;
  company_role: number;
  company_role_details: { id: number; name: string };
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  temp_password: string;
  date_created: string;
  signature: string;
  user_image: string;
}


// Helper to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState) => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  tagTypes: ["User"],
  baseQuery: async (args, api) => {
  const state = api.getState() as RootState;
  const baseUrl = getTenantBaseUrl(state);
  const token = state.auth.access_token;

  let url: string;
  let method = "GET";
  let body: any = undefined;

  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  headers.set("accept", "application/json");

  if (typeof args === "string") {
    url = `${baseUrl}${args}`;
  } else {
    url = `${baseUrl}${args.url}`;
    method = args.method ?? "GET";

    // If body is FormData, don't JSON.stringify it, don't set content-type
    if (args.body instanceof FormData) {
      body = args.body;
    } else if (args.body) {
      body = JSON.stringify(args.body);
      headers.set("content-type", "application/json");
    }
  }

  try {
    const response = await fetch(url, { method, body, headers });
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

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return { data };
    }

    const text = await response.text();
    return { data: text ? JSON.parse(text) : null };
  } catch (error) {
    return {
      error: { status: "FETCH_ERROR" as const, data: error },
    };
  }
},
  endpoints: (builder) => ({
  getUsers: builder.query<User[], void>({
    query: () => "/users/tenant-users/", // list all users
    providesTags: ["User"],
  }),

  // Original getUser (keep it)
  getUser: builder.query<User, number>({
    query: (id) => `/users/users/${id}/`,
    providesTags: (result, error, id) => [{ type: "User", id }],
  }),

  // ✅ New tenant-specific getUserById
  getUserById: builder.query<TenantUserWithAccess, number>({
    query: (id) => `/users/tenant-users/${id}/`,
    providesTags: (result, error, id) => [{ type: "User", id }],
  }),

  // ✅ Update user mutation for tenant users
  updateUserById: builder.mutation<NewUserResponse, { id: number; data: FormData }>({
    query: ({ id, data }) => ({
      url: `/users/tenant-users/edit/${id}/`,
      method: "PATCH",
      body: data,
    }),
    invalidatesTags: (result, error, { id }) => [
      { type: "User", id },
      "User",
    ],
  }),

    createUser: builder.mutation<NewUserResponse, FormData>({
      query: (body) => ({
        url: "/users/tenant-users/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    deleteUser: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/users/tenant-users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        "User",
      ],
    }),
  }),
});

export const { 
  useGetUsersQuery, 
  useGetUserQuery,   // original
  useGetUserByIdQuery, // new tenant-specific
  useUpdateUserByIdMutation, // new mutation
  useCreateUserMutation,
  useDeleteUserMutation,
} = usersApi;