import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export const PERMISSION_TEMPLATE_TAG = "PermissionTemplate" as const;

export interface PermissionTemplateItem {
  module: string;
  permission_types: Array<{
    permission_type: string;
    is_selected: boolean;
  }>;
}

export interface PermissionTemplate {
  id: number;
  name: string;
  is_active: boolean;
  created_at?: string;
  items: PermissionTemplateItem[];
}

export interface PermissionTemplateCreate {
  name: string;
  is_active: boolean;
  items: PermissionTemplateItem[];
}

export interface PermissionTemplateActionRequest {
  name?: string;
  is_active?: boolean;
  items?: PermissionTemplateItem[];
}

export const permissionsTemplateApi = createApi({
  reducerPath: "permissionsTemplateApi",
  tagTypes: [PERMISSION_TEMPLATE_TAG],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getPermissionTemplates: builder.query<
      PermissionTemplate[],
      { ordering?: string; search?: string } | void
    >({
      query: (params) => {
        if (params && (params.ordering || params.search)) {
          const queryParams = new URLSearchParams();
          if (params.ordering) queryParams.append("ordering", params.ordering);
          if (params.search) queryParams.append("search", params.search);
          return `/users/permissions-template/?${queryParams.toString()}`;
        }
        return "/users/permissions-template/";
      },
      providesTags: [PERMISSION_TEMPLATE_TAG],
    }),

    getPermissionTemplate: builder.query<PermissionTemplate, number>({
      query: (id) => `/users/permissions-template/${id}/`,
      providesTags: (result, error, id) => [
        { type: PERMISSION_TEMPLATE_TAG, id },
      ],
    }),

    createPermissionTemplate: builder.mutation<
      PermissionTemplate,
      PermissionTemplateCreate
    >({
      query: (body) => ({
        url: "/users/permissions-template/",
        method: "POST",
        body,
      }),
      invalidatesTags: [PERMISSION_TEMPLATE_TAG],
    }),

    updatePermissionTemplate: builder.mutation<
      PermissionTemplate,
      { id: number; body: PermissionTemplateCreate }
    >({
      query: ({ id, body }) => ({
        url: `/users/permissions-template/${id}/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: PERMISSION_TEMPLATE_TAG, id },
        PERMISSION_TEMPLATE_TAG,
      ],
    }),

    patchPermissionTemplate: builder.mutation<
      PermissionTemplate,
      { id: number; body: Partial<PermissionTemplateCreate> }
    >({
      query: ({ id, body }) => ({
        url: `/users/permissions-template/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: PERMISSION_TEMPLATE_TAG, id },
        PERMISSION_TEMPLATE_TAG,
      ],
    }),

    deletePermissionTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/permissions-template/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: PERMISSION_TEMPLATE_TAG, id },
        PERMISSION_TEMPLATE_TAG,
      ],
    }),

    activatePermissionTemplate: builder.mutation<
      PermissionTemplate,
      { id: number; body?: PermissionTemplateActionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/users/permissions-template/${id}/activate/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: PERMISSION_TEMPLATE_TAG, id },
        PERMISSION_TEMPLATE_TAG,
      ],
    }),

    archivePermissionTemplate: builder.mutation<
      PermissionTemplate,
      { id: number; body?: PermissionTemplateActionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/users/permissions-template/${id}/archive/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: PERMISSION_TEMPLATE_TAG, id },
        PERMISSION_TEMPLATE_TAG,
      ],
    }),

    duplicatePermissionTemplate: builder.mutation<
      PermissionTemplate,
      { id: number; body?: PermissionTemplateActionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/users/permissions-template/${id}/duplicate/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: PERMISSION_TEMPLATE_TAG, id },
        PERMISSION_TEMPLATE_TAG,
      ],
    }),
  }),
});

export const {
  useGetPermissionTemplatesQuery,
  useGetPermissionTemplateQuery,
  useCreatePermissionTemplateMutation,
  useUpdatePermissionTemplateMutation,
  usePatchPermissionTemplateMutation,
  useDeletePermissionTemplateMutation,
  useActivatePermissionTemplateMutation,
  useArchivePermissionTemplateMutation,
  useDuplicatePermissionTemplateMutation,
} = permissionsTemplateApi;
