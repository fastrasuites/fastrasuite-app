"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGetAccountingSettingsQuery } from "@/api/invoice/accountingSettingsApi";

export function SettingsEnforcer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: settings = [], isLoading, isSuccess } = useGetAccountingSettingsQuery();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // If the data has loaded and there are no settings, we need to enforce setup.
    if (isSuccess && settings.length === 0 && !hasRedirected) {
      // Define the paths that are allowed even without settings (Setup phase)
      const isSetupPath = 
        pathname.startsWith("/invoice/settings") || 
        pathname.startsWith("/invoice/chart-of-account");

      if (!isSetupPath) {
        setHasRedirected(true);
        // Add a small toast or message here if we had a global toast provider
        // But for now, we just redirect.
        router.push("/invoice/settings");
      }
    }
  }, [isSuccess, settings, pathname, router, hasRedirected]);

  return <>{children}</>;
}
