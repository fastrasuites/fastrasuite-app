import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";

export interface Company {
  id: string;
  logo?: string;
  phone: string;
  street_address: string;
  city?: string;
  state?: string;
  country?: string;
  registration_number?: string;
  tax_id?: string;
  industry?: string;
  language?: string;
  company_size?: string;
  website: string;
  roles?: { id: number; name: string }[];
}

const getTenantBaseUrl = (state: RootState) => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const COMPANY_TAG = 'Company' as const;
 
export const companyApi = createApi({
  reducerPath: "companyApi",
  tagTypes: [COMPANY_TAG],
  baseQuery: async (args, api) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) headers.set("authorization", `Bearer ${token}`);

    let url: string;
    let method = "GET";
    let body: any = undefined;

    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      url = `${baseUrl}${args.url}`;
      method = args.method || "GET";

      if (args.body instanceof FormData) {
        body = args.body;
      } else if (args.body) {
        headers.set("content-type", "application/json");
        body = JSON.stringify(args.body);
      }
    }

    try {
      const response = await fetch(url, { method, headers, body });

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
          status: "FETCH_ERROR",
          data: error,
        },
      };
    }
  },

  endpoints: (builder) => ({
    getCompany: builder.query<Company, void>({
      query: () => "/company/update-company-profile/",
      providesTags: [COMPANY_TAG],
    }),

    updateCompany: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/company/update-company-profile/",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: [COMPANY_TAG],
    }),

    changeAdminPassword: builder.mutation<{ detail: string }, { old_password: string; new_password: string; confirm_password: string; user_id: number }>({
      query: (body) => ({
        url: "/company/change-admin-password/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetCompanyQuery, useUpdateCompanyMutation, useChangeAdminPasswordMutation } = companyApi;
