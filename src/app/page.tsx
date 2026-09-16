"use client";

// File: src/app/dashboard/page.tsx
import React from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Briefcase,
  MapPin,
  BarChart2,
  Truck,
  ContactIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  AccountIcon,
  AppIcon,
  FinanceIcon,
  HRIcon,
  InventoryIcon,
  LogisticsIcon,
  SalesIcon,
  SettingsIcon,
} from "@/components/shared/icons";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { usePermission } from "@/hooks/usePermission";

type Module = {
  id: string;
  title: string;
  description: string;
  color: string;
  Icon: React.ComponentType<{ className?: string; color?: string }>;
  isFunctional: boolean;
};

const MODULES: Module[] = [
  // --- Functional Modules ---
  {
    id: "invoice",
    title: "Invoice",
    description:
      "Manage all financial transactions, including invoicing, billing, and ledger entries, to ensure accurate accounting records and financial reporting.",
    color: "green",
    Icon: AccountIcon,
    isFunctional: true,
  },
  {
    id: "inventory",
    title: "Inventory",
    description:
      "Monitor stock levels, track inventory movements, and optimize warehouse operations to ensure optimal inventory management and minimize stockouts.",
    color: "green",
    Icon: InventoryIcon,
    isFunctional: true,
  },

  {
    id: "project-request",
    title: "Project Request",
    description:
      "Submit and manage various project-related requests including labour, material consumption, petty cash, and subcontractor engagements.",
    color: "purple",
    Icon: ClipboardList,
    isFunctional: true,
  },
  {
    id: "settings",
    title: "Settings",
    description:
      "Configure system preferences, manage user permissions, and customize application settings to align with organizational requirements and user preferences.",
    color: "blue",
    Icon: SettingsIcon,
    isFunctional: true,
  },
  {
    id: "project",
    title: "Project Costing",
    description:
      "Track project expenses, monitor budget allocations, and analyze project profitability to ensure projects are delivered on time and within budget.",
    color: "yellow",
    Icon: Briefcase,
    isFunctional: true,
  },
  // --- Non-Functional Modules (Coming Soon) ---
  /*
    {
    id: "contacts",
    title: "Contacts",
    description:
      "Store and organize contact information for customers, vendors, and other stakeholders to facilitate communication and collaboration.",
    color: "yellow",
    Icon: ContactIcon,
    isFunctional: true,
  },
  {
    id: "sales",
    title: "Sales",
    description:
      "Track sales leads, manage customer relationships, and monitor sales performance to drive revenue growth and customer satisfaction.",
    color: "green",
    Icon: SalesIcon,
    isFunctional: false,
  },
  {
    id: "finance",
    title: "Finance",
    description:
      "Finance is the management of money and investments to achieve personal or organizational goals.",
    color: "blue",
    Icon: FinanceIcon,
    isFunctional: false,
  },
  {
    id: "hr",
    title: "HR",
    description:
      "Manage employee information, track attendance, process payroll, and oversee performance evaluations to support efficient HR administration and talent management.",
    color: "blue",
    Icon: HRIcon,
    isFunctional: false,
  },

  {
    id: "crm",
    title: "CRM",
    description:
      "Maintain a centralized database of customer information, track interactions, and manage sales pipelines to enhance customer relationships and boost sales effectiveness.",
    color: "blue",
    Icon: ClipboardList,
    isFunctional: false,
  },
  {
    id: "planning",
    title: "Planning",
    description:
      "Collaborate on strategic planning, set goals, allocate resources, and track progress towards objectives to drive organizational growth and success.",
    color: "blue",
    Icon: MapPin,
    isFunctional: false,
  },
  {
    id: "manufacturing",
    title: "Manufacturing",
    description:
      "Manage production processes, track work orders, and optimize resource allocation to maximize manufacturing efficiency and product quality.",
    color: "yellow",
    Icon: Truck,
    isFunctional: false,
  },
  {
    id: "logistics",
    title: "Logistics",
    description:
      "Coordinate transportation, manage delivery schedules, and track shipment statuses to ensure timely and cost-effective logistics operations.",
    color: "blue",
    Icon: LogisticsIcon,
    isFunctional: false,
  },
  {
    id: "reports",
    title: "Reports",
    description:
      "Generate customizable reports, analyze key performance metrics, and gain actionable insights to support data-driven decision-making and business optimization.",
    color: "green",
    Icon: BarChart2,
    isFunctional: false,
  },
  {
    id: "apps",
    title: "Apps",
    description:
      "Explore additional applications and integrations to extend the functionality of the Fastra suite and address specific business needs and requirements.",
    color: "green",
    Icon: AppIcon,
    isFunctional: false,
  },
  */
];

