"use client";

import Link from "next/link";
import {
  FaMoneyBill,
  FaShoppingCart,
  FaChartLine,
  FaUsers,
  FaWarehouse,
  FaUserCog,
  FaFileInvoice,
  FaCog,
  FaIndustry,
  FaTruck,
  FaClipboardList,
  FaAddressBook,
} from "react-icons/fa";

const cards = [
  {
    title: "Accounts",
    icon: <FaMoneyBill className="text-green-600 text-3xl" />,
    description:
      "Manage all financial transactions, including invoicing, billing, and ledger entries, to ensure accurate accounting and financial reporting.",
    link: "/accounts",
  },
  {
    title: "Sales",
    icon: <FaChartLine className="text-green-600 text-3xl" />,
    description:
      "Track sales leads, manage customer relationships, and monitor sales performance to drive revenue growth and customer satisfaction.",
    link: "/sales",
  },
  {
    title: "Finance",
    icon: <FaFileInvoice className="text-blue-600 text-3xl" />,
    description:
      "Finance is the management of money and investments to achieve personal or organizational goals.",
    link: "/finance",
  },
  {
    title: "Inventory",
    icon: <FaWarehouse className="text-green-600 text-3xl" />,
    description:
      "Monitor stock levels, track inventory movements, and optimize warehouse operations to ensure optimal inventory management and minimize stockouts.",
    link: "/inventory/operation",
  },
  {
    title: "HR",
    icon: <FaUserCog className="text-blue-600 text-3xl" />,
    description:
      "Manage employee information, track attendance, process payroll, and oversee performance evaluations to support efficient HR administration and talent management.",
    link: "/hr",
  },
  {
    title: "Project Costing",
    icon: <FaClipboardList className="text-yellow-500 text-3xl" />,
    description:
      "Track project expenses, monitor budget allocations, and analyze project profitability to ensure projects are delivered on time and within budget.",
    link: "/project-costing",
  },
  {
    title: "CRM",
    icon: <FaUsers className="text-blue-600 text-3xl" />,
    description:
      "Maintain a centralized database of customer information, track interactions, and manage sales pipelines to enhance customer relationships and boost sales effectiveness.",
    link: "/crm",
  },
  {
    title: "Contacts",
    icon: <FaAddressBook className="text-yellow-500 text-3xl" />,
    description:
      "Store and organize contact information for customers, vendors, and other stakeholders to facilitate communication and collaboration.",
    link: "/contacts",
  },
  {
    title: "Planning",
    icon: <FaClipboardList className="text-blue-600 text-3xl" />,
    description:
      "Collaborate on strategic planning, set goals, allocate resources, and track progress toward objectives to drive organizational growth and success.",
    link: "/planning",
  },
  {
    title: "Manufacturing",
    icon: <FaIndustry className="text-yellow-500 text-3xl" />,
    description:
      "Manage production processes, track work orders, and optimize resource allocation to maximize manufacturing efficiency and product quality.",
    link: "/manufacturing",
  },
  {
    title: "Logistics",
    icon: <FaTruck className="text-blue-600 text-3xl" />,
    description:
      "Coordinate transportation, manage delivery schedules, and track shipment statuses to ensure timely and cost-effective logistics operations.",
    link: "/logistics",
  },
  {
    title: "Reports",
    icon: <FaFileInvoice className="text-green-600 text-3xl" />,
    description:
      "Generate customizable reports, analyze key performance metrics, and gain actionable insights to support data-driven decision-making and business optimization.",
    link: "/reports",
  },
  {
    title: "Settings",
    icon: <FaCog className="text-blue-600 text-3xl" />,
    description:
      "Configure system preferences, manage user permissions, and customize application settings to align with organizational requirements and user preferences.",
    link: "/settings",
  },
  {
    title: "Apps",
    icon: <FaShoppingCart className="text-green-600 text-3xl" />,
    description:
      "Explore additional applications and integrations to extend the functionality of the system and address specific business needs.",
    link: "/apps",
  },
];

export default function ProductCards() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Link
              key={index}
              href={card.link}
              className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100 hover:border-gray-200 duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                {card.icon}
                <h2 className="text-lg font-semibold text-gray-800">
                  {card.title}
                </h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
