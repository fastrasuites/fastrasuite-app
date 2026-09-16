import React from "react";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";

export default function NotificationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <NavBar title="Notifications" items={[]} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
