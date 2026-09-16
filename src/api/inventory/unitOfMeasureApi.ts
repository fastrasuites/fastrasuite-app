import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export interface InventoryUnitOfMeasure {
  id?: number;
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on?: string;
  is_active?: boolean;
  is_hidden?: boolean;
  [key: string]: any;
}

export interface GetInventoryUnitOfMeasureParams {
  search?: string;
  [key: string]: any;
}

export interface CreateInventoryUnitOfMeasureRequest {
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  is_active?: boolean;
  is_hidden?: boolean;
  [key: string]: any;
}

export interface UpdateInventoryUnitOfMeasureRequest {
  unit_name?: string;
  unit_symbol?: string;
  unit_category?: string;
  is_active?: boolean;
  is_hidden?: boolean;
  [key: string]: any;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const inventoryUnitOfMeasureApi = createApi({
  reducerPath: "inventoryUnitOfMeasureApi",
  tagTypes: ["InventoryUnitOfMeasure"],
  baseQuery: async (args, api) => {
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

      if (response.status === 204) {
        return { data: undefined };
      }

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }
        return {
          error: {
            status: response.status,
            data: errData,
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
    getInventoryUnitOfMeasures: builder.query<
      InventoryUnitOfMeasure[],
      GetInventoryUnitOfMeasureParams
    >({
      query: (params) => ({
        url: "/inventory/unit-of-measure/",
        params,
      }),
      providesTags: ["InventoryUnitOfMeasure"],
    }),
    getInventoryUnitOfMeasure: builder.query<
      InventoryUnitOfMeasure,
      number | string
    >({
      query: (id) => `/inventory/unit-of-measure/${id}/`,
      providesTags: (result, error, id) => [
        { type: "InventoryUnitOfMeasure", id },
      ],
    }),
    createInventoryUnitOfMeasure: builder.mutation<
      InventoryUnitOfMeasure,
      CreateInventoryUnitOfMeasureRequest
    >({
      query: (body) => ({
        url: "/inventory/unit-of-measure/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryUnitOfMeasure"],
    }),
    updateInventoryUnitOfMeasure: builder.mutation<
      InventoryUnitOfMeasure,
      { id: number | string; data: UpdateInventoryUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/unit-of-measure/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryUnitOfMeasure", id },
        "InventoryUnitOfMeasure",
      ],
    }),
    patchInventoryUnitOfMeasure: builder.mutation<
      InventoryUnitOfMeasure,
      { id: number | string; data: UpdateInventoryUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/unit-of-measure/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryUnitOfMeasure", id },
        "InventoryUnitOfMeasure",
      ],
    }),
    deleteInventoryUnitOfMeasure: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/inventory/unit-of-measure/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryUnitOfMeasure"],
    }),
  }),
});

export const {
  useGetInventoryUnitOfMeasuresQuery,
  useGetInventoryUnitOfMeasureQuery,
  useCreateInventoryUnitOfMeasureMutation,
  useUpdateInventoryUnitOfMeasureMutation,
  usePatchInventoryUnitOfMeasureMutation,
  useDeleteInventoryUnitOfMeasureMutation,
} = inventoryUnitOfMeasureApi;