const colorMap: Record<
  string,
  { bg: string; ring: string; text: string; border: string }
> = {
  green: {
    bg: "bg-green-50",
    ring: "focus:ring-green-300",
    text: "text-green-600",
    border: "border-green-200",
  },
  blue: {
    bg: "bg-blue-50",
    ring: "focus:ring-blue-300",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  yellow: {
    bg: "bg-amber-50",
    ring: "focus:ring-amber-300",
    text: "text-amber-400",
    border: "border-amber-200",
  },
  purple: {
    bg: "bg-violet-50",
    ring: "focus:ring-violet-300",
    text: "text-violet-600",
    border: "border-violet-200",
  },
  teal: {
    bg: "bg-teal-50",
    ring: "focus:ring-teal-300",
    text: "text-teal-600",
    border: "border-teal-200",
  },
};

function ModuleCard({ module }: { module: Module }): ReactElement {
  const palette = colorMap[module.color] ?? colorMap.blue;
  const Icon = module.Icon;
  const isFunctional = module.isFunctional;

  const getRoute = (id: string): string | null => {
    const routeMap: Record<string, string> = {
      invoice: "/invoice/approved-requests",
      inventory: "/inventory/operation",
      contacts: "/contact",
      settings: "/settings/company/1",
      "project-request": "/project-request",
      project: "/project-costing",
    };
    return routeMap[id] || null;
  };

  const route = isFunctional ? getRoute(module.id) : null;

  const cardContent = (
    <Card
      className={`h-full p-4 group border shadow-none ${palette.border} ${
        isFunctional
          ? "hover:shadow-lg transition-transform transform-gpu hover:-translate-y-1 focus-within:scale-[1.01] focus-within:shadow-lg cursor-pointer bg-white"
          : "opacity-75 cursor-not-allowed bg-slate-50/50"
      } flex flex-col`}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center ${palette.text}`}
          aria-hidden="true"
        >
          <Icon className="w-10 h-10" />
        </div>
        {/* {!isFunctional && (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase tracking-wider">
            Coming Soon
          </span>
        )} */}
      </div>

      <div className="flex-1 min-w-0">
        <h3
          id={`module-title-${module.id}`}
          className={`text-lg font-semibold ${palette.text} leading-tight`}
        >
          {module.title}
        </h3>
        <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-4">
          {module.description}
        </p>
      </div>
    </Card>
  );

  if (isFunctional && route) {
    return <Link href={route}>{cardContent}</Link>;
  }

  return cardContent;
}

export default function DashboardPage(): ReactElement {
  const { hasAccess } = useModulePermissions();
  const { isAdmin } = usePermission();

  const filteredModules = MODULES.filter((m) => {
    if (!isAdmin && !m.isFunctional) return false;
    if (m.id === "invoice") return hasAccess("invoice");
    if (m.id === "inventory") return hasAccess("inventory");
    if (m.id === "project-request") return hasAccess("projectRequest");
    if (m.id === "settings") return hasAccess("settings");
    if (m.id === "project") return hasAccess("projectCosting");
    return true; // default access for non-applicable modules
  });

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      <NavBar title="Home" items={[]} />

      <main className="flex-1 py-8 bg-gray-100">
        <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8">
          <section aria-labelledby="dashboard-heading" className="mb-8">
            {/* Grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label="Dashboard modules"
            >
              {filteredModules.map((m) => (
                <div key={m.id} role="listitem">
                  <ModuleCard module={m} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
