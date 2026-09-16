import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown } from "lucide-react";

export function WbsTable() {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow className="hover:bg-gray-50 border-0">
            <TableHead className="w-[80px] font-semibold text-gray-600 py-3 text-center pl-4">S/N</TableHead>
            <TableHead className="min-w-[320px] font-semibold text-gray-600 py-3">Activity</TableHead>
            <TableHead className="w-[120px] font-semibold text-gray-600 py-3">Quantity</TableHead>
            <TableHead className="w-[140px] font-semibold text-gray-600 py-3">Rate</TableHead>
            <TableHead className="w-[160px] font-semibold text-gray-600 py-3">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Phase 1 */}
          <TableRow className="bg-[#EEF2FB] hover:bg-[#EEF2FB] border-b border-white">
            <TableCell colSpan={4} className="py-3 px-4 bg-[#EEF2FB]">
              <div className="flex items-center gap-2">
                <span className="text-[#3B7CED] text-sm font-bold uppercase tracking-wide">Phase:</span>
                <span className="font-bold text-base text-gray-900">Phase 1</span>
              </div>
            </TableCell>
            <TableCell className="py-3 font-bold text-base bg-[#EEF2FB] text-gray-900">
              ₦2,000,000
            </TableCell>
          </TableRow>
          <TableRow className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <TableCell className="py-3 text-sm font-medium text-gray-500 text-center pl-4">1</TableCell>
            <TableCell className="py-3 text-sm font-medium text-gray-800">Activity 1</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">1</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">₦1,000,000</TableCell>
            <TableCell className="py-3 font-medium text-sm text-gray-800">₦1,000,000</TableCell>
          </TableRow>
          <TableRow className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <TableCell className="py-3 text-sm font-medium text-gray-500 text-center pl-4">2</TableCell>
            <TableCell className="py-3 text-sm font-medium text-gray-800">Activity 2</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">1</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">₦1,000,000</TableCell>
            <TableCell className="py-3 font-medium text-sm text-gray-800">₦1,000,000</TableCell>
          </TableRow>

          {/* Phase 2 */}
          <TableRow className="bg-[#EEF2FB] hover:bg-[#EEF2FB] border-b border-white">
            <TableCell colSpan={4} className="py-3 px-4 bg-[#EEF2FB]">
              <div className="flex items-center gap-2">
                <span className="text-[#3B7CED] text-sm font-bold uppercase tracking-wide">Phase:</span>
                <span className="font-bold text-base text-gray-900">Phase 2</span>
              </div>
            </TableCell>
            <TableCell className="py-3 font-bold text-base bg-[#EEF2FB] text-gray-900">
              ₦2,000,000
            </TableCell>
          </TableRow>
          <TableRow className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <TableCell className="py-3 text-sm font-medium text-gray-500 text-center pl-4">3</TableCell>
            <TableCell className="py-3 text-sm font-medium text-gray-800">Activity 3</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">1</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">₦1,000,000</TableCell>
            <TableCell className="py-3 font-medium text-sm text-gray-800">₦1,000,000</TableCell>
          </TableRow>
          <TableRow className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <TableCell className="py-3 text-sm font-medium text-gray-500 text-center pl-4">4</TableCell>
            <TableCell className="py-3 text-sm font-medium text-gray-800">Activity 4</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">1</TableCell>
            <TableCell className="py-3 text-sm text-gray-600">₦1,000,000</TableCell>
            <TableCell className="py-3 font-medium text-sm text-gray-800">₦1,000,000</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-white">
        <div className="text-gray-500 font-medium">
          Total Project Budget: <span className="text-xl font-bold text-gray-800 ml-2">₦4,000,000</span>
        </div>
      </div>
    </div>
  );
}
