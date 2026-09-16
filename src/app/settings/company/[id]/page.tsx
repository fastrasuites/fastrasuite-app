"use client";

import React, { useState, useEffect } from "react";
import { useGetCompanyQuery } from "@/api/settings/companyApi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { LoadingDots } from "@/components/shared/LoadingComponents";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/ProtectedComponent";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Loader2, Building2 } from "lucide-react";

export default function CompanyDetails() {
  const { data, isLoading } = useGetCompanyQuery();
  const user = useSelector((state: any) => state.auth.user);
  const tenant_company_name = useSelector(
    (state: any) => state.auth.tenant_company_name,
  );
  const router = useRouter();

  useEffect(() => {
    // no form state needed for read-only view
  }, [data]);

  if (isLoading)
    return (
      <PageGuard module="settings" entitlement="view_company">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#F6F9FC]">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B7CED]" />
          <p className="mt-2 text-sm font-semibold text-[#8898AA]">Loading company details...</p>
        </div>
      </PageGuard>
    );

  if (!data) return <p className="p-6 text-sm text-[#8898AA]">No company data available</p>;

  const phoneValue = data.phone || "—";
  const emailValue = user?.email || "—";
  const websiteValue = data.website || "—";

  return (
    <PageGuard module="settings" entitlement="view_company">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-2xs sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#32325D]" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-semibold text-[#32325D]">
                  Company Details
                </h1>
              </div>
              <p className="text-xs text-[#8898AA] font-mono mt-0.5">
                View or configure your organization profile
              </p>
            </div>
          </div>

          <PermissionGuard module="settings" entitlement="change_company">
            <Button
              onClick={() => router.push("/settings/company/updatecompany/")}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 text-sm font-semibold shadow-2xs flex items-center gap-1.5"
            >
              <Edit2 className="h-4 w-4" />
              Edit Company
            </Button>
          </PermissionGuard>
        </div>

        {/* Main Content Container */}
        <main className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
          
          {/* Card 1: Basic Info */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden animate-in fade-in-50 duration-150">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">Basic Information</h2>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
              {data.logo ? (
                <img
                  src={
                    data.logo.startsWith("data:") ||
                    data.logo.startsWith("http") ||
                    data.logo.startsWith("blob:")
                      ? data.logo
                      : `data:image/jpeg;base64,${data.logo}`
                  }
                  alt="Company Logo"
                  className="w-24 h-24 rounded-full object-cover border border-gray-100 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#E8EFFD] flex items-center justify-center border border-gray-100 shadow-sm">
                  <span className="text-3xl text-[#3B7CED] font-bold">
                    {tenant_company_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-2 border-l border-gray-100 pl-6 py-2">
                <Label className="text-xs font-semibold text-[#525F7F]">Company Name</Label>
                <span className="text-lg font-bold text-[#32325D]">{tenant_company_name || "—"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Info */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden animate-in fade-in-50 duration-150">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">Contact Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-[#525F7F]">Email</Label>
                <span className="text-sm font-semibold text-[#32325D]">{emailValue}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-[#525F7F]">Phone Number</Label>
                <span className="text-sm font-semibold text-[#32325D]">{phoneValue}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-[#525F7F]">Website</Label>
                <span className="text-sm font-semibold text-[#3B7CED] hover:underline cursor-pointer">
                  {websiteValue !== "—" ? <a href={websiteValue.startsWith('http') ? websiteValue : `https://${websiteValue}`} target="_blank" rel="noreferrer">{websiteValue}</a> : "—"}
                </span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-[#32325D] mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#525F7F]" /> Physical Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">Street & Number</Label>
                  <span className="text-sm text-[#32325D]">{data.street_address || "—"}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">City</Label>
                  <span className="text-sm text-[#32325D]">{data.city || "—"}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">State</Label>
                  <span className="text-sm text-[#32325D]">{data.state || "—"}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">Country</Label>
                  <span className="text-sm text-[#32325D]">{data.country || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 3: Registration Info */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden animate-in fade-in-50 duration-150">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">Company Registration</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">Registration Number</Label>
                  <span className="text-sm font-mono font-medium text-[#32325D] bg-gray-50 px-2 py-1 rounded w-max">{data.registration_number || "—"}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">Tax ID</Label>
                  <span className="text-sm font-mono font-medium text-[#32325D] bg-gray-50 px-2 py-1 rounded w-max">{data.tax_id || "—"}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Other Info */}
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden animate-in fade-in-50 duration-150">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">Other Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">Industry</Label>
                  <span className="text-sm text-[#32325D]">{data.industry || "—"}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">Language</Label>
                  <span className="text-sm text-[#32325D]">{data.language === "en" ? "English" : data.language || "—"}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-[#525F7F]">Company Size</Label>
                  <span className="text-sm text-[#32325D]">{data.company_size || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Roles */}
          {data.roles && data.roles.length > 0 && (
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden animate-in fade-in-50 duration-150">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-[#32325D]">Roles & Access</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {data.roles.map((role: { id: number; name: string }) => (
                    <span 
                      key={role.id} 
                      className="inline-flex items-center px-3 py-1.5 rounded bg-gray-50 border border-gray-200 text-xs font-semibold text-[#525F7F]"
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </PageGuard>
  );
}
