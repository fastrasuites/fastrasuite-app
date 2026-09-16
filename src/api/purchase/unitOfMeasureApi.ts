import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

// Define types for requests and responses
export interface UnitOfMeasure {
  id?: number;
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on: string;
  is_hidden: boolean;
}

export interface GetUnitOfMeasureParams {
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateUnitOfMeasureRequest {
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  is_hidden?: boolean;
}

export interface UpdateUnitOfMeasureRequest {
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  is_hidden?: boolean;
}

export interface PatchUnitOfMeasureRequest {
  unit_name?: string;
  unit_symbol?: string;
  unit_category?: string;
  is_hidden?: boolean;
}

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const unitOfMeasureApi = createApi({
  reducerPath: "unitOfMeasureApi",
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
  tagTypes: ["UnitOfMeasure"],
  endpoints: (builder) => ({
    // Query endpoints
    getUnitOfMeasures: builder.query<UnitOfMeasure[], GetUnitOfMeasureParams>({
      query: (params) => ({
        url: "/purchase/unit-of-measure/",
        params,
      }),
      providesTags: ["UnitOfMeasure"],
    }),
    getUnitOfMeasure: builder.query<UnitOfMeasure, number>({
      query: (id) => `/purchase/unit-of-measure/${id}/`,
      providesTags: (result, error, id) => [{ type: "UnitOfMeasure", id }],
    }),

    // Mutation endpoints
    createUnitOfMeasure: builder.mutation<
      UnitOfMeasure,
      CreateUnitOfMeasureRequest
    >({
      query: (body) => ({
        url: "/purchase/unit-of-measure/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UnitOfMeasure"],
    }),
    updateUnitOfMeasure: builder.mutation<
      UnitOfMeasure,
      { id: number; data: UpdateUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/unit-of-measure/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UnitOfMeasure", id },
        "UnitOfMeasure",
      ],
    }),
    patchUnitOfMeasure: builder.mutation<
      UnitOfMeasure,
      { id: number; data: PatchUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/unit-of-measure/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UnitOfMeasure", id },
        "UnitOfMeasure",
      ],
    }),
    deleteUnitOfMeasure: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/unit-of-measure/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "UnitOfMeasure", id },
        "UnitOfMeasure",
      ],
    }),
  }),
});

export const {
  useGetUnitOfMeasuresQuery,
  useGetUnitOfMeasureQuery,
  useCreateUnitOfMeasureMutation,
  useUpdateUnitOfMeasureMutation,
  usePatchUnitOfMeasureMutation,
  useDeleteUnitOfMeasureMutation,
} = unitOfMeasureApi;
