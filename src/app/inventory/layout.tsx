import React from "react";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";

export default function InventoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = [
    {
      label: "Operations",
      children: [
        {
          label: "Incoming Product",
          href: "/inventory/operation/incoming_product",
          application: "inventory",
          module: "incomingproduct",
        },
        { 
          label: "Material Consumption", 
          href: "/inventory/operation/material-consumption",
          application: "inventory",
          module: "materialconsumption",
        },
        { 
          label: "Scrap", 
          href: "/inventory/operation/scrap",
          application: "inventory",
          module: "scrap",
        },
      ],
    },
    {
      label: "Stocks",
      children: [
        { 
          label: "Stock on Hand", 
          href: "/inventory/stock-on-hand",
          application: "inventory",
          module: "stockonhand",
        },
        { 
          label: "Stock Adjustment", 
          href: "/inventory/stocks/adjustment",
          application: "inventory",
          module: "stockadjustment",
        },
        { 
          label: "Inventory Ledger", 
          href: "/inventory/stocks/stock-moves",
          application: "inventory",
          module: "stockmove",
        },
      ],
    },
    {
      label: "Configuration",
      children: [
        {
          label: "Products",
          href: "/inventory/configuration/products",
          application: "inventory",
          module: "products",
        },
        {
          label: "Units of Measure",
          href: "/inventory/configuration/units-of-measure",
          application: "inventory",
          module: "unitsofmeasure",
        },
        {
          label: "Product Categories",
          href: "/inventory/configuration/categories",
          application: "inventory",
          module: "productcategories",
        },
        {
          label: "Locations",
          href: "/inventory/configuration/locations",
          application: "inventory",
          module: "location",
        },
        // {
        //   label: "Settings",
        //   href: "/inventory/configuration/settings",
        //   application: "inventory",
        //   module: "settings",
        // },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar title="Inventory" items={navItems} wizardModuleId="inventory" />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}