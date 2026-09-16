"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Check, X, ChevronDown, ChevronUp, ArrowRight, Sparkles, GripHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminOnboarding } from "@/hooks/useAdminOnboarding";

export function AdminOnboardingChecklist() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardDragControls = useDragControls();

  const {
    hasMounted,
    isAdmin,
    isDismissed,
    isMinimized,
    companyName,
    steps,
    completedCount,
    totalCount,
    progressPercent,
    isAllCompleted,
    dismiss,
    toggleMinimize,
  } = useAdminOnboarding();

  const handleStartTour = (moduleId: string = "project-costing") => {
    try {
      localStorage.setItem(`fastra_wizard_${moduleId}_seen`, "active");
      localStorage.setItem(`fastra_wizard_${moduleId}_step`, "0");
      localStorage.removeItem(`fastra_wizard_${moduleId}_root_seen`);
      localStorage.removeItem(`fastra_wizard_${moduleId}_detail_seen`);
    } catch {}

    window.dispatchEvent(
      new CustomEvent("wizard:start", { detail: { moduleId } })
    );

    toggleMinimize();
    router.push("/project-costing");
  };

  // Guard: Only render for mounted admin sessions when not permanently dismissed
  if (!hasMounted || !isAdmin || isDismissed) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-4 pointer-events-none z-40 font-sans"
    >
      <AnimatePresence mode="wait">
        {/* State 1: Minimized Floating Pill Badge (Draggable) */}
        {isMinimized ? (
          <motion.div
            key="minimized-pill"
            drag
            dragConstraints={containerRef}
            dragElastic={0.08}
            dragMomentum={false}
            initial={{ opacity: 0, y: 15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            onClick={toggleMinimize}
            className="pointer-events-auto absolute bottom-2 left-2 flex items-center gap-2.5 bg-white border border-gray-200 shadow-lg hover:shadow-xl px-3.5 py-2 rounded-full text-xs font-medium text-[#32325D] hover:text-[#3B7CED] transition-all cursor-grab active:cursor-grabbing group touch-none select-none"
            title="Click to expand or drag to reposition"
          >
            <GripHorizontal className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 shrink-0" />
            <div className="w-5 h-5 rounded-full bg-[#EEF4FF] text-[#3B7CED] flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Getting Started</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#3B7CED] font-semibold text-[11px]">
                {completedCount}/{totalCount}
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden ml-0.5">
              <div
                className="h-full bg-[#3B7CED] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#3B7CED] transition-transform ml-0.5" />
          </motion.div>
        ) : (
          /* State 2: Expanded Checklist Card (Draggable by Header) */
          <motion.div
            key="expanded-card"
            drag
            dragListener={false}
            dragControls={cardDragControls}
            dragConstraints={containerRef}
            dragElastic={0.08}
            dragMomentum={false}
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto absolute bottom-2 left-2 w-[360px] max-w-[calc(100vw-2.5rem)] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden flex flex-col touch-none"
          >
            {/* Top Bar Header with Drag Handle */}
            <div
              onPointerDown={(e) => cardDragControls.start(e)}
              className="px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing select-none bg-[#F8FAFC] border-b border-gray-100 transition-colors"
              title="Hold and drag to reposition"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-gray-400 hover:text-gray-600 shrink-0" />
                <div className="w-6 h-6 rounded-md bg-[#EEF4FF] text-[#3B7CED] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-[#32325D]">
                  Getting Started
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#3B7CED] font-medium text-[11px]">
                  {completedCount}/{totalCount}
                </span>
              </div>

              <div
                className="flex items-center gap-1 text-gray-400"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={toggleMinimize}
                  className="p-1 rounded hover:bg-gray-200/60 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Minimize"
                  aria-label="Minimize checklist"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="p-1 rounded hover:bg-gray-200/60 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Close checklist"
                  aria-label="Close checklist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full bg-gray-100 h-1 overflow-hidden">
              <motion.div
                className="h-full bg-[#3B7CED]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Greeting Subtext */}
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs text-[#525F7F] leading-relaxed">
                Welcome <span className="font-semibold text-[#32325D]">{companyName}</span>! Complete these initial steps to activate operational workflows across Fastra Suite:
              </p>
            </div>

            {/* Checklist Items */}
            <div className="px-4 py-2 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto">
              {steps.map((step) => {
                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                      step.isCompleted
                        ? "bg-[#F8FAFC]/80 border border-gray-100"
                        : "bg-white border border-gray-200/90 hover:border-blue-200 hover:bg-[#F8FAFC]/40"
                    }`}
                  >
                    {/* Checkbox Icon */}
                    <div className="shrink-0 pt-0.5">
                      {step.isCompleted ? (
                        <div className="w-4 h-4 rounded-[4px] bg-[#1E8E3E] text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-[4px] border-2 border-gray-300 bg-white" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`text-xs font-semibold leading-tight ${
                            step.isCompleted
                              ? "line-through text-[#8898AA] font-normal"
                              : "text-[#32325D]"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>

                      {!step.isCompleted && (
                        <>
                          <p className="text-[11px] text-[#525F7F] mt-1 leading-normal line-clamp-2">
                            {step.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Link
                              href={step.href}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-[#3B7CED] hover:bg-[#3065c3] rounded-md shadow-2xs transition-all cursor-pointer"
                            >
                              <span>{step.actionLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Celebration State when 4/4 Completed */}
            {isAllCompleted && (
              <div className="mx-4 my-2 p-3 bg-[#E2F2E9] border border-[#A8DAB5] rounded-lg flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1E8E3E] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1E8E3E]">Foundational Setup Ready!</p>
                  <p className="text-[11px] text-[#2D6A4F] leading-tight">
                    Your master records are set up. You can now launch guided feature tours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartTour("project-costing")}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1E8E3E] hover:bg-[#187532] text-white rounded-md transition-colors shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>Start Tour</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Footer: Dismiss permanently */}
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-center bg-[#F8FAFC]">
              <button
                type="button"
                onClick={dismiss}
                className="text-[11px] text-[#8898AA] hover:text-[#525F7F] transition-colors cursor-pointer font-normal"
              >
                Don&apos;t show this again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
