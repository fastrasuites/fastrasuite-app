"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/purchase/products";
import { BreadcrumbItem } from "@/types/purchase";
import { useGetVendorQuery } from "@/api/purchase/vendorsApi";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  AnimatedWrapper,
  Interactive,
} from "@/components/shared/AnimatedWrapper";
import Image from "next/image";
import React, { useEffect } from "react";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Purchase", href: "/purchase" },
  { label: "Vendors", href: "/purchase/vendors", current: true },
];

const Page = () => {
  const params = useParams();
  const vendorId = parseInt(params.id as string);

  const {
    data: vendor,
    isLoading,
    error,
    refetch,
  } = useGetVendorQuery(vendorId);

  useEffect(() => {
    refetch();
  }, [vendorId, refetch]);

  if (isLoading) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <PageHeader
          items={items}
          title="Vendor Details"
          isEdit={`/purchase/vendors/edit/${vendorId}`}
        />
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading vendor details...</div>
          </div>
        </div>
      </FadeIn>
    );
  }

  if (error || !vendor) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <PageHeader
          items={items}
          title="Vendor Details"
          isEdit={`/purchase/vendors/edit/${vendorId}`}
        />
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error loading vendor details</div>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <PageHeader
        items={items}
        title="Vendor Details"
        isEdit={`/purchase/vendors/edit/${vendorId}`}
      />

      <div className="h-full mx-auto px-6 py-8 bg-white">
        <FadeIn delay={0.2}>
          <h2 className="text-lg font-medium text-blue-500 mb-6">
            Vendor Information
          </h2>
        </FadeIn>

        <div className="flex items-start gap-8">
          {/* Avatar with scale animation */}
          <ScaleIn delay={0.3} className="shrink-0">
            <Interactive effect="subtle">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
                <Image
                  src={
                    `data:image/png;base64,${vendor.profile_picture}` ||
                    "/vendor_dummy.png"
                  }
                  alt="Vendor avatar"
                  className="w-24 h-24 object-cover rounded-full"
                  width={400}
                  height={400}
                />
              </div>
            </Interactive>
          </ScaleIn>

          {/* Content: rows with separators */}
          <div className="flex-1">
            {/* Row 1 (first 3 fields) */}
            <SlideUp delay={0.4}>
              <div className="py-4 border-b border-gray-200">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4"
                  staggerDelay={0.15}
                >
                  {/* Company Name */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Company Name
                      </h3>
                      <p className="text-gray-700">
                        {vendor.company_name || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Email */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Email
                      </h3>
                      <p className="text-gray-700">{vendor.email || "N/A"}</p>
                    </div>
                  </FadeIn>

                  {/* Phone Number */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Phone Number
                      </h3>
                      <p className="text-gray-700">
                        {vendor.phone_number || "N/A"}
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>

            {/* Row 2 (remaining fields) */}
            <SlideUp delay={0.6}>
              <div className="py-4 last:border-b-0 my-4">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  staggerDelay={0.15}
                >
                  {/* Address */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Address
                      </h3>
                      <p className="text-gray-700">{vendor.address || "N/A"}</p>
                    </div>
                  </FadeIn>

                  {/* Status */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Status
                      </h3>
                      <p className="text-gray-700">
                        {vendor.is_hidden ? "Hidden" : "Active"}
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>
          </div>
        </div>

        {/* Additional animated action section */}
      </div>
    </FadeIn>
  );
};

export default Page;
