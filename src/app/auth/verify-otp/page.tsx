"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVerifyOtpMutation, useForgetPasswordMutation } from "@/api/authApi";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [forgotPassword] = useForgetPasswordMutation();
  const router = useRouter();

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("forgotPasswordEmail");
    const storedTenant = sessionStorage.getItem("forgotPasswordTenant");

    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // No email found, redirect to forgot-password
      router.push("/auth/forgot-password");

      return;
    }

    // Store tenant for later use in reset password
    if (storedTenant) {
      sessionStorage.setItem("forgotPasswordTenant", storedTenant);
    }

    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const digits = paste.replace(/\D/g, "").slice(0, 4).split("");
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 4) newOtp[i] = digit;
    });
    setOtp(newOtp);
    digits.forEach((digit, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i]!.value = digit;
      }
    });
    if (digits.length === 4) {
      inputsRef.current[3]?.focus();
    }
  };

  const getTenant = () => window.location.hostname.split(".")[0];
  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const otpCode = otp.join("");
    const tenant = getTenant();

    try {
      const result = await verifyOtp({
        email,
        otp: otpCode,
        tenant: tenant || undefined,
      }).unwrap();

      // OTP verified successfully, redirect to create-password
      sessionStorage.setItem("otpVerified", "true");
      router.push("/auth/create-password");
    } catch (err) {
      const error = err as { data?: { detail?: string; message?: string } };
      setError(
        error?.data?.detail ||
          error?.data?.message ||
          "Invalid verification code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);

    const tenant = getTenant();
    try {
      await forgotPassword({
        email,
        tenant: tenant || undefined,
      }).unwrap();
      alert("OTP has been resent to your email");
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:px-20">
          <div className="max-w-md w-full text-center">
            <div className="rounded-md border border-green-100 bg-green-50 p-4 text-sm text-green-800">
              Email verified successfully! You can now proceed to create a new
              password.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:px-20">
        <div className="max-w-110 w-full flex flex-col justify-center items-center">
          <div className="w-full mb-4">
            <Link
              href="/auth/forgot-password"
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Forgot Password
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Verify your email
          </h1>
          <p className="text-base text-gray-600 mb-8 text-center">
            {"We've"} sent a verification code to{" "}
            <span className="font-medium text-gray-800">{email}</span>. Enter
            the code below to verify your account.
          </p>

          <div className="flex justify-center gap-2 md:gap-3 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className={cn(
                  "w-16 h-16 text-2xl md:w-19 md:h-19 md:text-[30px] lg:w-19.5 lg:h-19.5 lg:text-[32px] font-normal text-center border-2 border-gray-300 rounded-lg bg-white focus:border-[#4F86F7] focus:ring-2 focus:ring-[rgba(79,134,247,0.1)] outline-none transition-all",
                  error &&
                    "border-red-500 focus:border-red-500 focus:ring-red-100",
                )}
                aria-label={`OTP digit ${index + 1} of 4`}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={otp.some((d) => !d) || loading}
            className={cn(
              "w-full max-w-100 mx-auto h-12 bg-[#4F86F7] text-white font-medium rounded-lg hover:bg-[#3B72E6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg cursor-pointer",
            )}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <p className="mt-6 text-sm text-gray-600 text-center">
            {"Didn't"} receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[#4F86F7] hover:underline disabled:text-gray-400 cursor-pointer"
            >
              {resendLoading ? "Sending..." : "Resend"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
};

export default VerifyOTPPage;
