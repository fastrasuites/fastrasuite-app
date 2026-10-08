import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

// Define types for requests and responses
export interface Vendor {
  url: string;
  id: number;
  company_name: string;
  profile_picture: string;
  email: string;
  address: string;
  phone_number: string;
  is_hidden: boolean;
}

export interface GetVendorsParams {
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateVendorRequest {
  company_name: string;
  email: string;
  address: string;
  phone_number: string;
  profile_picture?: string;
  is_hidden?: boolean;
}

export interface CreateVendorFormData {
  company_name: string;
  email: string;
  address: string;
  phone_number: string;
  profile_picture?: File;
  is_hidden?: boolean;
}

export interface UpdateVendorRequest {
  company_name: string;
  email: string;
  address: string;
  phone_number: string;
  profile_picture?: File;
  is_hidden?: boolean;
}

export interface PatchVendorRequest {
  company_name?: string;
  email?: string;
  address?: string;
  phone_number?: string;
  profile_picture?: File;
  is_hidden?: boolean;
}

export const vendorsApi = createApi({
  reducerPath: "vendorsApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getVendors: builder.query<Vendor[], GetVendorsParams>({
      query: (params) => ({
        url: "/purchase/vendors/",
        ...(params ? { params } : {}),
      }),
    }),
    getVendor: builder.query<Vendor, number>({
      query: (id) => `/purchase/vendors/${id}/`,
    }),

    // Mutation endpoints
    createVendor: builder.mutation<Vendor, CreateVendorFormData>({
      query: (body) => ({
        url: "/purchase/vendors/",
        method: "POST",
        body,
      }),
    }),
    updateVendor: builder.mutation<
      Vendor,
      { id: number; data: UpdateVendorRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/vendors/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchVendor: builder.mutation<
      Vendor,
      { id: number; data: PatchVendorRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/vendors/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteVendor: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/vendors/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  usePatchVendorMutation,
  useDeleteVendorMutation,
} = vendorsApi;
