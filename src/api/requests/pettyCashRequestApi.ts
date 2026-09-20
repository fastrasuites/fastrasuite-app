import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export interface PettyCashRequest {
  id: number;
  available_budget?: string | number;
  reference_id?: string;
  amount_requested?: string | number;
  amount?: string | number;
  purpose?: string;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  date_created?: string;
  is_hidden?: boolean;
  project?: number;
  project_id?: number;
  project_request?: number | {
    id: number;
    reference_id?: string;
    request_type?: string;
    status?: string;
    request_amount?: number;
    created_by?: number;
    created_by_details?: any;
    requester_details?: any;
    [key: string]: any;
  };
  project_request_id?: number;
  project_details?: {
    id: number;
    name: string;
    project_code?: string;
    code?: string;
  };
  phase_details?: {
    id: string;
    name: string;
    code?: string;
  };
  activity_details?: {
    id: string;
    name: string;
    serial_number?: number;
  };
  created_by?: number;
  created_by_name?: string;
  created_by_details?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  requester_details?: {
    id: number;
    user?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  status?: string;
  detail?: any;
  [key: string]: any;
}

export interface GetPettyCashParams {
  ordering?: string;
  search?: string;
  project?: number | string;
  status?: string;
  [key: string]: any;
}

export interface CreatePettyCashRequest {
  project: number;
  wbs_element: string; // UUID of task
  activity?: string; // UUID of task
  amount_requested: string; // decimal string
  purpose: string;
  description: string;
  notes?: string;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const pettyCashRequestApi = createApi({
  reducerPath: "pettyCashRequestApi",
  tagTypes: ["PettyCashRequest"],
  baseQuery: async (args, api, extraOptions) => {
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
        body: typeof args === "string" ? undefined : args.body ? JSON.stringify(args.body) : undefined,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json(),
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
    getPettyCashRequests: builder.query<PettyCashRequest[], GetPettyCashParams | void>({
      query: (params) => ({
        url: "/project-requests/petty-cash/",
        params: params || undefined,
      }),
      providesTags: (result) => {
        const list = Array.isArray(result)
          ? result
          : (result as any)?.results && Array.isArray((result as any).results)
          ? (result as any).results
          : [];
        return [
          ...list.map(({ id }: { id: any }) => ({ type: "PettyCashRequest" as const, id })),
          { type: "PettyCashRequest", id: "LIST" },
          "PettyCashRequest",
        ];
      },
    }),
    getPettyCashRequest: builder.query<PettyCashRequest, number | string>({
      query: (id) => `/project-requests/petty-cash/${id}/`,
      providesTags: (result, error, id) => [{ type: "PettyCashRequest", id }, "PettyCashRequest"],
    }),
    createPettyCashRequest: builder.mutation<PettyCashRequest, CreatePettyCashRequest>({
      query: (body) => ({
        url: "/project-requests/petty-cash/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PettyCashRequest", { type: "PettyCashRequest", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPettyCashRequestsQuery,
  useGetPettyCashRequestQuery,
  useCreatePettyCashRequestMutation,
} = pettyCashRequestApi;
