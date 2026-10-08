import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import { VendorFull, CreateVendorRequest } from "./vendorsApi";

export const vendorImportApi = createApi({
  reducerPath: "vendorImportApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    downloadVendorTemplate: builder.query<VendorFull, void>({
      query: () => "/invoicing/vendors/download-template/",
    }),
    uploadVendorExcel: builder.mutation<
      VendorFull,
      Partial<CreateVendorRequest>
    >({
      query: (body) => ({
        url: "/invoicing/vendors/upload-excel/",
        method: "POST",
        body,
      }),
    }),
    uploadVendorProfilePicture: builder.mutation<
      VendorFull,
      { id: number; data?: Partial<CreateVendorRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendors/${id}/upload-profile-picture/`,
        method: "POST",
        body: data || {},
      }),
    }),
  }),
});

export const {
  useDownloadVendorTemplateQuery,
  useUploadVendorExcelMutation,
  useUploadVendorProfilePictureMutation,
} = vendorImportApi;
