import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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
  is_billed?: boolean;
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

export const projectPurchaseOrdersApi = createApi({
  reducerPath: "projectPurchaseOrdersApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<
      ProjectPurchaseOrder[],
      GetPurchaseOrdersParams | void
    >({
      query: (params) => ({
        url: "/invoicing/project-purchase-orders/",
        ...(params ? { params } : {}),
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
