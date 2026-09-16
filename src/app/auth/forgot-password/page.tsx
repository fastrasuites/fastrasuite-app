"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useForgetPasswordMutation } from "@/api/authApi";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusModal } from "@/components/shared/StatusModal";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormData = z.infer<typeof formSchema>;

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [forgotPassword, { isLoading }] = useForgetPasswordMutation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setAdminMessage(null);
    setLoading(true);

    try {
      const getTenant = () => window.location.hostname.split(".")[0];
      let tenant: string | undefined;
      tenant = getTenant();

      const result = await forgotPassword({
        email: data.email,
        tenant,
      }).unwrap();

      // Clear local lockout data if the user successfully requested a forgot password link/otp
      localStorage.removeItem(`auth_lockout_${data.email}`);
      localStorage.removeItem(`auth_failures_${data.email}`);

      // Check the response to determine the flow
      // Based on requirements:
      // - Admin can proceed to verify-otp page
      // - Employee gets forwarded to admin message

      if (result.role && result.role.toLowerCase() !== "admin") {
        // Employee - show message that request was forwarded to admin
        setUserRole(result.role);
        setAdminMessage(
          "Your request for a password reset has been forwarded to your administrator. Your admin will soon send a new password to your email.",
        );
        setSuccess(true);
      } else {
        // Admin - proceed to verify OTP
        // Store email in session storage for verify-otp page
        sessionStorage.setItem("forgotPasswordEmail", data.email);
        if (tenant) {
          sessionStorage.setItem("forgotPasswordTenant", tenant);
        }
        setSuccess(true);
        // Redirect to verify-otp page
        router.push("/auth/verify-otp");
      }
    } catch (err) {
      const error = err as { data?: { detail?: string; message?: string } };
      setError(
        error?.data?.detail ||
          error?.data?.message ||
          "Failed to process request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <main className="min-h-screen bg-white flex items-center">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:px-20">
        <div className="max-w-md w-full">
          <div className="mb-6">
            <Link
              href="/auth/login"
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4 cursor-pointer"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Login
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Forgot Password
          </h2>
          <p className="text-sm text-gray-600 mb-8 text-center">
            Enter your email for the verification process.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            aria-describedby="form-help"
          >
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                aria-required
                aria-label="Email"
                className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4F86F7] focus:ring-3 focus:ring-[rgba(79,134,247,0.1)]"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant={"default"}
              className={cn(
                "w-full py-3 rounded-md text-base font-medium transition-all duration-200 mt-6 cursor-pointer",
                !isValid || loading
                  ? "bg-gray-300 cursor-not-allowed opacity-60"
                  : "bg-[#4F86F7] hover:bg-[#3B72E6] text-white shadow-sm hover:shadow-md",
              )}
              disabled={!isValid || loading}
              aria-disabled={!isValid || loading}
            >
              {loading ? "Processing..." : "Continue"}
            </Button>

            <div className="text-center mt-4">
              <Link
                href="/auth/login"
                className="text-sky-600 hover:underline text-sm cursor-pointer"
              >
                Remember your password? Login
              </Link>
            </div>
          </form>

          <StatusModal
            isOpen={!!adminMessage}
            onClose={() => router.push("/auth/login")}
            type="info"
            title={`Request Submitted - ${userRole}`}
            message={adminMessage || ""}
            actionText="Done"
            onAction={() => router.push("/auth/login")}
          />
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
