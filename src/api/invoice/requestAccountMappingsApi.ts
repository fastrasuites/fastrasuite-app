import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export type RequestMappingType =
  | "labour"
  | "material"
  | "petty_cash"
  | "plant_equipment"
  | "purchase"
  | string;

export interface RequestAccountMapping {
  id: number;
  expense_account_name: string;
  request_type: RequestMappingType;
  created_at: string;
  is_active: boolean;
  expense_account: number;
}

export interface CreateRequestAccountMappingRequest {
  request_type: RequestMappingType;
  is_active: boolean;
  expense_account: number;
}

export interface UpdateRequestAccountMappingRequest
  extends CreateRequestAccountMappingRequest {}

export interface PatchRequestAccountMappingRequest
  extends Partial<CreateRequestAccountMappingRequest> {}

export interface GetRequestAccountMappingsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const requestAccountMappingsApi = createApi({
  reducerPath: "requestAccountMappingsApi",
  baseQuery: async (args, api, _extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");

    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
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

      if (response.status === 204) {
        return { data: null };
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
    getRequestAccountMappings: builder.query<
      RequestAccountMapping[],
      GetRequestAccountMappingsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/request-account-mappings/",
        params,
      }),
    }),
    createRequestAccountMapping: builder.mutation<
      RequestAccountMapping,
      CreateRequestAccountMappingRequest
    >({
      query: (body) => ({
        url: "/invoicing/request-account-mappings/",
        method: "POST",
        body,
      }),
    }),
    getRequestAccountMappingById: builder.query<RequestAccountMapping, number>({
      query: (id) => `/invoicing/request-account-mappings/${id}/`,
    }),
    updateRequestAccountMapping: builder.mutation<
      RequestAccountMapping,
      { id: number; data: UpdateRequestAccountMappingRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/request-account-mappings/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchRequestAccountMapping: builder.mutation<
      RequestAccountMapping,
      { id: number; data: PatchRequestAccountMappingRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/request-account-mappings/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteRequestAccountMapping: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/request-account-mappings/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetRequestAccountMappingsQuery,
  useCreateRequestAccountMappingMutation,
  useGetRequestAccountMappingByIdQuery,
  useUpdateRequestAccountMappingMutation,
  usePatchRequestAccountMappingMutation,
  useDeleteRequestAccountMappingMutation,
} = requestAccountMappingsApi;
