"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Breadcrumbs from "../../../components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import {
  ActionBar,
  ProductsTable,
  ProductsCards,
  ProductsTableSkeleton,
  ProductsCardsSkeleton,
  type BreadcrumbItem,
} from "../../../components/purchase/products/index";
import {
  useGetProductsQuery,
} from "../../../api/purchase/productsApi";
import type { Product } from "../../../types/purchase";
import { PageGuard } from "@/components/auth/PageGuard";
import { extractErrorMessage } from "@/lib/utils";

export default function Page() {
  const [currentView, setCurrentView] = React.useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: apiProducts,
    isLoading,
    error,
    refetch,
  } = useGetProductsQuery(debouncedSearch ? { search: debouncedSearch } : {});

  React.useEffect(() => {
    refetch();
  }, []);

  const products: Product[] = useMemo(() => {
    if (!apiProducts) return [];
    return apiProducts.map(
      (apiProduct: {
        id: number;
        product_name: string;
        product_category: string;
        available_product_quantity: string;
      }) => ({
        id: String(apiProduct.id),
        name: apiProduct.product_name,
        category: apiProduct.product_category,
        quantity: parseInt(apiProduct.available_product_quantity) || 0,
      }),
    );
  }, [apiProducts]);

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Products", href: "/purchase/products", current: true },
  ];

  const handleViewChange = (view: "grid" | "list") => {
    setCurrentView(view);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <PageGuard application="purchase" module="products" action="view">
      <motion.main
        className="h-full text-slate-900 antialiased pr-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        >
          <Breadcrumbs
            items={items}
            action={
              <Button
                variant="ghost"
                className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
              >
                Autosaved <AutoSaveIcon />
              </Button>
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        >
          <ActionBar
            href={"/purchase/products/new"}
            currentView={currentView}
            onViewChange={handleViewChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />
        </motion.div>

        <motion.section
          className="h-full mx-auto pb-12 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          {isLoading ? (
            currentView === "grid" ? (
              <ProductsCardsSkeleton />
            ) : (
              <ProductsTableSkeleton />
            )
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500 text-center px-4">
              <div>
                <p className="font-semibold text-lg">Error loading products</p>
                <p className="text-sm mt-1">{extractErrorMessage(error, "Please check your connection and try again.")}</p>
              </div>
            </div>
          ) : currentView === "grid" ? (
            <ProductsCards products={products} />
          ) : (
            <ProductsTable products={products} />
          )}
        </motion.section>
      </motion.main>
    </PageGuard>
  );
}
