"use client";

import React, { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLoginMutation } from "@/api/authApi";
import { useDispatch } from "react-redux";
import { setAuthData, setIsAdmin } from "@/lib/store/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof formSchema>;

function getUnlockTime(): number {
  return Date.now() + 30 * 60 * 1000;
}

const LoginPage: NextPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Lockout states
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState<number | null>(null);

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();
  
  // For redirect handling and reading session timeout reasons
  const searchParams = useSearchParams();
  const reason = searchParams?.get("reason");
  const redirectPath = searchParams?.get("redirect") || "/";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const watchEmail = useWatch({ control, name: "email" });

  // Check lockout status whenever email changes or component mounts
  useEffect(() => {
    if (!watchEmail) {
      const timer = setTimeout(() => {
        setIsLocked(false);
        setLockRemaining(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    
    const timer = setTimeout(() => {
      // We check if this email is locked
      const lockoutKey = `auth_lockout_${watchEmail}`;
      const lockoutUntilStr = localStorage.getItem(lockoutKey);
      
      if (lockoutUntilStr) {
        const lockoutUntil = parseInt(lockoutUntilStr, 10);
        const now = Date.now();
        
        if (now < lockoutUntil) {
          setIsLocked(true);
          const mins = Math.ceil((lockoutUntil - now) / 60000);
          setLockRemaining(mins);
          return;
        } else {
          // Lock expired
          localStorage.removeItem(lockoutKey);
          localStorage.removeItem(`auth_failures_${watchEmail}`);
          setIsLocked(false);
          setLockRemaining(null);
        }
      } else {
        setIsLocked(false);
        setLockRemaining(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [watchEmail]);

  // Log handler
  const logAttempt = async (email: string, outcome: string, errorDetails?: string) => {
    try {
      await fetch("/api/auth/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, outcome, errorDetails }),
      });
    } catch (e) {
      console.error("Failed to log attempt", e);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (isLocked) return;

    setError(null);
    try {
      const result = await login(data).unwrap();
      
      // On success, clear any failure records
      localStorage.removeItem(`auth_failures_${data.email}`);
      localStorage.removeItem(`auth_lockout_${data.email}`);

      // Store core auth data including new permission fields
      dispatch(
        setAuthData({
          user: result.user,
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          tenant_user_id: result.tenant_user_id,
          tenant_id: result.tenant_id,
          tenant_schema_name: result.tenant_schema_name,
          tenant_company_name: result.tenant_company_name,
          isOnboarded: result.isOnboarded,
          user_permissions: result.user_permissions ?? [],
          permission_details: result.permission_details ?? [],
          // Temporarily set isAdmin = false; will be confirmed below
          isAdmin: false,
        }),
      );

      // --- Determine admin status from username ---
      // Admin usernames always start with "admin_" (e.g. "admin_lukudev")
      const username = result.user?.username ?? "";
      const isAdminByUsername = username.startsWith("admin_");
      dispatch(setIsAdmin(isAdminByUsername));



      // Set httpOnly cookie via API route for security
      await fetch("/api/auth/set-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        }),
      });

      await logAttempt(data.email, "SUCCESS");

      setSubmittedId(result.user.username || "success");
      
      // Redirect to the originally requested page or dashboard
      router.push(redirectPath);
    } catch (err) {
      const errorData = err as { data?: { detail?: string } };
      const errDetail = errorData?.data?.detail || "Failed to login. Please try again.";
      setError(errDetail);
      
      // Handle failed attempts counter
      const failuresKey = `auth_failures_${data.email}`;
      const lockoutKey = `auth_lockout_${data.email}`;
      let failures = parseInt(localStorage.getItem(failuresKey) || "0", 10);
      failures += 1;
      
      await logAttempt(data.email, "FAILURE", errDetail);
      
      if (failures >= 5) {
        // Lock for 30 minutes
        const unlockTime = getUnlockTime();
        localStorage.setItem(lockoutKey, unlockTime.toString());
        setIsLocked(true);
        setLockRemaining(30);
      }
      
      localStorage.setItem(failuresKey, failures.toString());
    }
  };

  // If the account is locked, show the Lockout Screen
  if (isLocked) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:px-20">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <LockKeyhole className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Locked</h2>
            <p className="text-gray-600 mb-6">
              For your security, your account has been temporarily locked due to multiple failed login attempts.
              Please try again in <span className="font-semibold">{lockRemaining} minutes</span> or reset your password to unlock immediately.
            </p>
            
            <div className="space-y-4">
              <Link href="/auth/forgot-password" className="block w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-md transition-all">
                  Reset Password
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full py-6 text-lg text-gray-600 border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setIsLocked(false);
                  router.push("/auth/login"); // Refresh essentially
                }}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:px-20">
        <div className="max-w-md w-full">
          {reason === "timeout" && (
            <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Your session has expired due to inactivity. Please log in again.
            </div>
          )}
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            Login
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Enter your login details below
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            aria-describedby="form-help"
          >
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                aria-required
                aria-label="Email"
                className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4169E1] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)]"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="relative">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Password
              </Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Enter your password"
                aria-required
                aria-label="Password"
                className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4169E1] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10.5 text-gray-600 hover:text-gray-800"
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

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            {!submittedId ? (
              <>
                <Button
                  type="submit"
                  variant={"default"}
                  className={cn(
                    "bg-blue-500 hover:bg-blue-600 text-white w-full py-6 rounded-md text-lg font-medium transition-transform active:scale-[0.995] mt-4",
                    !isValid || isLoggingIn
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:shadow-md cursor-pointer",
                  )}
                  disabled={!isValid || isLoggingIn}
                  aria-disabled={!isValid || isLoggingIn}
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </Button>

                <div className="text-center mt-6">
                  <Link
                    href="/auth/register"
                    className="text-sky-600 hover:underline text-sm cursor-pointer"
                  >
                    Don&apos;t have an account?
                  </Link>
                </div>
                <div className="text-center mt-2">
                  <Link
                    href="/auth/forgot-password"
                    className="text-red-600 hover:underline text-sm cursor-pointer"
                  >
                    forgot password?
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                Login successful. Welcome back!
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
