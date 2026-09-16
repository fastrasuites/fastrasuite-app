"use client";

// src/app/register/page.tsx
import React, { useState } from "react";
import type { NextPage } from "next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRegisterMutation } from "@/api/authApi";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { StatusModal } from "@/components/shared/StatusModal";
import { useRouter } from "next/navigation";

const companyFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyEmail: z.string().email("Please enter a valid email address"),
});

const passwordFormSchema = z
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

type CompanyFormData = z.infer<typeof companyFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

// -- Mock submit handler (simulates network)
const fakeSubmit = (payload: CompanyFormData & PasswordFormData) =>
  new Promise<{ ok: boolean; id?: string }>((resolve) =>
    setTimeout(() => resolve({ ok: true, id: "company_abc_123" }), 900),
  );

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    mode: "onChange",
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onChange",
  });

  const watchedPassword = passwordForm.watch("password", "");

  const passwordValidations = {
    minLength: watchedPassword.length >= 8,
    hasLowercase: /[a-z]/.test(watchedPassword),
    hasUppercase: /[A-Z]/.test(watchedPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword),
    hasNumber: /\d/.test(watchedPassword),
  };

  const onCompanySubmit = async (data: CompanyFormData) => {
    setShowPasswordSection(true);
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setError(null);
    try {
      const companyData = companyForm.getValues();
      const registerData = {
        company_name: companyData.companyName,
        user: {
          email: companyData.companyEmail,
          password1: data.password,
          password2: data.confirmPassword,
        },
      };

      const result = await register(registerData).unwrap();
      setSubmittedId(result.tenant_url || "success");
    } catch (err) {
      console.error(err);
      const error = err as {
        data?: { email?: string[]; company_name?: string[]; detail?: string };
      };
      if (error?.data?.company_name && Array.isArray(error.data.company_name)) {
        setError(error.data.company_name[0]);
      } else if (error?.data?.email && Array.isArray(error.data.email)) {
        setError(error.data.email[0]);
      } else if (error?.data?.detail) {
        setError(error.data.detail);
      } else {
        setError("Failed to register. Please try again.");
      }
    }
  };
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:px-20">
        <div className="max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            Register
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Enter your details to register
          </p>

          <div className="relative min-h-[480px] flex items-center justify-center">
            {/* Company Information Section */}
            <AnimatePresence mode="wait">
              {!showPasswordSection && (
                <motion.form
                  key="company-form"
                  initial={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  onSubmit={companyForm.handleSubmit(onCompanySubmit)}
                  className="absolute inset-0 space-y-5"
                  aria-describedby="form-help"
                >
                  <div>
                    <Label
                      htmlFor="companyName"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Company name
                    </Label>
                    <Input
                      id="companyName"
                      {...companyForm.register("companyName")}
                      placeholder="Enter your company name"
                      aria-required
                      aria-label="Company name"
                      className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#3B7CED] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)]"
                    />
                    {companyForm.formState.errors.companyName && (
                      <p className="text-sm text-red-600 mt-1">
                        {companyForm.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="companyEmail"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Company email
                    </Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      {...companyForm.register("companyEmail")}
                      placeholder="Enter your company email"
                      aria-required
                      aria-label="Company email"
                      className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#3B7CED] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)]"
                    />
                    {companyForm.formState.errors.companyEmail && (
                      <p className="text-sm text-red-600 mt-1">
                        {companyForm.formState.errors.companyEmail.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant={"default"}
                    className={cn(
                      "w-full py-6 rounded-md text-lg font-medium transition-transform active:scale-[0.995] mt-4 cursor-pointer",
                      !companyForm.formState.isValid
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:shadow-md cursor-pointer",
                    )}
                    disabled={!companyForm.formState.isValid}
                    aria-disabled={!companyForm.formState.isValid}
                  >
                    Continue
                  </Button>

                  {!showPasswordSection && (
                    <Link
                      href="/auth/login"
                      className="text-center mt-4 w-full block cursor-pointer"
                    >
                      <p className="text-[#3B7CED] font-semibold hover:underline text-sm cursor-pointer">
                        Already have an account?
                      </p>
                    </Link>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

            {/* Password Section */}
            <AnimatePresence mode="wait">
              {showPasswordSection && (
                <motion.form
                  key="password-form"
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="absolute inset-0 space-y-5"
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
                        {...passwordForm.register("password")}
                        placeholder="Enter your password"
                        aria-required
                        aria-label="Password"
                        className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#3B7CED] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 cursor-pointer"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.password.message}
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
                        {...passwordForm.register("confirmPassword")}
                        placeholder="Confirm your password"
                        aria-required
                        aria-label="Confirm Password"
                        className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#3B7CED] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 cursor-pointer"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
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
                      "bg-[#3B7CED] hover:bg-blue-600 text-white w-full py-6 rounded-md text-lg font-medium transition-transform active:scale-[0.995] mt-4",
                      !passwordForm.formState.isValid || isRegistering
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:shadow-md cursor-pointer",
                    )}
                    disabled={!passwordForm.formState.isValid || isRegistering}
                    aria-disabled={!passwordForm.formState.isValid || isRegistering}
                  >
                    {isRegistering ? "Creating Account..." : "Create Account"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(false)}
                    className="w-full text-[#3B7CED] font-semibold hover:underline text-sm mt-2 cursor-pointer"
                  >
                    Back to Company Info
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <StatusModal
              isOpen={!!submittedId}
              onClose={() => router.push("/auth/login")}
              type="info"
              title="Confirmation Link Sent"
              message="We sent a confirmation link to your email, click on that link to proceed."
              actionText="Done"
              onAction={() => router.push("/auth/login")}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
