"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateVendorMutation,
  VENDOR_TYPE_CHOICES,
  isVendorType,
} from "@/api/invoice/vendorsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { PageGuard } from "@/components/auth/PageGuard";

const schema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorType: z.enum(["supplier", "subcontractor", "labour", "service"]),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  lga: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  // optional tax fields
  taxId: z.string().optional(),
  taxRegistered: z.boolean().optional(),
  taxNumber: z.string().optional(),
  // bank (all optional)
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  branch: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewVendorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramVendorType = searchParams.get("vendor_type");
  const initialVendorType = isVendorType(paramVendorType)
    ? paramVendorType
    : "supplier";

  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorType: initialVendorType as any,
      taxRegistered: false,
    },
  });

  const taxRegistered = watch("taxRegistered");

  const onSubmit = async (data: FormData) => {
    try {
      const addressParts = [
        data.street,
        data.lga,
        data.state,
        data.country,
      ].filter(Boolean);
      const address = addressParts.join(", ");

      const hasBank =
        data.bankAccountName?.trim() ||
        data.bankAccountNumber?.trim() ||
        data.bankName?.trim() ||
        data.branch?.trim();

      const vendorPayload = {
        vendor_name: data.vendorName,
        contact_name: data.contactName || "",
        email: data.email || "",
        phone_number: data.phone || "",
        address,
        tax_id: data.taxId || undefined,
        tax_registered: data.taxRegistered ?? false,
        tax_number: data.taxNumber || undefined,
        vendor_type: data.vendorType,
        status: "active" as const,
        ...(hasBank
          ? {
              bank_account: {
                bank_account_name: data.bankAccountName || "",
                bank_account_number: data.bankAccountNumber || "",
                bank_name: data.bankName || "",
                branch_code: data.branch || "",
              },
            }
          : {}),
      };

      await createVendor(vendorPayload).unwrap();

      setToast({
        show: true,
        message: "Vendor created successfully",
        type: "success",
      });
      setTimeout(() => {
        router.push("/invoice/settings?tab=vendor");
      }, 1200);
    } catch (err: any) {
      setToast({
        show: true,
        message:
          err?.data?.message ||
          err?.data?.detail ||
          err?.message ||
          "Failed to create vendor",
        type: "error",
      });
    }
  };

  return (
    <PageGuard module="invoice" entitlement="configure_invoice">
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
          <h1 className="text-xl font-semibold text-gray-900">New Vendor</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information – unchanged */}
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
                  Generated Automatically
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vendor Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("vendorType")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </div>
            </div>
          </div>

          {/* Contact Information – unchanged */}
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

          {/* Address – unchanged */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Street & Number
                </label>
                <input
                  {...register("street")}
                  placeholder="Enter Street & number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Local Government
                </label>
                <input
                  {...register("lga")}
                  placeholder="Enter local government"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  State
                </label>
                <input
                  {...register("state")}
                  placeholder="Enter state"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Country
                </label>
                <input
                  {...register("country")}
                  placeholder="Enter country"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* NEW – Tax Information (optional) */}
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

          {/* Bank Information – unchanged layout, still optional */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-blue-600 mb-6">
              Bank Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bank Account Name
                </label>
                <input
                  {...register("bankAccountName")}
                  placeholder="Enter account name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bank Account Number
                </label>
                <input
                  {...register("bankAccountNumber")}
                  placeholder="Enter account number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bank Name
                </label>
                <input
                  {...register("bankName")}
                  placeholder="Enter bank name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Branch / Sort Code
                </label>
                <input
                  {...register("branch")}
                  placeholder="Optional branch code"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {isCreating ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </PageGuard>
  );
}
