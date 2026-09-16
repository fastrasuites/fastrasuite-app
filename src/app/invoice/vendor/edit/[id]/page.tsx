"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetVendorByIdQuery,
  useUpdateVendorMutation,
  VENDOR_TYPE_CHOICES,
  isVendorType,
} from "@/api/invoice/vendorsApi";
import { useGetVendorBillsQuery } from "@/api/invoice/vendorBillsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { PageGuard } from "@/components/auth/PageGuard";

const schema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorType: z.enum(["supplier", "subcontractor", "labour", "service"]),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  taxRegistered: z.boolean().optional(),
  taxNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();

  const vendorIdStr = (params?.id as string) || "";
  const vendorId = parseInt(vendorIdStr, 10);

  const {
    data: vendor,
    isLoading,
    isError,
  } = useGetVendorByIdQuery(vendorId, {
    skip: isNaN(vendorId),
  });

  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const {
    data: allBills,
    isLoading: isBillsLoading,
    isError: isBillsError,
  } = useGetVendorBillsQuery(undefined, { skip: isNaN(vendorId) });
  const billsList = useMemo(() => {
    const list = Array.isArray(allBills)
      ? allBills
      : (allBills as any)?.results || [];
    return list.filter((b: any) => String(b.vendor) === String(vendorId));
  }, [allBills, vendorId]);
  const hasLinkedBills = billsList.length > 0;
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (vendor) {
      const currentType = isVendorType(vendor.vendor_type)
        ? vendor.vendor_type
        : "supplier";
      reset({
        vendorName: vendor.vendor_name || "",
        vendorType: currentType,
        contactName: vendor.contact_name || "",
        email: vendor.email || "",
        phone: vendor.phone_number || "",
        address: vendor.address || "",
        taxId: vendor.tax_id || "",
        taxRegistered: Boolean(vendor.tax_registered),
        taxNumber: vendor.tax_number || "",
      });
    }
  }, [vendor, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const vendorPayload = {
        vendor_name: data.vendorName,
        contact_name: data.contactName || "",
        email: data.email || "",
        phone_number: data.phone || "",
        address: data.address || "",
        tax_id: data.taxId || "",
        tax_registered: data.taxRegistered ?? false,
        tax_number: data.taxNumber || "",
        vendor_type: data.vendorType,
        status: vendor?.status || "active",
      };

      await updateVendor({ id: vendorId, data: vendorPayload }).unwrap();

      setToast({
        show: true,
        message: "Vendor updated successfully",
        type: "success",
      });
      setTimeout(() => {
        router.push(`/invoice/settings?tab=vendor`);
      }, 1500);
    } catch (err: any) {
      setToast({
        show: true,
        message:
          err?.data?.message || err?.message || "Failed to update vendor",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
          Loading vendor details...
        </div>
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <PageGuard module="invoice" entitlement="configure_invoice">
        <div className="p-6">
          <div className="p-12 text-center text-red-500 bg-white rounded-2xl border border-gray-100">
            Failed to load vendor.
          </div>
        </div>
      </PageGuard>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Edit Vendor</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-600 mb-6">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vendor Name
              </label>
              <input
                {...register("vendorName")}
                placeholder="Enter your company name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.vendorName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.vendorName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end justify-end">
              <p className="text-sm text-gray-500">Vendor Code</p>
              <p className="font-medium text-gray-900 mt-1">
                {vendor.vendor_code}
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Vendor Type <span className="text-red-500">*</span>
                </label>
                {isBillsLoading && (
                  <span className="text-xs text-gray-400">
                    (checking linked bills…)
                  </span>
                )}
              </div>
              <select
                {...register("vendorType")}
                disabled={isUpdating || hasLinkedBills}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {VENDOR_TYPE_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1.5">
                Labour vendors can only be used for Labour Request bills.
              </p>
              {errors.vendorType && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.vendorType.message}
                </p>
              )}
              {hasLinkedBills && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-xs">
                    This vendor is referenced by{" "}
                    <strong>{billsList.length}</strong> existing vendor bill
                    {billsList.length === 1 ? "" : "s"}. The vendor type cannot
                    be changed because it may break linked records.
                  </p>
                </div>
              )}
              {!isBillsLoading && !hasLinkedBills && !isBillsError && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Changing the vendor type after bills are linked may break
                  existing records.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-600 mb-6">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Name
              </label>
              <input
                {...register("contactName")}
                placeholder="Enter contact name here"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                {...register("email")}
                placeholder="Enter email here"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone number
              </label>
              <input
                {...register("phone")}
                placeholder="Enter company phone number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Address</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Address
            </label>
            <input
              {...register("address")}
              placeholder="Enter full address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tax Information */}
        {/* <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-600 mb-6">
            Tax Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tax ID
              </label>
              <input
                {...register("taxId")}
                placeholder="Optional Tax ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tax Number
              </label>
              <input
                {...register("taxNumber")}
                placeholder="Optional TIN / Tax number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  {...register("taxRegistered")}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Tax Registered</span>
              </label>
            </div>
          </div>
        </div> */}

        {/* Footer Actions */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isUpdating ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
