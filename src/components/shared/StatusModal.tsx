"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, Info } from "lucide-react";
import { cn, extractErrorMessage as baseExtractErrorMessage } from "@/lib/utils";

export type StatusType = "success" | "error" | "warning" | "info";

export interface StatusModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** The type of status to display */
  type: StatusType;
  /** The title of the modal */
  title: string;
  /** The message to display */
  message: string;
  /** Optional action button text (defaults based on type) */
  actionText?: string;
  /** Optional callback for the action button */
  onAction?: () => void;
  /** Optional secondary button text */
  secondaryText?: string;
  /** Optional callback for the secondary button */
  onSecondary?: () => void;
  /** Whether to show the close button in the header */
  showCloseButton?: boolean;
  /** Optional visual style variant for the primary action button */
  actionVariant?: "primary" | "destructive";
}

const statusConfig: Record<
  StatusType,
  {
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    defaultActionText: string;
  }
> = {
  success: {
    icon: Check,
    iconColor: "text-[#3B7CED]",
    bgColor: "bg-[#EEF4FF]",
    borderColor: "border-[#D0E1FD]",
    defaultActionText: "Done",
  },
  error: {
    icon: AlertTriangle,
    iconColor: "text-[#E43D2B]",
    bgColor: "bg-[#FFF2F0]",
    borderColor: "border-[#FFE0DB]",
    defaultActionText: "Try again",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-[#3B7CED]",
    bgColor: "bg-[#EEF4FF]",
    borderColor: "border-[#D0E1FD]",
    defaultActionText: "Understood",
  },
  info: {
    icon: Info,
    iconColor: "text-[#3B7CED]",
    bgColor: "bg-[#EEF4FF]",
    borderColor: "border-[#D0E1FD]",
    defaultActionText: "OK",
  },
};

export function StatusModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  actionText,
  onAction,
  secondaryText,
  onSecondary,
  showCloseButton = true,
  actionVariant,
}: StatusModalProps) {
  const config = statusConfig[type];
  const Icon = config.icon;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  const isDestructive =
    actionVariant === "destructive" ||
    actionText === "Delete" ||
    actionText?.toLowerCase().includes("delete");

  const iconBgClass = isDestructive ? "bg-[#FFF2F0]" : config.bgColor;
  const iconBorderClass = isDestructive ? "border-[#FFE0DB]" : config.borderColor;
  const iconColorClass = isDestructive ? "text-[#E43D2B]" : config.iconColor;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[400px] w-[calc(100%-2rem)] p-6 rounded-2xl bg-white gap-0 border-none shadow-xl"
        showCloseButton={showCloseButton}
      >
        <div className="flex flex-col items-start w-full text-left">
          {/* Header section with Icon, Title and Message (Left-aligned) */}
          <div className="flex flex-col items-start text-left gap-0 p-0 w-full">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border",
                iconBgClass,
                iconBorderClass
              )}
            >
              <Icon className={cn("w-6 h-6", iconColorClass)} />
            </div>

            <DialogTitle className="text-lg font-bold text-gray-900 mt-5 leading-snug">
              {title}
            </DialogTitle>

            <DialogDescription className="text-sm font-medium text-gray-500 mt-2 leading-relaxed whitespace-pre-line">
              {message}
            </DialogDescription>
          </div>

          {/* Action buttons list */}
          <div className="w-full mt-6">
            {secondaryText && onSecondary ? (
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={onSecondary}
                  className={cn(
                    "w-full h-12 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center shadow-none bg-white",
                    isDestructive
                      ? "border border-gray-300 hover:bg-gray-50 text-gray-700"
                      : "border border-[#3B7CED] hover:bg-[#EEF4FF]/50 text-[#3B7CED]"
                  )}
                >
                  {secondaryText}
                </Button>
                <Button
                  onClick={handleAction}
                  className={cn(
                    "w-full h-12 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center border-none shadow-none text-white",
                    isDestructive
                      ? "bg-[#E43D2B] hover:bg-[#c93322]"
                      : "bg-[#3B7CED] hover:bg-[#2d63c7]"
                  )}
                >
                  {actionText || config.defaultActionText}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAction}
                className={cn(
                  "w-full h-12 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center border-none shadow-none text-white",
                  isDestructive || type === "error"
                    ? "bg-[#E43D2B] hover:bg-[#c93322]"
                    : "bg-[#3B7CED] hover:bg-[#2d63c7]"
                )}
              >
                {actionText || config.defaultActionText}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier status modal management
export interface UseStatusModalReturn {
  isOpen: boolean;
  type: StatusType;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  secondaryText?: string;
  onSecondary?: () => void;
  actionVariant?: "primary" | "destructive";
  showSuccess: (title: string, message: string, actionText?: string, onAction?: () => void) => void;
  showError: (title: string, message: string, actionText?: string, onAction?: () => void) => void;
  showWarning: (
    title: string,
    message: string,
    actionText?: string,
    onAction?: () => void,
    secondaryText?: string,
    onSecondary?: () => void,
    actionVariant?: "primary" | "destructive"
  ) => void;
  showInfo: (title: string, message: string, actionText?: string, onAction?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
    actionVariant?: "primary" | "destructive"
  ) => void;
  close: () => void;
}

export function useStatusModal(): UseStatusModalReturn {
  const [isOpen, setIsOpen] = React.useState(false);
  const [type, setType] = React.useState<StatusType>("info");
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [actionText, setActionText] = React.useState<string | undefined>();
  const [onAction, setOnAction] = React.useState<(() => void) | undefined>();
  const [secondaryText, setSecondaryText] = React.useState<string | undefined>();
  const [onSecondary, setOnSecondary] = React.useState<(() => void) | undefined>();
  const [actionVariant, setActionVariant] = React.useState<"primary" | "destructive" | undefined>();

  const show = (
    statusType: StatusType,
    statusTitle: string,
    statusMessage: string,
    customActionText?: string,
    customOnAction?: () => void,
    customSecondaryText?: string,
    customOnSecondary?: () => void,
    customActionVariant?: "primary" | "destructive"
  ) => {
    setType(statusType);
    setTitle(statusTitle);
    setMessage(statusMessage);
    setActionText(customActionText);
    setOnAction(() => customOnAction);
    setSecondaryText(customSecondaryText);
    setOnSecondary(() => customOnSecondary);
    setActionVariant(customActionVariant);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setActionText(undefined);
    setOnAction(undefined);
    setSecondaryText(undefined);
    setOnSecondary(undefined);
    setActionVariant(undefined);
  };

  return {
    isOpen,
    type,
    title,
    message,
    actionText,
    onAction,
    secondaryText,
    onSecondary,
    actionVariant,
    showSuccess: (t, m, actText, actCb) => show("success", t, m, actText, actCb, undefined, undefined, "primary"),
    showError: (t, m, actText, actCb) => show("error", t, m, actText, actCb, undefined, undefined, "destructive"),
    showWarning: (t, m, actText, actCb, secText, secCb, actVar) =>
      show("warning", t, m, actText, actCb, secText, secCb, actVar),
    showInfo: (t, m, actText, actCb) => show("info", t, m, actText, actCb, undefined, undefined, "primary"),
    showConfirm: (
      confirmTitle,
      confirmMessage,
      onConfirm,
      confirmText = "Delete",
      cancelText = "Cancel",
      actVar = "destructive"
    ) => {
      show(
        "warning",
        confirmTitle,
        confirmMessage,
        confirmText,
        () => {
          onConfirm();
        },
        cancelText,
        () => {
          close();
        },
        actVar
      );
    },
    close,
  };
}

export function extractErrorMessage(
  err: any,
  fallback = "An unexpected error occurred. Please try again."
): string {
  return baseExtractErrorMessage(err, fallback);
}

export default StatusModal;
