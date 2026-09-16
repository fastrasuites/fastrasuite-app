"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils"; // utility to merge classes

type GrayButtonProps = {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ElementType; // <- allow passing any icon component
};

export const GrayButton = ({
  children,
  size = "md",
  loading = false,
  onClick,
  className,
  icon: Icon, // receive icon component as prop
}: GrayButtonProps) => {
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-6 text-base",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded text-[#7A8A98] bg-transparent hover:bg-gray-100 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        className
      )}
      disabled={loading}
    >
      {children}
      {Icon && <Icon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
    </button>
  );
};
