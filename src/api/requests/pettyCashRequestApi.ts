import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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
  project_request?:
    | number
    | {
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

export interface UpdatePettyCashRequest {
  project?: number;
  wbs_element?: string;
  activity?: string;
  amount_requested?: string;
  purpose?: string;
  description?: string;
  notes?: string;
  [key: string]: any;
}

export const pettyCashRequestApi = createApi({
  reducerPath: "pettyCashRequestApi",
  tagTypes: ["PettyCashRequest"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getPettyCashRequests: builder.query<
      PettyCashRequest[],
      GetPettyCashParams | void
    >({
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
          ...list.map(({ id }: { id: any }) => ({
            type: "PettyCashRequest" as const,
            id,
          })),
          { type: "PettyCashRequest", id: "LIST" },
          "PettyCashRequest",
        ];
      },
    }),
    getPettyCashRequest: builder.query<PettyCashRequest, number | string>({
      query: (id) => `/project-requests/petty-cash/${id}/`,
      providesTags: (result, error, id) => [
        { type: "PettyCashRequest", id },
        "PettyCashRequest",
      ],
    }),
    createPettyCashRequest: builder.mutation<
      PettyCashRequest,
      CreatePettyCashRequest
    >({
      query: (body) => ({
        url: "/project-requests/petty-cash/",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "PettyCashRequest",
        { type: "PettyCashRequest", id: "LIST" },
      ],
    }),
    updatePettyCashRequest: builder.mutation<
      PettyCashRequest,
      { id: number | string; data: UpdatePettyCashRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/petty-cash/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "PettyCashRequest",
        { type: "PettyCashRequest", id },
        { type: "PettyCashRequest", id: "LIST" },
      ],
    }),
    patchPettyCashRequest: builder.mutation<
      PettyCashRequest,
      { id: number | string; data: Partial<UpdatePettyCashRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/petty-cash/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "PettyCashRequest",
        { type: "PettyCashRequest", id },
        { type: "PettyCashRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPettyCashRequestsQuery,
  useGetPettyCashRequestQuery,
  useCreatePettyCashRequestMutation,
  useUpdatePettyCashRequestMutation,
  usePatchPettyCashRequestMutation,
} = pettyCashRequestApi;
