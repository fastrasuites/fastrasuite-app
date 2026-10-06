import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export interface UpdateRequestAccountMappingRequest extends CreateRequestAccountMappingRequest {}

export interface PatchRequestAccountMappingRequest extends Partial<CreateRequestAccountMappingRequest> {}

export interface GetRequestAccountMappingsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export const requestAccountMappingsApi = createApi({
  reducerPath: "requestAccountMappingsApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getRequestAccountMappings: builder.query<
      RequestAccountMapping[],
      GetRequestAccountMappingsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/request-account-mappings/",
        ...(params ? { params } : {}),
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
