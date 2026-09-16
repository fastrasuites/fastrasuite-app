"use client";

import React, { useMemo } from "react";
import { motion, useTransform, useMotionValue } from "framer-motion";
import { useSystemState } from "./SystemStateProvider";
import { cn } from "@/lib/utils";

interface GridNodeProps {
  id: number;
  indexX: number;
  indexY: number;
  totalX: number;
  totalY: number;
}

export const GridNode: React.FC<GridNodeProps> = ({ indexX, indexY, totalX, totalY }) => {
  const { mouseX, mouseY, systemStatus } = useSystemState();
  const nodeRef = React.useRef<HTMLDivElement>(null);

  // Initialize position values
  const x = (indexX / (totalX - 1)) * 100;
  const y = (indexY / (totalY - 1)) * 100;

  // Use a local motion value for the distance calculation to avoid re-renders
  const distance = useTransform([mouseX, mouseY], ([latestX, latestY]) => {
    if (!nodeRef.current || systemStatus === "REBUILDING") return 1000;

    const rect = nodeRef.current.getBoundingClientRect();
    const nodeCenterX = rect.left + rect.width / 2;
    const nodeCenterY = rect.top + rect.height / 2;

    const dx = (latestX as number) - nodeCenterX;
    const dy = (latestY as number) - nodeCenterY;
    
    return Math.sqrt(dx * dx + dy * dy);
  });

  // Opacity: 0.1 (Idle) -> 1.0 (Active)
  // Distance zones: > 160 (IDLE), 60-160 (STANDBY), < 60 (ACTIVE)
  const opacity = useTransform(distance, [160, 60], [0.1, 1], { clamp: true });
  
  // Scale: 1.0 -> 1.08
  const scale = useTransform(distance, [160, 60], [1, 1.08], { clamp: true });

  // Binary class switching for border
  const [isActive, setIsActive] = React.useState(false);
  
  // We use a useEffect-like approach with useTransform to sync the binary state
  // without re-rendering the whole grid, if possible. 
  // But since we need class names, we might need a local state or just use motion styles for border.
  // Actually, animating border opacity or scale is better. 
  // Let's use motion style for the border itself.
  const borderOpacity = useTransform(distance, [160, 60], [0.2, 1], { clamp: true });

  // REBUILDING logic
  const rebuildX = systemStatus === "REBUILDING" ? "50vw" : `${x}%`;
  const rebuildY = systemStatus === "REBUILDING" ? "50vh" : `${y}%`;

  return (
    <motion.div
      ref={nodeRef}
      className={cn(
        "absolute w-4 h-4 rounded-sm border transition-colors duration-200",
        systemStatus === "REBUILDING" 
            ? "border-blue-500 bg-blue-500/20" 
            : "border-slate-200 bg-slate-100/30"
      )}
      style={{
        left: `calc(${x}% - 8px)`,
        top: `calc(${y}% - 8px)`,
        opacity,
        scale,
        borderStyle: "solid",
        borderColor: systemStatus === "REBUILDING" ? "#3B7CED" : undefined
      }}
      animate={systemStatus === "REBUILDING" ? {
        left: "50%",
        top: "50%",
        x: "-50%",
        y: "-50%",
        scale: 0,
        opacity: 0,
        transition: { 
            duration: 1.2, 
            ease: [0.22, 1, 0.36, 1],
            delay: (indexX + indexY) * 0.01 
        }
      } : {}}
    >
      {/* Interaction Indicator */}
      <motion.div 
        className="absolute inset-0 rounded-[1px] border-[#3B7CED]"
        style={{ 
            borderWidth: 1, 
            opacity: useTransform(distance, [60, 40], [0, 1]) 
        }} 
      />
    </motion.div>
  );
};
