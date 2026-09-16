"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PurchaseRequestItem } from "@/api/purchase/purchaseRequestApi";

type ProductRow = {
  id: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  estimatedUnitPrice: number;
};

interface ProductItemsTableProps {
  items: PurchaseRequestItem[];
}

const formatCurrency = (value: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(parseFloat(value));

const computeRowTotal = (item: PurchaseRequestItem) =>
  item.qty * parseFloat(item.estimated_unit_price);

const ProductItemsTable: React.FC<ProductItemsTableProps> = ({
  items = [],
}) => {
  const grandTotal = items.reduce(
    (acc, item) => acc + computeRowTotal(item),
    0
  );

  if (!items.length) {
    return (
      <div className="mx-auto">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px] table-fixed border-collapse">
            <TableHeader className="bg-[#F6F7F8]">
              <TableRow>
                <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                  Product Name
                </TableHead>
                <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                  Description
                </TableHead>
                <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                  QTY
                </TableHead>
                <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                  Unit of Measure
                </TableHead>
                <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                  Estimated Unit Price
                </TableHead>
                <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                  Total Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No items found for this purchase request
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="overflow-x-auto">
        {/* table-fixed + explicit equal widths on cells -> evenly sized columns */}
        <Table className="min-w-[900px] table-fixed border-collapse">
          <TableHeader className="bg-[#F6F7F8]">
            <TableRow>
              <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                Product Name
              </TableHead>
              <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                Description
              </TableHead>
              <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                QTY
              </TableHead>
              <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 font-medium">
                Unit of Measure
              </TableHead>
              <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                Estimated Unit Price
              </TableHead>
              <TableHead className="w-1/6 border border-gray-200 px-4 py-3 text-right text-sm text-gray-600 font-medium">
                Total Price
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white">
            {items.map((item, idx) => (
              <TableRow
                key={item.id}
                tabIndex={0}
                className="group hover:bg-[#FBFBFB] focus-within:bg-[#FBFBFB] transition-colors duration-150"
                aria-rowindex={idx + 2}
              >
                <TableCell className="w-1/6 border border-gray-200 px-4 py-4 align-middle">
                  <div className="text-sm font-medium text-gray-800">
                    {item.product_details?.product_name ||
                      `Product ${item.product}`}
                  </div>
                </TableCell>

                <TableCell
                  className="w-1/6 border border-gray-200 px-4 py-4 align-middle"
                  style={{ maxWidth: 420 }}
                >
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {item.product_details?.product_description ||
                      "No description available"}
                  </div>
                </TableCell>

                <TableCell className="w-1/6 border border-gray-200 px-4 py-4 align-middle">
                  <div className="text-sm text-gray-700">{item.qty}</div>
                </TableCell>

                <TableCell className="w-1/6 border border-gray-200 px-4 py-4 align-middle">
                  <div className="text-sm text-gray-700">
                    {item.product_details?.unit_of_measure_details
                      ?.unit_symbol ||
                      item.product_details?.unit_of_measure_details
                        ?.unit_name ||
                      "N/A"}
                  </div>
                </TableCell>

                <TableCell className="w-1/6 border border-gray-200 px-4 py-4 align-middle text-right">
                  <div className="text-sm text-gray-700 tabular-nums">
                    {formatCurrency(item.estimated_unit_price)}
                  </div>
                </TableCell>

                <TableCell className="w-1/6 border border-gray-200 px-4 py-4 align-middle text-right">
                  <div className="text-sm font-medium text-gray-800 tabular-nums">
                    {formatCurrency(
                      (
                        item.qty * parseFloat(item.estimated_unit_price)
                      ).toString()
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter className="bg-[#FBFCFD]">
            <TableRow>
              {/* use empty cells to align footer under last two columns */}
              <TableCell className="bg-white" />
              <TableCell className="bg-white" />
              <TableCell className="bg-white" />
              <TableCell className="bg-white" />

              <TableCell className="w-1/6 border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Total
              </TableCell>
              <TableCell className="w-1/6 border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-800 tabular-nums">
                {formatCurrency(grandTotal.toString())}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <TableCaption className="mt-4 text-sm text-gray-400"> </TableCaption>
    </div>
  );
};

export default ProductItemsTable;
