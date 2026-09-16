import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export type PurchaseOrderStatus =
  | "draft"
  | "issued"
  | "partially_received"
  | "fully_received"
  | "fully_billed"
  | "closed"
  | "cancelled"
  | string;

export interface PurchaseOrderLine {
  id: number;
  product: number;
  description: string;
  qty: string;
  unit_price: string;
  line_total: string;
  quantity_received: string;
  quantity_billed: string;
  item_name: string;
  unit?: string | null;
}

export interface EquipmentHire {
  id: number;
  equipment_description: string;
  vendor: number;
  hire_start_date: string;
  expected_return_date: string;
  returned_at: string | null;
  status: "on_hire" | "returned" | "overdue";
}

export interface ProjectPurchaseOrder {
  id: number;
  po_number: string;
  source_request_type: string;
  object_id: number | null;
  vendor: number;
  vendor_name: string;
  currency: number;
  wbs_element: string;
  payment_term: number | null;
  expected_delivery_date: string;
  required_date?: string;
  expected_return_date?: string | null;
  status: PurchaseOrderStatus;
  issued_at: string | null;
  created_by: number;
  total_amount: string;
  created_at: string;
  updated_at: string;
  lines: PurchaseOrderLine[];
  site_location?: string;
  equipment_hire?: EquipmentHire | null;
  wbs_element_details?: {
    id: string;
    serial_number: number;
    name: string;
    quantity: string;
    rate: string;
    amount: string;
    current_budget: string;
    total_budget: string;
    phase: {
      id: string;
      name: string;
      code: string;
      sequence: number;
    };
  };
}

export interface CreatePurchaseOrderRequest {
  vendor: number;
  currency: number;
  wbs_element: string;
  payment_term?: number | null;
  expected_delivery_date: string;
}

export interface UpdatePurchaseOrderRequest extends CreatePurchaseOrderRequest {}

export interface PatchPurchaseOrderRequest extends Partial<CreatePurchaseOrderRequest> {}

export interface ConvertRequestToPurchaseOrderRequest {
  source_type: string;
  source_id: number;
  vendor: number;
  currency: number;
  payment_term?: number | null;
  expected_delivery_date?: string;
  expected_return_date?: string;
}

export interface GetPurchaseOrdersParams {
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

export const projectPurchaseOrdersApi = createApi({
  reducerPath: "projectPurchaseOrdersApi",
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
    getPurchaseOrders: builder.query<
      ProjectPurchaseOrder[],
      GetPurchaseOrdersParams | void
    >({
      query: (params) => ({
        url: "/invoicing/project-purchase-orders/",
        params,
      }),
    }),
    createPurchaseOrder: builder.mutation<
      ProjectPurchaseOrder,
      CreatePurchaseOrderRequest
    >({
      query: (body) => ({
        url: "/invoicing/project-purchase-orders/",
        method: "POST",
        body,
      }),
    }),
    getPurchaseOrderById: builder.query<ProjectPurchaseOrder, number>({
      query: (id) => `/invoicing/project-purchase-orders/${id}/`,
    }),
    updatePurchaseOrder: builder.mutation<
      ProjectPurchaseOrder,
      { id: number; data: UpdatePurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/project-purchase-orders/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchPurchaseOrder: builder.mutation<
      ProjectPurchaseOrder,
      { id: number; data: PatchPurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/project-purchase-orders/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deletePurchaseOrder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/project-purchase-orders/${id}/`,
        method: "DELETE",
      }),
    }),
    cancelPurchaseOrder: builder.mutation<ProjectPurchaseOrder, number>({
      query: (id) => ({
        url: `/invoicing/project-purchase-orders/${id}/cancel/`,
        method: "POST",
      }),
    }),
    closePurchaseOrder: builder.mutation<ProjectPurchaseOrder, number>({
      query: (id) => ({
        url: `/invoicing/project-purchase-orders/${id}/close/`,
        method: "POST",
      }),
    }),
    fullyReceivePurchaseOrder: builder.mutation<ProjectPurchaseOrder, number>({
      query: (id) => ({
        url: `/invoicing/project-purchase-orders/${id}/fully-receive/`,
        method: "POST",
      }),
    }),
    issuePurchaseOrder: builder.mutation<ProjectPurchaseOrder, number>({
      query: (id) => ({
        url: `/invoicing/project-purchase-orders/${id}/issue/`,
        method: "POST",
      }),
    }),
    returnHiredEquipment: builder.mutation<ProjectPurchaseOrder, number>({
      query: (id) => ({
        url: `/invoicing/project-purchase-orders/${id}/equipment-hire/return/`,
        method: "POST",
      }),
    }),
    partiallyReceivePurchaseOrder: builder.mutation<
      ProjectPurchaseOrder,
      number
    >({
      query: (id) => ({
        url: `/invoicing/project-purchase-orders/${id}/partially-receive/`,
        method: "POST",
      }),
    }),
    convertRequestToPurchaseOrder: builder.mutation<
      ProjectPurchaseOrder,
      { data: ConvertRequestToPurchaseOrderRequest }
    >({
      query: ({ data }) => ({
        url: `/invoicing/project-purchase-orders/convert/`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrderByIdQuery,
  useUpdatePurchaseOrderMutation,
  usePatchPurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,
  useFullyReceivePurchaseOrderMutation,
  useIssuePurchaseOrderMutation,
  useReturnHiredEquipmentMutation,
  usePartiallyReceivePurchaseOrderMutation,
  useConvertRequestToPurchaseOrderMutation,
} = projectPurchaseOrdersApi;
