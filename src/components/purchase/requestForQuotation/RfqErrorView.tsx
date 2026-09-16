"use client";

import React from "react";
import { FadeIn } from "@/components/shared/AnimatedWrapper";

export interface RfqErrorViewProps {
  error: unknown;
}

export function RfqErrorView({ error }: RfqErrorViewProps) {
  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "object" && err !== null && "data" in err) {
      const errorObj = err as { data?: { detail?: string; message?: string } };
      return (
        errorObj.data?.detail ||
        errorObj.data?.message ||
        "Unable to load RFQ details"
      );
    }
    return "Unable to load RFQ details";
  };

  const errorMessage = getErrorMessage(error);

  return (
    <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <div className="h-full mx-auto px-6 py-8 bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-lg font-semibold mb-2">
              Error Loading RFQ
            </div>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
