import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import { StockMove, GetStockMovesParams } from "@/types/stockMove";

export const stockMoveApi = createApi({
  reducerPath: "stockMoveApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getStockMoves: builder.query<StockMove[], GetStockMovesParams>({
      query: (params) => ({
        url: "/inventory/stock-move/",
        ...(params ? { params } : {}),
      }),
    }),
    getStockMove: builder.query<StockMove, string | number>({
      query: (id) => `/inventory/stock-move/${id}/`,
    }),
  }),
});

export const { useGetStockMovesQuery, useGetStockMoveQuery } = stockMoveApi;
