"use client";

import React from "react";
import {
  AlertCircle,
  FileQuestion,
  Info,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type CustomMessageType =
  | "error"
  | "empty"
  | "info"
  | "success"
  | "warning";

export interface CustomMessageProps {
  variant?: CustomMessageType;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  retryText?: string;
  actionButton?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<
  CustomMessageType,
  {
    container: string;
    iconColor: string;
    iconBg: string;
    defaultTitle: string;
    defaultIcon: React.ReactNode;
  }
> = {
  error: {
    container: "border-red-100 bg-red-50/30 text-red-900",
    iconColor: "text-red-500",
    iconBg: "bg-red-100/80",
    defaultTitle: "We encountered an issue loading this data",
    defaultIcon: <AlertCircle className="w-6 h-6 text-red-500" />,
  },
  empty: {
    container: "border-gray-200/80 bg-gray-50/50 text-gray-800",
    iconColor: "text-gray-400",
    iconBg: "bg-gray-100",
    defaultTitle: "No data available yet",
    defaultIcon: <FileQuestion className="w-6 h-6 text-gray-400" />,
  },
  info: {
    container: "border-blue-100 bg-blue-50/50 text-blue-900",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100/80",
    defaultTitle: "Information",
    defaultIcon: <Info className="w-6 h-6 text-blue-500" />,
  },
  warning: {
    container: "border-amber-100 bg-amber-50/50 text-amber-900",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100/80",
    defaultTitle: "Attention Required",
    defaultIcon: <AlertCircle className="w-6 h-6 text-amber-500" />,
  },
  success: {
    container: "border-green-100 bg-green-50/50 text-green-900",
    iconColor: "text-green-500",
    iconBg: "bg-green-100/80",
    defaultTitle: "Operation Successful",
    defaultIcon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  },
};

export function CustomMessage({
  variant = "info",
  title,
  message,
  icon,
  onRetry,
  retryText = "Try Again",
  actionButton,
  className = "",
}: CustomMessageProps) {
  const styles = variantStyles[variant] || variantStyles.info;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-xl border transition-all ${styles.container} ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3.5 shadow-2xs ${styles.iconBg}`}
      >
        {icon || styles.defaultIcon}
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {title || styles.defaultTitle}
      </h3>

      {message && (
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed mb-4 text-center">
          {message}
        </p>
      )}

      {(onRetry || actionButton) && (
        <div className="flex items-center justify-center gap-3 mt-1">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-1.5 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {retryText}
            </Button>
          )}
          {actionButton}
        </div>
      )}
    </div>
  );
}
