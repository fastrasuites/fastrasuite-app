import React from "react";
import { motion } from "framer-motion";

interface ShimmerProps {
  className?: string;
  duration?: number;
  delay?: number;
}

export function Shimmer({
  className = "",
  duration = 2,
  delay = 0,
}: ShimmerProps) {
  return (
    <motion.div
      className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent ${className}`}
      animate={{
        x: [-200, 400],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      style={{
        width: "100px",
      }}
    />
  );
}

interface PulseDotProps {
  delay?: number;
  size?: "sm" | "md" | "lg";
}

export function PulseDot({ delay = 0, size = "md" }: PulseDotProps) {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} bg-blue-400 rounded-full`}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

interface LoadingDotsProps {
  count?: number;
  className?: string;
}

export function LoadingDots({ count = 3, className = "" }: LoadingDotsProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <PulseDot key={index} delay={index * 0.2} />
      ))}
    </div>
  );
}
