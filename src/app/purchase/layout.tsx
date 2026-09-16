import React from "react";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";

export default function PurchaseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = [
    {
      label: "Purchase Requests",
      href: "/purchase/purchase_requests",
      application: "purchase",
      module: "purchaserequest",
    },
    {
      label: "Request for Quotations",
      href: "/purchase/request_for_quotations",
      application: "purchase",
      module: "requestforquotation",
    },
    {
      label: "Purchase Orders",
      href: "/purchase/purchase_orders",
      application: "purchase",
      module: "purchaseorder",
    },
    { 
      label: "Vendors", 
      href: "/purchase/vendors", 
      application: "purchase",
      module: "vendor",
    },
    { 
      label: "Products", 
      href: "/purchase/products", 
      application: "purchase",
      module: "product",
    },
    {
      label: "Configuration",
      href: "/purchase/configurations",
      application: "purchase",
      module: "unitofmeasure",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar title="Purchase" items={navItems} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}