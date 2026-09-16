"use client";

import React, { useEffect } from "react";
import { SystemProbeField } from "./SystemProbeField";
import { useSystemState } from "./SystemStateProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const NotFoundScreen: React.FC = () => {
  const { systemStatus, triggerRebuild } = useSystemState();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRebuild();
      } else if (e.key === "Escape") {
        router.back();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleRebuild = async () => {
    await triggerRebuild();
    router.push("/protected/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#3B7CED]/20 flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Dynamic Interaction layer */}
      <SystemProbeField />

      <main className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
        {/* Massive Architectural Typography */}
        <div className="relative mb-8 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[12rem] md:text-[20rem] font-black tracking-tighter leading-none text-slate-200 select-none"
          >
            404
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-white/60 backdrop-blur-md px-10 py-6 border border-slate-200 rounded-3xl shadow-2xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900">
                Resource Missing
              </h1>
            </div>
          </motion.div>
        </div>

        {/* Minimalist Support Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="space-y-8 max-w-lg"
        >
          <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
            The requested internal module could not be synchronized. Execution
            path terminated due to reference loss.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="px-8 border-slate-200 text-slate-600 hover:bg-slate-100 transition-all duration-300 rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              size="lg"
              onClick={handleRebuild}
              disabled={systemStatus === "REBUILDING"}
              className="px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all duration-500 rounded-full hover:scale-105 active:scale-95"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {systemStatus === "REBUILDING"
                ? "Restoring..."
                : "Dashboard Re-entry"}
            </Button>
          </div>
        </motion.div>

        {/* Bottom Technical Detail */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.5 }}
          className="mt-24 space-x-6 text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-slate-400"
        >
          <span>
            ERR_CID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </span>
          <span className="hidden sm:inline-block">|</span>
          <span>STATUS: {systemStatus}</span>
        </motion.div>
      </main>

      {/* Screen Effects */}
      <AnimatePresence>
        {systemStatus === "REBUILDING" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-100 flex items-center justify-center"
          >
            <div className="w-48 h-[2px] bg-slate-100 overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "110%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-slate-900"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
