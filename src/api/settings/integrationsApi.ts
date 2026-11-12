import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

/* ------------------------------------------------------------------ */
/* Base path                                                           */
/* ------------------------------------------------------------------ */
/**
 * All accounting-integration endpoints live under this prefix, per the
 * swagger dated 12 Nov 2026 (e.g. /accounting/odoo/connection/,
 * /accounting/odoo/vendor-mappings/...). If the API moves, change ONLY
 * this constant.
 */
export const ACCOUNTING_BASE = "/accounting/odoo";

/* ------------------------------------------------------------------ */
/* Choice constants (mirrors the vendorsApi pattern)                   */
/* ------------------------------------------------------------------ */

/**
 * Values for the connection form's "Authentication method" select.
 * Sent to the API as `credential_type` (swagger example: "password").
 */
export const ODOO_AUTH_METHODS = [
  { value: "password", label: "Password" },
  { value: "api_key", label: "API Key" },
] as const;

export type OdooCredentialType = (typeof ODOO_AUTH_METHODS)[number]["value"];

export const isOdooCredentialType = (
  value: unknown,
): value is OdooCredentialType =>
  ODOO_AUTH_METHODS.some((m) => m.value === value);

/**
 * Version options for the design's "Odoo version" select.
 * NOTE: the save endpoint does not accept `odoo_version` – the backend
 * detects and returns it (see GET /connection/). The field is kept in
 * the form for design parity; it is not sent to the API.
 */
export const ODOO_VERSIONS = [
  "13.0",
  "14.0",
  "15.0",
  "16.0",
  "17.0",
  "18.0",
  "19.0",
  "20.0",
] as const;

/** Lifecycle of a mapping row (vendor + account). */
export const MAPPING_STATUS = {
  suggested: "Suggested",
  confirmed: "Confirmed",
  rejected: "Rejected",
} as const;

export type MappingStatus = keyof typeof MAPPING_STATUS;

/** Documented values of the journals list `type` filter. */
export const ODOO_JOURNAL_TYPES = [
  "bank",
  "cash",
  "general",
  "purchase",
  "sale",
] as const;

export type OdooJournalType = (typeof ODOO_JOURNAL_TYPES)[number];

/** Documented values of the mapping-list `status` filter. */
export const MAPPING_STATUS_FILTERS = [
  "suggested",
  "confirmed",
  "rejected",
] as const;

/* ------------------------------------------------------------------ */
/* Error helper                                                        */
/* ------------------------------------------------------------------ */

/**
 * Error responses are documented as { detail, company_id?, journal_id? }.
 * RTK Query trigger results carry the HTTP error body in `.error.data`.
 */
export const getErrorDetail = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const data = (error as { data?: unknown }).data;
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return undefined;
};

/* ------------------------------------------------------------------ */
/* Types – exact shapes from the swagger (12 Nov 2026)                 */
/* ------------------------------------------------------------------ */

/* ------------------------- Connection ------------------------- */

/**
 * GET/PUT/PATCH /accounting/odoo/connection/.
 * `configured=false` is returned when no connection exists – the other
 * fields are only meaningful once configured=true.
 */
export interface OdooConnection {
  configured: boolean;
  id?: number;
  name?: string;
  base_url?: string;
  database?: string;
  username?: string;
  credential_type?: OdooCredentialType | string;
  /** True when a secret is stored; the API never returns the value. */
  has_secret?: boolean;
  selected_company_id?: number | null;
  selected_company_name?: string | null;
  /** Detected server-side (not part of the save body). */
  odoo_version?: string;
  /** "connected" | "not_connected" */
  connection_status?: string;
  last_tested_at?: string | null;
  last_error?: string | null;
  is_active?: boolean;
}

/** Body of PUT /accounting/odoo/connection/ (full save, e.g. create). */
export interface SaveConnectionRequest {
  /** Record label; the UI has no input for it and sends "Odoo". */
  name?: string;
  base_url: string;
  database: string;
  username: string;
  credential_type: OdooCredentialType;
  /** Omit on PATCH to keep the stored secret. */
  secret?: string;
  is_active?: boolean;
}

/** PATCH /accounting/odoo/connection/ – partial validation per swagger. */
export type PatchConnectionRequest = Partial<SaveConnectionRequest>;

/** Response of POST /accounting/odoo/connection/test/. HTTP 400 with
 *  connected=false + detail when the test fails. */
export interface TestConnectionResponse {
  connected?: boolean;
  version?: string;
  detail?: string;
}

