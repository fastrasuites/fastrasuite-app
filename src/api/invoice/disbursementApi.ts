import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DisbursementSourceType = "PETTY_CASH" | string;

export type DisbursementMethod = "CASH" | "BANK_TRANSFER" | string;

export type DisbursementStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled"
  | "paid"
  | string;

/* ------------------------- Full Disbursement Shape ------------------------ */

export interface Disbursement {
  id: number;
  petty_cash_reference: string;
  bank_account_name: string;
  created_by_name: string;
  approved_by_name: string;
  reference_number: string;
  source_type: DisbursementSourceType;
  disbursement_method: DisbursementMethod;
  amount: string;
  payment_date: string | null; // YYYY-MM-DD (may be null until paid)
  status: DisbursementStatus;
  payment_reference: string | null;
  notes: string | null;
  approved_at: string | null;
  paid_at: string | null;
  petty_cash_request: number;
  company_bank_account: number;
  created_by: number;
  approved_by: number | null;

  // Cash-specific
  recipient_name?: string | null;
  cash_received?: boolean | null;

  // Bank-transfer-specific
  recipient_bank_name?: string | null;
  recipient_account_number?: string | null;
  recipient_account_name?: string | null;

  // Optional supporting document (URL after upload)
  document?: string | null;
}

/* ------------------------- Create / Update Payloads ----------------------- */

/** Shared base fields for both cash and bank-transfer creates */
interface BaseCreateDisbursement {
  source_type: "PETTY_CASH";
  petty_cash_request: number;
  company_bank_account: number;
  payment_reference?: string; // optional – backend will generate if omitted
  notes?: string;             // optional
  document?: string | File | null; // optional supporting file (e.g. signed voucher)
}

/** Cash hand-out variant */
export type CreateCashDisbursement = BaseCreateDisbursement & {
  disbursement_method: "CASH";
  recipient_name: string;
  cash_received: boolean;
  // bank fields must not be sent
  recipient_bank_name?: never;
  recipient_account_number?: never;
  recipient_account_name?: never;
};

/** Bank transfer variant */
export type CreateBankTransferDisbursement = BaseCreateDisbursement & {
  disbursement_method: "BANK_TRANSFER";
  recipient_bank_name: string;
  recipient_account_number: string;
  recipient_account_name: string;
  cash_received?: false; // typically false / omitted
  // cash field must not be sent
  recipient_name?: never;
};

/**
 * Discriminated union – prefer this for type-safe construction.
 * At runtime you will usually send FormData when a file is present.
 */
export type CreateDisbursementRequest =
  | CreateCashDisbursement
  | CreateBankTransferDisbursement;

/** What the mutation actually accepts (JSON or FormData) */
export type CreateDisbursementBody = FormData | CreateDisbursementRequest;

/**
 * Fields that can be updated via PUT / PATCH.
 * source_type, petty_cash_request and disbursement_method are immutable after creation.
 */
export interface UpdateDisbursementRequest {
  company_bank_account?: number;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  // optional re-upload of supporting document
  document?: string | File | null;

  // Cash fields (only relevant when method = CASH)
  recipient_name?: string;
  cash_received?: boolean;

  // Bank-transfer fields (only relevant when method = BANK_TRANSFER)
  recipient_bank_name?: string;
  recipient_account_number?: string;
  recipient_account_name?: string;
}

export type PatchDisbursementRequest = Partial<UpdateDisbursementRequest>;

/** Action endpoints may receive a body or none at all */
export type DisbursementActionBody =
  | CreateDisbursementRequest
  | UpdateDisbursementRequest
  | Record<string, unknown>
  | FormData
  | undefined
  | null;

/* ----------------------------- List Params -------------------------------- */

export interface GetDisbursementsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/* -------------------------------------------------------------------------- */
/*                              Base Query Helper                             */
/* -------------------------------------------------------------------------- */

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol =
    apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")
      ? "http"
      : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

