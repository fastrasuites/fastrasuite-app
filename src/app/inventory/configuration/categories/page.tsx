"use client";

import React, { useState } from "react";
import { Search, Filter, Plus, Loader2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetProductCategoriesQuery } from "@/api/inventory/productCategoryApi";
import { Skeleton } from "@/components/ui/skeleton";
const getStatusVariant = (isActive: boolean) => {
  if (isActive) return "validated";
  return "draft";
};

const getStatusText = (isActive: boolean) => {
  if (isActive) return "ACTIVE";
  return "INACTIVE";
};

export default function ProductCategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: categoriesData, isLoading, isFetching } = useGetProductCategoriesQuery({ search });
  const categories = categoriesData || [];

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Configuration", href: "/inventory/configuration" },
    { label: "Categories", href: "/inventory/configuration/categories", current: true },
  ];

  const handleRowClick = (id: string | number) => {
    router.push(`/inventory/configuration/categories/${id}`);
  };

  const filteredCategories = categories.filter((c) => {
    const matchStatus = 
      selectedStatus === "all" || 
      (selectedStatus === "ACTIVE" && c.is_active) ||
      (selectedStatus === "INACTIVE" && !c.is_active);
    return matchStatus;
  });

  return (
    <PageGuard module="inventory" entitlement="view_productcategory">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs
            items={items}
            action={
              <Button variant="ghost" className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors">
                Autosaved <AutoSaveIcon />
              </Button>
            }
          />

          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-[#32325D] shrink-0">Product Categories</h1>
                <div className="relative w-[240px] md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white border-gray-200 rounded-lg h-9 text-sm w-full focus:ring-1 focus:ring-[#3B7CED] text-[#32325D]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <PermissionGuard module="inventory" entitlement="add_productcategory">
                  <Link href="/inventory/configuration/categories/new">
                    <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> New Category
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              {[
                { label: "All Categories", value: "all" },
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
          </div>

          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[700px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap w-64">
                      Category Name
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                      Description
                    </TableHead>
                    <TableHead className="py-3.5 pr-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center w-36">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || isFetching ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-gray-100">
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-[180px] rounded-md bg-gray-200" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-[250px] rounded-md bg-gray-200" />
                        </TableCell>
                        <TableCell className="pr-6 py-4">
                          <Skeleton className="h-5 w-[80px] rounded-full mx-auto bg-gray-200" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <TableRow 
                        key={cat.id} 
                        className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        onClick={() => handleRowClick(cat.id)}
                      >
                        <TableCell className="px-6 py-3.5 text-sm font-semibold text-[#32325D] whitespace-nowrap">
                          {cat.category_name}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-sm text-[#525F7F]">
                          {cat.description}
                        </TableCell>
                        <TableCell className="pr-6 py-3.5 text-center whitespace-nowrap">
                          <Badge variant={getStatusVariant(cat.is_active) as any} className="px-2.5 py-0.5 font-semibold text-xs shadow-none">
                            {getStatusText(cat.is_active)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-[#8898AA] text-sm">
                        No categories found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </PageGuard>
  );
}

