"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/purchase/products";
import { BreadcrumbItem } from "@/types/purchase";
import { useGetProductQuery } from "@/api/purchase/productsApi";
import { extractErrorMessage } from "@/lib/utils";
import {
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  AnimatedWrapper,
  Interactive,
} from "@/components/shared/AnimatedWrapper";
import Image from "next/image";
import React from "react";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Purchase", href: "/purchase" },
  { label: "Products", href: "/purchase/products", current: true },
];

const Page = () => {
  const params = useParams();
  const productId = parseInt(params.id as string);

  const { data: product, isLoading, error } = useGetProductQuery(productId);

  if (isLoading) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <PageHeader
          items={items}
          title="Product Details"
          isEdit={`/purchase/products/edit/${productId}`}
        />
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading product details...</div>
          </div>
        </div>
      </FadeIn>
    );
  }

  if (error || !product) {
    return (
      <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
        <PageHeader
          items={items}
          title="Product Details"
          isEdit={`/purchase/products/edit/${productId}`}
        />
        <div className="h-full mx-auto px-6 py-8 bg-white">
          <div className="flex items-center justify-center h-64 text-center px-4">
            <div className="text-red-500">
              <p className="font-semibold text-lg">Error Loading Product</p>
              <p className="text-sm mt-1">{extractErrorMessage(error, "Unable to load product details")}</p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <PageHeader
        items={items}
        title="New Product"
        isEdit={`/purchase/products/edit/${productId}`}
      />

      <div className="h-full mx-auto px-6 py-8 bg-white">
        <FadeIn delay={0.2}>
          <h2 className="text-lg font-medium text-blue-500 mb-6">
            Basic Information
          </h2>
        </FadeIn>

        <div className="flex items-start gap-8">
          {/* Avatar with scale animation */}
          <ScaleIn delay={0.3} className="shrink-0">
            <Interactive effect="subtle">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
                <Image
                  src="/vercel.svg"
                  alt="Product avatar"
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
                  {/* Product Name */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Product Name
                      </h3>
                      <p className="text-gray-700">
                        {product.product_name || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Product Description */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Product Description
                      </h3>
                      <p className="text-gray-700">
                        {product.product_description || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Available Product Quantity */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Available Product Quantity
                      </h3>
                      <p className="text-gray-700">
                        {product.available_product_quantity || "N/A"}
                      </p>
                    </div>
                  </FadeIn>
                </StaggerContainer>
              </div>
            </SlideUp>

            {/* Row 2 (next 3 fields) */}
            <SlideUp delay={0.6}>
              <div className="py-4 last:border-b-0 my-4">
                <StaggerContainer
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  staggerDelay={0.15}
                >
                  {/* Total Quantity Purchased */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Total Quantity Purchased
                      </h3>
                      <p className="text-gray-700">
                        {product.total_quantity_purchased || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Product Category */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Product Category
                      </h3>
                      <p className="text-gray-700">
                        {product.product_category || "N/A"}
                      </p>
                    </div>
                  </FadeIn>

                  {/* Unit of Measure */}
                  <FadeIn>
                    <div className="p-4 transition-colors border-r border-gray-300">
                      <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                        Unit of Measure
                      </h3>
                      <p className="text-gray-700">
                        {product.unit_of_measure_details?.unit_name || "N/A"}
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
