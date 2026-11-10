export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-EKJVB2XN2Z";

export const GTM_ID =
  process.env.NEXT_PUBLIC_GTM_ID || "GTM-WFNV687T";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Safely invokes `window.gtag` if available in the browser.
 */
export function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  }
}

/**
 * Resolves the top-level Fastra Suite module name from a URL pathname.
 */
export function getModuleFromPath(pathname?: string | null): string {
  if (!pathname || pathname === "/") return "dashboard";
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] || "dashboard";
}

/**
 * Sends a custom event to Google Analytics 4 and pushes to dataLayer for GTM.
 */
export function trackEvent(
  eventName: string,
  params: AnalyticsEventParams = {},
): void {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  const enrichedParams: AnalyticsEventParams = {
    page_path: pathname,
    page_location: window.location.href,
    module: getModuleFromPath(pathname),
    ...params,
  };

  gtag("event", eventName, enrichedParams);
}

/**
 * Tracks a page view in GA4 (including Next.js App Router soft navigations).
 */
export function trackPageView(url: string, title?: string): void {
  if (typeof window === "undefined") return;

  const pathname = url.split("?")[0] || "/";
  const moduleName = getModuleFromPath(pathname);

  gtag("event", "page_view", {
    page_path: url,
    page_location: window.location.href,
    page_title: title || document.title,
    module: moduleName,
    send_to: GA_MEASUREMENT_ID,
  });
}

/**
 * Associates non-PII user & tenant properties with all subsequent GA4 events.
 */
export function setAnalyticsUser(userContext: {
  userId?: number | string | null;
  tenantId?: number | string | null;
  tenantCompanyName?: string | null;
  tenantSchemaName?: string | null;
  isAdmin?: boolean | null;
  isOnboarded?: boolean | null;
}): void {
  if (typeof window === "undefined") return;

  const userIdStr =
    userContext.userId != null ? String(userContext.userId) : undefined;

  if (userIdStr) {
    gtag("config", GA_MEASUREMENT_ID, {
      user_id: userIdStr,
    });
  }

  gtag("set", "user_properties", {
    tenant_id:
      userContext.tenantId != null ? String(userContext.tenantId) : undefined,
    tenant_company: userContext.tenantCompanyName || undefined,
    tenant_schema: userContext.tenantSchemaName || undefined,
    user_role: userContext.isAdmin ? "admin" : "member",
    is_onboarded:
      userContext.isOnboarded != null
        ? String(userContext.isOnboarded)
        : undefined,
  });
}

/**
 * Clears the GA4 user_id when the user logs out.
 */
export function clearAnalyticsUser(): void {
  if (typeof window === "undefined") return;

  gtag("config", GA_MEASUREMENT_ID, {
    user_id: null,
  });
}

/**
 * Tracks runtime or API exceptions in GA4.
 */
export function trackException(
  description: string,
  fatal = false,
  extra: AnalyticsEventParams = {},
): void {
  trackEvent("exception", {
    description: description.slice(0, 150),
    fatal,
    ...extra,
  });
}

