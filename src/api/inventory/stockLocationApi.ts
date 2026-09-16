import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";

export interface StockLocationItem {
  id: number;
  location: string;
  location_details?: any;
  product: number;
  product_details?: any;
  quantity: string | number;
  [key: string]: any;
}

export interface GetStockLocationsParams {
  location__id?: string;
  product__id?: number | string;
  search?: string;
  [key: string]: any;
}

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const stockLocationApi = createApi({
  reducerPath: "stockLocationApi",
  tagTypes: ["StockLocation"],
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

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
    getStockLocations: builder.query<StockLocationItem[], GetStockLocationsParams | void>({
      query: (params) => ({
        url: "/inventory/stock-location/",
        params: params || undefined,
      }),
      providesTags: ["StockLocation"],
    }),

    getStockLocationsByLocation: builder.query<StockLocationItem[], string>({
      query: (locationId) => `/inventory/stock-location/by-location/${locationId}/`,
      providesTags: (result, error, locationId) => [{ type: "StockLocation", id: locationId }],
    }),

    getStockLocation: builder.query<StockLocationItem, number | string>({
      query: (id) => `/inventory/stock-location/${id}/`,
    }),

    getActiveStockLocations: builder.query<StockLocationItem[], void>({
      query: () => "/inventory/stock-location/active_list/",
      providesTags: ["StockLocation"],
    }),
  }),
});

export const {
  useGetStockLocationsQuery,
  useGetStockLocationsByLocationQuery,
  useGetStockLocationQuery,
  useGetActiveStockLocationsQuery,
} = stockLocationApi;
