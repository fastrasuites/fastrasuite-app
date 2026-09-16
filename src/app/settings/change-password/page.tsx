"use client";

import React, { useState } from "react";
import type { NextPage } from "next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useChangePasswordMutation } from "@/api/settings/tenantUserApi";
import {
  changePasswordSchema,
  ChangePasswordData,
} from "@/schemas/changePasswordSchema";
import { Eye, EyeOff } from "lucide-react";
import { extractErrorMessage } from "@/lib/utils";

const ChangePasswordPage: NextPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const tenant_user_id = useSelector(
    (state: RootState) => state.auth.tenant_user_id,
  );
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ChangePasswordData) => {
    const targetUserId = tenant_user_id || user?.id;
    if (!targetUserId) {
      setError("User information not found. Please log in again.");
      return;
    }

    setError(null);
    setSuccess(null);

    const payload = {
      user_id: Number(user?.id || targetUserId),
      old_password: data.old_password,
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    };

    try {
      const result: any = await changePassword(payload).unwrap();

      setSuccess(
        result?.detail ||
          result?.message ||
          "Your password has been changed successfully.",
      );
      reset();
    } catch (err: any) {
      setError(
        extractErrorMessage(
          err,
          "Failed to change password. Please check your current password and try again.",
        ),
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Change Your Password
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label
                  htmlFor="old_password"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="old_password"
                    type={showOldPassword ? "text" : "password"}
                    {...register("old_password")}
                    placeholder="Enter current password"
                    className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4169E1] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                    aria-label={
                      showOldPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.old_password && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.old_password.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="new_password"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    {...register("new_password")}
                    placeholder="Enter new password"
                    className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4169E1] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.new_password.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="confirm_password"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirm_password")}
                    placeholder="Confirm new password"
                    className="h-12 rounded-md border-gray-300 placeholder:text-gray-400 focus:border-[#4169E1] focus:ring-4 focus:ring-[rgba(65,105,225,0.08)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
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
                {errors.confirm_password && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-md text-lg font-medium transition-transform active:scale-[0.995] mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChangePasswordPage;
