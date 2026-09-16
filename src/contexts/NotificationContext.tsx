"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/lib/store/store";
import type { AppNotification } from "@/types/notification";
import { notificationApi } from "@/api/notificationApi";
import { playNotificationSound } from "@/utils/notificationSound";
import { NotificationToast } from "@/components/notifications/NotificationToast";

interface NotificationContextType {
  isConnected: boolean;
  activeToast: AppNotification | null;
  dismissToast: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  isConnected: false,
  activeToast: null,
  dismissToast: () => {},
  soundEnabled: true,
  setSoundEnabled: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.access_token);
  const tenantSchemaName = useSelector((state: RootState) => state.auth.tenant_schema_name);
  const [isConnected, setIsConnected] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const urlIndexRef = useRef(0);
  const maxReconnectDelay = 30000; // max 30s backoff

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";

    // Build candidate WebSocket URLs to try in order
    const candidateUrls: string[] = [];
    if (process.env.NEXT_PUBLIC_WS_URL) {
      candidateUrls.push(process.env.NEXT_PUBLIC_WS_URL);
    }
    
    if (tenantSchemaName) {
      // 1. Try tenant-specific WebSocket (Standard for this app's API)
      candidateUrls.push(`wss://${tenantSchemaName}.${apiDomain}/ws/notifications/`);
    }
    
    // 2. Try exactly what the backend docs/user suggested
    candidateUrls.push(`wss://${apiDomain}/ws/notifications/`);
    
    // 3. Try with www prefix just in case
    candidateUrls.push(`wss://www.${apiDomain}/ws/notifications/`);

    const selectedBaseUrl = candidateUrls[urlIndexRef.current % candidateUrls.length];
    
    // Construct full URL with token parameter
    const url = new URL(selectedBaseUrl);
    url.searchParams.set("token", token);

    try {
      if (socketRef.current) {
        socketRef.current.close();
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`🔌 [Notification WebSocket] Connecting to: ${url.origin}${url.pathname}?token=...`);
      }

      const socket = new WebSocket(url.toString());
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset backoff delay
        (socket as any)._connectedAt = Date.now(); // Track how long it stays open

        if (process.env.NODE_ENV === "development") {
          console.log(`🟢 [Notification WebSocket] Connected successfully to ${selectedBaseUrl}`);
        }

        // Setup Heartbeat to prevent 1006 idle timeout drops by proxies (e.g. NGINX/Cloudflare)
        const heartbeatInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000); // 25s ping

        (socket as any)._heartbeatInterval = heartbeatInterval;
      };

      socket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          if (process.env.NODE_ENV === "development") {
            console.log("🔔 [Notification WebSocket] Incoming message:", rawData);
          }

          // Handle various wrapper shapes if present (e.g. { data: ... } or { notification: ... } or raw notification object)
          const notificationData: AppNotification =
            rawData?.notification || rawData?.data || rawData;

          if (notificationData && (notificationData.id || notificationData.title || notificationData.message)) {
            // Optimistically prepend to RTK Query cache
            dispatch(
              notificationApi.util.updateQueryData("getNotifications", undefined, (draft) => {
                const exists = draft.some((n) => String(n.id) === String(notificationData.id));
                if (!exists) {
                  draft.unshift(notificationData);
                }
              })
            );

            // Invalidate to ensure consistency across tabs & filtered queries
            dispatch(notificationApi.util.invalidateTags([{ type: "Notification", id: "LIST" }]));

            // Play sound if enabled
            if (soundEnabled) {
              playNotificationSound();
            }

            // Display floating Toast alert
            setActiveToast(notificationData);
          }
        } catch (err) {
          // Ignore non-json or ping messages
        }
      };

      socket.onerror = (err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ [Notification WebSocket] Error:", err);
        }
      };

      socket.onclose = (event) => {
        if ((socket as any)._heartbeatInterval) {
          clearInterval((socket as any)._heartbeatInterval);
        }
        
        setIsConnected(false);
        socketRef.current = null;
        if (process.env.NODE_ENV === "development") {
          console.log(`🔴 [Notification WebSocket] Connection closed (code: ${event.code}) for ${selectedBaseUrl}`);
        }

        // Attempt reconnection if token still exists
        if (token) {
          const connectedAt = (socket as any)._connectedAt;
          const uptime = connectedAt ? Date.now() - connectedAt : 0;

          // If the connection dropped within 5 seconds, it's a bad URL. Move to the next candidate.
          if (!connectedAt || uptime < 5000) {
            urlIndexRef.current += 1;
          }

          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelay
          );
          reconnectAttemptsRef.current += 1;

          if (process.env.NODE_ENV === "development") {
            console.log(`🔄 [Notification WebSocket] Retrying connection in ${delay / 1000}s...`);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    } catch {
      setIsConnected(false);
    }
  }, [token, tenantSchemaName, dispatch, soundEnabled]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        if ((socketRef.current as any)._heartbeatInterval) {
          clearInterval((socketRef.current as any)._heartbeatInterval);
        }
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connectWebSocket]);

  return (
    <NotificationContext.Provider
      value={{
        isConnected,
        activeToast,
        dismissToast,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
      <NotificationToast
        notification={activeToast}
        onClose={dismissToast}
      />
    </NotificationContext.Provider>
  );
}
