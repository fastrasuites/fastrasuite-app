import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import type { 
  IncomingProductReturn, 
} from "../../types/incomingProductReturn";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const incomingProductReturnsApi = createApi({
  reducerPath: "incomingProductReturnsApi",
  tagTypes: ["IncomingProductReturn"],
  baseQuery: async (args, api) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    // Prepare headers
    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    
    // NOTE: For FormData, we must let the browser set the boundary and content-type automatically
    const isFormData = typeof args !== "string" && args.body instanceof FormData;
    if (!isFormData) {
      headers.set("content-type", "application/json");
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
        body:
          typeof args === "string"
            ? undefined
            : isFormData
              ? args.body
              : args.body
                ? JSON.stringify(args.body)
                : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: {
            status: response.status,
            data: errorData,
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
    getIncomingProductReturns: builder.query<IncomingProductReturn[], any>({
      query: (params) => ({
        url: "/inventory/return-incoming-product/",
        params,
      }),
      providesTags: ["IncomingProductReturn"],
    }),

    getIncomingProductReturn: builder.query<IncomingProductReturn, string>({
      query: (id) => `/inventory/return-incoming-product/${id}/`,
      providesTags: (result, error, id) => [{ type: "IncomingProductReturn", id }],
    }),

    createIncomingProductReturn: builder.mutation<
      IncomingProductReturn,
      any
    >({
      query: (formData) => ({
        url: "/inventory/return-incoming-product/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["IncomingProductReturn"],
    }),

    confirmIncomingProductReturn: builder.mutation<
      IncomingProductReturn,
      string
    >({
      query: (id) => ({
        url: `/inventory/return-incoming-product/${id}/confirm-return/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "IncomingProductReturn", id },
        "IncomingProductReturn",
      ],
    }),

    cancelIncomingProductReturn: builder.mutation<
      IncomingProductReturn,
      string
    >({
      query: (id) => ({
        url: `/inventory/return-incoming-product/${id}/cancel/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "IncomingProductReturn", id },
        "IncomingProductReturn",
      ],
    }),
  }),
});

export const {
  useGetIncomingProductReturnsQuery,
  useGetIncomingProductReturnQuery,
  useCreateIncomingProductReturnMutation,
  useConfirmIncomingProductReturnMutation,
  useCancelIncomingProductReturnMutation,
} = incomingProductReturnsApi;

