"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/components/shared/types";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetInventoryProductsQuery } from "@/api/inventory/productsApi";

const getStatusVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "validated";
    case "INACTIVE":
      return "rejected";
    default:
      return "draft";
  }
};

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: rawProducts, isLoading, error } = useGetInventoryProductsQuery({});

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Configuration", href: "/inventory/configuration" },
    { label: "Products", href: "/inventory/configuration/products", current: true },
  ];

  const productsList = useMemo(() => {
    if (!rawProducts) return [];
    if (Array.isArray(rawProducts)) return rawProducts;
    if ((rawProducts as any).results && Array.isArray((rawProducts as any).results)) {
      return (rawProducts as any).results;
    }
    return [];
  }, [rawProducts]);

  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    productsList.forEach((p: any) => {
      const catId = p.product_category || p.category;
      const catName = p.product_category_details?.category_name;
      if (catId) {
        cats.set(String(catId), catName || `Category ${catId}`);
      }
    });
    return Array.from(cats.entries());
  }, [productsList]);

  const handleRowClick = (id: string | number) => {
    router.push(`/inventory/configuration/products/${id}`);
  };

  const filteredProducts = useMemo(() => {
    return productsList.filter((p: any) => {
      if (!p) return false;
      const nameStr = String(p.product_name || p.name || "").toLowerCase();
      const codeStr = String(p.product_code || p.code || `PRD-${p.id}`).toLowerCase();
      const matchQuery =
        !search.trim() ||
        nameStr.includes(search.toLowerCase()) ||
        codeStr.includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === "all" ||
        String(p.product_category || p.category || "") === selectedCategory;
      const statusStr = p.is_active !== false ? "ACTIVE" : "INACTIVE";
      const matchStatus =
        selectedStatus === "all" || statusStr === selectedStatus.toUpperCase();
      return matchQuery && matchCategory && matchStatus;
    });
  }, [productsList, search, selectedCategory, selectedStatus]);

  return (
    <PageGuard module="inventory" entitlement="view_products">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20"
      >
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs
            items={items}
            action={
              <Button variant="ghost" className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors">
                Autosaved <AutoSaveIcon />
              </Button>
            }
          />

          {/* White Header Card with Filter Pills */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {/* Top Bar: title + search + actions */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-[#32325D] shrink-0">Products</h1>
                <div className="relative w-[240px] md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products or codes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white border-gray-200 rounded-lg h-9 text-sm w-full focus:ring-1 focus:ring-[#3B7CED] text-[#32325D]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <PermissionGuard module="inventory" entitlement="add_products">
                  <Link href="/inventory/configuration/products/new">
                    <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> New Product
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>

            {/* Status Filter Pills & Category Dropdown */}
            <div className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "All Products", value: "all" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                ].map((tab) => {
                  const isSelected = selectedStatus === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedStatus(tab.value)}
                      className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-[#E8F0FE] text-[#1A73E8] font-semibold"
                          : "bg-[#E9ECEF] text-[#8898AA] font-normal hover:bg-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#8898AA] mr-1 uppercase tracking-wider">Category:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] h-8 border-gray-200 bg-white text-xs text-[#32325D]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[900px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                      Product Code
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                      Product Name
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                      Category
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                      Unit
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-right">
                      Standard Cost
                    </TableHead>
                    <TableHead className="py-3.5 pr-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={`skeleton-row-${idx}`} className="border-b border-gray-100">
                        <TableCell className="py-4 px-6"><Skeleton className="h-5 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell className="py-4 px-6"><Skeleton className="h-5 w-48 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell className="py-4 px-6"><Skeleton className="h-5 w-28 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell className="py-4 px-6"><Skeleton className="h-5 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                        <TableCell className="py-4 px-6 text-right"><Skeleton className="h-5 w-20 bg-gray-200 rounded animate-pulse ml-auto" /></TableCell>
                        <TableCell className="py-4 pr-6 text-center"><Skeleton className="h-6 w-20 bg-gray-200 rounded-full animate-pulse mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredProducts.map((prd: any) => {
                      const statusStr = prd.is_active !== false ? "ACTIVE" : "INACTIVE";
                      const uomStr =
                        prd.unit_of_measure_details?.unit_name ||
                        prd.unit_of_measure_details?.unit_symbol ||
                        prd.uom ||
                        String(prd.unit_of_measure || "-");

                      return (
                        <TableRow
                          key={prd.id}
                          className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors"
                          onClick={() => handleRowClick(prd.id)}
                        >
                          <TableCell className="px-6 py-3.5 font-mono text-sm font-semibold text-[#3B7CED] whitespace-nowrap">
                            {prd.product_code || prd.code || `PRD-${prd.id}`}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm font-semibold text-[#32325D] whitespace-nowrap">
                            {prd.product_name || prd.name}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-[#525F7F] whitespace-nowrap">
                            {prd.product_category_details?.category_name || prd.product_category || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm font-medium text-[#525F7F] whitespace-nowrap">
                            {uomStr}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-right font-mono font-bold text-[#32325D] whitespace-nowrap">
                            {prd.standard_cost !== undefined ? `₦${Number(prd.standard_cost).toLocaleString()}` : "₦0.00"}
                          </TableCell>
                          <TableCell className="pr-6 py-3.5 text-center whitespace-nowrap">
                            <Badge
                              variant={getStatusVariant(statusStr) as any}
                              className="px-2.5 py-0.5 font-semibold text-xs shadow-none"
                            >
                              {statusStr}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}

                  {!isLoading && filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-[#8898AA] text-sm"
                      >
                        No products found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </motion.div>
    </PageGuard>
  );
}
