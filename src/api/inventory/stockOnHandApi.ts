import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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
  baseQuery: createTenantBaseQuery(),
  endpoints: (builder) => ({
    getStockOnHandList: builder.query<
      StockOnHandListResponse,
      GetStockOnHandParams | void
    >({
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

    getStockOnHandMetrics: builder.query<
      StockOnHandMetrics,
      { location?: string | number } | void
    >({
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
