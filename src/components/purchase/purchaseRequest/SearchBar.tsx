"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function SearchBar({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative w-full md:w-[400px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
          aria-hidden
        />
        <Input
          aria-label="Search purchase requests"
          className="pl-10 h-10"
          placeholder="Search"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onQueryChange(e.target.value)
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Button className="h-10 bg-[#4169FF] hover:bg-[#3558E6] focus-visible:ring-2 focus-visible:ring-[#4169FF]">
          New Purchase Request
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-expanded={false}
              className="h-10 w-10 rounded-md border border-gray-200 flex items-center justify-center"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="#374151"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={8} align="end">
            <DropdownMenuItem>Grid</DropdownMenuItem>
            <DropdownMenuItem>List</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
