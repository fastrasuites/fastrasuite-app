import { isFulfilled, isRejectedWithValue, Middleware } from "@reduxjs/toolkit";
import {
  trackEvent,
  setAnalyticsUser,
  clearAnalyticsUser,
} from "@/lib/analytics";

interface RtkQueryMetaArg {
  type?: "query" | "mutation";
  endpointName?: string;
}

/**
 * Redux middleware that automatically tracks:
 * 1. Every RTK Query mutation (create, update, delete, approve, reject, etc.)
 * 2. Every RTK Query API error (both queries and mutations)
 * 3. Auth login / logout / admin role changes
 * 4. View mode changes (grid/list)
 */
export const analyticsMiddleware: Middleware =
  (storeApi) => (next) => (action: unknown) => {
    const result = next(action);

    if (typeof window === "undefined" || !action || typeof action !== "object") {
      return result;
    }

    const typedAction = action as {
      type?: string;
      payload?: Record<string, unknown>;
      meta?: {
        arg?: RtkQueryMetaArg;
        baseQueryMeta?: { response?: { status?: number } };
      };
      error?: { message?: string };
    };

    const actionType = typedAction.type || "";

    // 1. Track Auth state changes
    if (actionType === "auth/setAuthData") {
      const state = storeApi.getState()?.auth;
      if (state?.user?.id) {
        setAnalyticsUser({
          userId: state.user.id,
          tenantId: state.tenant_id,
          tenantCompanyName: state.tenant_company_name,
          tenantSchemaName: state.tenant_schema_name,
          isAdmin: state.isAdmin,
          isOnboarded: state.isOnboarded,
        });
        trackEvent("auth_session_set", {
          tenant_id: state.tenant_id ?? undefined,
          is_admin: Boolean(state.isAdmin),
        });
      }
      return result;
    }

    if (actionType === "auth/clearAuthData") {
      trackEvent("auth_logout");
      clearAnalyticsUser();
      return result;
    }

    // 2. Track View Mode switches (list vs grid/kanban)
    if (actionType.startsWith("viewMode/")) {
      trackEvent("view_mode_change", {
        action_name: actionType.replace("viewMode/", ""),
        mode:
          typeof typedAction.payload === "string"
            ? typedAction.payload
            : undefined,
      });
      return result;
    }

    // 3. Track RTK Query Mutations (Fulfilled)
    if (isFulfilled(action)) {
      const metaArg = typedAction.meta?.arg;
      if (metaArg?.type === "mutation" && metaArg.endpointName) {
        const apiService = actionType.split("/")[0] || "api";
        trackEvent("api_mutation_success", {
          api_service: apiService,
          endpoint_name: metaArg.endpointName,
        });
      }
      return result;
    }

    // 4. Track RTK Query API Failures (Rejected)
    if (isRejectedWithValue(action)) {
      const metaArg = typedAction.meta?.arg;
      const apiService = actionType.split("/")[0] || "api";
      const payload = typedAction.payload as
        | { status?: number | string; data?: { detail?: string; message?: string } }
        | undefined;

      const status =
        payload?.status ??
        typedAction.meta?.baseQueryMeta?.response?.status ??
        "unknown";
      const errorMessage =
        payload?.data?.detail ||
        payload?.data?.message ||
        typedAction.error?.message ||
        "API request failed";

      trackEvent("api_error", {
        api_service: apiService,
        endpoint_name: metaArg?.endpointName || "unknown",
        request_type: metaArg?.type || "unknown",
        http_status: String(status),
        error_message: String(errorMessage).slice(0, 100),
      });
    }

    return result;
  };

