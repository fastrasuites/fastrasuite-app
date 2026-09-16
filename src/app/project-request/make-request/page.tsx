"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Calculator, Package, Wallet, Settings } from "lucide-react";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";
import { motion } from "framer-motion";

export default function MakeRequestPage() {
  const requestTypes = [
    {
      title: "Purchase Request",
      description: "Request to procure goods or materials needed on-site",
      icon: Calculator,
      href: "/project-request/purchase-request",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
      titleColor: "text-green-600",
    },
    {
      title: "Labour Request",
      description: "Request for additional human resources (workers, contractors)",
      icon: Package,
      href: "/project-request/labour-request",
      iconColor: "text-[#3B7CED]",
      borderColor: "border-blue-200",
      titleColor: "text-[#3B7CED]",
    },
    {
      title: "Petty Cash Request",
      description: "Request to procure goods or materials needed on-site",
      icon: Wallet,
      href: "/project-request/petty-cash-request",
      iconColor: "text-yellow-500",
      borderColor: "border-yellow-200",
      titleColor: "text-yellow-500",
    },
    {
      title: "Subcontractor Request",
      description: "Request to engage a subcontractor for a specific task or scope",
      icon: Calculator,
      href: "/project-request/subcontractor-request",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
      titleColor: "text-green-600",
    },
    {
      title: "Plant & Equipment Request",
      description: "Request for machinery, tools, or equipment needed on-site",
      icon: Settings, // Alternative to Calculator for variety
      href: "/project-request/plant-equipment-request",
      iconColor: "text-[#3B7CED]",
      borderColor: "border-blue-200",
      titleColor: "text-[#3B7CED]",
    },
    {
      title: "Material Consumption Request",
      description: "Record of materials consumed from inventory on-site",
      icon: Wallet, // Alternative to Wallet for variety
      href: "/project-request/material-consumption-request",
      iconColor: "text-yellow-500",
      borderColor: "border-yellow-200",
      titleColor: "text-yellow-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-[#F9FAFB]"
    >
      <NavBar title="Make Request" items={[]} backUrl="/project-request" wizardModuleId="project-request" />
      
      <main className="max-w-2xl mx-auto p-4 pt-6 pb-24">
        <div data-wizard="pr-request-types-grid" className="space-y-4">
          {requestTypes.map((req, index) => {
            const Icon = req.icon;
            return (
              <Link key={index} href={req.href} className="block">
                <motion.div
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className={`bg-white border ${req.borderColor} rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow group cursor-pointer`}
                >
                  <div className="flex items-start gap-4">
                    <Icon className={`w-5 h-5 ${req.iconColor} mt-0.5 shrink-0`} />
                    <div>
                      <h2 className={`text-base font-semibold ${req.titleColor} mb-1`}>
                        {req.title}
                      </h2>
                      <p className="text-sm text-gray-500 pr-4">
                        {req.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 group-hover:text-gray-600 transition-colors" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </main>
    </motion.div>
  );
}
