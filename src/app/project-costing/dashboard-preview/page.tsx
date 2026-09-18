"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  FileText,
  AlertTriangle,
  Wallet,
  MapPin,
  Package,
  ChevronRight,
  TrendingUp,
  Clock,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  X,
  Filter,
  Download,
  Building2,
  Check,
  ArrowRight,
  ChevronDown,
  Search,
  Eye,
  CreditCard,
  RefreshCw,
  Box,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// DATA DEFINITIONS & INITIAL MOCK DATA (Fastra Suite Realistic Data)
// ---------------------------------------------------------------------------

interface SiteRequest {
  id: string;
  title: string;
  project: string;
  requestedBy: string;
  date: string;
  amount: string;
  amountNum: number;
  category: "Material" | "Labor" | "Equipment" | "Petty cash";
  status: "Pending" | "Approved" | "Rejected";
  items: { desc: string; qty: number; unit: string; rate: string; total: string }[];
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  vendorEmail: string;
  vendorPhone: string;
  amount: string;
  amountNum: number;
  status: "Draft" | "Sent" | "Partially Received" | "Received";
  statusStyle: string;
  date: string;
  project: string;
  wbsCode: string;
  items: { desc: string; qty: number; rate: string; total: string }[];
}

interface Invoice {
  id: string;
  vendor: string;
  vendorBank: string;
  accountNumber: string;
  dueDate: string;
  amount: string;
  amountNum: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  statusStyle: string;
  project: string;
  paidAmount: string;
  balance: string;
  items: { desc: string; qty: number; rate: string; total: string }[];
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  unitCost: string;
  totalValue: string;
  status: "Normal" | "Low Stock" | "Critical";
  location: string;
}

interface BudgetWBS {
  code: string;
  name: string;
  allocated: string;
  spent: string;
  committed: string;
  available: string;
  utilization: number;
}

