"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { HiMiniBell } from "react-icons/hi2";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Tooltip } from "../ui/tooltip";

export default function NotifySection() {
  return (
    <div className="flex items-center gap-3">
      <NotificationButton />
      <UserProfile />
    </div>
  );
}

function NotificationButton() {
  return (
    <Button
      aria-label="Open notifications"
      className="relative h-9 w-9 flex-shrink-0 rounded-full bg-white border border-transparent hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] transition-all duration-150 flex items-center justify-center"
    >
      {/* Bell icon (stroke) */}
      <HiMiniBell color={"black"} />

      {/* Notification red dot */}
    </Button>
  );
}

function UserProfile() {
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-haspopup="true"
            aria-label="Open account menu"
            className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] transition"
          >
            <div className="relative h-9 w-9 flex items-center justify-center rounded-full bg-pink-100 ring-0 overflow-hidden">
              {/* Inline SVG avatar to match the screenshot face */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden
              >
                <circle cx="18" cy="18" r="18" fill="#FEE2E2" />
                <g transform="translate(4,6)">
                  <circle cx="14" cy="8" r="6" fill="#FCA5A5" />
                  <path
                    d="M6 20c2-3 8-3 12 0"
                    stroke="#7C3AED"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="10" cy="7" r="1" fill="#111827" />
                  <circle cx="18" cy="7" r="1" fill="#111827" />
                </g>
              </svg>
            </div>
            <span className="hidden sm:inline-block text-sm font-medium text-[#111827]">
              Administrator
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent sideOffset={8} align="end" className="w-48">
          <DropdownMenuItem>Company Profile</DropdownMenuItem>
          <DropdownMenuItem>Change Password</DropdownMenuItem>
          <DropdownMenuItem>User</DropdownMenuItem>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
