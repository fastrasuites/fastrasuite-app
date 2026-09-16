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

  const invoiceOptions: NavOption[] = [
    { label: "Paid Invoices", href: "/invoice/paid" },
    { label: "Partially Paid Invoices", href: "/invoice/partially-paid" },
    { label: "Unpaid Invoices", href: "/invoice/unpaid" },
    { label: "Payment History", href: "/invoice/payment-history" },
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
        <h1 className="text-2xl">Invoices</h1>
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm text-gray-600 h-full"
        >
          {/* Invoices Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-full flex items-center text-base font-medium transition-all duration-200 hover:text-[#3B7CED] hover:border-b-2 hover:border-[#3B7CED] focus:outline-none focus:text-[#3B7CED] focus:border-b-2 focus:border-[#3B7CED] group">
              <span className="flex items-center">
                Invoices
                <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg py-2 mt-1"
            >
              {/* <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Invoices
              </div> */}
              {invoiceOptions.map((option, index) => (
                <DropdownMenuItem key={option.href} asChild>
                  <Link
                    href={option.href}
                    className={`w-full px-3 py-2.5 text-sm cursor-pointer transition-colors duration-150 border-l-2 ${
                      isActive(option.href)
                        ? "text-[#3B7CED] bg-blue-50 border-l-[#3B7CED] font-medium"
                        : "text-gray-700 hover:text-[#3B7CED] hover:bg-gray-50 hover:border-l-gray-300"
                    } ${
                      index === invoiceOptions.length - 1 ? "rounded-b-lg" : ""
                    }`}
                  >
                    {option.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Payments Navigation */}
          <Link
            href="/payments"
            className={`h-full flex items-center text-base font-medium transition-all duration-200 ${
              isActive("/payments")
                ? "text-[#3B7CED] border-b-2 border-[#3B7CED] font-semibold"
                : "hover:text-[#3B7CED] hover:border-b-2 hover:border-[#3B7CED]"
            }`}
          >
            Payments
          </Link>
        </nav>
        <NotifySection />
      </div>
    </header>
  );
}
