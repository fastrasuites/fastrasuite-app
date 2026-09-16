import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

// Define types for requests and responses
export interface Vendor {
  url: string;
  id: number;
  company_name: string;
  profile_picture: string;
  email: string;
  address: string;
  phone_number: string;
  is_hidden: boolean;
}

export interface GetVendorsParams {
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateVendorRequest {
  company_name: string;
  email: string;
  address: string;
  phone_number: string;
  profile_picture?: string;
  is_hidden?: boolean;
}

export interface CreateVendorFormData {
  company_name: string;
  email: string;
  address: string;
  phone_number: string;
  profile_picture?: File;
  is_hidden?: boolean;
}

export interface UpdateVendorRequest {
  company_name: string;
  email: string;
  address: string;
  phone_number: string;
  profile_picture?: File;
  is_hidden?: boolean;
}

export interface PatchVendorRequest {
  company_name?: string;
  email?: string;
  address?: string;
  phone_number?: string;
  profile_picture?: File;
  is_hidden?: boolean;
}

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const vendorsApi = createApi({
  reducerPath: "vendorsApi",
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    // Prepare headers
    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    let body: FormData | string | undefined;
    let contentType: string | undefined;

    if (typeof args === "string") {
      // For GET requests
      body = undefined;
    } else {
      // For POST/PUT/PATCH requests
      if (args.body instanceof FormData) {
        // Don't set content-type for FormData, let the browser set it with boundary
        body = args.body;
        contentType = undefined;
      } else {
        // For JSON data
        headers.set("content-type", "application/json");
        body = args.body ? JSON.stringify(args.body) : undefined;
        contentType = "application/json";
      }
    }

    // Set content-type if not FormData
    if (contentType) {
      headers.set("content-type", contentType);
    }

    // Handle both string URLs and object URLs with params
    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      // Build URL with query parameters
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
    }

    try {
      const response = await fetch(url, {
        method: typeof args === "string" ? "GET" : args.method || "GET",
        headers,
        body: body,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json(),
          },
        };
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
  endpoints: (builder) => ({
    // Query endpoints
    getVendors: builder.query<Vendor[], GetVendorsParams>({
      query: (params) => ({
        url: "/purchase/vendors/",
        params,
      }),
    }),
    getVendor: builder.query<Vendor, number>({
      query: (id) => `/purchase/vendors/${id}/`,
    }),

    // Mutation endpoints
    createVendor: builder.mutation<Vendor, CreateVendorFormData>({
      query: (body) => ({
        url: "/purchase/vendors/",
        method: "POST",
        body,
      }),
    }),
    updateVendor: builder.mutation<
      Vendor,
      { id: number; data: UpdateVendorRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/vendors/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchVendor: builder.mutation<
      Vendor,
      { id: number; data: PatchVendorRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/vendors/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteVendor: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/vendors/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  usePatchVendorMutation,
  useDeleteVendorMutation,
} = vendorsApi;
