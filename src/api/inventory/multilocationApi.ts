import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type {
  MultiLocationStatusRequest,
  MultiLocationStatusResponse,
} from "@/types/multilocation";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const multilocationApi = createApi({
  reducerPath: "multilocationApi",
  tagTypes: ["MultiLocationStatus"],
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    // Prepare headers
    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

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
            : args.body
              ? JSON.stringify(args.body)
              : undefined,
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
    getMultiLocationStatus: builder.query<MultiLocationStatusResponse, void>({
      query: () => "/inventory/configuration/multi-location/check_status/",
      providesTags: ["MultiLocationStatus"],
    }),

    // Mutation endpoints
    updateMultiLocationStatus: builder.mutation<
      MultiLocationStatusResponse,
      MultiLocationStatusRequest
    >({
      query: (body) => ({
        url: "/inventory/configuration/multi-location/change_status/",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MultiLocationStatus"],
    }),

    patchMultiLocationStatus: builder.mutation<
      MultiLocationStatusResponse,
      MultiLocationStatusRequest
    >({
      query: (body) => ({
        url: "/inventory/configuration/multi-location/change_status/",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["MultiLocationStatus"],
    }),
  }),
});

export const {
  // Query hooks
  useGetMultiLocationStatusQuery,

  // Mutation hooks
  useUpdateMultiLocationStatusMutation,
  usePatchMultiLocationStatusMutation,
} = multilocationApi;
