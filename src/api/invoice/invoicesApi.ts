import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import { EmbeddedUserDetails } from "./paymentsApi";

export type InvoiceStatus =
  | "paid"
  | "partial"
  | "pending"
  | "draft"
  | "cancelled";

export type InvoicingMethod = "ordered_quantity" | "delivered_quantity";

export interface VendorBankAccount {
  id: number;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  branch_code: string;
  confirmed: boolean;
  updated_at: string;
  updated_by: number;
}

export interface VendorDetails {
  id: number;
  vendor_code: string;
  profile_picture: string | null;
  vendor_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  address: string;
  tax_id: string;
  tax_registered: boolean;
  tax_number: string;
  vendor_type: "supplier" | "contractor" | string;
  status: "active" | "inactive" | string;
  bank_account: VendorBankAccount | null;
  created_on: string;
  updated_on: string;
  payment_term: number | null;
}

export interface ProductCategoryDetails {
  id: number;
  url: string;
  category_name: string;
  description: string;
  is_active: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitOfMeasureDetails {
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on: string;
  is_hidden: boolean;
}

export interface ProductDetails {
  id: number;
  url: string;
  product_code: string;
  product_name: string;
  description: string;
  product_category: number;
  product_category_details: ProductCategoryDetails;
  unit_of_measure: number;
  unit_of_measure_details: UnitOfMeasureDetails;
  standard_cost: string;
  reorder_point: string;
  is_active: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  product: number;
  product_details: ProductDetails;
  quantity: number;
  unit_price: string;
  invoice: string;
}

export interface Invoice {
  created_by: number;
  updated_by: number;
  date_created: string;
  date_updated: string;
  is_hidden: boolean;
  created_by_details: EmbeddedUserDetails;
  updated_by_details: EmbeddedUserDetails;
  id: string;
  due_date: string;
  status: InvoiceStatus;
  vendor: number;
  vendor_details: VendorDetails;
  total_amount: string;
  amount_paid: string;
  balance: string;
  method: InvoicingMethod;
  purchase_order: string | null;
  purchase_order_details: string | null;
  invoice_items: InvoiceItem[];
}

export interface CreateInvoiceItemRequest {
  product: number;
  quantity: number;
  unit_price: string;
}

export interface CreateInvoiceRequest {
  is_hidden?: boolean;
  due_date: string;
  status?: InvoiceStatus;
  vendor: number;
  purchase_order?: string | null;
  invoice_items: CreateInvoiceItemRequest[];
}

export interface UpdateInvoiceRequest extends CreateInvoiceRequest {}

export interface PatchInvoiceRequest extends Partial<CreateInvoiceRequest> {}

export interface GetInvoicesParams {
  due_date?: string;
  method?: InvoicingMethod;
  search?: string;
  status?: InvoiceStatus;
  [key: string]: string | number | boolean | undefined;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const invoicesApi = createApi({
  reducerPath: "invoicesApi",
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

    const isFormData =
      args && typeof args === "object" && args.body instanceof FormData;

    if (isFormData) {
      headers.delete("content-type");
    }

    try {
      const response = await fetch(url, {
        method: typeof args === "string" ? "GET" : args.method || "GET",
        headers,
        body:
          typeof args === "string"
            ? undefined
            : args.body
              ? isFormData
                ? args.body
                : JSON.stringify(args.body)
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
    getInvoices: builder.query<Invoice[], GetInvoicesParams | void>({
      query: (params) => ({
        url: "/invoicing/invoice/",
        params,
      }),
    }),
    createInvoice: builder.mutation<Invoice, CreateInvoiceRequest>({
      query: (body) => ({
        url: "/invoicing/invoice/",
        method: "POST",
        body,
      }),
    }),
    getInvoiceById: builder.query<Invoice, string>({
      query: (id) => `/invoicing/invoice/${id}/`,
    }),
    updateInvoice: builder.mutation<
      Invoice,
      { id: string; data: UpdateInvoiceRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/invoice/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchInvoice: builder.mutation<
      Invoice,
      { id: string; data: PatchInvoiceRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/invoice/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/invoicing/invoice/${id}/`,
        method: "DELETE",
      }),
    }),
    softDeleteInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/invoicing/invoice/${id}/soft_delete/`,
        method: "DELETE",
      }),
    }),
    toggleInvoiceHiddenStatus: builder.mutation<
      Invoice,
      { id: string; data: UpdateInvoiceRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/invoice/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchToggleInvoiceHiddenStatus: builder.mutation<
      Invoice,
      { id: string; data: PatchInvoiceRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/invoice/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data,
      }),
    }),
    getActiveInvoices: builder.query<Invoice[], void>({
      query: () => "/invoicing/invoice/active_list/",
    }),
    getHiddenInvoices: builder.query<Invoice[], void>({
      query: () => "/invoicing/invoice/hidden_list/",
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useGetInvoiceByIdQuery,
  useUpdateInvoiceMutation,
  usePatchInvoiceMutation,
  useDeleteInvoiceMutation,
  useSoftDeleteInvoiceMutation,
  useToggleInvoiceHiddenStatusMutation,
  usePatchToggleInvoiceHiddenStatusMutation,
  useGetActiveInvoicesQuery,
  useGetHiddenInvoicesQuery,
} = invoicesApi;
