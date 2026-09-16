"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageGuard } from "@/components/auth/PageGuard";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/components/shared/types";
import { ToastNotification } from "@/components/shared/ToastNotification";

type BackorderLine = {
  id: string;
  product_description: string;
  unit_of_measure: string;
  expected_quantity: number;
  received_quantity: number;
};

const INITIAL_LINES: BackorderLine[] = [
  {
    id: "line-1",
    product_description: "Dangote Cement (50kg Bag)",
    unit_of_measure: "Bags",
    expected_quantity: 50,
    received_quantity: 0,
  }
];

export default function BackorderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [items, setItems] = useState<BackorderLine[]>(INITIAL_LINES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" as const });

  const breadcrumbsItem: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Operation", href: "/inventory/operation" },
    { label: "Backorders", href: "/inventory/operation/backorder" },
    { label: id, href: "#", current: true },
  ];

  const updateItemQty = (id: string, val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, received_quantity: Number(val) } : it))
    );
  };

  const handleValidate = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setNotification({ show: true, message: "Backorder quantities received and stock updated.", type: "success" });
      setTimeout(() => router.push("/inventory/operation/backorder"), 1500);
    }, 1000);
  };

  return (
    <PageGuard application="inventory" module="backorder">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Breadcrumbs items={breadcrumbsItem} />
            <div className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#E8F0FE] text-[#1A73E8]">
              Pending
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-[#3B7CED] text-xl mb-6 font-medium">Backorder Context</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Backorder ID</label>
                  <div className="text-sm font-semibold text-gray-800">{id}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Source Receipt</label>
                  <div className="text-sm font-semibold text-[#3B7CED]">WH-IN-0017</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Vendor</label>
                  <div className="text-sm font-semibold text-gray-800">Lafarge Africa Plc</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium text-sm">Destination</label>
                  <div className="text-sm text-gray-800">Main Warehouse - Site A</div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-[#3B7CED] text-xl font-medium">Pending Product Lines</h2>
              </div>
              
              <div className="overflow-x-auto">
                <Table className="min-w-[1100px] table-fixed">
                  <TableHeader className="bg-[#F6F7F8]">
                    <TableRow>
                      <TableHead className="w-80 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                        Product Description
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Unit
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Pending Qty
                      </TableHead>
                      <TableHead className="w-32 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                        Received Qty
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {items.map((it) => (
                      <TableRow key={it.id} className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150">
                        <TableCell className="border border-gray-200 px-4 align-middle">
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {it.product_description}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 px-4 align-middle text-center">
                          <div className="text-sm text-gray-700">
                            {it.unit_of_measure}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center">
                          <div className="text-sm font-semibold text-gray-700">
                            {it.expected_quantity}
                          </div>
                        </TableCell>
                        <TableCell className="border border-gray-200 align-middle text-center p-0">
                          <Input
                            type="number"
                            min={0}
                            value={it.received_quantity || ""}
                            onChange={(e) => updateItemQty(it.id, e.target.value)}
                            className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0 bg-blue-50/30 text-[#3B7CED] font-medium"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shadow-lg z-30">
          <Button variant="outline" type="button" onClick={() => router.back()} className="border-blue-400 text-blue-500 hover:bg-blue-50">
            Cancel
          </Button>
          <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleValidate}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white"
          >
              {isSubmitting ? "Validating..." : "Validate Receipt"}
          </Button>
        </div>

        <ToastNotification message={notification.message} type={notification.type as any} show={notification.show} onClose={() => setNotification(p => ({...p, show: false}))} />
      </div>
    </PageGuard>
  );
}
