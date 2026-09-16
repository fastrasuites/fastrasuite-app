"use client";

import React from "react";
import { Package, Scale, Tags, Settings, ArrowRight, MapPin } from "lucide-react";
import { BreadcrumbItem } from "@/components/shared/types";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { Button } from "@/components/ui/button";
import { AutoSaveIcon } from "@/components/shared/icons";
import { PageGuard } from "@/components/auth/PageGuard";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
  { label: "Configuration", href: "/inventory/configuration", current: true },
];

export default function InventoryConfiguration() {
  const configModules = [
    {
      title: "Products",
      description: "Company-wide list of all physical items and construction materials.",
      href: "/inventory/configuration/products",
      icon: Package,
      color: "text-[#3B7CED]",
      bg: "bg-blue-50",
    },
    {
      title: "Units of Measure",
      description: "Standard measurement attributes and conversion ratios (Bags, Tonnes, Liters, Meters).",
      href: "/inventory/configuration/units-of-measure",
      icon: Scale,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Product Categories",
      description: "Hierarchy and classifications for grouping inventory items in reports and cost codes.",
      href: "/inventory/configuration/categories",
      icon: Tags,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Locations",
      description: "Configure physical warehouses, stock yards, and active project locations.",
      href: "/inventory/configuration/locations",
      icon: MapPin,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <PageGuard application="inventory" module="configuration">
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

          {/* White Header Control Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[#32325D]">Inventory Configuration</h1>
              <p className="text-xs text-[#8898AA] mt-0.5">
                Manage master data, measurement units, categories, and system-wide inventory policies.
              </p>
            </div>
          </div>

          {/* Quick Navigation Tiles on Gray Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {configModules.map((mod) => (
              <Link 
                key={mod.title} 
                href={mod.href}
                className="bg-white p-6 rounded-lg border border-gray-100 shadow-2xs hover:border-[#3B7CED] hover:shadow-md transition-all flex flex-col justify-between group h-[220px]"
              >
                <div>
                  <div className={`w-11 h-11 rounded-full ${mod.bg} flex items-center justify-center mb-4`}>
                    <mod.icon className={`w-5 h-5 ${mod.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-[#32325D] mb-1 group-hover:text-[#3B7CED] transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-[#525F7F] leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-[#3B7CED]">
                  Manage <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </main>
      </motion.div>
    </PageGuard>
  );
}
