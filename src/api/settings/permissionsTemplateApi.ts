import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type { UserPermissions } from "@/utils/modulePermissionsStore";

const getTenantBaseUrl = (state: RootState) => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

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
      url = `${baseUrl}${args.url}`;
      method = args.method || "GET";

      if (args.body instanceof FormData) {
        body = args.body;
      } else if (args.body) {
        headers.set("content-type", "application/json");
        body = JSON.stringify(args.body);
      }
    }

    try {
      const response = await fetch(url, { method, headers, body });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json(),
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
          status: "FETCH_ERROR",
          data: error,
        },
      };
    }
  },
  endpoints: (builder) => ({
    getPermissionTemplates: builder.query<PermissionTemplate[], { ordering?: string; search?: string } | void>({
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
      providesTags: (result, error, id) => [{ type: PERMISSION_TEMPLATE_TAG, id }],
    }),

    createPermissionTemplate: builder.mutation<PermissionTemplate, PermissionTemplateCreate>({
      query: (body) => ({
        url: "/users/permissions-template/",
        method: "POST",
        body,
      }),
      invalidatesTags: [PERMISSION_TEMPLATE_TAG],
    }),

    updatePermissionTemplate: builder.mutation<PermissionTemplate, { id: number; body: PermissionTemplateCreate }>({
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

    patchPermissionTemplate: builder.mutation<PermissionTemplate, { id: number; body: Partial<PermissionTemplateCreate> }>({
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

    activatePermissionTemplate: builder.mutation<PermissionTemplate, { id: number; body?: PermissionTemplateActionRequest }>({
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

    archivePermissionTemplate: builder.mutation<PermissionTemplate, { id: number; body?: PermissionTemplateActionRequest }>({
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

    duplicatePermissionTemplate: builder.mutation<PermissionTemplate, { id: number; body?: PermissionTemplateActionRequest }>({
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
