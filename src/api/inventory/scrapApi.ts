import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import type {
  Scrap,
  CreateScrapRequest,
  UpdateScrapRequest,
  PatchScrapRequest,
  GetScrapsParams,
  ToggleHiddenStatusRequest,
} from "@/types/scrap";

export const scrapApi = createApi({
  reducerPath: "scrapApi",
  tagTypes: ["Scrap"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getScraps: builder.query<Scrap[], GetScrapsParams>({
      query: (params) => ({
        url: "/inventory/scrap/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["Scrap"],
    }),

    getScrap: builder.query<Scrap, string>({
      query: (id) => `/inventory/scrap/${id}/`,
      providesTags: (result, error, id) => [{ type: "Scrap", id }],
    }),

    getScrapEditable: builder.query<Scrap, string>({
      query: (id) => `/inventory/scrap/${id}/check_editable/`,
      providesTags: (result, error, id) => [{ type: "Scrap", id }],
    }),

    getActiveScraps: builder.query<Scrap[], void>({
      query: () => "/inventory/scrap/active_list/",
      providesTags: ["Scrap"],
    }),

    getHiddenScraps: builder.query<Scrap[], void>({
      query: () => "/inventory/scrap/hidden_list/",
      providesTags: ["Scrap"],
    }),

    // Mutation endpoints
    createScrap: builder.mutation<Scrap, CreateScrapRequest>({
      query: (body) => ({
        url: "/inventory/scrap/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Scrap"],
    }),

    createAndValidateScrap: builder.mutation<Scrap, CreateScrapRequest>({
      query: (body) => ({
        url: "/inventory/scrap/create-and-validate/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Scrap"],
    }),

    updateScrap: builder.mutation<
      Scrap,
      { id: string; data: UpdateScrapRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Scrap",
        { type: "Scrap", id },
      ],
    }),

    patchScrap: builder.mutation<
      Scrap,
      { id: string; data: PatchScrapRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Scrap",
        { type: "Scrap", id },
      ],
    }),

    deleteScrap: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/scrap/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Scrap"],
    }),

    validateScrap: builder.mutation<
      Scrap,
      { id: string; data?: UpdateScrapRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/validate/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        "Scrap",
        { type: "Scrap", id },
      ],
    }),

    toggleScrapHiddenStatus: builder.mutation<
      Scrap,
      { id: string; data?: ToggleHiddenStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data || {},
      }),
    }),

    patchToggleScrapHiddenStatus: builder.mutation<
      Scrap,
      { id: string; data?: ToggleHiddenStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetScrapsQuery,
  useGetScrapQuery,
  useGetScrapEditableQuery,
  useGetActiveScrapsQuery,
  useGetHiddenScrapsQuery,

  // Mutation hooks
  useCreateScrapMutation,
  useCreateAndValidateScrapMutation,
  useUpdateScrapMutation,
  usePatchScrapMutation,
  useDeleteScrapMutation,
  useValidateScrapMutation,
  useToggleScrapHiddenStatusMutation,
  usePatchToggleScrapHiddenStatusMutation,
} = scrapApi;
