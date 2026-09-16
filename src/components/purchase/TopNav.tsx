"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotifySection from "../shared/Notify";
import { ProtectedComponent } from "../ProtectedComponent";

export function TopNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Purchase Requests",
      href: "/purchase/purchase_requests",
      module: "purchaserequest",
    },
    {
      label: "Request for Quotations",
      href: "/purchase/request_for_quotations",
      module: "requestforquotation",
    },
    {
      label: "Purchase Orders",
      href: "/purchase/purchase_orders",
      module: "purchaseorder",
    },
    { label: "Vendors", href: "/purchase/vendors", module: "vendor" },
    { label: "Products", href: "/purchase/products", module: "product" },
    {
      label: "Configuration",
      href: "/purchase/configurations",
      module: "unitofmeasure",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/purchase") {
      return pathname === "/purchase" || pathname === "/purchase/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30 ">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <h1 className="text-2xl">Purchase</h1>
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm text-gray-600 h-full"
        >
          {navItems.map((item) => (
            <ProtectedComponent
              key={item.href}
              application="purchase"
              module={item.module}
              action="view"
            >
              <Link
                href={item.href}
                className={`h-full flex items-center text-base transition-colors duration-200 ${
                  isActive(item.href)
                    ? "text-[#3B7CED] border-b-2 border-[#3B7CED]"
                    : "hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
                }`}
              >
                {item.label}
              </Link>
            </ProtectedComponent>
          ))}
        </nav>
        <NotifySection />
      </div>
    </header>
  );
}
