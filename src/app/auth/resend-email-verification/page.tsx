"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useResendVerificationEmailMutation } from "@/api/authApi";
import { Loader2, Send, MailCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ResendVerificationContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tenant = searchParams.get("tenant");

  const [resendEmail, { isLoading, isSuccess, isError, error }] =
    useResendVerificationEmailMutation();

  // Redirect if missing tenant
  useEffect(() => {
    if (!tenant) {
      router.push("/auth/login");
    }
  }, [tenant, router]);

  const handleResend = async () => {
    if (!tenant) return;
    try {
      await resendEmail({ tenant }).unwrap();
    } catch (err) {
      // Error handled by isError/error state
      console.error("Failed to resend verification email:", err);
    }
  };

  if (!tenant) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6">
      <Card className="w-full shadow-lg border-gray-100">
        <CardHeader className="text-center pb-2">
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We need to verify your email address before you can access your
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>
              Your previous verification link may have expired or was invalid.
              Please request a new one below.
            </p>
          </div>

          {isSuccess && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Email Sent!</AlertTitle>
              <AlertDescription>
                A new verification email has been sent. Please check your inbox.
              </AlertDescription>
            </Alert>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {(error as any)?.data?.detail ||
                  "Failed to resend verification email. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full mt-2 cursor-pointer"
            onClick={handleResend}
            disabled={isLoading || isSuccess} // Disable if loading or already sent success (prevent spam)
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-sm text-gray-500 cursor-pointer"
            onClick={() => router.push("/auth/login")}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ResendVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResendVerificationContent />
    </Suspense>
  );
}
