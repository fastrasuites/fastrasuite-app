"use client";

// src/app/create-password/page.tsx
import React, { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useResetPasswordMutation } from "@/api/authApi";
import { StatusModal } from "@/components/shared/StatusModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      )
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

const CreatePasswordPage: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [isFromForgotPassword, setIsFromForgotPassword] = useState(false);

  const router = useRouter();
  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password", "");

  useEffect(() => {
    // Check if this is a forgot password flow
    const otpVerified = sessionStorage.getItem("otpVerified");
    const storedEmail = sessionStorage.getItem("forgotPasswordEmail");

    if (otpVerified && storedEmail) {
      setIsFromForgotPassword(true);
      setEmail(storedEmail);
      // Clear the session storage items
      sessionStorage.removeItem("otpVerified");
    }
  }, [router]);

  const passwordValidations = {
    minLength: watchedPassword.length >= 8,
    hasLowercase: /[a-z]/.test(watchedPassword),
    hasUppercase: /[A-Z]/.test(watchedPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword),
    hasNumber: /\d/.test(watchedPassword),
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      if (isFromForgotPassword) {
        // Call reset password API
        const result = await resetPassword({
          email,
          new_password: data.password,
          confirm_password: data.confirmPassword,
        }).unwrap();

        // Clear session storage
        sessionStorage.removeItem("forgotPasswordEmail");
        sessionStorage.removeItem("forgotPasswordTenant");

        setSubmittedId("password_reset_success");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch (err) {
      const error = err as { data?: { detail?: string; message?: string } };
      setError(
        error?.data?.detail ||
          error?.data?.message ||
          "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-white flex items-center">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:px-20">
        <div className="max-w-md w-full">
          {isFromForgotPassword ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Reset Password
              </h2>
              <p className="text-sm text-gray-600 mb-8 text-center">
                Create a new password for your account
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Create Password
              </h2>
              <p className="text-sm text-gray-600 mb-8 text-center">
                Create a strong password for your account
              </p>
            </>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            aria-describedby="form-help"
          >
            <div className="relative">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  aria-required
                  aria-label="Password"
                  className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4F86F7] focus:ring-3 focus:ring-[rgba(79,134,247,0.1)] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}

              {/* Password Validation List */}
              {watchedPassword.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    {passwordValidations.minLength ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span
                      className={
                        passwordValidations.minLength
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      Minimum of 8 characters
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordValidations.hasLowercase ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span
                      className={
                        passwordValidations.hasLowercase
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      At least one lowercase letter
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordValidations.hasUppercase ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span
                      className={
                        passwordValidations.hasUppercase
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      At least one uppercase letter
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordValidations.hasSpecial ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span
                      className={
                        passwordValidations.hasSpecial
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      At least one special character
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordValidations.hasNumber ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span
                      className={
                        passwordValidations.hasNumber
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      At least one number
                    </span>
                  </li>
                </ul>
              ) : null}
            </div>

            <div className="relative">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Confirm your password"
                  aria-required
                  aria-label="Confirm Password"
                  className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4F86F7] focus:ring-3 focus:ring-[rgba(79,134,247,0.1)] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 cursor-pointer"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.confirmPassword.message}
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
              {loading
                ? "Processing..."
                : isFromForgotPassword
                  ? "Reset Password"
                  : "Create Password"}
            </Button>

            <StatusModal
              isOpen={!!submittedId}
              onClose={() => router.push("/auth/login")}
              type="info"
              title="Password Reset Successful"
              message={
                isFromForgotPassword
                  ? "Your password has been reset successfully. You can now login with your new password."
                  : "Your password has been created successfully. You can now login."
              }
              actionText="Done"
              onAction={() => router.push("/auth/login")}
            />
          </form>
        </div>
      </div>
    </main>
  );
};

export default CreatePasswordPage;
