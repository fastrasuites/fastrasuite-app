import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export const stockLocationApi = createApi({
  reducerPath: "stockLocationApi",
  tagTypes: ["StockLocation"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getStockLocations: builder.query<
      StockLocationItem[],
      GetStockLocationsParams | void
    >({
      query: (params) => ({
        url: "/inventory/stock-location/",
        params: params || undefined,
      }),
      providesTags: ["StockLocation"],
    }),

    getStockLocationsByLocation: builder.query<StockLocationItem[], string>({
      query: (locationId) =>
        `/inventory/stock-location/by-location/${locationId}/`,
      providesTags: (result, error, locationId) => [
        { type: "StockLocation", id: locationId },
      ],
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
