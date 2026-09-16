"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MODULE_WIZARDS, ModuleWizardConfig, WizardStep } from "@/config/moduleWizards";

const STORAGE_PREFIX = "fastra_wizard_";

export function useModuleWizard(moduleId: string) {
  const config: ModuleWizardConfig | undefined = MODULE_WIZARDS[moduleId];
  const pathname = usePathname();
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const storageKey = `${STORAGE_PREFIX}${moduleId}_seen`;
  const stepStorageKey = `${STORAGE_PREFIX}${moduleId}_step`;
  const animationFrameRef = useRef<number | null>(null);

  // Check initial seen state on mount
  useEffect(() => {
    setHasMounted(true);
    if (!config) return;

    try {
      const seen = localStorage.getItem(storageKey);
      const savedStep = localStorage.getItem(stepStorageKey);

      if (!seen) {
        setShowInvitation(true);
      } else if (seen === "active" && savedStep !== null) {
        const stepNum = parseInt(savedStep, 10);
        if (!isNaN(stepNum) && stepNum < config.steps.length) {
          setCurrentStepIndex(stepNum);
          setIsTourActive(true);
        }
      }
    } catch {}
  }, [storageKey, stepStorageKey, config]);

  const currentStep: WizardStep | undefined = config?.steps[currentStepIndex];

  const stepIndexRef = useRef(currentStepIndex);
  useEffect(() => {
    stepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  const isRouteMatch = useCallback((stepRoute?: string, currentPath?: string) => {
    if (!stepRoute || !currentPath) return false;
    const cleanCurrent = currentPath.split("?")[0].replace(/\/$/, "");
    const cleanStep = stepRoute.split("?")[0].replace(/\/$/, "");

    if (cleanStep.includes("[id]")) {
      const prefix = cleanStep.split("[id]")[0].replace(/\/$/, "");
      return cleanCurrent.startsWith(prefix) && cleanCurrent !== prefix && !cleanCurrent.endsWith("/new");
    }
    return cleanCurrent === cleanStep;
  }, []);

  const getPageKey = useCallback((path: string) => {
    const clean = path.split("?")[0].replace(/\/$/, "");
    if (clean.includes("/project-costing/") && !clean.endsWith("/new")) return "detail";
    if (clean.includes("/project-costing/new")) return "new";
    if (clean.includes("/project-request/purchase-request/new")) return "new";
    if (clean.includes("/project-request/make-request")) return "make_request";
    if (clean.includes("/project-request/approve")) return "approve";
    if (clean.includes("/invoice/purchase-order")) return "purchase_order";
    if (clean.includes("/invoice/payment-queue")) return "payment_queue";
    if (clean.includes("/inventory/operation/material-consumption")) return "material_consumption";
    if (clean.includes("/inventory/stock-on-hand")) return "stock_on_hand";
    if (clean.includes("/inventory/stocks/adjustment")) return "adjustment";
    const lastPart = clean.split("/").filter(Boolean).pop();
    return lastPart || "root";
  }, []);

  const currentInvitation = useMemo(() => {
    if (!config) return { title: "", text: "" };
    if (config.pageInvitations && pathname) {
      const matched = config.pageInvitations.find((pi) => isRouteMatch(pi.routePattern, pathname));
      if (matched) {
        return {
          title: matched.title,
          text: matched.text,
        };
      }
    }
    return {
      title: config.invitationTitle,
      text: config.invitationText,
    };
  }, [config, pathname, isRouteMatch]);

  // Check initial and route-level seen state on mount and pathname change
  useEffect(() => {
    setHasMounted(true);
    if (!config || !pathname) return;

    try {
      const savedGlobal = localStorage.getItem(storageKey);
      const savedStep = localStorage.getItem(stepStorageKey);
      const pageKey = getPageKey(pathname);
      const pageSeenKey = `${STORAGE_PREFIX}${moduleId}_${pageKey}_seen`;
      const pageSeen = localStorage.getItem(pageSeenKey);

      if (savedGlobal === "active" && savedStep !== null) {
        const stepNum = parseInt(savedStep, 10);
        if (!isNaN(stepNum) && stepNum < config.steps.length) {
          setCurrentStepIndex(stepNum);
          setIsTourActive(true);
          setShowInvitation(false);
          return;
        }
      }

      // Check if current page has matching tour steps and hasn't been seen/dismissed
      const hasStepsOnThisPage = config.steps.some((s) => isRouteMatch(s.route, pathname));
      if (hasStepsOnThisPage && !pageSeen) {
        setShowInvitation(true);
      } else {
        setShowInvitation(false);
      }
    } catch {}
  }, [storageKey, stepStorageKey, config, pathname, isRouteMatch, getPageKey, moduleId]);

  // Route-aware step matching on pathname change or mount
  useEffect(() => {
    if (!isTourActive || !config || !pathname) return;

    const currentIdx = stepIndexRef.current;
    const activeStep = config.steps[currentIdx];

    // If the active step's route already matches current pathname, keep the active step!
    if (activeStep?.route && isRouteMatch(activeStep.route, pathname)) {
      return;
    }

    // Otherwise, user navigated to a different page - find the first step on the new page
    const matchingStepIndex = config.steps.findIndex((s) => isRouteMatch(s.route, pathname));

    if (matchingStepIndex !== -1 && matchingStepIndex !== currentIdx) {
      setCurrentStepIndex(matchingStepIndex);
      try {
        localStorage.setItem(stepStorageKey, matchingStepIndex.toString());
      } catch {}
    }
  }, [isTourActive, config, pathname, stepStorageKey, isRouteMatch]);

  // Switch tab if step declares a target tab
  useEffect(() => {
    if (isTourActive && currentStep?.tab && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("wizard:tab-change", { detail: { tab: currentStep.tab } })
      );
    }
  }, [isTourActive, currentStep]);

  // Update target element bounding box
  const updateTargetRect = useCallback(() => {
    if (!isTourActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isTourActive, currentStep]);

  // Scroll target element into view smoothly when step changes or DOM renders
  useEffect(() => {
    if (!isTourActive || !currentStep) return;

    let retryCount = 0;
    const maxRetries = 20;

    const findAndScroll = () => {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const inViewport =
          rect.top >= 50 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 50 &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (!inViewport) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        }
        updateTargetRect();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(findAndScroll, 200);
      }
    };

    findAndScroll();

    const timer = setTimeout(() => {
      updateTargetRect();
    }, 300);

    return () => clearTimeout(timer);
  }, [isTourActive, currentStepIndex, currentStep, updateTargetRect]);

  // Re-calculate target rect on resize and scroll
  useEffect(() => {
    if (!isTourActive) return;

    const handleUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateTargetRect();
      });
    };

    window.addEventListener("resize", handleUpdate, { passive: true });
    window.addEventListener("scroll", handleUpdate, { passive: true });

    const interval = setInterval(handleUpdate, 350);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTourActive, updateTargetRect]);

  const startTour = useCallback(() => {
    if (!config) return;
    setShowInvitation(false);
    setIsComplete(false);

    // Contextually find if current page has a matching step
    const currentMatchingIdx = config.steps.findIndex((s) => isRouteMatch(s.route, pathname));
    const targetIdx = currentMatchingIdx !== -1 ? currentMatchingIdx : 0;

    setCurrentStepIndex(targetIdx);
    setIsTourActive(true);

    const pageKey = pathname ? getPageKey(pathname) : "root";
    const pageSeenKey = `${STORAGE_PREFIX}${moduleId}_${pageKey}_seen`;

    try {
      localStorage.setItem(storageKey, "active");
      localStorage.setItem(stepStorageKey, targetIdx.toString());
      localStorage.setItem(pageSeenKey, "seen");
    } catch {}

    // Only navigate to rootRoute if the current page has NO steps in this module
    if (currentMatchingIdx === -1 && config.rootRoute && pathname !== config.rootRoute) {
      router.push(config.rootRoute);
    }
  }, [config, storageKey, stepStorageKey, pathname, router, isRouteMatch, getPageKey, moduleId]);

  // Listen for global wizard:start events (e.g. from AdminOnboardingChecklist)
  useEffect(() => {
    const handleStartEvent = (e: any) => {
      const targetModule = e?.detail?.moduleId;
      if (!targetModule || targetModule === moduleId) {
        startTour();
      }
    };
    window.addEventListener("wizard:start", handleStartEvent as EventListener);
    return () => {
      window.removeEventListener("wizard:start", handleStartEvent as EventListener);
    };
  }, [moduleId, startTour]);

  const dismissInvitation = useCallback(() => {
    setShowInvitation(false);
    const pageKey = pathname ? getPageKey(pathname) : "root";
    const pageSeenKey = `${STORAGE_PREFIX}${moduleId}_${pageKey}_seen`;
    try {
      localStorage.setItem(pageSeenKey, "dismissed");
    } catch {}
  }, [pathname, getPageKey, moduleId]);

  const triggerActionFeedback = useCallback((msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3000);
  }, []);

  const nextStep = useCallback(() => {
    if (!config) return;

    if (currentStep?.successFeedback) {
      triggerActionFeedback(currentStep.successFeedback);
    }

    if (currentStepIndex < config.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const nextStepDef = config.steps[nextIdx];

      setCurrentStepIndex(nextIdx);
      try {
        localStorage.setItem(stepStorageKey, nextIdx.toString());
      } catch {}

      // Handle intelligent route transition if nextRoute is specified
      if (currentStep?.nextRoute) {
        router.push(currentStep.nextRoute);
      } else if (nextStepDef?.route && !nextStepDef.route.includes("[id]") && pathname !== nextStepDef.route) {
        router.push(nextStepDef.route);
      }
    } else {
      setIsTourActive(false);
      setIsComplete(true);
      try {
        localStorage.setItem(storageKey, "completed");
        localStorage.removeItem(stepStorageKey);
      } catch {}
    }
  }, [config, currentStep, currentStepIndex, stepStorageKey, storageKey, router, pathname, triggerActionFeedback]);

  const prevStep = useCallback(() => {
    if (!config || currentStepIndex <= 0) return;

    const prevIdx = currentStepIndex - 1;
    const prevStepDef = config.steps[prevIdx];
    setCurrentStepIndex(prevIdx);

    try {
      localStorage.setItem(stepStorageKey, prevIdx.toString());
    } catch {}

    if (prevStepDef?.route && !prevStepDef.route.includes("[id]") && pathname !== prevStepDef.route) {
      router.push(prevStepDef.route);
    }
  }, [config, currentStepIndex, stepStorageKey, router, pathname]);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setIsComplete(false);
    try {
      localStorage.setItem(storageKey, "skipped");
      localStorage.removeItem(stepStorageKey);
    } catch {}
  }, [storageKey, stepStorageKey]);

  const closeCompletion = useCallback(() => {
    setIsComplete(false);
  }, []);

  const resetTour = useCallback(() => {
    startTour();
  }, [startTour]);

  return {
    hasMounted,
    config,
    showInvitation,
    currentInvitation,
    isTourActive,
    currentStepIndex,
    currentStep,
    totalSteps: config?.steps.length || 0,
    targetRect,
    isComplete,
    feedbackToast,
    startTour,
    dismissInvitation,
    nextStep,
    prevStep,
    skipTour,
    closeCompletion,
    resetTour,
    triggerActionFeedback,
  };
}
