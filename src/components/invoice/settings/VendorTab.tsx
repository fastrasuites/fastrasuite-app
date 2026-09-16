"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Grid3X3, List } from "lucide-react";
import Link from "next/link";
import { useGetVendorsQuery } from "@/api/invoice/vendorsApi";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export function VendorTab() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors, isLoading, isError } = useGetVendorsQuery();

  const filtered = (vendors || []).filter(
    (v) =>
      v.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendor_code?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Vendor</h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <PermissionGuard module="invoice" entitlement="configure_invoice">
            <Link
              href="/invoice/vendor/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Vendor
            </Link>
          </PermissionGuard>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button className="p-2.5 bg-white">
              <List className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2.5 bg-gray-50">
              <Grid3X3 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading vendors...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load vendors.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No vendors found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500">
                  Vendor Code
                </th>
                <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500">
                  Vendor Name
                </th>
                <th className="text-left py-3.5 px-6 text-sm font-medium text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vendor) => (
                <tr
                  key={vendor.id}
                  onClick={() => router.push(`/invoice/vendor/${vendor.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">
                    {vendor.vendor_code}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-800">
                    {vendor.vendor_name}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full capitalize ${
                        vendor.status?.toLowerCase() === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {vendor.status || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
