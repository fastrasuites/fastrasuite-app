"use client";

import React from "react";
import { FadeIn } from "@/components/shared/AnimatedWrapper";
import { LoadingDots } from "@/components/shared/LoadingComponents";

export function RfqLoadingView() {
  return (
    <FadeIn className="h-full text-gray-900 font-sans antialiased pr-4">
      <div className="h-full mx-auto px-6 py-8 bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600">Loading RFQ details...</p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
