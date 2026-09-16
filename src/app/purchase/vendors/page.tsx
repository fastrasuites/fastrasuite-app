"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Breadcrumbs from "../../../components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";

import { ActionBar } from "../../../components/purchase/vendors/index";
import {
  useGetVendorsQuery,
  type Vendor as ApiVendor,
} from "../../../api/purchase/vendorsApi";
import type { BreadcrumbItem, Vendor } from "../../../types/purchase";
import { ProductsTableSkeleton } from "@/components/purchase/vendors/VendorTableSkeleton";
import { VendorTable } from "@/components/purchase/vendors/VendorTable";
import { VendorCards } from "@/components/purchase/vendors/VendorCards";

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

  // Fetch vendors with search parameter
  const {
    data: apiVendors,
    isLoading,
    error,
  } = useGetVendorsQuery(debouncedSearch ? { search: debouncedSearch } : {});

  // Map API vendors to local Vendor type
  const vendors: Vendor[] = React.useMemo(() => {
    if (!apiVendors) return [];
    return apiVendors.map(
      (apiVendor: {
        id: number;
        company_name: string;
        profile_picture: string;
        email: string;
        phone_number: string;
        address: string;
      }) => ({
        id: String(apiVendor.id),
        name: apiVendor.company_name,
        email: apiVendor.email,
        phone: apiVendor.phone_number,
        address: apiVendor.address,
        profile_picture: apiVendor.profile_picture,
      })
    );
  }, [apiVendors]);

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "vendors", href: "/purchase/vendors", current: true },
  ];

  const handleViewChange = (view: "grid" | "list") => {
    setCurrentView(view);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
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
          href={"/purchase/vendors/new"}
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
          <ProductsTableSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">
              Error loading vendors. Please try again.
            </div>
          </div>
        ) : (
          <>
            {currentView === "grid" ? (
              <VendorCards vendors={vendors} />
            ) : (
              <VendorTable vendors={vendors} />
            )}
          </>
        )}
      </motion.section>
    </motion.main>
  );
}