interface ProjectData {
  id: string;
  name: string;
  client: string;
  manager: string;
  poValue: string;
  poCount: number;
  poTrend: string;
  totalInvoiced: string;
  paidAmount: string;
  overdueAmount: string;
  overdueCount: number;
  hasOverdue: boolean;
  budgetUtilization: number;
  allocatedBudget: string;
  totalBudget: string;
  siteRequestsCount: number;
  siteRequestsPending: number;
  inventoryAlerts: number;
  monthlySpending: string;
  monthlyTotalRequests: number;
  monthlyApprovedRequests: number;
  monthlyRejectedRequests: number;
  categorySpend: { name: string; value: number; color: string; amount: string }[];
  barData: {
    project: string;
    fullName: string;
    budget: number;
    spent: number;
    budgetFormatted: string;
    spentFormatted: string;
  }[];
  monthlyTrends: {
    month: string;
    budget: number;
    committed: number;
    actual: number;
  }[];
  siteRequests: SiteRequest[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  inventoryItems: InventoryItem[];
  budgetWBS: BudgetWBS[];
}

const INITIAL_PROJECTS: Record<string, ProjectData> = {
  all: {
    id: "all",
    name: "All Active Projects",
    client: "Multiple Enterprise Clients",
    manager: "NobleStack Portfolio Operations",
    poValue: "₦44.1M",
    poCount: 4,
    poTrend: "+12% vs last mo",
    totalInvoiced: "₦34.3M",
    paidAmount: "₦15.0M",
    overdueAmount: "₦5.5M",
    overdueCount: 1,
    hasOverdue: true,
    budgetUtilization: 62,
    allocatedBudget: "₦525.0M",
    totalBudget: "₦850.0M",
    siteRequestsCount: 3,
    siteRequestsPending: 2,
    inventoryAlerts: 2,
    monthlySpending: "₦34,300,000",
    monthlyTotalRequests: 12,
    monthlyApprovedRequests: 9,
    monthlyRejectedRequests: 3,
    categorySpend: [
      { name: "Purchase", value: 30, color: "#3B7CED", amount: "₦10,290,000" },
      { name: "Labor", value: 20, color: "#1E3A8A", amount: "₦6,860,000" },
      { name: "Material", value: 20, color: "#0F172A", amount: "₦6,860,000" },
      { name: "Subcontractor", value: 16, color: "#60A5FA", amount: "₦5,488,000" },
      { name: "Petty cash", value: 14, color: "#38BDF8", amount: "₦4,802,000" },
    ],
    barData: [
      {
        project: "Victoria Isl...",
        fullName: "Victoria Island Office Tower",
        budget: 450000000,
        spent: 312000000,
        budgetFormatted: "₦450.0M",
        spentFormatted: "₦312.0M",
      },
      {
        project: "Lekki Phase ...",
        fullName: "Lekki Phase 1 Luxury Villas",
        budget: 180000000,
        spent: 165000000,
        budgetFormatted: "₦180.0M",
        spentFormatted: "₦165.0M",
      },
      {
        project: "Ikeja Office...",
        fullName: "Ikeja Tech Complex",
        budget: 220000000,
        spent: 48000000,
        budgetFormatted: "₦220.0M",
        spentFormatted: "₦48.0M",
      },
    ],
    monthlyTrends: [
      { month: "Jan", budget: 260000, committed: 215000, actual: 110000 },
      { month: "Feb", budget: 180000, committed: 285000, actual: 110000 },
      { month: "Mar", budget: 135000, committed: 85000, actual: 250000 },
      { month: "Apr", budget: 180000, committed: 285000, actual: 110000 },
      { month: "May", budget: 125000, committed: 155000, actual: 110000 },
      { month: "Jun", budget: 180000, committed: 285000, actual: 110000 },
      { month: "Jul", budget: 180000, committed: 285000, actual: 110000 },
      { month: "Aug", budget: 180000, committed: 240000, actual: 248000 },
      { month: "Sep", budget: 220000, committed: 190000, actual: 185000 },
      { month: "Oct", budget: 250000, committed: 210000, actual: 195000 },
    ],
    siteRequests: [
      {
        id: "SR-101",
        title: "Reinforcement High-Tensile Steel Rebars (Block B)",
        project: "Victoria Island Office Tower",
        requestedBy: "Engr. David Okon",
        date: "14 Sept 2026",
        amount: "₦3,800,000",
        amountNum: 3800000,
        category: "Material",
        status: "Pending",
        items: [
          { desc: "16mm TMT High Yield Steel Rebars", qty: 5, unit: "Tons", rate: "₦650,000", total: "₦3,250,000" },
          { desc: "Binding wire & plastic spacers", qty: 25, unit: "Rolls", rate: "₦22,000", total: "₦550,000" },
        ],
      },
      {
        id: "SR-102",
        title: "MEP Rough-in Plumbing Accessories & High Pressure Valves",
        project: "Victoria Island Office Tower",
        requestedBy: "Tunde Bakare (Site Supervisor)",
        date: "12 Sept 2026",
        amount: "₦1,250,000",
        amountNum: 1250000,
        category: "Material",
        status: "Pending",
        items: [
          { desc: "PPR 32mm Pressure Pipe Class 20", qty: 15, unit: "Bundles", rate: "₦55,000", total: "₦825,000" },
          { desc: "Heavy Duty Brass Gate Valves 1.5 inch", qty: 10, unit: "Pcs", rate: "₦42,500", total: "₦425,000" },
        ],
      },
      {
        id: "SR-103",
        title: "Granite Aggregate 3/4 inch Sub-base Pour",
        project: "Lekki Phase 1 Luxury Villas",
        requestedBy: "Arch. Sarah Adeyemi",
        date: "09 Sept 2026",
        amount: "₦2,100,000",
        amountNum: 2100000,
        category: "Material",
        status: "Approved",
        items: [
          { desc: "Granite Stones 3/4 inch Clean Aggregate", qty: 3, unit: "30-ton Tipper", rate: "₦700,000", total: "₦2,100,000" },
        ],
      },
    ],
    purchaseOrders: [
      {
        id: "PO-1004",
        vendor: "Lagos Plumbing Supplies",
        vendorEmail: "orders@lagosplumbing.ng",
        vendorPhone: "+234 803 123 4567",
        amount: "₦2,560,000",
        amountNum: 2560000,
        status: "Draft",
        statusStyle: "bg-gray-100 text-[#525F7F] border-gray-200",
        date: "14 Sept 2026",
        project: "Victoria Island Office Tower",
        wbsCode: "WBS-1.2.4 Plumbing Rough-in",
        items: [
          { desc: "PPR Pipes 32mm High Pressure (100m)", qty: 20, rate: "₦65,000", total: "₦1,300,000" },
          { desc: "Gate Valves & Fittings Set", qty: 15, rate: "₦84,000", total: "₦1,260,000" },
        ],
      },
      {
        id: "PO-1003",
        vendor: "Bright Electricals",
        vendorEmail: "sales@brightelectricals.com",
        vendorPhone: "+234 802 987 6543",
        amount: "₦5,550,000",
        amountNum: 5550000,
        status: "Sent",
        statusStyle: "bg-blue-50 text-[#3B7CED] border-blue-200",
        date: "10 Sept 2026",
        project: "Ikeja Tech Complex",
        wbsCode: "WBS-2.1.3 Electrical Conduit & Cabling",
        items: [
          { desc: "Armoured Cable 16mm 4-Core (500m)", qty: 2, rate: "₦1,850,000", total: "₦3,700,000" },
          { desc: "Distribution Board 12-Way 3-Phase", qty: 3, rate: "₦616,666", total: "₦1,850,000" },
        ],
      },
      {
        id: "PO-1002",
        vendor: "SteelCo Nigeria",
        vendorEmail: "dispatch@steelco.ng",
        vendorPhone: "+234 805 555 1212",
        amount: "₦21,000,000",
        amountNum: 21000000,
        status: "Partially Received",
        statusStyle: "bg-amber-50 text-amber-700 border-amber-200",
        date: "04 Sept 2026",
        project: "Victoria Island Office Tower",
        wbsCode: "WBS-1.1.2 Structural Steel Reinforcement",
        items: [
          { desc: "High-Tensile TMT Rebar 16mm (Tons)", qty: 20, rate: "₦650,000", total: "₦13,000,000" },
          { desc: "Binding Wire & Spacer Blocks", qty: 50, rate: "₦160,000", total: "₦8,000,000" },
        ],
      },
      {
        id: "PO-1001",
        vendor: "Dangote Cement",
        vendorEmail: "commercial@dangote-cement.com",
        vendorPhone: "+234 807 000 8888",
        amount: "₦15,000,000",
        amountNum: 15000000,
        status: "Received",
        statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "01 Sept 2026",
        project: "Lekki Phase 1 Luxury Villas",
        wbsCode: "WBS-3.1.1 Substructure Foundation Pour",
        items: [
          { desc: "Grade 42.5R Portland Cement (Trailer Load)", qty: 2, rate: "₦7,500,000", total: "₦15,000,000" },
        ],
      },
    ],
    invoices: [
      {
        id: "INV-2004",
        vendor: "Cedar Homes Logistics",
        vendorBank: "Access Bank Plc",
        accountNumber: "0123456789",
        dueDate: "due 08 Oct 2026",
        amount: "₦3,200,000",
        amountNum: 3200000,
        status: "Draft",
        statusStyle: "bg-gray-100 text-[#525F7F] border-gray-200",
        project: "Victoria Island Office Tower",
        paidAmount: "₦0",
        balance: "₦3,200,000",
        items: [
          { desc: "Tower Crane Hire (September 2-Week Block)", qty: 1, rate: "₦3,200,000", total: "₦3,200,000" },
        ],
      },
      {
        id: "INV-2002",
        vendor: "SteelCo Nigeria",
        vendorBank: "Zenith Bank Plc",
        accountNumber: "1012345678",
        dueDate: "due 06 Oct 2026",
        amount: "₦10,500,000",
        amountNum: 10500000,
        status: "Sent",
        statusStyle: "bg-blue-50 text-[#3B7CED] border-blue-200",
        project: "Victoria Island Office Tower",
        paidAmount: "₦0",
        balance: "₦10,500,000",
        items: [
          { desc: "Partial Delivery Payment - 10 Tons Rebar", qty: 10, rate: "₦650,000", total: "₦6,500,000" },
          { desc: "Transportation & Offloading Logistics", qty: 1, rate: "₦4,000,000", total: "₦4,000,000" },
        ],
      },
      {
        id: "INV-2001",
        vendor: "Dangote Cement",
        vendorBank: "First Bank of Nigeria",
        accountNumber: "2034567891",
        dueDate: "due 02 Oct 2026",
        amount: "₦15,000,000",
        amountNum: 15000000,
        status: "Paid",
        statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        project: "Lekki Phase 1 Luxury Villas",
        paidAmount: "₦15,000,000",
        balance: "₦0",
        items: [
          { desc: "Fulfilled PO-1001 Cement Delivery (900 Bags)", qty: 1, rate: "₦15,000,000", total: "₦15,000,000" },
        ],
      },
      {
        id: "INV-2003",
        vendor: "Bright Electricals",
        vendorBank: "Guaranty Trust Bank (GTBank)",
        accountNumber: "0159876543",
        dueDate: "due 20 Sept 2026",
        amount: "₦5,550,000",
        amountNum: 5550000,
        status: "Overdue",
        statusStyle: "bg-rose-50 text-rose-700 border-rose-200",
        project: "Ikeja Tech Complex",
        paidAmount: "₦0",
        balance: "₦5,550,000",
        items: [
          { desc: "Cabling & Conduit Batch 1 (Overdue milestone)", qty: 1, rate: "₦5,550,000", total: "₦5,550,000" },
        ],
      },
    ],
    inventoryItems: [
      {
        id: "INV-ITEM-01",
        name: "Portland Cement Grade 42.5R",
        sku: "MAT-CEM-042",
        category: "Civil & Masonry",
        quantity: 85,
        unit: "Bags",
        reorderLevel: 150,
        unitCost: "₦8,500",
        totalValue: "₦722,500",
        status: "Critical",
        location: "Warehouse A (Victoria Island)",
      },
      {
        id: "INV-ITEM-02",
        name: "High-Tensile TMT Steel Rebars 16mm",
        sku: "MAT-STEEL-016",
        category: "Structural",
        quantity: 12,
        unit: "Tons",
        reorderLevel: 20,
        unitCost: "₦650,000",
        totalValue: "₦7,800,000",
        status: "Low Stock",
        location: "Central Yard (Ikeja)",
      },
      {
        id: "INV-ITEM-03",
        name: "PPR Pipes 32mm High Pressure",
        sku: "MEP-PPR-032",
        category: "Plumbing",
        quantity: 240,
        unit: "Meters",
        reorderLevel: 100,
        unitCost: "₦650",
        totalValue: "₦156,000",
        status: "Normal",
        location: "Store 3 (Lekki Yard)",
      },
      {
        id: "INV-ITEM-04",
        name: "Distribution Boards 12-Way 3-Phase",
        sku: "ELE-DB-012",
        category: "Electrical",
        quantity: 8,
        unit: "Units",
        reorderLevel: 4,
        unitCost: "₦120,000",
        totalValue: "₦960,000",
        status: "Normal",
        location: "Store 2 (Ikeja)",
      },
    ],
    budgetWBS: [
      {
        code: "WBS-1.0",
        name: "Substructure & Deep Foundation",
        allocated: "₦180,000,000",
        spent: "₦145,000,000",
        committed: "₦25,000,000",
        available: "₦10,000,000",
        utilization: 81,
      },
      {
        code: "WBS-2.0",
        name: "Structural Concrete & Heavy Framing",
        allocated: "₦220,000,000",
        spent: "₦120,000,000",
        committed: "₦45,000,000",
        available: "₦55,000,000",
        utilization: 55,
      },
      {
        code: "WBS-3.0",
        name: "MEP Services & Electrical Rough-in",
        allocated: "₦125,000,000",
        spent: "₦47,000,000",
        committed: "₦32,000,000",
        available: "₦46,000,000",
        utilization: 38,
      },
    ],
  },
  vi: {
    id: "vi",
    name: "Victoria Island Office Tower",
    client: "Sterling Prime Real Estate",
    manager: "Engr. David Okon",
    poValue: "₦23.5M",
    poCount: 2,
    poTrend: "+8% vs budget",
    totalInvoiced: "₦13.7M",
    paidAmount: "₦0.0M",
    overdueAmount: "₦0.0M",
    overdueCount: 0,
    hasOverdue: false,
    budgetUtilization: 69,
    allocatedBudget: "₦312.0M",
    totalBudget: "₦450.0M",
    siteRequestsCount: 2,
    siteRequestsPending: 2,
    inventoryAlerts: 1,
    monthlySpending: "₦13,700,000",
    monthlyTotalRequests: 6,
    monthlyApprovedRequests: 4,
    monthlyRejectedRequests: 2,
    categorySpend: [
      { name: "Purchase", value: 35, color: "#3B7CED", amount: "₦4,795,000" },
      { name: "Labor", value: 25, color: "#1E3A8A", amount: "₦3,425,000" },
      { name: "Material", value: 20, color: "#0F172A", amount: "₦2,740,000" },
      { name: "Subcontractor", value: 12, color: "#60A5FA", amount: "₦1,644,000" },
      { name: "Petty cash", value: 8, color: "#38BDF8", amount: "₦1,096,000" },
    ],
    barData: [
      {
        project: "Substructure",
        fullName: "Substructure & Deep Foundation",
        budget: 180000000,
        spent: 145000000,
        budgetFormatted: "₦180.0M",
        spentFormatted: "₦145.0M",
      },
      {
        project: "Framing",
        fullName: "Structural Concrete & Framing",
        budget: 170000000,
        spent: 105000000,
        budgetFormatted: "₦170.0M",
        spentFormatted: "₦105.0M",
      },
      {
        project: "MEP Services",
        fullName: "MEP Services & Finishes",
        budget: 100000000,
        spent: 62000000,
        budgetFormatted: "₦100.0M",
        spentFormatted: "₦62.0M",
      },
    ],
    monthlyTrends: [
      { month: "Jan", budget: 45000, committed: 35000, actual: 30000 },
      { month: "Feb", budget: 50000, committed: 42000, actual: 40000 },
      { month: "Mar", budget: 60000, committed: 55000, actual: 48000 },
      { month: "Apr", budget: 55000, committed: 50000, actual: 52000 },
      { month: "May", budget: 70000, committed: 65000, actual: 61000 },
      { month: "Jun", budget: 65000, committed: 60000, actual: 58000 },
      { month: "Jul", budget: 75000, committed: 70000, actual: 68000 },
      { month: "Aug", budget: 80000, committed: 75000, actual: 72000 },
      { month: "Sep", budget: 90000, committed: 85000, actual: 80000 },
      { month: "Oct", budget: 95000, committed: 90000, actual: 85000 },
    ],
    siteRequests: [
      {
        id: "SR-101",
        title: "Reinforcement High-Tensile Steel Rebars (Block B)",
        project: "Victoria Island Office Tower",
        requestedBy: "Engr. David Okon",
        date: "14 Sept 2026",
        amount: "₦3,800,000",
        amountNum: 3800000,
        category: "Material",
        status: "Pending",
        items: [
          { desc: "16mm TMT High Yield Steel Rebars", qty: 5, unit: "Tons", rate: "₦650,000", total: "₦3,250,000" },
          { desc: "Binding wire & plastic spacers", qty: 25, unit: "Rolls", rate: "₦22,000", total: "₦550,000" },
        ],
      },
      {
        id: "SR-102",
        title: "MEP Rough-in Plumbing Accessories & High Pressure Valves",
        project: "Victoria Island Office Tower",
        requestedBy: "Tunde Bakare (Site Supervisor)",
        date: "12 Sept 2026",
        amount: "₦1,250,000",
        amountNum: 1250000,
        category: "Material",
        status: "Pending",
        items: [
          { desc: "PPR 32mm Pressure Pipe Class 20", qty: 15, unit: "Bundles", rate: "₦55,000", total: "₦825,000" },
          { desc: "Heavy Duty Brass Gate Valves 1.5 inch", qty: 10, unit: "Pcs", rate: "₦42,500", total: "₦425,000" },
        ],
      },
    ],
    purchaseOrders: [
      {
        id: "PO-1004",
        vendor: "Lagos Plumbing Supplies",
        vendorEmail: "orders@lagosplumbing.ng",
        vendorPhone: "+234 803 123 4567",
        amount: "₦2,560,000",
        amountNum: 2560000,
        status: "Draft",
        statusStyle: "bg-gray-100 text-[#525F7F] border-gray-200",
        date: "14 Sept 2026",
        project: "Victoria Island Office Tower",
        wbsCode: "WBS-1.2.4 Plumbing Rough-in",
        items: [
          { desc: "PPR Pipes 32mm High Pressure (100m)", qty: 20, rate: "₦65,000", total: "₦1,300,000" },
          { desc: "Gate Valves & Fittings Set", qty: 15, rate: "₦84,000", total: "₦1,260,000" },
        ],
      },
      {
        id: "PO-1002",
        vendor: "SteelCo Nigeria",
        vendorEmail: "dispatch@steelco.ng",
        vendorPhone: "+234 805 555 1212",
        amount: "₦21,000,000",
        amountNum: 21000000,
        status: "Partially Received",
        statusStyle: "bg-amber-50 text-amber-700 border-amber-200",
        date: "04 Sept 2026",
        project: "Victoria Island Office Tower",
        wbsCode: "WBS-1.1.2 Structural Steel Reinforcement",
        items: [
          { desc: "High-Tensile TMT Rebar 16mm (Tons)", qty: 20, rate: "₦650,000", total: "₦13,000,000" },
          { desc: "Binding Wire & Spacer Blocks", qty: 50, rate: "₦160,000", total: "₦8,000,000" },
        ],
      },
    ],
    invoices: [
      {
        id: "INV-2004",
        vendor: "Cedar Homes Logistics",
        vendorBank: "Access Bank Plc",
        accountNumber: "0123456789",
        dueDate: "due 08 Oct 2026",
        amount: "₦3,200,000",
        amountNum: 3200000,
        status: "Draft",
        statusStyle: "bg-gray-100 text-[#525F7F] border-gray-200",
        project: "Victoria Island Office Tower",
        paidAmount: "₦0",
        balance: "₦3,200,000",
        items: [
          { desc: "Tower Crane Hire (September 2-Week Block)", qty: 1, rate: "₦3,200,000", total: "₦3,200,000" },
        ],
      },
      {
        id: "INV-2002",
        vendor: "SteelCo Nigeria",
        vendorBank: "Zenith Bank Plc",
        accountNumber: "1012345678",
        dueDate: "due 06 Oct 2026",
        amount: "₦10,500,000",
        amountNum: 10500000,
        status: "Sent",
        statusStyle: "bg-blue-50 text-[#3B7CED] border-blue-200",
        project: "Victoria Island Office Tower",
        paidAmount: "₦0",
        balance: "₦10,500,000",
        items: [
          { desc: "Partial Delivery Payment - 10 Tons Rebar", qty: 10, rate: "₦650,000", total: "₦6,500,000" },
          { desc: "Transportation & Offloading Logistics", qty: 1, rate: "₦4,000,000", total: "₦4,000,000" },
        ],
      },
    ],
    inventoryItems: [
      {
        id: "INV-ITEM-01",
        name: "Portland Cement Grade 42.5R",
        sku: "MAT-CEM-042",
        category: "Civil & Masonry",
        quantity: 85,
        unit: "Bags",
        reorderLevel: 150,
        unitCost: "₦8,500",
        totalValue: "₦722,500",
        status: "Critical",
        location: "Warehouse A (Victoria Island)",
      },
    ],
    budgetWBS: [
      {
        code: "WBS-1.0",
        name: "Substructure & Deep Foundation",
        allocated: "₦180,000,000",
        spent: "₦145,000,000",
        committed: "₦25,000,000",
        available: "₦10,000,000",
        utilization: 81,
      },
      {
        code: "WBS-2.0",
        name: "Structural Concrete & Heavy Framing",
        allocated: "₦170,000,000",
        spent: "₦105,000,000",
        committed: "₦40,000,000",
        available: "₦25,000,000",
        utilization: 62,
      },
    ],
  },
  lekki: {
    id: "lekki",
    name: "Lekki Phase 1 Luxury Villas",
    client: "Oasis Real Estate Holdings",
    manager: "Arch. Sarah Adeyemi",
    poValue: "₦15.0M",
    poCount: 1,
    poTrend: "On track",
    totalInvoiced: "₦15.0M",
    paidAmount: "₦15.0M",
    overdueAmount: "₦0.0M",
    overdueCount: 0,
    hasOverdue: false,
    budgetUtilization: 91,
    allocatedBudget: "₦165.0M",
    totalBudget: "₦180.0M",
    siteRequestsCount: 1,
    siteRequestsPending: 0,
    inventoryAlerts: 0,
    monthlySpending: "₦15,000,000",
    monthlyTotalRequests: 4,
    monthlyApprovedRequests: 4,
    monthlyRejectedRequests: 0,
    categorySpend: [
      { name: "Material", value: 45, color: "#0F172A", amount: "₦6,750,000" },
      { name: "Labor", value: 30, color: "#1E3A8A", amount: "₦4,500,000" },
      { name: "Purchase", value: 15, color: "#3B7CED", amount: "₦2,250,000" },
      { name: "Petty cash", value: 10, color: "#38BDF8", amount: "₦1,500,000" },
    ],
    barData: [
      {
        project: "Foundation",
        fullName: "Substructure Foundation Pour",
        budget: 70000000,
        spent: 65000000,
        budgetFormatted: "₦70.0M",
        spentFormatted: "₦65.0M",
      },
      {
        project: "Masonry",
        fullName: "Blockwork & Framing",
        budget: 60000000,
        spent: 58000000,
        budgetFormatted: "₦60.0M",
        spentFormatted: "₦58.0M",
      },
      {
        project: "Utilities",
        fullName: "Roofing & Infrastructure",
        budget: 50000000,
        spent: 42000000,
        budgetFormatted: "₦50.0M",
        spentFormatted: "₦42.0M",
      },
    ],
    monthlyTrends: [
      { month: "Jan", budget: 20000, committed: 18000, actual: 15000 },
      { month: "Feb", budget: 25000, committed: 22000, actual: 20000 },
      { month: "Mar", budget: 30000, committed: 28000, actual: 25000 },
      { month: "Apr", budget: 35000, committed: 32000, actual: 30000 },
      { month: "May", budget: 40000, committed: 38000, actual: 35000 },
      { month: "Jun", budget: 45000, committed: 42000, actual: 40000 },
      { month: "Jul", budget: 50000, committed: 48000, actual: 45000 },
      { month: "Aug", budget: 55000, committed: 52000, actual: 50000 },
      { month: "Sep", budget: 60000, committed: 58000, actual: 55000 },
      { month: "Oct", budget: 65000, committed: 62000, actual: 60000 },
    ],
    siteRequests: [
      {
        id: "SR-103",
        title: "Granite Aggregate 3/4 inch Sub-base Pour",
        project: "Lekki Phase 1 Luxury Villas",
        requestedBy: "Arch. Sarah Adeyemi",
        date: "09 Sept 2026",
        amount: "₦2,100,000",
        amountNum: 2100000,
        category: "Material",
        status: "Approved",
        items: [
          { desc: "Granite Stones 3/4 inch Clean Aggregate", qty: 3, unit: "30-ton Tipper", rate: "₦700,000", total: "₦2,100,000" },
        ],
      },
    ],
    purchaseOrders: [
      {
        id: "PO-1001",
        vendor: "Dangote Cement",
        vendorEmail: "commercial@dangote-cement.com",
        vendorPhone: "+234 807 000 8888",
        amount: "₦15,000,000",
        amountNum: 15000000,
        status: "Received",
        statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        date: "01 Sept 2026",
        project: "Lekki Phase 1 Luxury Villas",
        wbsCode: "WBS-3.1.1 Substructure Foundation Pour",
        items: [
          { desc: "Grade 42.5R Portland Cement (Trailer Load)", qty: 2, rate: "₦7,500,000", total: "₦15,000,000" },
        ],
      },
    ],
    invoices: [
      {
        id: "INV-2001",
        vendor: "Dangote Cement",
        vendorBank: "First Bank of Nigeria",
        accountNumber: "2034567891",
        dueDate: "due 02 Oct 2026",
        amount: "₦15,000,000",
        amountNum: 15000000,
        status: "Paid",
        statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        project: "Lekki Phase 1 Luxury Villas",
        paidAmount: "₦15,000,000",
        balance: "₦0",
        items: [
          { desc: "Fulfilled PO-1001 Cement Delivery (900 Bags)", qty: 1, rate: "₦15,000,000", total: "₦15,000,000" },
        ],
      },
    ],
    inventoryItems: [
      {
        id: "INV-ITEM-03",
        name: "PPR Pipes 32mm High Pressure",
        sku: "MEP-PPR-032",
        category: "Plumbing",
        quantity: 240,
        unit: "Meters",
        reorderLevel: 100,
        unitCost: "₦650",
        totalValue: "₦156,000",
        status: "Normal",
        location: "Store 3 (Lekki Yard)",
      },
    ],
    budgetWBS: [
      {
        code: "WBS-1.0",
        name: "Substructure & Deep Foundation",
        allocated: "₦100,000,000",
        spent: "₦95,000,000",
        committed: "₦4,000,000",
        available: "₦1,000,000",
        utilization: 95,
      },
      {
        code: "WBS-2.0",
        name: "Superstructure Masonry & Finishing",
        allocated: "₦80,000,000",
        spent: "₦70,000,000",
        committed: "₦8,000,000",
        available: "₦2,000,000",
        utilization: 87,
      },
    ],
  },
  ikeja: {
    id: "ikeja",
    name: "Ikeja Tech Complex",
    client: "Innovate Hub Africa",
    manager: "Kenechukwu Obi",
    poValue: "₦5.55M",
    poCount: 1,
    poTrend: "Initial phase",
    totalInvoiced: "₦5.55M",
    paidAmount: "₦0.0M",
    overdueAmount: "₦5.55M",
    overdueCount: 1,
    hasOverdue: true,
    budgetUtilization: 22,
    allocatedBudget: "₦48.0M",
    totalBudget: "₦220.0M",
    siteRequestsCount: 0,
    siteRequestsPending: 0,
    inventoryAlerts: 1,
    monthlySpending: "₦5,550,000",
    monthlyTotalRequests: 2,
    monthlyApprovedRequests: 1,
    monthlyRejectedRequests: 1,
    categorySpend: [
      { name: "Purchase", value: 60, color: "#3B7CED", amount: "₦3,330,000" },
      { name: "Labor", value: 25, color: "#1E3A8A", amount: "₦1,387,500" },
      { name: "Petty cash", value: 15, color: "#38BDF8", amount: "₦832,500" },
    ],
    barData: [
      {
        project: "Site Clearance",
        fullName: "Site Clearance & Excavation",
        budget: 70000000,
        spent: 28000000,
        budgetFormatted: "₦70.0M",
        spentFormatted: "₦28.0M",
      },
      {
        project: "Electrical",
        fullName: "Data Infrastructure & Electrical Cabling",
        budget: 150000000,
        spent: 20000000,
        budgetFormatted: "₦150.0M",
        spentFormatted: "₦20.0M",
      },
    ],
    monthlyTrends: [
      { month: "Jan", budget: 10000, committed: 5000, actual: 2000 },
      { month: "Feb", budget: 15000, committed: 8000, actual: 4000 },
      { month: "Mar", budget: 20000, committed: 12000, actual: 6000 },
      { month: "Apr", budget: 25000, committed: 16000, actual: 8000 },
      { month: "May", budget: 30000, committed: 20000, actual: 12000 },
      { month: "Jun", budget: 35000, committed: 25000, actual: 16000 },
      { month: "Jul", budget: 40000, committed: 30000, actual: 22000 },
      { month: "Aug", budget: 45000, committed: 35000, actual: 28000 },
      { month: "Sep", budget: 50000, committed: 40000, actual: 34000 },
      { month: "Oct", budget: 55000, committed: 45000, actual: 40000 },
    ],
    siteRequests: [],
    purchaseOrders: [
      {
        id: "PO-1003",
        vendor: "Bright Electricals",
        vendorEmail: "sales@brightelectricals.com",
        vendorPhone: "+234 802 987 6543",
        amount: "₦5,550,000",
        amountNum: 5550000,
        status: "Sent",
        statusStyle: "bg-blue-50 text-[#3B7CED] border-blue-200",
        date: "10 Sept 2026",
        project: "Ikeja Tech Complex",
        wbsCode: "WBS-2.1.3 Electrical Conduit & Cabling",
        items: [
          { desc: "Armoured Cable 16mm 4-Core (500m)", qty: 2, rate: "₦1,850,000", total: "₦3,700,000" },
          { desc: "Distribution Board 12-Way 3-Phase", qty: 3, rate: "₦616,666", total: "₦1,850,000" },
        ],
      },
    ],
    invoices: [
      {
        id: "INV-2003",
        vendor: "Bright Electricals",
        vendorBank: "Guaranty Trust Bank (GTBank)",
        accountNumber: "0159876543",
        dueDate: "due 20 Sept 2026",
        amount: "₦5,550,000",
        amountNum: 5550000,
        status: "Overdue",
        statusStyle: "bg-rose-50 text-rose-700 border-rose-200",
        project: "Ikeja Tech Complex",
        paidAmount: "₦0",
        balance: "₦5,550,000",
        items: [
          { desc: "Cabling & Conduit Batch 1 (Overdue milestone)", qty: 1, rate: "₦5,550,000", total: "₦5,550,000" },
        ],
      },
    ],
    inventoryItems: [
      {
        id: "INV-ITEM-02",
        name: "High-Tensile TMT Steel Rebars 16mm",
        sku: "MAT-STEEL-016",
        category: "Structural",
        quantity: 12,
        unit: "Tons",
        reorderLevel: 20,
        unitCost: "₦650,000",
        totalValue: "₦7,800,000",
        status: "Low Stock",
        location: "Central Yard (Ikeja)",
      },
    ],
    budgetWBS: [
      {
        code: "WBS-1.0",
        name: "Site Clearance & Excavation",
        allocated: "₦70,000,000",
        spent: "₦28,000,000",
        committed: "₦12,000,000",
        available: "₦30,000,000",
        utilization: 40,
      },
      {
        code: "WBS-2.0",
        name: "Data Infrastructure & Electrical Wiring",
        allocated: "₦150,000,000",
        spent: "₦20,000,000",
        committed: "₦25,000,000",
        available: "₦105,000,000",
        utilization: 13,
      },
    ],
  },
};

const PERIOD_OPTIONS = [
  { id: "current", label: "September 2026" },
  { id: "q3_2026", label: "Q3 2026" },
  { id: "ytd_2026", label: "Year-To-Date (2026)" },
  { id: "all_time", label: "All Time" },
];

const INVOICE_STATUS_DATA = [
  { name: "Paid", value: 2, color: "#22C55E" },
  { name: "Sent", value: 1, color: "#3B7CED" },
  { name: "Draft", value: 1, color: "#94A3B8" },
  { name: "Overdue", value: 1, color: "#EF4444" },
];

const INVOICE_LEGEND = [
  { name: "Paid", color: "#22C55E" },
  { name: "Sent", color: "#3B7CED" },
  { name: "Draft", color: "#94A3B8" },
  { name: "Overdue", color: "#EF4444" },
];

function formatNaira(num: number): string {
  if (num >= 1000000000) {
    return `₦${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `₦${(num / 1000000).toFixed(1)}M`;
  }
  return `₦${num.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function StandaloneCostingDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [allProjectsData, setAllProjectsData] = useState<Record<string, ProjectData>>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current");
  const [chartView, setChartView] = useState<"projects" | "monthly">("projects");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [poFilter, setPoFilter] = useState<string>("all");
  const [invFilter, setInvFilter] = useState<string>("all");
  const [invoicePeriodFilter, setInvoicePeriodFilter] = useState<string>("all");
  const [monthlyRangeFilter, setMonthlyRangeFilter] = useState<string>("all");

  // Drawers & Modals
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSiteRequestsDrawerOpen, setIsSiteRequestsDrawerOpen] = useState(false);
  const [isInventoryDrawerOpen, setIsInventoryDrawerOpen] = useState(false);
  const [isBudgetDrawerOpen, setIsBudgetDrawerOpen] = useState(false);

  // New Project Form State
  const [newProjectForm, setNewProjectForm] = useState({
    name: "",
    code: "",
    manager: "",
    client: "",
    type: "Fixed Price",
    budget: "",
    startDate: "2026-10-01",
    endDate: "2027-04-30",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentProject = useMemo(() => {
    return allProjectsData[selectedProjectId] || allProjectsData["all"];
  }, [allProjectsData, selectedProjectId]);

  const projectOptions = useMemo(() => {
    return [
      { id: "all", label: "All Projects" },
      ...Object.keys(allProjectsData)
        .filter((k) => k !== "all")
        .map((k) => ({ id: k, label: allProjectsData[k].name })),
    ];
  }, [allProjectsData]);

  // Filtered POs
  const filteredPOs = useMemo(() => {
    if (poFilter === "all") return currentProject.purchaseOrders;
    return currentProject.purchaseOrders.filter((po) =>
      po.status.toLowerCase().includes(poFilter.toLowerCase())
    );
  }, [currentProject, poFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    if (invFilter === "all") return currentProject.invoices;
    return currentProject.invoices.filter((inv) =>
      inv.status.toLowerCase() === invFilter.toLowerCase()
    );
  }, [currentProject, invFilter]);

  const currentInvoiceChartData = useMemo(() => {
    const counts: Record<string, number> = { Paid: 0, Sent: 0, Draft: 0, Overdue: 0 };
    currentProject.invoices.forEach((inv) => {
      const st = inv.status.toLowerCase();
      if (st === "paid") counts.Paid++;
      else if (st === "sent") counts.Sent++;
      else if (st === "overdue") counts.Overdue++;
      else counts.Draft++;
    });

    const colors: Record<string, string> = {
      Paid: "#22C55E",
      Sent: "#3B7CED",
      Draft: "#94A3B8",
      Overdue: "#EF4444",
    };

    const data = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colors[name],
    }));

    const active = data.filter((d) => d.value > 0);
    return active.length > 0 ? active : INVOICE_STATUS_DATA;
  }, [currentProject]);

  const invoiceBreakdown = useMemo(() => {
    const total = currentProject.invoices.length || 1;
    const counts: Record<string, { count: number; color: string; filterKey: string }> = {
      Paid: { count: 0, color: "#22C55E", filterKey: "paid" },
      Sent: { count: 0, color: "#3B7CED", filterKey: "sent" },
      Draft: { count: 0, color: "#94A3B8", filterKey: "draft" },
      Overdue: { count: 0, color: "#EF4444", filterKey: "overdue" },
    };

    currentProject.invoices.forEach((inv) => {
      const st = inv.status.toLowerCase();
      if (st === "paid") counts.Paid.count++;
      else if (st === "sent") counts.Sent.count++;
      else if (st === "overdue") counts.Overdue.count++;
      else counts.Draft.count++;
    });

    return Object.entries(counts).map(([label, info]) => ({
      label,
      count: info.count,
      color: info.color,
      filterKey: info.filterKey,
      percent: Math.round((info.count / total) * 100),
    }));
  }, [currentProject]);

  const filteredMonthlyTrends = useMemo(() => {
    if (monthlyRangeFilter === "h1") return currentProject.monthlyTrends.slice(0, 6);
    if (monthlyRangeFilter === "q3") return currentProject.monthlyTrends.slice(6, 9);
    return currentProject.monthlyTrends;
  }, [currentProject, monthlyRangeFilter]);

  const barChartMax = useMemo(() => {
    if (selectedProjectId === "all") return 600000000;
    const maxVal = Math.max(
      ...currentProject.barData.map((d) => Math.max(d.budget, d.spent)),
      100000000
    );
    return Math.ceil(maxVal / 50000000) * 50000000;
  }, [selectedProjectId, currentProject]);

  const barChartTicks = useMemo(() => {
    if (selectedProjectId === "all") {
      return [0, 150000000, 300000000, 450000000, 600000000];
    }
    const step = barChartMax / 4;
    return [0, step, step * 2, step * 3, barChartMax];
  }, [selectedProjectId, barChartMax]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Handler: Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.name.trim()) return;

    const newKey = `proj_${Date.now()}`;
    const cleanBudgetNum = parseFloat(newProjectForm.budget.replace(/[^0-9.]/g, "")) || 250000000;
    const formattedBudget = formatNaira(cleanBudgetNum);

    const newProjObj: ProjectData = {
      id: newKey,
      name: newProjectForm.name,
      client: newProjectForm.client || "Fastra Enterprise Client",
      manager: newProjectForm.manager || "Lead Project Engineer",
      poValue: "₦0.0M",
      poCount: 0,
      poTrend: "New",
      totalInvoiced: "₦0.0M",
      paidAmount: "₦0.0M",
      overdueAmount: "₦0.0M",
      overdueCount: 0,
      hasOverdue: false,
      budgetUtilization: 0,
      allocatedBudget: "₦0.0M",
      totalBudget: formattedBudget,
      siteRequestsCount: 0,
      siteRequestsPending: 0,
      inventoryAlerts: 0,
      monthlySpending: "₦0",
      monthlyTotalRequests: 0,
      monthlyApprovedRequests: 0,
      monthlyRejectedRequests: 0,
      categorySpend: [
        { name: "Purchase", value: 0, color: "#3B7CED", amount: "₦0" },
        { name: "Labor", value: 0, color: "#1E3A8A", amount: "₦0" },
        { name: "Material", value: 0, color: "#0F172A", amount: "₦0" },
      ],
      barData: [
        {
          project: newProjectForm.name.slice(0, 12) + "...",
          fullName: newProjectForm.name,
          budget: cleanBudgetNum,
          spent: 0,
          budgetFormatted: formattedBudget,
          spentFormatted: "₦0.0M",
        },
      ],
      monthlyTrends: [
        { month: "Oct", budget: cleanBudgetNum / 1000, committed: 0, actual: 0 },
      ],
      siteRequests: [],
      purchaseOrders: [],
      invoices: [],
      inventoryItems: [],
      budgetWBS: [
        {
          code: "WBS-1.0",
          name: "Phase 1 Mobilization & Setup",
          allocated: formattedBudget,
          spent: "₦0",
          committed: "₦0",
          available: formattedBudget,
          utilization: 0,
        },
      ],
    };

    setAllProjectsData((prev) => ({
      ...prev,
      [newKey]: newProjObj,
    }));

    setSelectedProjectId(newKey);
    setIsNewProjectOpen(false);
    showToast(`Project "${newProjectForm.name}" created and selected!`);
    setNewProjectForm({
      name: "",
      code: "",
      manager: "",
      client: "",
      type: "Fixed Price",
      budget: "",
      startDate: "2026-10-01",
      endDate: "2027-04-30",
    });
  };

