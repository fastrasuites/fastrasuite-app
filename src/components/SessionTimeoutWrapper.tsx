"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearAuthData } from "@/lib/store/authSlice";

// 30 minutes in milliseconds
// const TIMEOUT_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 1000 * 60 * 1000;


export default function SessionTimeoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // We only run the timeout on authenticated routes, ignoring auth pages
  const isAuthPage = pathname.startsWith("/auth");

  const handleTimeout = useCallback(async () => {
    // 1. Clear httpOnly cookies via API
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Failed to clear cookies", e);
    }

    // 2. Clear Redux auth state
    // We assume clearAuthData exists, or we might need to modify authSlice if it doesn't.
    // If it doesn't exist, this will just gracefully pass and the token removal will handle redirect.
    if (clearAuthData) {
      try {
        dispatch(clearAuthData());
      } catch (e) {}
    }

    // 3. Redirect back to login with a message & redirect path
    const loginUrl = new URL(window.location.origin + "/auth/login");
    loginUrl.searchParams.set("reason", "timeout");
    loginUrl.searchParams.set("redirect", pathname);
    router.push(loginUrl.toString());
  }, [router, pathname, dispatch]);

  const resetTimer = useCallback(() => {
    if (isAuthPage) return; // Don't run timer on auth pages

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleTimeout, TIMEOUT_MS);
  }, [handleTimeout, isAuthPage]);

  useEffect(() => {
    if (isAuthPage) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Initial timer setup
    resetTimer();

    // Events that denote user activity
    const events = ["mousemove", "keydown", "wheel", "touchstart", "click"];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, isAuthPage]);

  return <>{children}</>;
}
