import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

import type {
  MultiLocationStatusRequest,
  MultiLocationStatusResponse,
} from "@/types/multilocation";

export const multilocationApi = createApi({
  reducerPath: "multilocationApi",
  tagTypes: ["MultiLocationStatus"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
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
