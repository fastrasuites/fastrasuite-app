import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export interface StockOnHandMetrics {
  total_products: number;
  products_in_stock: number;
  low_stock: number;
  out_of_stock: number;
}

export interface StockOnHandProduct {
  id: number;
  code: string;
  product: string;
  category: string;
  category_id?: number;
  unit: string;
  unit_id?: number;
  stock_on_hand: number;
  reorder_point: number | null;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  status_key: "in_stock" | "low_stock" | "out_of_stock";
}

export interface StockOnHandListResponse {
  metrics: StockOnHandMetrics;
  count: number;
  results: StockOnHandProduct[];
}

export interface StockOnHandTransaction {
  id: number;
  date: string;
  reference: string;
  source_document_id?: string;
  transaction: string;
  transaction_type: string;
  source_location_name?: string;
  destination_location_name?: string;
  source_to_destination: string;
  in_qty: number | null;
  out_qty: number | null;
  stock_on_hand: number;
  moved_by_name: string;
}

export interface StockOnHandDetailResponse {
  basic_information: StockOnHandProduct;
  recent_transactions: StockOnHandTransaction[];
}

export interface GetStockOnHandParams {
  location?: string | number;
  category?: string | number;
  status?: "in_stock" | "low_stock" | "out_of_stock";
  search?: string;
}

export const stockOnHandApi = createApi({
  reducerPath: "stockOnHandApi",
  tagTypes: ["StockOnHand"],
  baseQuery: async (args, api) => {
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
        return {
          error: {
            status: response.status,
            data: await response.json().catch(() => ({})),
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
    getStockOnHandList: builder.query<StockOnHandListResponse, GetStockOnHandParams | void>({
      query: (params) => ({
        url: "/inventory/stock-on-hand/",
        params: params || {},
      }),
      providesTags: ["StockOnHand"],
    }),

    getStockOnHandDetail: builder.query<
      StockOnHandDetailResponse,
      { id: string | number; location?: string | number; limit?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/inventory/stock-on-hand/${encodeURIComponent(String(id))}/`,
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: "StockOnHand", id }],
    }),

    getStockOnHandMetrics: builder.query<StockOnHandMetrics, { location?: string | number } | void>({
      query: (params) => ({
        url: "/inventory/stock-on-hand/metrics/",
        params: params || {},
      }),
      providesTags: ["StockOnHand"],
    }),
  }),
});

export const {
  useGetStockOnHandListQuery,
  useGetStockOnHandDetailQuery,
  useGetStockOnHandMetricsQuery,
} = stockOnHandApi;
