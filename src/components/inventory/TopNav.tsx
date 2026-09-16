"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotifySection from "../shared/Notify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

export function TopNav() {
  const pathname = usePathname();

  const stockOptions: NavOption[] = [
    { label: "Stock on Hand", href: "/inventory/stock-on-hand" },
    { label: "Stock Adjustment", href: "/inventory/stocks/adjustment" },
    { label: "Inventory Ledger", href: "/inventory/stocks/stock-moves" },
    { label: "Scrap", href: "/inventory/operation/scrap" },
  ];

  const configurationOptions: NavOption[] = [
    { label: "Products", href: "/inventory/configuration/products" },
    {
      label: "Units of Measure",
      href: "/inventory/configuration/units-of-measure",
    },
    {
      label: "Product Categories",
      href: "/inventory/configuration/categories",
    },
    { label: "Locations", href: "/inventory/configuration/locations" },
    { label: "General Settings", href: "/inventory/configuration/settings" },
  ];

  const operationOptions: NavOption[] = [
    {
      label: "Incoming Product",
      href: "/inventory/operation/incoming_product",
    },
    {
      label: "Incoming Product Return",
      href: "/inventory/operation/incoming_product_return",
    },
    {
      label: "Material Consumption",
      href: "/inventory/operation/material-consumption",
    },
    { label: "Delivery Order", href: "/inventory/operation/delivery_order" },
    {
      label: "Delivery Order Return",
      href: "/inventory/operation/delivery_order_return",
    },
    {
      label: "Internal Transfer",
      href: "/inventory/operation/internal_transfer",
    },
    { label: "Back Order", href: "/inventory/operation/backorder" },
  ];

  type NavOption = {
    label: string;
    href: string;
  };

  const isActive = (href: string) => {
    if (href === "/purchase") {
      return pathname === "/purchase" || pathname === "/purchase/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30 ">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <h1 className="text-2xl">Inventory</h1>
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm text-gray-600 h-full"
        >
          {/* Operations Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-full flex items-center text-base font-medium transition-all duration-200 hover:text-[#3B7CED] hover:border-b-2 hover:border-[#3B7CED] focus:outline-none focus:text-[#3B7CED] focus:border-b-2 focus:border-[#3B7CED] group">
              <span className="flex items-center">
                Operations
                <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg py-2 mt-1"
            >
              {/* <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Operations
              </div> */}
              {operationOptions.map((option, index) => (
                <DropdownMenuItem key={option.href} asChild>
                  <Link
                    href={option.href}
                    className={`w-full px-3 py-2.5 text-sm cursor-pointer transition-colors duration-150 border-l-2 ${
                      isActive(option.href)
                        ? "text-[#3B7CED] bg-blue-50 border-l-[#3B7CED] font-medium"
                        : "text-gray-700 hover:text-[#3B7CED] hover:bg-gray-50 hover:border-l-gray-300"
                    } ${
                      index === operationOptions.length - 1
                        ? "rounded-b-lg"
                        : ""
                    }`}
                  >
                    {option.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stocks Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-full flex items-center text-base font-medium transition-all duration-200 hover:text-[#3B7CED] hover:border-b-2 hover:border-[#3B7CED] focus:outline-none focus:text-[#3B7CED] focus:border-b-2 focus:border-[#3B7CED] group">
              <span className="flex items-center">
                Stocks
                <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg py-2 mt-1"
            >
              {/* <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Stock Management
              </div> */}
              {stockOptions.map((option, index) => (
                <DropdownMenuItem key={option.href} asChild>
                  <Link
                    href={option.href}
                    className={`w-full px-3 py-2.5 text-sm cursor-pointer transition-colors duration-150 border-l-2 ${
                      isActive(option.href)
                        ? "text-[#3B7CED] bg-blue-50 border-l-[#3B7CED] font-medium"
                        : "text-gray-700 hover:text-[#3B7CED] hover:bg-gray-50 hover:border-l-gray-300"
                    } ${
                      index === stockOptions.length - 1 ? "rounded-b-lg" : ""
                    }`}
                  >
                    {option.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>



          {/* Configuration Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-full flex items-center text-base font-medium transition-all duration-200 hover:text-[#3B7CED] hover:border-b-2 hover:border-[#3B7CED] focus:outline-none focus:text-[#3B7CED] focus:border-b-2 focus:border-[#3B7CED] group">
              <span className="flex items-center">
                Configuration
                <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg py-2 mt-1"
            >
              {configurationOptions.map((option, index) => (
                <DropdownMenuItem key={option.href} asChild>
                  <Link
                    href={option.href}
                    className={`w-full px-3 py-2.5 text-sm cursor-pointer transition-colors duration-150 border-l-2 ${
                      isActive(option.href)
                        ? "text-[#3B7CED] bg-blue-50 border-l-[#3B7CED] font-medium"
                        : "text-gray-700 hover:text-[#3B7CED] hover:bg-gray-50 hover:border-l-gray-300"
                    } ${
                      index === configurationOptions.length - 1 ? "rounded-b-lg" : ""
                    }`}
                  >
                    {option.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <NotifySection />
      </div>
    </header>
  );
}
