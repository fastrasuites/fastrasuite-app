"use client";

import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { store, persistor } from "@/lib/store/store";
import { PersistGate } from "redux-persist/integration/react";
import { usePathname } from "next/navigation";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Sidebar from "@/components/shared/Sidebar";
import SessionTimeoutWrapper from "@/components/SessionTimeoutWrapper";
import DatabaseInitializer from "@/components/DatabaseInitializer";
import dynamic from "next/dynamic";
import SubscriptionGuard from "@/components/shared/SubscriptionGuard";

const AdminOnboardingChecklist = dynamic(
  () =>
    import("@/components/shared/onboarding/AdminOnboardingChecklist").then(
      (mod) => mod.AdminOnboardingChecklist
    ),
  { ssr: false }
);

import { createContext, useContext } from "react";

// Create context for sidebar toggle
export const SidebarContext = createContext<{
  toggleSidebar: () => void;
  isOpen: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
}>({
  toggleSidebar: () => {},
  isOpen: false,
  isExpanded: false,
  toggleExpanded: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
    if (pathname !== "/") {
      setSidebarExpanded(false);
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleExpanded = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PermissionProvider>
          <NotificationProvider>
            <SidebarContext.Provider
              value={{ toggleSidebar, isOpen: sidebarOpen, isExpanded: sidebarExpanded, toggleExpanded }}
            >
              <SessionTimeoutWrapper>
                <DatabaseInitializer />
                <div className="flex bg-gray-100 min-h-screen">
                  {!isAuthPage && (
                    <Sidebar
                      isOpen={sidebarOpen}
                      onClose={closeSidebar}
                      onToggle={toggleSidebar}
                      isExpanded={sidebarExpanded}
                      onToggleExpanded={toggleExpanded}
                    />
                  )}

                  {/* Overlay for mobile when sidebar is open */}
                  {!isAuthPage && sidebarOpen && (
                    <div
                      className="fixed inset-0 bg-black/30 z-30 md:hidden"
                      onClick={closeSidebar}
                      aria-hidden="true"
                    />
                  )}

                  <div
                    className={`flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ${!isAuthPage ? (sidebarExpanded ? "md:ml-64" : "md:ml-16") : ""}`}
                  >
                    <SubscriptionGuard>
                      {children}
                    </SubscriptionGuard>
                  </div>
                  {!isAuthPage && <AdminOnboardingChecklist />}
                </div>
              </SessionTimeoutWrapper>
            </SidebarContext.Provider>
          </NotificationProvider>
        </PermissionProvider>
      </PersistGate>
    </Provider>
  );
}
