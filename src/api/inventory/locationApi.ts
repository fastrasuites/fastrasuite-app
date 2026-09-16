import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import type {
  Location,
  LocationType,
  GetLocationsParams,
  CreateLocationRequest,
  UpdateLocationRequest,
  PatchLocationRequest,
  StockLevelItem,
} from "../../types/location";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const locationApi = createApi({
  reducerPath: "locationApi",
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
  tagTypes: ["Location"],
  endpoints: (builder) => ({
    // Query endpoints
    getLocations: builder.query<Location[], GetLocationsParams>({
      query: (params) => ({
        url: "/inventory/location/",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...(Array.isArray(result) ? result : (result as any)?.results || []).map(
                (loc: any) => ({ type: "Location" as const, id: loc.id })
              ),
              { type: "Location", id: "LIST" },
            ]
          : [{ type: "Location", id: "LIST" }],
    }),

    getLocation: builder.query<Location, string>({
      query: (id) => `/inventory/location/${id}/`,
      providesTags: (result, error, id) => [{ type: "Location", id }],
    }),

    getLocationStockLevels: builder.query<StockLevelItem[], string>({
      query: (id) => `/inventory/location/${id}/location_stock_levels/`,
      providesTags: (result, error, id) => [{ type: "Location", id: `stock-${id}` }],
    }),

    getActiveLocations: builder.query<Location[], void>({
      query: () => "/inventory/location/active_list/",
      providesTags: [{ type: "Location", id: "LIST" }],
    }),

    getAllUserLocations: builder.query<Location[], void>({
      query: () => "/inventory/location/get-all-user-locations/",
      providesTags: [{ type: "Location", id: "LIST" }],
    }),

    getOtherLocationsForUser: builder.query<Location[], void>({
      query: () => "/inventory/location/get-other-locations-for-user/",
      providesTags: [{ type: "Location", id: "LIST" }],
    }),

    getUserManagedLocations: builder.query<Location[], void>({
      query: () => "/inventory/location/get-user-managed-locations/",
      providesTags: [{ type: "Location", id: "LIST" }],
    }),

    getUserStoreLocations: builder.query<Location[], void>({
      query: () => "/inventory/location/get-user-store-locations/",
      providesTags: [{ type: "Location", id: "LIST" }],
    }),

    getActiveLocationsFiltered: builder.query<Location[], void>({
      query: () => "/inventory/location/get_active_locations/",
      providesTags: [{ type: "Location", id: "LIST" }],
    }),

    getHiddenLocations: builder.query<Location[], void>({
      query: () => "/inventory/location/hidden_list/",
      providesTags: [{ type: "Location", id: "LIST" }],
    }),

    // Mutation endpoints
    createLocation: builder.mutation<Location, CreateLocationRequest>({
      query: (body) => ({
        url: "/inventory/location/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Location", id: "LIST" }],
    }),

    updateLocation: builder.mutation<
      Location,
      { id: string; data: UpdateLocationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/location/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Location", id },
        { type: "Location", id: "LIST" },
      ],
    }),

    patchLocation: builder.mutation<
      Location,
      { id: string; data: PatchLocationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/location/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Location", id },
        { type: "Location", id: "LIST" },
      ],
    }),

    deleteLocation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/location/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Location", id },
        { type: "Location", id: "LIST" },
      ],
    }),

    toggleLocationHiddenStatus: builder.mutation<
      Location,
      { id: string; data?: PatchLocationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/location/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Location", id },
        { type: "Location", id: "LIST" },
      ],
    }),
  }),
});

export const {
  // Query hooks
  useGetLocationsQuery,
  useGetLocationQuery,
  useGetLocationStockLevelsQuery,
  useGetActiveLocationsQuery,
  useGetAllUserLocationsQuery,
  useGetOtherLocationsForUserQuery,
  useGetUserManagedLocationsQuery,
  useGetUserStoreLocationsQuery,
  useGetActiveLocationsFilteredQuery,
  useGetHiddenLocationsQuery,

  // Mutation hooks
  useCreateLocationMutation,
  useUpdateLocationMutation,
  usePatchLocationMutation,
  useDeleteLocationMutation,
  useToggleLocationHiddenStatusMutation,
} = locationApi;
