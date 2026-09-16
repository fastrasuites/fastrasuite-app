import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PermissionDetail } from "@/utils/normalizePermissions";

// Define types for requests and responses
export interface RegisterRequest {
  company_name: string;
  user: {
    email: string;
    password1: string;
    password2: string;
  };
}

export interface RegisterResponse {
  detail: string;
  tenant_url: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  refresh_token: string;
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    user_image: string | null;
  };
  /** The TenantUser profile ID for this user within their tenant. */
  tenant_user_id: number;
  tenant_id: number;
  tenant_schema_name: string;
  tenant_company_name: string;
  isOnboarded: boolean;
  /**
   * New backend permission format with deeply nested entitlements.
   * Empty array [] for admin/superusers (they bypass all permission checks).
   */
  user_permissions: PermissionDetail[];
  /**
   * This is likely redundant now, but kept for legacy fallback.
   */
  permission_details?: PermissionDetail[];
}

export interface ForgetPasswordRequest {
  email: string;
  tenant?: string;
}

export interface ForgetPasswordResponse {
  detail: string;
  role?: string;
  message?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  tenant?: string;
}

export interface VerifyOtpResponse {
  detail: string;
}

export interface ResetPasswordRequest {
  email: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  detail: string;
  message?: string;
}

export interface VerifyEmailRequest {
  token: string;
  tenant: string;
}

export interface VerifyEmailResponse {
  detail: string;
  message?: string;
}

export interface ResendVerificationRequest {
  tenant: string;
}

export interface ResendVerificationResponse {
  detail: string;
  message?: string;
}

const getAuthDomain = () => process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
const getAuthProtocol = () => (getAuthDomain().includes("localhost") || getAuthDomain().includes("127.0.0.1") ? "http" : "https");

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: "/register/",
        method: "POST",
        body,
      }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/login/",
        method: "POST",
        body,
      }),
    }),
    forgetPassword: builder.mutation<
      ForgetPasswordResponse,
      ForgetPasswordRequest
    >({
      query: ({ email, tenant }) => ({
        url: `${getAuthProtocol()}://${tenant}.${getAuthDomain()}/request-forgotten-password/`,
        method: "POST",
        body: { email },
      }),
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: ({ email, otp, tenant }) => ({
        url: `${getAuthProtocol()}://${tenant}.${getAuthDomain()}/verify-otp/`,
        method: "POST",
        body: { email, otp },
      }),
    }),
    resetPassword: builder.mutation<
      ResetPasswordResponse,
      ResetPasswordRequest
    >({
      query: (body) => ({
        url: `${getAuthProtocol()}://${getAuthDomain()}/reset-password/`,
        method: "POST",
        body,
      }),
    }),
    verifyEmail: builder.query<VerifyEmailResponse, VerifyEmailRequest>({
      query: ({ token, tenant }) => ({
        url: `${getAuthProtocol()}://${tenant}.${getAuthDomain()}/company/email-verify?token=${token}`,
        method: "GET",
      }),
    }),
    resendVerificationEmail: builder.mutation<
      ResendVerificationResponse,
      ResendVerificationRequest
    >({
      query: ({ tenant }) => ({
        url: `${getAuthProtocol()}://${tenant}.${getAuthDomain()}/company/resend-verification-email/`,
        method: "POST",
        body: {},
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useForgetPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useVerifyEmailQuery,
  useResendVerificationEmailMutation,
} = authApi;
