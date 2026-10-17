"use client";

import { useEffect, useState, useCallback } from "react";
import { WifiOff, Wifi, SignalLow } from "lucide-react";

type NetState = "online" | "offline" | "slow" | "reconnected";

function getConnectionSlow(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn =
    (navigator as any).connection || (navigator as any).mozConnection;
  if (!conn?.effectiveType) return false;
  return conn.effectiveType === "2g" || conn.effectiveType === "slow-2g";
}

export default function NetworkStatusNotifier() {
  const [state, setState] = useState<NetState>("online");
  const [visible, setVisible] = useState(false);

  const applyOnline = useCallback(() => {
    const slow = getConnectionSlow();
    setState(slow ? "slow" : "online");
    setVisible(slow);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial
    if (!navigator.onLine) {
      setState("offline");
      setVisible(true);
    } else {
      applyOnline();
    }

    const onOffline = () => {
      setState("offline");
      setVisible(true);
    };

    const onOnline = () => {
      setState("reconnected");
      setVisible(true);
      // Brief “back online”, then settle
      window.setTimeout(() => {
        const slow = getConnectionSlow();
        setState(slow ? "slow" : "online");
        setVisible(slow); // hide if fully ok; keep if still slow
      }, 3000);
    };

    const onConnectionChange = () => {
      if (!navigator.onLine) return;
      if (state === "offline" || state === "reconnected") return;
      const slow = getConnectionSlow();
      setState(slow ? "slow" : "online");
      setVisible(slow);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    const conn = (navigator as any).connection;
    conn?.addEventListener?.("change", onConnectionChange);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      conn?.removeEventListener?.("change", onConnectionChange);
    };
  }, [applyOnline, state]);

  if (!visible || state === "online") return null;

  const config = {
    offline: {
      icon: WifiOff,
      text: "You’re offline! Check your connection.",
      className: "bg-red-600 text-white",
    },
    reconnected: {
      icon: Wifi,
      text: "You’re back online.",
      className: "bg-emerald-600 text-white",
    },
    slow: {
      icon: SignalLow,
      text: "Slow connection. Some actions may take longer.",
      className: "bg-amber-500 text-white",
    },
  }[
    state === "reconnected"
      ? "reconnected"
      : state === "slow"
        ? "slow"
        : "offline"
  ];

  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-99999 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium shadow-md rounded ${config.className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{config.text}</span>
    </div>
  );
}
