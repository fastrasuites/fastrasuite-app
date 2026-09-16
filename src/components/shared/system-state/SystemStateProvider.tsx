"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, MotionValue } from "framer-motion";

export type SystemStatus = "DEGRADED" | "STABILIZING" | "STABLE" | "REBUILDING";

interface SystemStateContextType {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  systemStatus: SystemStatus;
  setSystemStatus: (status: SystemStatus) => void;
  triggerRebuild: () => Promise<void>;
}

const SystemStateContext = createContext<SystemStateContextType | null>(null);

export function useSystemState() {
  const context = useContext(SystemStateContext);
  if (!context) {
    throw new Error("useSystemState must be used within a SystemStateProvider");
  }
  return context;
}

export const SystemStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  
  // Smoothly track the mouse for a premium feel
  const springX = useSpring(mouseX, { stiffness: 500, damping: 50, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50, mass: 0.5 });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>("DEGRADED");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (systemStatus === "REBUILDING") return;
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      // Update status based on interaction
      if (systemStatus === "DEGRADED") {
        setSystemStatus("STABILIZING");
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (systemStatus === "REBUILDING") return;
      if (e.touches[0]) {
        mouseX.set(e.touches[0].clientX);
        mouseY.set(e.touches[0].clientY);
        if (systemStatus === "DEGRADED") {
          setSystemStatus("STABILIZING");
        }
      }
    };

    // Idle stabilization
    const idleTimeout = setTimeout(() => {
        if (systemStatus === "STABILIZING") {
            setSystemStatus("STABLE");
        }
    }, 2000);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      isMounted.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      clearTimeout(idleTimeout);
    };
  }, [systemStatus, mouseX, mouseY]);

  const triggerRebuild = async () => {
    setSystemStatus("REBUILDING");
    // Animation duration logic handled by consumers observing this state
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  return (
    <SystemStateContext.Provider
      value={{
        mouseX: springX,
        mouseY: springY,
        systemStatus,
        setSystemStatus,
        triggerRebuild,
      }}
    >
      {children}
    </SystemStateContext.Provider>
  );
};
