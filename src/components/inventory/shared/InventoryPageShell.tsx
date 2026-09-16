"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PageGuard } from "@/components/auth/PageGuard";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/components/shared/types";
import { ApplicationName } from "@/types/permissions";

interface InventoryPageShellProps {
  application?: ApplicationName;
  module?: string;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  showAutosave?: boolean;
}

export function InventoryPageShell({
  application = "inventory",
  module = "incomingproduct",
  breadcrumbs,
  children,
  headerAction,
  showAutosave = true,
}: InventoryPageShellProps) {
  return (
    <PageGuard application={application} module={module}>
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-24 sm:pb-28">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs
            items={breadcrumbs}
            action={
              headerAction !== undefined ? (
                headerAction
              ) : showAutosave ? (
                <Button
                  variant="ghost"
                  className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
                >
                  Autosaved <AutoSaveIcon />
                </Button>
              ) : null
            }
          />
          {children}
        </main>
      </div>
    </PageGuard>
  );
}