/* ------------------------- Companies ------------------------- */

export interface OdooCompany {
  id: number;
  name: string;
  currency?: string;
}

/** Response of POST /accounting/odoo/companies/select/. */
export interface SelectCompanyResponse {
  selected_company_id?: number;
  selected_company_name?: string | null;
}

/* ------------------------- Partners ------------------------- */

export interface OdooPartner {
  id: number;
  name: string;
  email?: string | null;
  ref?: string | null;
  phone?: string | null;
  company_id?: number;
  is_company?: boolean;
  type?: string;
  supplier_rank?: number;
  supplier?: boolean;
}

/* --------------------- Vendor mappings ---------------------- */

export interface FastraVendor {
  id: number;
  vendor_code?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  type?: string;
}

export interface OdooPartnerRef {
  id: number;
  name?: string;
  email?: string | null;
  ref?: string | null;
}

export interface VendorMapping {
  id: number;
  fastra_vendor?: FastraVendor | null;
  odoo_partner?: OdooPartnerRef | null;
  status?: MappingStatus | string;
  match_method?: string | null;
  match_score?: number | null;
  rejection_reason?: string | null;
  confirmed_by?: number | string | null;
  confirmed_at?: string | null;
}

export interface ConfirmVendorMappingResponse {
  detail?: string;
  mapping_id?: number;
  fastra_vendor_id?: number;
  odoo_partner_id?: number;
  status?: string;
  confirmed_by?: string | number;
  confirmed_at?: string;
}

export interface RejectMappingResponse {
  detail?: string;
  mapping_id?: number;
  status?: string;
  rejection_reason?: string | null;
}

/** Counters returned by POST /vendor-mappings/suggest/ and
 *  POST /account-mappings/suggest/. */
export interface MappingSuggestSummary {
  company_id?: number;
  odoo_accounts_checked?: number;
  fastra_accounts_checked?: number;
  odoo_partners_checked?: number;
  fastra_vendors_checked?: number;
  mappings_created?: number;
  mappings_refreshed?: number;
  unmatched?: number;
  confirmed_or_rejected_preserved?: number;
}

/* --------------------- Chart of accounts -------------------- */

export interface OdooAccount {
  id: number;
  code?: string;
  name?: string;
  account_type?: string;
  company_id?: number;
}

export interface FastraAccount {
  id: number;
  code?: string;
  name?: string;
  type?: string;
}

export interface OdooAccountRef {
  id: number;
  code?: string;
  name?: string;
  type?: string;
}

export interface AccountMapping {
  id: number;
  fastra_account?: FastraAccount | null;
  odoo_account?: OdooAccountRef | null;
  status?: MappingStatus | string;
  match_method?: string | null;
  match_score?: number | null;
  rejection_reason?: string | null;
  confirmed_by?: number | string | null;
  confirmed_at?: string | null;
}

export interface ConfirmAccountMappingResponse {
  detail?: string;
  mapping_id?: number;
  status?: string;
  fastra_account_id?: number;
  odoo_account_id?: number;
  confirmed_by?: string | number;
  confirmed_at?: string;
}

/* ------------------------- Journals ------------------------- */

export interface OdooJournal {
  id: number;
  name?: string;
  code?: string;
  type?: string;
  company_id?: number;
}

export interface JournalRef {
  id: number;
  name?: string;
  code?: string;
}

/** GET /accounting/odoo/journals/ */
export interface JournalsResponse {
  company_id?: number;
  count?: number;
  journals?: OdooJournal[];
  default_purchase_journal?: JournalRef | null;
  default_payment_journal?: JournalRef | null;
}

/** GET /accounting/odoo/journals/default-purchase/ */
export interface DefaultPurchaseJournalResponse {
  configured?: boolean;
  company_id?: number;
  default_purchase_journal?: JournalRef | null;
}

/** GET /accounting/odoo/journals/payment/ */
export interface DefaultPaymentJournalResponse {
  configured?: boolean;
  company_id?: number;
  default_payment_journal?: JournalRef | null;
}

/** Response of POST /journals/default-purchase/ and POST /journals/payment/ */
export interface SetJournalResponse {
  detail?: string;
  company_id?: number;
  default_purchase_journal?: JournalRef | null;
  default_payment_journal?: JournalRef | null;
}

/* ------------------------------------------------------------------ */
/* Mutation argument types                                             */
/* ------------------------------------------------------------------ */

export interface SelectCompanyArgs {
  companyId: number;
}

