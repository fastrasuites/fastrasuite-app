"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

const DISMISSAL_KEY = "fastra_pwa_prompt_dismissed";
const INSTALLED_KEY = "fastra_pwa_installed";
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if running in standalone/PWA mode
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true);

    const isDismissedOrInstalled = () => {
      try {
        if (typeof window === "undefined") return true;
        if (localStorage.getItem(INSTALLED_KEY) === "true") return true;
        const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
        if (dismissedAt) {
          const dismissedTime = parseInt(dismissedAt, 10);
          if (Date.now() - dismissedTime < COOLDOWN_MS) {
            return true;
          }
        }
      } catch {
        return false;
      }
      return false;
    };

    if (isStandalone || isDismissedOrInstalled()) {
      return;
    }

    const handler = (e: any) => {
      // Prevent the default browser prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the banner only if not dismissed
      if (!isDismissedOrInstalled()) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    try {
      if (outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "true");
      } else {
        localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
      }
    } catch {}

    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
    } catch {}
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[min(90vw,400px)]"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <img src="/icons/icon-192x192.png" alt="Fastra Logo" className="w-8 h-8 rounded-md" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fastra Suite</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Add to home screen</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
