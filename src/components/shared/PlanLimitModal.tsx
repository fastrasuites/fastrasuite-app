"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, Users, Warehouse, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LimitType = "projects" | "users" | "warehouses" | "feature";

export interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: LimitType;
  currentCount?: number;
  maxCount?: number;
  currentTier?: string;
  requiredTier?: "professional" | "enterprise";
  featureName?: string;
  customTitle?: string;
  customDescription?: string;
}

export function PlanLimitModal({
  isOpen,
  onClose,
  limitType,
  currentCount,
  maxCount,
  currentTier = "Starter",
  requiredTier = "professional",
  featureName,
  customTitle,
  customDescription,
}: PlanLimitModalProps) {
  const router = useRouter();

  const handleUpgradeClick = () => {
    onClose();
    router.push("/settings/billing");
  };

  const getContent = () => {
    switch (limitType) {
      case "projects":
        return {
          icon: Layers,
          heading: "Active Projects Limit",
          subtitle: `You've used all ${maxCount ?? 3} projects on the ${currentTier} plan`,
          description:
            customDescription ||
            `To start this new project, you can upgrade your subscription to the Professional plan, or archive an inactive project from your project list.`,
          resourceName: "Active Projects",
          current: currentCount ?? 3,
          max: maxCount ?? 3,
          nextTierInfo: "Professional plan includes up to 15 active projects",
          accentColor: "amber",
        };

      case "users":
        return {
          icon: Users,
          heading: "Team Member Limit",
          subtitle: `You've reached ${maxCount ?? 5} team members on your plan`,
          description:
            customDescription ||
            `To invite additional collaborators and assign custom permission roles, upgrade your organization to the Professional plan.`,
          resourceName: "Team Members",
          current: currentCount ?? 5,
          max: maxCount ?? 5,
          nextTierInfo: "Professional plan includes up to 25 team members",
          accentColor: "amber",
        };

      case "warehouses":
        return {
          icon: Warehouse,
          heading: "Warehouse Limit",
          subtitle: "Single-location inventory limit reached",
          description:
            customDescription ||
            `Your current plan is restricted to 1 warehouse location. Upgrade to Professional to unlock multi-location inventory and manage up to 3 warehouses.`,
          resourceName: "Warehouses",
          current: currentCount ?? 1,
          max: maxCount ?? 1,
          nextTierInfo: "Professional plan includes up to 3 warehouses",
          accentColor: "amber",
        };

      case "feature":
      default:
        const isEnt = requiredTier === "enterprise";
        return {
          icon: Building2,
          heading: "Feature Access",
          subtitle: `${featureName || "This capability"} requires an upgrade`,
          description:
            customDescription ||
            `This module is exclusively available on the ${
              isEnt ? "Enterprise" : "Professional"
            } tier. Upgrade your subscription to gain immediate access.`,
          resourceName: featureName || "Feature Access",
          current: undefined,
          max: undefined,
          nextTierInfo: `Available on the ${
            isEnt ? "Enterprise" : "Professional"
          } tier`,
          accentColor: "blue",
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;
  const isAmber = content.accentColor === "amber";
  const isQuota = content.current !== undefined && content.max !== undefined;
  const percentUsed = isQuota
    ? Math.min(100, Math.round(((content.current ?? 0) / (content.max ?? 1)) * 100))
    : 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[420px] border-none p-0 overflow-hidden rounded-2xl bg-white shadow-2xl font-['Open_Sans',sans-serif]"
        showCloseButton={false}
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col w-full font-['Open_Sans',sans-serif]"
        >
          {/* Top Bar: Official FastraSuite Logo & Close Button */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2 w-full border-b border-gray-100/60">
            <img
              src="/fastraLogo.png"
              alt="FastraSuite Logo"
              className="h-7 w-auto object-contain"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Center Icon, Title & Decorative Accent */}
          <div className="flex flex-col items-center justify-center pt-5 pb-2 px-6">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center mb-3 border shadow-xs",
                isAmber
                  ? "bg-amber-50 text-amber-600 border-amber-200/70"
                  : "bg-blue-50 text-[#3B7CED] border-blue-200/70"
              )}
            >
              <Icon className="w-7 h-7" />
            </motion.div>

            <DialogTitle className="text-lg font-bold text-gray-900 tracking-tight text-center font-['Open_Sans',sans-serif]">
              {content.heading}
            </DialogTitle>

            {/* FastraSuite double accent line animation */}
            <div className="flex items-center gap-1.5 mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 44 }}
                transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
                className={cn(
                  "h-1 rounded-full",
                  isAmber ? "bg-amber-400" : "bg-[#3B7CED]"
                )}
              />
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 14, opacity: 0.55 }}
                transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
                className={cn(
                  "h-1 rounded-full",
                  isAmber ? "bg-amber-400" : "bg-[#3B7CED]"
                )}
              />
            </div>
          </div>

          {/* Clean Message Body */}
          <div className="px-7 py-3 text-center">
            <p className="text-gray-900 text-sm font-semibold leading-snug mb-1.5">
              {content.subtitle}
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* Minimalist Capacity Progress Meter */}
          {isQuota && (
            <div className="mx-6 my-2 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                <span>{content.resourceName}</span>
                <span className="font-semibold text-gray-800">
                  {content.current} of {content.max} used ({percentUsed}%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200/80 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentUsed}%` }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    isAmber ? "bg-amber-500" : "bg-[#3B7CED]"
                  )}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-200/60 text-gray-500">
                <span>Next tier</span>
                <span className="font-semibold text-[#3B7CED]">
                  {content.nextTierInfo}
                </span>
              </div>
            </div>
          )}

          <DialogDescription className="sr-only">
            {content.description}
          </DialogDescription>

          {/* Clean Action Buttons */}
          <div className="px-6 pb-6 pt-3 flex flex-col sm:flex-row gap-2.5">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full sm:flex-1"
            >
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full h-10 text-gray-700 border border-gray-200 hover:bg-gray-50 font-semibold text-xs transition-all shadow-none rounded-lg font-['Open_Sans',sans-serif]"
              >
                Cancel
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full sm:flex-1"
            >
              <Button
                type="button"
                onClick={handleUpgradeClick}
                className="w-full h-10 font-semibold text-xs text-white shadow-xs transition-all border-none rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#3B7CED] hover:bg-[#2d63c7] active:bg-[#2563EB] font-['Open_Sans',sans-serif]"
              >
                Upgrade Plan
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default PlanLimitModal;
