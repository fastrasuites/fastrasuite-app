import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import type {
  Location,
  LocationType,
  GetLocationsParams,
  CreateLocationRequest,
  UpdateLocationRequest,
  PatchLocationRequest,
  StockLevelItem,
} from "../../types/location";

export const locationApi = createApi({
  reducerPath: "locationApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  tagTypes: ["Location"],
  endpoints: (builder) => ({
    // Query endpoints
    getLocations: builder.query<Location[], GetLocationsParams>({
      query: (params) => ({
        url: "/inventory/location/",
        ...(params ? { params } : {}),
      }),
      providesTags: (result) =>
        result
          ? [
              ...(Array.isArray(result)
                ? result
                : (result as any)?.results || []
              ).map((loc: any) => ({ type: "Location" as const, id: loc.id })),
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
      providesTags: (result, error, id) => [
        { type: "Location", id: `stock-${id}` },
      ],
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
