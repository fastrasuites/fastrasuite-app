"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useGetSubscriptionStatusQuery } from "@/api/settings/subscriptionApi";
import { AlertTriangle, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const isAuthenticated = Boolean(auth?.access_token || auth?.user);

  const { data: subStatus, isLoading } = useGetSubscriptionStatusQuery(undefined, {
    skip: !isAuthenticated,
  });

  const isAuthPage =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/resend-email-verification");

  const isSettingsPage = pathname.startsWith("/settings");

  // Determine if subscription is expired
  // Note: 'trialing', 'active', and 'past_due' (grace period) grant access.
  const isExpired =
    !isAuthPage &&
    isAuthenticated &&
    !isLoading &&
    (subStatus?.status === "expired" ||
      (subStatus &&
        subStatus.is_access_granted === false &&
        subStatus.status !== "trialing" &&
        subStatus.status !== "past_due"));

  useEffect(() => {
    // If expired and user is trying to access anything outside of /settings
    if (isExpired && !isSettingsPage) {
      router.replace("/settings/billing?expired=true");
    }
  }, [isExpired, isSettingsPage, router]);

  // If on an auth page, render immediately without restrictions
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If expired and navigating outside of /settings, show lockout screen while redirecting
  if (isExpired && !isSettingsPage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 min-h-[80vh] text-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-5 text-red-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Expired</h2>
          <p className="text-xs text-gray-600 leading-relaxed mb-6">
            Your FastraSuite subscription has expired. Access to operational modules (Invoicing, Inventory, Projects, Purchase) is currently locked. Only the Settings module is accessible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/settings/billing" className="flex-1">
              <Button className="w-full bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs font-semibold h-10 shadow-xs flex items-center justify-center gap-1.5">
                Renew Subscription <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/settings/company/1" className="flex-1">
              <Button variant="outline" className="w-full border-gray-200 text-xs font-medium h-10">
                Go to Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If expired and on a /settings page, show a sticky red top banner and render settings normally
  return (
    <>
      {isExpired && (
        <div className="bg-red-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-xs sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
            <span>
              Your subscription has expired. Operational modules are locked. Only the Settings module is available.
            </span>
          </div>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1 bg-white text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-50 transition-colors ml-4 flex-shrink-0 shadow-2xs"
          >
            Renew Plan
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