export interface ConfirmVendorMappingArgs {
  mappingId: number;
  /** Omit to confirm the suggested partner as-is. */
  odooPartnerId?: number;
}

export interface ConfirmAccountMappingArgs {
  mappingId: number;
  /** Omit to confirm the suggested account as-is. */
  odooAccountId?: number;
}

export interface RejectMappingArgs {
  mappingId: number;
  /** Optional – stored as rejection_reason. */
  reason?: string;
}

export interface SetJournalArgs {
  journalId: number;
}

/* ------------------------------------------------------------------ */
/* Field helpers                                                       */
/* ------------------------------------------------------------------ */

export type OdooConnectionStatus = "connected" | "not_connected";

export const getConnectionStatus = (
  c?: OdooConnection | null,
): OdooConnectionStatus =>
  c?.connection_status === "connected" ? "connected" : "not_connected";

export const getConnectionBaseUrl = (c?: OdooConnection | null): string =>
  c?.base_url ?? "";

/** The company selected on the connection (may be null on both sides). */
export interface OdooSelectedCompany {
  id: number | null;
  name: string | null;
}

export const getConnectionCompany = (
  c?: OdooConnection | null,
): OdooSelectedCompany => ({
  id: c?.selected_company_id ?? null,
  name: c?.selected_company_name ?? null,
});

export const getMappingId = (m: VendorMapping | AccountMapping): number =>
  m?.id ?? 0;

export const getMappingStatus = (
  m?:
    | VendorMapping
    | AccountMapping
    | { status?: MappingStatus | string }
    | null,
): MappingStatus | string => m?.status ?? "";

export const getVendorName = (m: VendorMapping): string =>
  m?.fastra_vendor?.name ?? "—";

export const getVendorCode = (m: VendorMapping): string =>
  m?.fastra_vendor?.vendor_code ?? "";

export const getOdooPartnerName = (m: VendorMapping): string =>
  m?.odoo_partner?.name ?? "";

export const getOdooPartnerId = (m: VendorMapping): number | null =>
  m?.odoo_partner?.id ?? null;

export const getPartnerId = (p: OdooPartner): number => p?.id ?? 0;

export const getPartnerLabel = (p: OdooPartner): string =>
  p?.name ?? `#${p?.id ?? ""}`;

/** "600 Office Supplies" style label for the FastrSuite side. */
export const getLocalAccountLabel = (m: AccountMapping): string => {
  const a = m?.fastra_account;
  if (!a) return "—";
  return [a.code, a.name].filter(Boolean).join(" ") || a.name || `#${a.id}`;
};

/** FastrSuite account type – used to group the mapping table. */
export const getLocalAccountType = (m: AccountMapping): string | null =>
  m?.fastra_account?.type ?? null;

export const getOdooAccountName = (m: AccountMapping): string => {
  const a = m?.odoo_account;
  if (!a) return "";
  return [a.code, a.name].filter(Boolean).join(" ");
};

export const getOdooAccountId = (m: AccountMapping): number | null =>
  m?.odoo_account?.id ?? null;

export const getJournalId = (j: OdooJournal | JournalRef): number => j?.id ?? 0;

export const getJournalLabel = (
  j?: OdooJournal | JournalRef | null,
): string => {
  if (!j) return "";
  return j.code ? `${j.name} (${j.code})` : (j.name ?? "");
};

/** Tolerant success check for the /connection/test/ response. */
export const isTestConnectionSuccessful = (
  r?: TestConnectionResponse | null,
): boolean => r?.connected === true;

export const getTestConnectionMessage = (
  r?: TestConnectionResponse | null,
): string | undefined => r?.detail;

/* ------------------------------------------------------------------ */
/* Query params                                                        */
/* ------------------------------------------------------------------ */

export interface ListMappingsParams {
  status?: MappingStatus;
}

export interface ListAccountsParams {
  search?: string;
}

export interface ListPartnersParams {
  search?: string;
}

export interface ListJournalsParams {
  search?: string;
  type?: OdooJournalType;
}

/* ------------------------------------------------------------------ */
/* API slice                                                           */
/* ------------------------------------------------------------------ */

