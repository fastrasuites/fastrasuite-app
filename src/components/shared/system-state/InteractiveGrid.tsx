"use client";

import React from "react";
import { GridNode } from "./GridNode";
import { useSystemState } from "./SystemStateProvider";
import { motion, AnimatePresence } from "framer-motion";

export const InteractiveGrid: React.FC = () => {
  const { systemStatus } = useSystemState();
  const ROWS = 6;
  const COLS = 8;
  const totalNodes = ROWS * COLS;

  return (
    <div className="relative w-full h-[400px] md:h-[600px] pointer-events-none select-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-4xl aspect-8/6 px-12 md:px-24">
          {Array.from({ length: COLS }).map((_, i) =>
            Array.from({ length: ROWS }).map((_, j) => (
              <GridNode
                key={`${i}-${j}`}
                id={i * ROWS + j}
                indexX={i}
                indexY={j}
                totalX={COLS}
                totalY={ROWS}
              />
            ))
          )}
        </div>
      </div>

      {/* Background Grid Lines (Subtle) */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #3B7CED 0.5px, transparent 0.5px), linear-gradient(to bottom, #3B7CED 0.5px, transparent 0.5px)`,
          backgroundSize: '12.5% 16.66%'
        }}
      />
      
      {/* Scanline Effect */}
      <motion.div 
        className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent via-[#3B7CED]/2 to-transparent h-20 w-full"
        animate={{
            top: ["-10%", "110%"]
        }}
        transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
        }}
      />
    </div>
  );
};