/* -------------------------------------------------------------------------- */
/*                                   API                                      */
/* -------------------------------------------------------------------------- */

export const disbursementsApi = createApi({
  reducerPath: "disbursementsApi",
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
      // Let the browser set the correct multipart/form-data boundary
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
            data: await response.json().catch(() => null),
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
  tagTypes: ["Disbursement"],
  endpoints: (builder) => ({
    /* ---------------------------------------------------------------------- */
    /*                                List                                    */
    /* ---------------------------------------------------------------------- */
    getDisbursements: builder.query<
      Disbursement[],
      GetDisbursementsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/disbursements/",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Disbursement" as const,
                id,
              })),
              { type: "Disbursement", id: "LIST" },
            ]
          : [{ type: "Disbursement", id: "LIST" }],
    }),

    /* ---------------------------------------------------------------------- */
    /*                               Retrieve                                 */
    /* ---------------------------------------------------------------------- */
    getDisbursementById: builder.query<Disbursement, number>({
      query: (id) => `/invoicing/disbursements/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Disbursement", id }],
    }),

    /* ---------------------------------------------------------------------- */
    /*                                Create                                  */
    /* ---------------------------------------------------------------------- */
    /**
     * Create a Disbursement.
     * Prefer FormData when a supporting document (file) is included.
     * Supports both CASH and BANK_TRANSFER methods via the discriminated union.
     */
    createDisbursement: builder.mutation<Disbursement, CreateDisbursementBody>({
      query: (body) => ({
        url: "/invoicing/disbursements/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Disbursement", id: "LIST" }],
    }),

    /* ---------------------------------------------------------------------- */
    /*                                Update                                  */
    /* ---------------------------------------------------------------------- */
    updateDisbursement: builder.mutation<
      Disbursement,
      { id: number; data: UpdateDisbursementRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    patchDisbursement: builder.mutation<
      Disbursement,
      { id: number; data: PatchDisbursementRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    /* ---------------------------------------------------------------------- */
    /*                                Delete                                  */
    /* ---------------------------------------------------------------------- */
    /** Body is optional – you may call with just the id */
    deleteDisbursement: builder.mutation<
      void,
      number | { id: number; data?: DisbursementActionBody }
    >({
      query: (arg) => {
        const id = typeof arg === "number" ? arg : arg.id;
        const body = typeof arg === "number" ? undefined : arg.data;
        return {
          url: `/invoicing/disbursements/${id}/`,
          method: "DELETE",
          body,
        };
      },
      invalidatesTags: (_result, _error, arg) => {
        const id = typeof arg === "number" ? arg : arg.id;
        return [
          { type: "Disbursement", id },
          { type: "Disbursement", id: "LIST" },
        ];
      },
    }),

    /* ---------------------------------------------------------------------- */
    /*                          Action Endpoints                              */
    /* ---------------------------------------------------------------------- */
    /**
     * All action endpoints accept an optional body.
     * You can call them with just `{ id }` or with `{ id, data }`.
     */
    approveDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/approve/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    cancelDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/cancel/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    payDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/pay/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    rejectDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/reject/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    submitDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/submit/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),
  }),
});

/* -------------------------------------------------------------------------- */
/*                                   Hooks                                    */
/* -------------------------------------------------------------------------- */

export const {
  // Queries
  useGetDisbursementsQuery,
  useGetDisbursementByIdQuery,
  useLazyGetDisbursementsQuery,
  useLazyGetDisbursementByIdQuery,

  // Mutations
  useCreateDisbursementMutation,
  useUpdateDisbursementMutation,
  usePatchDisbursementMutation,
  useDeleteDisbursementMutation,
  useApproveDisbursementMutation,
  useCancelDisbursementMutation,
  usePayDisbursementMutation,
  useRejectDisbursementMutation,
  useSubmitDisbursementMutation,
} = disbursementsApi;