import React from "react";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";
import { SettingsEnforcer } from "@/components/invoice/SettingsEnforcer";

export default function InvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = [
    {
      label: "Approved Requests",
      href: "/invoice/approved-requests",
      application: "invoice",
      module: "invoice",
    },
    {
      label: "Purchase Order",
      href: "/invoice/purchase-order",
      application: "invoice",
      module: "invoice",
    },
    {
      label: "Payment Queue",
      href: "/invoice/payment-queue",
      application: "invoice",
      module: "invoice",
    },
    {
      label: "Chart of Accounts",
      href: "/invoice/chart-of-account",
      application: "invoice",
      module: "invoice",
    },
    {
      label: "Account Ledger",
      href: "/invoice/account-ledger",
      application: "invoice",
      module: "invoice",
    },
    {
      label: "Settings",
      href: "/invoice/settings",
      application: "invoice",
      module: "invoice",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar title="Invoices" items={navItems} wizardModuleId="invoice" />
      <main className="flex-1">
        {/* <SettingsEnforcer> */}
        {children}
        {/* </SettingsEnforcer> */}
      </main>
    </div>
  );
}