export const integrationsApi = createApi({
  reducerPath: "integrationsApi",
  tagTypes: [
    "Connection",
    "Companies",
    "Partners",
    "VendorMappings",
    "Accounts",
    "AccountMappings",
    "Journals",
    "DefaultPurchaseJournal",
    "PaymentJournal",
  ],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    /* ---------------- Connection ---------------- */

    getConnection: builder.query<OdooConnection, void>({
      query: () => `${ACCOUNTING_BASE}/connection/`,
      // configured=false is a valid 200 response (no connection yet).
      providesTags: ["Connection"],
    }),

    /** Full save – used to create a connection (PUT validates all fields). */
    updateConnection: builder.mutation<OdooConnection, SaveConnectionRequest>({
      query: (body) => ({
        url: `${ACCOUNTING_BASE}/connection/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Connection"],
    }),

    /** Partial save – used to edit a connection (omit `secret` to keep it)
     *  and to disconnect ({ is_active: false }). */
    patchConnection: builder.mutation<OdooConnection, PatchConnectionRequest>({
      query: (body) => ({
        url: `${ACCOUNTING_BASE}/connection/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Connection"],
    }),

    /** Tests the SAVED connection – the endpoint takes no request body.
     *  Persist new settings first (PUT/PATCH), then call this. */
    testConnection: builder.mutation<TestConnectionResponse, void>({
      query: () => ({
        url: `${ACCOUNTING_BASE}/connection/test/`,
        method: "POST",
      }),
    }),

    /* ---------------- Companies ---------------- */

    getCompanies: builder.query<OdooCompany[], void>({
      query: () => `${ACCOUNTING_BASE}/companies/`,
      transformResponse: (response: unknown): OdooCompany[] =>
        (response as { companies?: OdooCompany[] } | null)?.companies ?? [],
      providesTags: ["Companies"],
    }),

    selectCompany: builder.mutation<SelectCompanyResponse, SelectCompanyArgs>({
      query: ({ companyId }) => ({
        url: `${ACCOUNTING_BASE}/companies/select/`,
        method: "POST",
        body: { company_id: companyId },
      }),
      // Mappings and journals belong to the selected company – refetch all.
      invalidatesTags: [
        "Connection",
        "Companies",
        "VendorMappings",
        "AccountMappings",
        "Journals",
        "DefaultPurchaseJournal",
        "PaymentJournal",
      ],
    }),

    /* ---------------- Partners (Odoo contacts) ---------------- */

    getPartners: builder.query<OdooPartner[], ListPartnersParams | void>({
      query: (params) => ({
        url: `${ACCOUNTING_BASE}/partners/`,
        ...(params && Object.keys(params).length > 0 ? { params } : {}),
      }),
      transformResponse: (response: unknown): OdooPartner[] =>
        (response as { partners?: OdooPartner[] } | null)?.partners ?? [],
      providesTags: ["Partners"],
    }),

    /* ---------------- Vendor mappings ---------------- */

    getVendorMappings: builder.query<
      VendorMapping[],
      ListMappingsParams | void
    >({
      query: (params) => ({
        url: `${ACCOUNTING_BASE}/vendor-mappings/`,
        ...(params && Object.keys(params).length > 0 ? { params } : {}),
      }),
      transformResponse: (response: unknown): VendorMapping[] =>
        (response as { results?: VendorMapping[] } | null)?.results ?? [],
      providesTags: ["VendorMappings"],
    }),

    suggestVendorMappings: builder.mutation<MappingSuggestSummary, void>({
      query: () => ({
        url: `${ACCOUNTING_BASE}/vendor-mappings/suggest/`,
        method: "POST",
      }),
      invalidatesTags: ["VendorMappings"],
    }),

    confirmVendorMapping: builder.mutation<
      ConfirmVendorMappingResponse,
      ConfirmVendorMappingArgs
    >({
      query: ({ mappingId, odooPartnerId }) => ({
        url: `${ACCOUNTING_BASE}/vendor-mappings/${mappingId}/confirm/`,
        method: "POST",
        body:
          odooPartnerId === undefined ? {} : { odoo_partner_id: odooPartnerId },
      }),
      invalidatesTags: ["VendorMappings"],
    }),

    rejectVendorMapping: builder.mutation<
      RejectMappingResponse,
      RejectMappingArgs
    >({
      query: ({ mappingId, reason }) => ({
        url: `${ACCOUNTING_BASE}/vendor-mappings/${mappingId}/reject/`,
        method: "POST",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["VendorMappings"],
    }),

    /* ---------------- Accounts (Odoo chart of accounts) ---------------- */

    getAccounts: builder.query<OdooAccount[], ListAccountsParams | void>({
      query: (params) => ({
        url: `${ACCOUNTING_BASE}/accounts/`,
        ...(params && Object.keys(params).length > 0 ? { params } : {}),
      }),
      transformResponse: (response: unknown): OdooAccount[] =>
        (response as { accounts?: OdooAccount[] } | null)?.accounts ?? [],
      providesTags: ["Accounts"],
    }),

    /* ---------------- Account mappings ---------------- */

    getAccountMappings: builder.query<
      AccountMapping[],
      ListMappingsParams | void
    >({
      query: (params) => ({
        url: `${ACCOUNTING_BASE}/account-mappings/`,
        ...(params && Object.keys(params).length > 0 ? { params } : {}),
      }),
      transformResponse: (response: unknown): AccountMapping[] =>
        (response as { results?: AccountMapping[] } | null)?.results ?? [],
      providesTags: ["AccountMappings"],
    }),

    suggestAccountMappings: builder.mutation<MappingSuggestSummary, void>({
      query: () => ({
        url: `${ACCOUNTING_BASE}/account-mappings/suggest/`,
        method: "POST",
      }),
      invalidatesTags: ["AccountMappings"],
    }),

    confirmAccountMapping: builder.mutation<
      ConfirmAccountMappingResponse,
      ConfirmAccountMappingArgs
    >({
      query: ({ mappingId, odooAccountId }) => ({
        url: `${ACCOUNTING_BASE}/account-mappings/${mappingId}/confirm/`,
        method: "POST",
        body:
          odooAccountId === undefined ? {} : { odoo_account_id: odooAccountId },
      }),
      invalidatesTags: ["AccountMappings"],
    }),

    rejectAccountMapping: builder.mutation<
      RejectMappingResponse,
      RejectMappingArgs
    >({
      query: ({ mappingId, reason }) => ({
        url: `${ACCOUNTING_BASE}/account-mappings/${mappingId}/reject/`,
        method: "POST",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["AccountMappings"],
    }),

    /* ---------------- Journals ---------------- */

    getJournals: builder.query<OdooJournal[], ListJournalsParams | void>({
      query: (params) => ({
        url: `${ACCOUNTING_BASE}/journals/`,
        ...(params && Object.keys(params).length > 0 ? { params } : {}),
      }),
      transformResponse: (response: unknown): OdooJournal[] =>
        (response as { journals?: OdooJournal[] } | null)?.journals ?? [],
      providesTags: ["Journals"],
    }),

    getDefaultPurchaseJournal: builder.query<
      DefaultPurchaseJournalResponse,
      void
    >({
      query: () => `${ACCOUNTING_BASE}/journals/default-purchase/`,
      providesTags: ["DefaultPurchaseJournal"],
    }),

    setDefaultPurchaseJournal: builder.mutation<
      SetJournalResponse,
      SetJournalArgs
    >({
      query: ({ journalId }) => ({
        url: `${ACCOUNTING_BASE}/journals/default-purchase/`,
        method: "POST",
        body: { journal_id: journalId },
      }),
      invalidatesTags: ["DefaultPurchaseJournal", "Journals"],
    }),

    getPaymentJournal: builder.query<DefaultPaymentJournalResponse, void>({
      query: () => `${ACCOUNTING_BASE}/journals/payment/`,
      providesTags: ["PaymentJournal"],
    }),

    setPaymentJournal: builder.mutation<SetJournalResponse, SetJournalArgs>({
      query: ({ journalId }) => ({
        url: `${ACCOUNTING_BASE}/journals/payment/`,
        method: "POST",
        body: { journal_id: journalId },
      }),
      invalidatesTags: ["PaymentJournal", "Journals"],
    }),
  }),
});

/* ------------------------------------------------------------------ */
/* Exported hooks                                                      */
/* ------------------------------------------------------------------ */

export const {
  useGetConnectionQuery,
  useUpdateConnectionMutation,
  usePatchConnectionMutation,
  useTestConnectionMutation,
  useGetCompaniesQuery,
  useSelectCompanyMutation,
  useGetPartnersQuery,
  useGetVendorMappingsQuery,
  useSuggestVendorMappingsMutation,
  useConfirmVendorMappingMutation,
  useRejectVendorMappingMutation,
  useGetAccountsQuery,
  useGetAccountMappingsQuery,
  useSuggestAccountMappingsMutation,
  useConfirmAccountMappingMutation,
  useRejectAccountMappingMutation,
  useGetJournalsQuery,
  useGetDefaultPurchaseJournalQuery,
  useSetDefaultPurchaseJournalMutation,
  useGetPaymentJournalQuery,
  useSetPaymentJournalMutation,
} = integrationsApi;
