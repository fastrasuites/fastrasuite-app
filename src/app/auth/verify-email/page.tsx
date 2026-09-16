"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyEmailQuery } from "@/api/authApi";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const tenant = searchParams.get("tenant");

  const [countdown, setCountdown] = useState<number | null>(null);

  // Redirect if missing params
  useEffect(() => {
    if (!token || !tenant) {
      router.push("/auth/login");
    }
  }, [token, tenant, router]);

  // API Call - skip if params are missing
  const { data, error, isLoading, isSuccess, isError } = useVerifyEmailQuery(
    { token: token!, tenant: tenant! },
    { skip: !token || !tenant },
  );

  // Handle Success
  useEffect(() => {
    if (isSuccess) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            router.push("/auth/login");
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess, router]);

  // Handle Error
  useEffect(() => {
    if (isError && error && tenant) {
      // Type assertion for error structure
      const apiError = error as { status?: number; data?: { detail?: string } };
      const detail = apiError.data?.detail?.toLowerCase() || "";

      if (detail.includes("already verified")) {
        // Case 3: Already Verified -> Login
        // We'll show a message briefly or redirect?
        // Requirement says: Redirect to /login
        // Let's verify if we should show message first.
        // Requirement: "Redirect to /login".
        // I'll add a small delay so they see "Already Verified" or just redirect.
        // Requirement says "Redirect to /login" under Error Handling.
        // But for Success it says "Start 3-second countdown".
        // I will assume immediate redirect for errors unless it's a "Resend" case which is a different page.
        // Actually, if I redirect immediately, the user might be confused.
        // But I will follow instructions: "Redirect to /login".
        const timer = setTimeout(() => router.push("/auth/login"), 2000);
        return () => clearTimeout(timer);
      } else {
        // Case 1 & 2: Token Expired or Invalid -> Redirect to Resend
        // Also assuming default behavior for other errors is to redirect to resend as fallback
        // or show error?
        // Requirement: "Handle errors explicitly... Case 1... Case 2... "
        // "Backend returning unexpected response" -> Edge case.
        // For known token issues, redirect to resend.
        const timer = setTimeout(() => {
          router.push(`/auth/resend-email-verification?tenant=${tenant}`);
        }, 2000); // 2 second delay to show the error state
        return () => clearTimeout(timer);
      }
    }
  }, [isError, error, tenant, router]);

  if (!token || !tenant) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6">
      <Card className="w-full shadow-lg border-gray-100">
        <CardHeader className="text-center pb-2">
          {isLoading && <CardTitle>Verifying Email</CardTitle>}
          {isSuccess && (
            <CardTitle className="text-green-600">Verified!</CardTitle>
          )}
          {isError && (
            <CardTitle className="text-red-600">Verification Failed</CardTitle>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center space-y-4 pt-4">
          {isLoading && (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-gray-500">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {isSuccess && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium text-gray-900">
                Your email has been successfully verified.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login in {countdown} seconds...
              </p>
              <Button
                className="w-full mt-4 cursor-pointer"
                onClick={() => router.push("/auth/login")}
              >
                Go to Login Now
              </Button>
            </>
          )}

          {isError && (
            <>
              {error &&
              (error as any).data?.detail
                ?.toLowerCase()
                .includes("already verified") ? (
                <CheckCircle2 className="h-16 w-16 text-blue-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}

              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {(error as any)?.data?.detail ||
                    "An unexpected error occurred."}
                </p>
                <p className="text-sm text-gray-500">Redirecting...</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
