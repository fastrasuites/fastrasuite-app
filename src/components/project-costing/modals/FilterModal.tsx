import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterModal({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-900">Filter</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 flex flex-col gap-6">
          {/* Select Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-900">Select Date</label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Input placeholder="From" className="pr-10" />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="relative flex-1">
                <Input placeholder="To" className="pr-10" />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-900">Category</label>
            <Select>
              <SelectTrigger className="w-full text-gray-500">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="sub-contractor">Sub contractor</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-900">Cost Category</label>
            <Select>
              <SelectTrigger className="w-full text-gray-500">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lab-001">LAB-001</SelectItem>
                <SelectItem value="sub-001">SUB-001</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-900">Status</label>
            <Select>
              <SelectTrigger className="w-full text-gray-500">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6 pt-4">
          <Button onClick={onClose} className="w-full bg-[#3B7CED] hover:bg-[#3065c3] text-white">
            Apply filter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
