"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useTransform, useMotionValueEvent } from "framer-motion";
import { useSystemState } from "./SystemStateProvider";

export const SystemProbeField: React.FC = () => {
  const { mouseX, mouseY, systemStatus } = useSystemState();
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);

  // Update text content directly to avoid React re-renders
  useMotionValueEvent(mouseX, "change", (latest) => {
    if (xRef.current) xRef.current.innerText = `LOC_X: ${Math.round(latest)}`;
  });

  useMotionValueEvent(mouseY, "change", (latest) => {
    if (yRef.current) yRef.current.innerText = `LOC_Y: ${Math.round(latest)}`;
  });

  // Create a soft focal glow that follows the mouse
  const background = useMotionTemplate`radial-gradient(
    400px circle at ${mouseX}px ${mouseY}px,
    rgba(59,124,237,0.25),
    transparent 80%
  )`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Subtle Background Grid - Only visible near the cursor */}
      <motion.div
        className="absolute inset-0 opacity-80"
        style={{
          background,
          WebkitMaskImage: useMotionTemplate`radial-gradient(
            250px circle at ${mouseX}px ${mouseY}px,
            black 20%,
            transparent 100%
          )`,
          backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Atmospheric Focal Point */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{
            left: mouseX,
            top: mouseY,
            x: "-50%",
            y: "-50%",
            background: "radial-gradient(circle, rgba(59,124,237,0.1), transparent 70%)",
            border: "1px solid rgba(59,124,237,0.15)"
        }}
      />

      {/* Concentric Rings (Mechanical Detail) */}
      <motion.div
        className="absolute w-24 h-24 rounded-full border border-[#3B7CED]/40 pointer-events-none"
        style={{ left: mouseX, top: mouseY, x: "-50%", y: "-50%" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full border border-dashed border-[#3B7CED]/20 pointer-events-none"
        style={{ left: mouseX, top: mouseY, x: "-50%", y: "-50%" }}
      />
      
      {/* Precision Crosshairs */}
      <motion.div 
        className="absolute w-px h-4 bg-[#3B7CED]/60"
        style={{ left: mouseX, top: useTransform(mouseY, (v) => (v as number) - 32), x: "-50%" }}
      />
      <motion.div 
        className="absolute w-px h-4 bg-[#3B7CED]/60"
        style={{ left: mouseX, top: useTransform(mouseY, (v) => (v as number) + 16), x: "-50%" }}
      />
      <motion.div 
        className="absolute w-4 h-px bg-[#3B7CED]/60"
        style={{ left: useTransform(mouseX, (v) => (v as number) - 32), top: mouseY, y: "-50%" }}
      />
      <motion.div 
        className="absolute w-4 h-px bg-[#3B7CED]/60"
        style={{ left: useTransform(mouseX, (v) => (v as number) + 16), top: mouseY, y: "-50%" }}
      />

      {/* Coordinate Display (Minimalist Metadata) */}
      <motion.div 
        className="absolute bottom-12 right-12 font-mono text-[10px] text-slate-400 tracking-tighter hidden md:block"
        animate={{ opacity: systemStatus === "REBUILDING" ? 0 : 0.5 }}
      >
        <div className="flex flex-col items-end">
            <span ref={xRef}>LOC_X: 0</span>
            <span ref={yRef}>LOC_Y: 0</span>
        </div>
      </motion.div>
    </div>
  );
};
