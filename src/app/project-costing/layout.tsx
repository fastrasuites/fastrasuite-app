import React from "react";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";

export default function ProjectCostingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col gap-3 bg-[#F1F2F4] pl-3">
      <NavBar title="Project Costing" items={[]} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