  // Handler: Site Request status update (Approve/Reject)
  const handleUpdateRequestStatus = (reqId: string, newStatus: "Approved" | "Rejected") => {
    setAllProjectsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        const proj = updated[k];
        const reqIdx = proj.siteRequests.findIndex((r) => r.id === reqId);
        if (reqIdx !== -1) {
          const req = proj.siteRequests[reqIdx];
          const oldStatus = req.status;
          req.status = newStatus;
          if (oldStatus === "Pending") {
            proj.siteRequestsPending = Math.max(0, proj.siteRequestsPending - 1);
            if (newStatus === "Approved") {
              proj.monthlyApprovedRequests += 1;
            } else {
              proj.monthlyRejectedRequests += 1;
            }
          }
        }
      });
      return updated;
    });
    showToast(`Site Request ${reqId} marked as ${newStatus}`);
  };

  // Handler: Invoice payment approval / marking as paid
  const handleMarkInvoicePaid = (invId: string) => {
    setAllProjectsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        const proj = updated[k];
        const inv = proj.invoices.find((i) => i.id === invId);
        if (inv) {
          const prevStatus = inv.status;
          inv.status = "Paid";
          inv.statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
          inv.paidAmount = inv.amount;
          inv.balance = "₦0";
          if (prevStatus === "Overdue") {
            proj.overdueCount = Math.max(0, proj.overdueCount - 1);
            proj.hasOverdue = proj.overdueCount > 0;
            proj.overdueAmount = proj.overdueCount > 0 ? proj.overdueAmount : "₦0.0M";
          }
        }
      });
      return updated;
    });
    setSelectedInv(null);
    showToast(`Payment processed for ${invId}! Marked as Paid.`);
  };

  // Handler: PO Mark as Received
  const handleMarkPoReceived = (poId: string) => {
    setAllProjectsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        const proj = updated[k];
        const po = proj.purchaseOrders.find((p) => p.id === poId);
        if (po) {
          po.status = "Received";
          po.statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
        }
      });
      return updated;
    });
    setSelectedPo(null);
    showToast(`Goods delivery confirmed for ${poId}! Status updated to Received.`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-16 font-open-sans text-[#32325D] select-none">
      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#32325D] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} className="text-[#2DCE89] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ================================================================= */}
        {/* TOP CONTROL HEADER: Unified Scope & Global Actions */}
        {/* ================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-gray-200/70">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Project Costing Dashboard
              </h1>
              <span className="bg-blue-50 text-[#3B7CED] text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
                Live Overview
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Procurement status, financial tracking, and cost execution across active projects.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Global Project Selector */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
                  Project
                </span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    showToast(`Active Project: ${allProjectsData[e.target.value]?.name || "All Projects"}`);
                  }}
                  className="bg-transparent text-xs font-semibold text-gray-800 cursor-pointer focus:outline-none pr-3"
                >
                  {projectOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Global Period Selector */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
                  Period
                </span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    showToast(`Period: ${e.target.options[e.target.selectedIndex].text}`);
                  }}
                  className="bg-transparent text-xs font-semibold text-gray-800 cursor-pointer focus:outline-none pr-3"
                >
                  <option value="current">Current Month (Sep 2026)</option>
                  <option value="last">Last Month (Aug 2026)</option>
                  <option value="q3">Q3 2026</option>
                  <option value="ytd">Year to Date (2026)</option>
                </select>
              </div>
            </div>

            {/* New Project Button */}
            <button
              onClick={() => setIsNewProjectOpen(true)}
              className="flex items-center gap-1.5 bg-[#3B7CED] hover:bg-[#3065c3] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROW 1: EXECUTIVE KPI CARDS */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: PO Value */}
          <div
            onClick={() => {
              setPoFilter("all");
              showToast("Viewing all Purchase Orders");
            }}
            className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-[#3B7CED]/50 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                PO VALUE
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3B7CED] flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingCart size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {currentProject.poValue}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 font-normal">
              <span>{currentProject.poCount} purchase orders</span>
              <span className="text-emerald-600 font-medium">{currentProject.poTrend}</span>
            </div>
          </div>

          {/* Card 2: Total Invoiced */}
          <div
            onClick={() => {
              setInvFilter("all");
              showToast("Viewing all Invoices");
            }}
            className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-emerald-400/50 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                TOTAL INVOICED
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {currentProject.totalInvoiced}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 font-normal">
              <span>Paid: <strong className="text-gray-700 font-semibold">{currentProject.paidAmount}</strong></span>
              <span className="text-xs text-gray-400">{currentProject.invoices.length} invoices</span>
            </div>
          </div>

          {/* Card 3: Overdue Invoices */}
          <div
            onClick={() => {
              setInvFilter("overdue");
              showToast("Filtered view to Overdue Invoices");
            }}
            className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-rose-400/50 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                OVERDUE INVOICES
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight flex items-baseline gap-2">
              <span>{currentProject.overdueAmount}</span>
              {currentProject.overdueCount > 0 && (
                <span className="text-xs bg-rose-50 text-rose-600 font-semibold px-2 py-0.5 rounded-full border border-rose-100">
                  {currentProject.overdueCount} Overdue
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2 font-normal">
              Pending vendor settlement actions
            </div>
          </div>

          {/* Card 4: Project Costing */}
          <Link
            href="/project-costing"
            className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-amber-400/50 hover:shadow-xs transition-all cursor-pointer group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                PROJECT COSTING
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wallet size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {currentProject.budgetUtilization}%
            </div>
            <div className="text-xs text-gray-500 mt-2 font-normal">
              {currentProject.allocatedBudget} of {currentProject.totalBudget}
            </div>
          </Link>
        </div>

        {/* ================================================================= */}
        {/* ROW 2: MODULE QUICK STATUS CARDS (Click to open respective pages) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Project Request */}
          <Link
            href="/project-request"
            className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs hover:border-[#3B7CED] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-[#3B7CED] flex items-center justify-center transition-colors">
                <MapPin size={17} />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                {currentProject.siteRequestsPending} Pending
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">
                {currentProject.siteRequestsCount}
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-900 transition-colors flex items-center justify-between">
                <span>Project Requests</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#3B7CED] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>

          {/* Card 2: Purchase Orders */}
          <Link
            href="/invoice/purchase-order"
            className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs hover:border-[#3B7CED] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-[#3B7CED] flex items-center justify-center transition-colors">
                <ShoppingCart size={17} />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#3B7CED] border border-blue-100">
                Active
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">
                {currentProject.poCount}
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-900 transition-colors flex items-center justify-between">
                <span>Purchase Orders</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#3B7CED] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>

          {/* Card 3: Invoices */}
          <Link
            href="/invoice/approved-requests"
            className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs hover:border-[#3B7CED] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-[#3B7CED] flex items-center justify-center transition-colors">
                <FileText size={17} />
              </div>
              {currentProject.overdueCount > 0 ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  {currentProject.overdueCount} Overdue
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  On Track
                </span>
              )}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">
                {currentProject.invoices.length}
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-900 transition-colors flex items-center justify-between">
                <span>Invoices</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#3B7CED] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>

          {/* Card 4: Incoming Products */}
          <Link
            href="/inventory/operation/incoming_product"
            className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs hover:border-[#3B7CED] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-[#3B7CED] flex items-center justify-center transition-colors">
                <Package size={17} />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                {currentProject.inventoryAlerts} Alerts
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">
                {currentProject.inventoryItems.length || 4}
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-900 transition-colors flex items-center justify-between">
                <span>Incoming Products</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#3B7CED] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>

          {/* Card 5: Project Costing */}
          <Link
            href="/project-costing"
            className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs hover:border-[#3B7CED] hover:shadow-xs transition-all cursor-pointer group col-span-2 sm:col-span-1 flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-[#3B7CED] flex items-center justify-center transition-colors">
                <Wallet size={17} />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#3B7CED] border border-blue-100">
                WBS Active
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">
                {currentProject.budgetWBS.length || 3}
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-900 transition-colors flex items-center justify-between">
                <span>Project Costing</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#3B7CED] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>
        </div>

        {/* ================================================================= */}
        {/* ROW 3: CHARTS (Cohesive, Balanced Presentation) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Main Bar Chart (Project Costing vs Spent) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">
                      Project Costing vs Spent
                    </h2>
                    <TrendingUp size={16} className="text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Budget allocation versus actual spending for {currentProject.name}
                  </p>
                </div>

                {/* Sleek Segmented View Toggle */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/70 self-start sm:self-auto">
                  <button
                    onClick={() => setChartView("projects")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      chartView === "projects"
                        ? "bg-white text-gray-900 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Projects
                  </button>
                  <button
                    onClick={() => setChartView("monthly")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      chartView === "monthly"
                        ? "bg-white text-gray-900 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Monthly Trends
                  </button>
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-[310px] w-full">
                {isMounted ? (
                  chartView === "projects" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={currentProject.barData}
                        margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                        barGap={8}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F9" />
                        <XAxis
                          dataKey="project"
                          tick={{ fill: "#8898AA", fontSize: 11, fontFamily: "'Open Sans', sans-serif" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#8898AA", fontSize: 11, fontFamily: "'Open Sans', sans-serif" }}
                          axisLine={false}
                          tickLine={false}
                          ticks={barChartTicks}
                          tickFormatter={(val) => (val === 0 ? "₦0" : `₦${(val / 1000000).toFixed(0)}.0M`)}
                          domain={[0, barChartMax]}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "#E2E8F0", opacity: 0.4 }}
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg text-xs space-y-1 font-open-sans">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {data.fullName || data.project}
                                  </p>
                                  <div className="text-[#3B7CED] font-medium pt-0.5">
                                    Project Costing: ₦{data.budget.toLocaleString()}
                                  </div>
                                  <div className="text-[#22C55E] font-medium">
                                    Spent: ₦{data.spent.toLocaleString()}
                                  </div>
                                  {data.budget > data.spent && (
                                    <div className="text-gray-400 text-[11px] pt-1 border-t border-gray-100">
                                      Remaining: ₦{(data.budget - data.spent).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="budget"
                          name="Project Costing"
                          fill="#3B7CED"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="spent"
                          name="Spent"
                          fill="#22C55E"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredMonthlyTrends}
                        margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                        barGap={6}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F9" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#8898AA", fontSize: 11, fontFamily: "'Open Sans', sans-serif" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#8898AA", fontSize: 11, fontFamily: "'Open Sans', sans-serif" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip
                          content={({ active, payload, label }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg text-xs space-y-1">
                                  <p className="font-semibold text-gray-900">{label} Spending</p>
                                  <div className="text-[#3B7CED]">
                                    Committed: ₦{(payload[0]?.value * 1000).toLocaleString()}
                                  </div>
                                  <div className="text-[#22C55E]">
                                    Actual Spent: ₦{(payload[1]?.value * 1000).toLocaleString()}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="committed" name="Committed" fill="#3B7CED" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="actual" name="Actual Spent" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                    Loading chart...
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100 text-xs font-medium text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B7CED]" />
                <span>{chartView === "projects" ? "Project Costing" : "Committed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                <span>{chartView === "projects" ? "Actual Spent" : "Actual Spent"}</span>
              </div>
            </div>
          </div>

          {/* Right: Invoice Status Donut */}
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">
                    Invoice Status
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Settlement & lifecycle status
                  </p>
                </div>
                <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {currentProject.invoices.length} Total
                </span>
              </div>

              {/* Donut Container */}
              <div className="h-[200px] w-full relative flex items-center justify-center">
                {isMounted ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={currentInvoiceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {currentInvoiceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(val, name) => [`${val} Invoices`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Donut Metric */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900">
                        {currentProject.invoices.length}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        Invoices
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-xs">Loading chart...</div>
                )}
              </div>

              {/* Structured Status Breakdown List with Filter Action */}
              <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                {invoiceBreakdown.map((item) => {
                  const isSelected = invFilter === item.filterKey;
                  return (
                    <div
                      key={item.label}
                      onClick={() => {
                        const next = isSelected ? "all" : item.filterKey;
                        setInvFilter(next);
                        showToast(next === "all" ? "Showing all invoices" : `Filtered by ${item.label}`);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 border border-blue-200 text-blue-900 font-semibold shadow-2xs"
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.count}</span>
                        <span className="text-gray-400 text-[11px]">({item.percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {invFilter !== "all" && (
              <button
                onClick={() => {
                  setInvFilter("all");
                  showToast("Cleared status filter");
                }}
                className="text-xs text-[#3B7CED] font-semibold hover:underline pt-2 text-center cursor-pointer block"
              >
                Reset Invoice Filter
              </button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROW 4: RECENT TRANSACTIONS (PO & INVOICES) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Purchase Orders */}
          <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Recent Purchase Orders
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                    {filteredPOs.length}
                  </span>
                </div>
                <Link
                  href="/invoice/purchase-order"
                  className="text-xs font-semibold text-[#3B7CED] hover:text-[#3065c3] hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Sub-filter Tabs for PO */}
              <div className="flex items-center gap-1.5 mb-3">
                {["all", "Draft", "Sent", "Received"].map((tab) => {
                  const isActive = poFilter.toLowerCase() === tab.toLowerCase();
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setPoFilter(tab === "all" ? "all" : tab);
                        showToast(`Filtered POs by ${tab}`);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-[#3B7CED] border border-blue-200"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {tab === "all" ? "All" : tab}
                    </button>
                  );
                })}
              </div>

              {/* PO Rows */}
              <div className="divide-y divide-gray-100">
                {filteredPOs.length > 0 ? (
                  filteredPOs.slice(0, 4).map((po) => (
                    <div
                      key={po.id}
                      onClick={() => setSelectedPo(po)}
                      className="py-3 px-2.5 flex items-center justify-between hover:bg-gray-50/80 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-[#3B7CED] transition-colors">
                          {po.id}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {po.vendor} · {po.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-gray-900">
                          {po.amount}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            po.status === "Draft"
                              ? "bg-gray-100 text-gray-700"
                              : po.status === "Sent"
                              ? "bg-blue-50 text-[#3B7CED]"
                              : po.status === "Partially Received"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No purchase orders found matching this filter.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Recent Invoices
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                    {filteredInvoices.length}
                  </span>
                </div>
                <Link
                  href="/invoice/approved-requests"
                  className="text-xs font-semibold text-[#3B7CED] hover:text-[#3065c3] hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Sub-filter Tabs for Invoices */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {["all", "Draft", "Sent", "Paid", "Overdue"].map((tab) => {
                  const isActive = invFilter.toLowerCase() === tab.toLowerCase();
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setInvFilter(tab === "all" ? "all" : tab);
                        showToast(`Filtered Invoices by ${tab}`);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-[#3B7CED] border border-blue-200"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {tab === "all" ? "All" : tab}
                    </button>
                  );
                })}
              </div>

              {/* Invoice Rows */}
              <div className="divide-y divide-gray-100">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.slice(0, 4).map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInv(inv)}
                      className="py-3 px-2.5 flex items-center justify-between hover:bg-gray-50/80 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-[#3B7CED] transition-colors">
                          {inv.id}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {inv.vendor} · Due {inv.dueDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-gray-900">
                          {inv.amount}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            inv.status === "Draft"
                              ? "bg-gray-100 text-gray-700"
                              : inv.status === "Sent"
                              ? "bg-blue-50 text-[#3B7CED]"
                              : inv.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No invoices found matching this filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 1: PURCHASE ORDER DETAIL */}
      {/* ================================================================= */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#32325D]">
                      {selectedPo.id}
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${selectedPo.statusStyle}`}
                    >
                      {selectedPo.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8898AA] mt-1">
                    Issued on {selectedPo.date} · {selectedPo.project}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPo(null)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Vendor & WBS Info */}
              <div className="bg-[#F8F9FE] p-4 rounded-xl my-4 space-y-2 border border-[#E9ECEF] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Vendor:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedPo.vendor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Contact:</span>
                  <span className="text-[#525F7F]">
                    {selectedPo.vendorEmail} · {selectedPo.vendorPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">WBS Code:</span>
                  <span className="font-semibold text-[#3B7CED]">
                    {selectedPo.wbsCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Project:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedPo.project}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-[#8898AA] uppercase tracking-wider mb-2">
                  Line Items Breakdown
                </h4>
                <div className="border border-[#E9ECEF] rounded-xl divide-y divide-[#E9ECEF]">
                  {selectedPo.items?.map((item: any, i: number) => (
                    <div key={i} className="p-3 text-xs">
                      <div className="font-medium text-[#32325D]">
                        {item.desc}
                      </div>
                      <div className="flex justify-between text-[#8898AA] mt-1">
                        <span>
                          {item.qty} units @ {item.rate}
                        </span>
                        <span className="font-bold text-[#32325D]">
                          {item.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-[#E9ECEF]">
                <span className="text-sm font-semibold text-[#525F7F]">
                  Total Value:
                </span>
                <span className="text-xl font-extrabold text-[#3B7CED]">
                  {selectedPo.amount}
                </span>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-6 border-t border-[#E9ECEF] flex items-center gap-3">
              {selectedPo.status !== "Received" && (
                <button
                  onClick={() => handleMarkPoReceived(selectedPo.id)}
                  className="flex-1 bg-[#2BA24D] hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Confirm Goods Received
                </button>
              )}
              <button
                onClick={() => {
                  showToast(`Simulated PO PDF download for ${selectedPo.id}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FE] hover:bg-gray-200 text-[#32325D] py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer border border-[#E9ECEF]"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setSelectedPo(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 2: INVOICE DETAIL */}
      {/* ================================================================= */}
      {selectedInv && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#32325D]">
                      {selectedInv.id}
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${selectedInv.statusStyle}`}
                    >
                      {selectedInv.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8898AA] mt-1">
                    {selectedInv.dueDate} · {selectedInv.project}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInv(null)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedInv.status === "Overdue" && (
                <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#F5365C] flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>
                    Payment deadline exceeded! Vendor reminder issued. Immediate Finance action required.
                  </span>
                </div>
              )}

              {/* Financial Balance Summary */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-[#F8F9FE] p-3 rounded-xl border border-[#E9ECEF] text-xs">
                  <span className="text-[#8898AA]">Paid Amount:</span>
                  <div className="text-base font-bold text-[#2BA24D] mt-0.5">
                    {selectedInv.paidAmount}
                  </div>
                </div>
                <div className="bg-[#F8F9FE] p-3 rounded-xl border border-[#E9ECEF] text-xs">
                  <span className="text-[#8898AA]">Outstanding Balance:</span>
                  <div className="text-base font-bold text-[#F5365C] mt-0.5">
                    {selectedInv.balance}
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="bg-[#F8F9FE] p-4 rounded-xl mb-4 space-y-2 border border-[#E9ECEF] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Vendor:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedInv.vendor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Bank Details:</span>
                  <span className="text-[#525F7F]">
                    {selectedInv.vendorBank} - {selectedInv.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Due Date:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedInv.dueDate}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-xs font-bold text-[#8898AA] uppercase tracking-wider mb-2">
                  Invoice Breakdown
                </h4>
                <div className="border border-[#E9ECEF] rounded-xl divide-y divide-[#E9ECEF]">
                  {selectedInv.items?.map((item: any, i: number) => (
                    <div key={i} className="p-3 text-xs">
                      <div className="font-medium text-[#32325D]">
                        {item.desc}
                      </div>
                      <div className="flex justify-between text-[#8898AA] mt-1">
                        <span>Quantity: {item.qty}</span>
                        <span className="font-bold text-[#32325D]">
                          {item.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-6 border-t border-[#E9ECEF] flex items-center gap-3">
              {selectedInv.status !== "Paid" && (
                <button
                  onClick={() => handleMarkInvoicePaid(selectedInv.id)}
                  className="flex-1 bg-[#3B7CED] hover:bg-[#3065c3] text-white py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Approve & Record Payment
                </button>
              )}
              <button
                onClick={() => setSelectedInv(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#525F7F] py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 3: SITE REQUESTS FLOW (Approve / Reject Scope) */}
      {/* ================================================================= */}
      {isSiteRequestsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] text-[#3B7CED] flex items-center justify-center">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#32325D]">
                      Project Requests
                    </h3>
                    <p className="text-xs text-[#8898AA]">
                      {currentProject.name} · {currentProject.siteRequests.length} total requests
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSiteRequestsDrawerOpen(false)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="my-4 space-y-3">
                {currentProject.siteRequests.length === 0 ? (
                  <div className="text-center py-12 text-[#8898AA] text-xs">
                    No project requests logged for this project.
                  </div>
                ) : (
                  currentProject.siteRequests.map((req) => (
                    <div
                      key={req.id}
                      className="border border-[#E9ECEF] rounded-xl p-4 bg-[#F8F9FE] hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#32325D]">{req.id}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                req.status === "Approved"
                                  ? "bg-emerald-50 text-[#2BA24D] border-emerald-200"
                                  : req.status === "Rejected"
                                  ? "bg-rose-50 text-[#F5365C] border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-[#32325D] mt-1">{req.title}</h4>
                          <p className="text-[11px] text-[#8898AA] mt-0.5">
                            By {req.requestedBy} · {req.date}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-[#3B7CED]">{req.amount}</span>
                      </div>

                      {/* Items */}
                      <div className="bg-white rounded-lg p-2.5 border border-[#E9ECEF] divide-y divide-gray-100 text-[11px]">
                        {req.items.map((item, idx) => (
                          <div key={idx} className="py-1 flex justify-between text-[#525F7F]">
                            <span>{item.qty} {item.unit} - {item.desc}</span>
                            <span className="font-semibold text-[#32325D]">{item.total}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons if pending */}
                      {req.status === "Pending" && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, "Rejected")}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#F5365C] font-semibold text-xs rounded-lg transition-colors border border-rose-200 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, "Approved")}
                            className="px-3 py-1.5 bg-[#2BA24D] hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                          >
                            Approve Request
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9ECEF]">
              <button
                onClick={() => setIsSiteRequestsDrawerOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Project Requests
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 4: INVENTORY WAREHOUSE STOCK PREVIEW */}
      {/* ================================================================= */}
      {isInventoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] text-[#3B7CED] flex items-center justify-center">
                    <Package size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#32325D]">
                      Incoming Products & Material Stock
                    </h3>
                    <p className="text-xs text-[#8898AA]">
                      Stock on hand across project warehouses
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInventoryDrawerOpen(false)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="my-4 space-y-3">
                {currentProject.inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-[#E9ECEF] rounded-xl p-3.5 bg-[#F8F9FE] hover:bg-white transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#32325D]">{item.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.status === "Critical"
                                ? "bg-rose-50 text-[#F5365C] border-rose-200"
                                : item.status === "Low Stock"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-emerald-50 text-[#2BA24D] border-emerald-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8898AA] mt-0.5">
                          SKU: {item.sku} · {item.location}
                        </p>
                      </div>
                      <span className="font-bold text-[#32325D]">{item.totalValue}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#525F7F] bg-white p-2 rounded-lg border border-gray-100">
                      <span>Available: <strong className="text-[#32325D]">{item.quantity} {item.unit}</strong></span>
                      <span>Reorder Level: <strong>{item.reorderLevel} {item.unit}</strong></span>
                      <span>Unit Cost: <strong>{item.unitCost}</strong></span>
                    </div>

                    {item.status !== "Normal" && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            showToast(`Initiated replenishment PO for ${item.name}`);
                          }}
                          className="px-3 py-1 bg-[#3B7CED] hover:bg-[#3065c3] text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          Create Restock Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9ECEF]">
              <button
                onClick={() => setIsInventoryDrawerOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Incoming Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 5: BUDGET WBS BREAKDOWN */}
      {/* ================================================================= */}
      {isBudgetDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Wallet size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#32325D]">
                      Project Costing & WBS Scope
                    </h3>
                    <p className="text-xs text-[#8898AA]">
                      {currentProject.name} · WBS Level Financials
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBudgetDrawerOpen(false)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="my-4 space-y-4">
                {currentProject.budgetWBS.map((wbs) => (
                  <div
                    key={wbs.code}
                    className="border border-[#E9ECEF] rounded-xl p-4 bg-[#F8F9FE] space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#3B7CED]">{wbs.code}</span>
                        <span className="font-semibold text-[#32325D]">{wbs.name}</span>
                      </div>
                      <span className="font-bold text-[#32325D]">{wbs.utilization}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${wbs.utilization}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          wbs.utilization > 80 ? "bg-amber-500" : "bg-[#3B7CED]"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-[#8898AA] block">Allocated:</span>
                        <span className="font-bold text-[#32325D]">{wbs.allocated}</span>
                      </div>
                      <div>
                        <span className="text-[#8898AA] block">Spent:</span>
                        <span className="font-bold text-[#2BA24D]">{wbs.spent}</span>
                      </div>
                      <div>
                        <span className="text-[#8898AA] block">Committed:</span>
                        <span className="font-bold text-blue-600">{wbs.committed}</span>
                      </div>
                      <div>
                        <span className="text-[#8898AA] block">Available:</span>
                        <span className="font-bold text-[#32325D]">{wbs.available}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9ECEF]">
              <button
                onClick={() => setIsBudgetDrawerOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Project Costing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE NEW PROJECT */}
      {/* ================================================================= */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-[#E9ECEF] overflow-hidden animate-in zoom-in-95 duration-150 font-open-sans">
            <div className="flex items-center justify-between p-5 border-b border-[#E9ECEF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] text-[#3B7CED] flex items-center justify-center">
                  <Building2 size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#32325D]">
                    Create New Project
                  </h3>
                  <p className="text-xs text-[#8898AA]">
                    Add a new project to your Costing Dashboard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewProjectOpen(false)}
                className="p-1 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#32325D] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Commercial Towers Phase 2"
                  value={newProjectForm.name}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    placeholder="PRJ-2026-004"
                    value={newProjectForm.code}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, code: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Allocated Budget (₦) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="₦350,000,000"
                    value={newProjectForm.budget}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, budget: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Project Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Kolawole Davies"
                    value={newProjectForm.manager}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, manager: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Contract Type
                  </label>
                  <select
                    value={newProjectForm.type}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, type: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  >
                    <option value="Fixed Price">Fixed Price</option>
                    <option value="Time & Materials">Time & Materials</option>
                    <option value="Cost Plus">Cost Plus</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E9ECEF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3B7CED] hover:bg-[#3065c3] text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
