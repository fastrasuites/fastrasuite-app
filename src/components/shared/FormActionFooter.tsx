"use client";

import React from "react";
import { useSidebarContext } from "@/app/AppWrapper";

export interface FormActionFooterProps {
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  containerClassName?: string;
  zIndex?: string;
}

/**
 * Responsive floating action footer that dynamically adjusts its left offset
 * and horizontal alignment to match the sidebar's expanded / collapsed state
 * with smooth transitions.
 */
export function FormActionFooter({
  children,
  maxWidth = "max-w-2xl",
  className = "",
  containerClassName = "",
  zIndex = "z-20",
}: FormActionFooterProps) {
  const { isExpanded } = useSidebarContext();

  return (
    <div
      className={`fixed bottom-0 right-0 bg-white border-t border-gray-100 p-4 transition-all duration-300 ${
        isExpanded ? "md:left-64" : "md:left-16"
      } left-0 ${zIndex} ${className}`}
    >
      <div className={`w-full ${maxWidth} mx-auto ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default FormActionFooter;
