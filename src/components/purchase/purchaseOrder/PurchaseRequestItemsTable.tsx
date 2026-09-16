"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash } from "lucide-react";
import { LineItem } from "@/schemas/purchaseRequestSchema";

type Option = { value: string; label: string };

interface PurchaseRequestItemsTableProps {
  items: LineItem[];
  productOptions: Option[];
  isLoadingProducts: boolean;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<LineItem>) => void;
  onUpdateItemWithDetails: (id: string, patch: Partial<LineItem>) => void;
  getProductDisplayText: (item: LineItem) => string;
  formatCurrency: (amount: number) => string;
}

export function PurchaseRequestItemsTable({
  items,
  productOptions,
  isLoadingProducts,
  onAddRow,
  onRemoveRow,
  onUpdateItem,
  onUpdateItemWithDetails,
  getProductDisplayText,
  formatCurrency,
}: PurchaseRequestItemsTableProps) {
  const total = useMemo(() => {
    return items.reduce((acc, i) => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.estimated_unit_price) || 0;
      return acc + qty * price;
    }, 0);
  }, [items]);

  return (
    <section className="bg-white mt-8 border-none">
      <div className="mx-auto">
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px] table-fixed">
            <TableHeader className="bg-[#F6F7F8]">
              <TableRow>
                <TableHead className="w-30 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                  Product
                </TableHead>
                <TableHead className="w-80 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                  Description
                </TableHead>
                <TableHead className="w-20 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                  QTY
                </TableHead>
                <TableHead className="w-24 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                  Unit of Measure
                </TableHead>
                <TableHead className="w-32 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                  Estimated Unit Price
                </TableHead>
                <TableHead className="w-28 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                  Total Price
                </TableHead>
                <TableHead className="w-16 border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 font-medium">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="bg-white">
              {items.map((it) => {
                const rowTotal = it.qty * Number(it.estimated_unit_price || 0);
                return (
                  <TableRow
                    key={it.id}
                    className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150"
                  >
                    <TableCell className="border border-gray-200 align-middle">
                      <Select
                        value={it.product}
                        onValueChange={(value) =>
                          onUpdateItemWithDetails(it.id, {
                            product: value,
                          })
                        }
                        disabled={isLoadingProducts}
                      >
                        <SelectTrigger className="h-11 w-full rounded-none border-0 focus:ring-0 focus:ring-offset-0">
                          <SelectValue
                            placeholder={
                              isLoadingProducts
                                ? "Loading products..."
                                : "Select product"
                            }
                          >
                            {it.product ? getProductDisplayText(it) : ""}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingProducts ? (
                            <SelectItem value="__loading__" disabled>
                              Loading products...
                            </SelectItem>
                          ) : productOptions.length === 0 ? (
                            <SelectItem value="__no_products__" disabled>
                              No products available
                            </SelectItem>
                          ) : (
                            productOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="border border-gray-200 px-4 align-middle">
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {it.product_description || "Select a product"}
                      </div>
                    </TableCell>

                    <TableCell className="border border-gray-200 align-middle text-center">
                      <Input
                        type="number"
                        min={1}
                        aria-label="Quantity"
                        value={String(it.qty)}
                        onChange={(e) =>
                          onUpdateItemWithDetails(it.id, {
                            qty: Math.max(1, Number(e.target.value || 0)),
                          })
                        }
                        className="h-11 w-full text-center rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                      />
                    </TableCell>

                    <TableCell className="border border-gray-200 px-4 align-middle text-center">
                      <div className="text-sm text-gray-700">
                        {it.unit_of_measure || "N/A"}
                      </div>
                    </TableCell>

                    <TableCell className="border border-gray-200 px-4 align-middle text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        aria-label="Estimated unit price"
                        value={String(it.estimated_unit_price)}
                        onChange={(e) =>
                          onUpdateItemWithDetails(it.id, {
                            estimated_unit_price: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        className="h-11 w-28 text-right rounded-none border-0 focus:ring-0 focus:ring-offset-0"
                      />
                    </TableCell>

                    <TableCell className="border border-gray-200 px-4 align-middle text-right">
                      <div className="text-sm font-medium text-gray-800 tabular-nums">
                        {formatCurrency(rowTotal)}
                      </div>
                    </TableCell>

                    <TableCell className="border border-gray-200 px-4 align-middle text-center">
                      <button
                        onClick={() => onRemoveRow(it.id)}
                        aria-label="Remove row"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-2 rounded-md hover:bg-red-50"
                        disabled={items.length === 1}
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

            <TableFooter className="bg-[#FBFCFD] border border-gray-200">
              <TableRow className="">
                {/* Empty cells for alignment */}
                <TableCell className="bg-white">
                  <Button
                    variant="ghost"
                    onClick={onAddRow}
                    className="flex items-center gap-2 px-3 py-0 text-sm m-auto rounded-md hover:bg-gray-50"
                    aria-label="Add row"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TableCell>
                <TableCell className="bg-white" />
                <TableCell className="bg-white" />
                <TableCell className="bg-white" />
                <TableCell className="bg-white" />
                <TableCell className="bg-white" />
                <TableCell className="bg-white" />

                {/* <TableCell className="w-28 border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Total
                </TableCell>
                <TableCell className="w-16 border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-800 tabular-nums">
                  {formatCurrency(total)}
                </TableCell> */}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="ml-auto flex items-center gap-4 border-x border-b">
          <div className="hidden sm:block text-sm text-slate-700 px-4 py-2 bg-white rounded-md">
            <div className="flex items-center justify-between gap-6 min-w-[220px] ">
              <span className="text-sm text-slate-600">Total</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
