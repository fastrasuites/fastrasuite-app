import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export const COMPANY_TAG = "Company" as const;

export const companyApi = createApi({
  reducerPath: "companyApi",
  tagTypes: [COMPANY_TAG],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
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

    changeAdminPassword: builder.mutation<
      { detail: string },
      {
        old_password: string;
        new_password: string;
        confirm_password: string;
        user_id: number;
      }
    >({
      query: (body) => ({
        url: "/company/change-admin-password/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useChangeAdminPasswordMutation,
} = companyApi;
