"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, CheckCircle2, HelpCircle, Check } from "lucide-react";
import Link from "next/link";
import { useModuleWizard } from "@/hooks/useModuleWizard";

interface ModuleWizardProps {
  moduleId: string;
}

export function ModuleWizard({ moduleId }: ModuleWizardProps) {
  const {
    hasMounted,
    config,
    showInvitation,
    currentInvitation,
    isTourActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    targetRect,
    isComplete,
    feedbackToast,
    startTour,
    dismissInvitation,
    nextStep,
    prevStep,
    skipTour,
    closeCompletion,
  } = useModuleWizard(moduleId);

  // Compute card popover position relative to targetRect
  const cardStyle = useMemo(() => {
    if (!targetRect) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      };
    }

    const padding = 12;
    const cardWidth = 330;
    const cardHeight = 165;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    let top = targetRect.bottom + padding;
    let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;

    // Flip to top if bottom runs out of screen
    if (top + cardHeight > viewportHeight - 20) {
      top = Math.max(20, targetRect.top - cardHeight - padding);
    }

    // Keep horizontally within screen bounds
    if (left < 16) {
      left = 16;
    } else if (left + cardWidth > viewportWidth - 16) {
      left = viewportWidth - cardWidth - 16;
    }

    return {
      position: "fixed" as const,
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
      width: `${cardWidth}px`,
    };
  }, [targetRect]);

  if (!hasMounted || !config) return null;

  return (
    <>
      {/* 1. Action Success Feedback Banner */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1E8E3E] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium"
          >
            <Check className="w-4 h-4 text-white" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. First-Time Subtle Invitation Banner */}
      <AnimatePresence>
        {showInvitation && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-gray-200 shadow-xl rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#32325D] font-semibold text-sm">
                <span className="w-2 h-2 rounded-full bg-[#3B7CED]"></span>
                <span>{currentInvitation.title}</span>
              </div>
              <button
                onClick={dismissInvitation}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#525F7F] leading-relaxed">
              {currentInvitation.text}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={dismissInvitation}
                className="px-3 py-1.5 text-xs text-[#8898AA] hover:text-[#525F7F] font-medium transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={startTour}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#3B7CED] hover:bg-[#3065c3] rounded-md shadow-2xs transition-all flex items-center gap-1.5"
              >
                <span>Take a quick tour</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Active Tour Spotlight & Floating Card */}
      <AnimatePresence>
        {isTourActive && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {/* SVG Mask Backdrop */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ width: "100vw", height: "100vh" }}
            >
              <defs>
                <mask id={`wizard-mask-${moduleId}`}>
                  {/* White background covers everything */}
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {/* Black cutout over target element */}
                  {targetRect && (
                    <rect
                      x={targetRect.left - 4}
                      y={targetRect.top - 4}
                      width={targetRect.width + 8}
                      height={targetRect.height + 8}
                      rx="6"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              {/* Dimmed Overlay */}
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(15, 23, 42, 0.40)"
                mask={`url(#wizard-mask-${moduleId})`}
              />
            </svg>

            {/* Glowing Spotlight Target Outline */}
            {targetRect && (
              <motion.div
                initial={false}
                animate={{
                  top: targetRect.top - 4,
                  left: targetRect.left - 4,
                  width: targetRect.width + 8,
                  height: targetRect.height + 8,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute rounded-md border-2 border-[#3B7CED] shadow-[0_0_12px_rgba(59,124,237,0.35)] pointer-events-none"
              />
            )}

            {/* Floating Wizard Card */}
            <motion.div
              style={cardStyle}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 flex flex-col gap-2.5 pointer-events-auto"
            >
              {/* Header: Step counter & Skip */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                  {currentStepIndex + 1} / {totalSteps}
                </span>
                <button
                  onClick={skipTour}
                  className="text-xs text-[#8898AA] hover:text-[#525F7F] transition-colors font-normal"
                >
                  Skip tour
                </button>
              </div>

              {/* Title & One-sentence copy */}
              <div>
                <h4 className="text-sm font-semibold text-[#32325D] mb-1">
                  {currentStep?.title}
                </h4>
                <p className="text-xs text-[#525F7F] leading-relaxed">
                  {currentStep?.description}
                </p>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                {currentStepIndex > 0 ? (
                  <button
                    onClick={prevStep}
                    className="text-xs text-[#525F7F] hover:text-[#32325D] font-medium flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={nextStep}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#3B7CED] hover:bg-[#3065c3] rounded-md shadow-2xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <span>{currentStep?.actionText || (currentStepIndex === totalSteps - 1 ? "Finish" : "Next")}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Module Completion Card */}
      <AnimatePresence>
        {isComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full flex flex-col items-center text-center gap-3 relative"
            >
              <button
                onClick={closeCompletion}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-full bg-[#E2F2E9] text-[#1E8E3E] flex items-center justify-center mb-1">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h3 className="text-base font-semibold text-[#32325D]">
                {config.completionTitle}
              </h3>
              <p className="text-xs text-[#525F7F] leading-relaxed">
                {config.completionText}
              </p>

              <div className="w-full flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
                {config.nextModule && (
                  <Link
                    href={config.nextModule.route}
                    onClick={closeCompletion}
                    className="w-full py-2 px-3 text-xs font-medium text-[#3B7CED] bg-[#E8F0FE] hover:bg-blue-100 rounded-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Next: {config.nextModule.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={closeCompletion}
                  className="w-full py-2 px-3 text-xs font-medium text-white bg-[#3B7CED] hover:bg-[#3065c3] rounded-md transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Reusable Guide Button that can be placed in module headers or navigation bars
 */
export function WizardGuideButton({ moduleId, className = "" }: { moduleId: string; className?: string }) {
  const { startTour, config } = useModuleWizard(moduleId);

  if (!config) return null;

  return (
    <button
      type="button"
      onClick={startTour}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#525F7F] hover:text-[#3B7CED] hover:bg-blue-50/70 border border-gray-200 transition-all cursor-pointer ${className}`}
      title={`Start ${config.moduleName} Guide`}
    >
      <HelpCircle className="w-3.5 h-3.5 text-[#3B7CED]" />
      <span>Guide</span>
    </button>
  );
}
