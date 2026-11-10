"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import {
  trackPageView,
  trackEvent,
  setAnalyticsUser,
  trackException,
} from "@/lib/analytics";

const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[data-slot="button"]',
  "[data-track]",
  'input[type="submit"]',
  'input[type="button"]',
].join(",");

function sanitizeText(raw: string | null | undefined, maxLen = 80): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function inferActionCategory(label: string): string {
  const lower = label.toLowerCase();
  if (/export|download|csv|excel|xlsx|pdf/.test(lower)) return "export_download";
  if (/print/.test(lower)) return "print";
  if (/approve|confirm|verify|validate/.test(lower)) return "approval";
  if (/reject|cancel|decline/.test(lower)) return "rejection_cancel";
  if (/delete|remove|trash|scrap/.test(lower)) return "delete";
  if (/create|new|add|save|submit|post|record|send/.test(lower))
    return "create_save";
  if (/edit|update|modify/.test(lower)) return "edit_update";
  if (/filter|sort|search/.test(lower)) return "filter_search";
  return "general_interaction";
}

function AnalyticsRouteAndUserTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageEnterTimeRef = useRef<number>(Date.now());
  const prevUrlRef = useRef<string | null>(null);

  const auth = useSelector((state: RootState) => state.auth);

  // Sync user and tenant context whenever auth state updates
  useEffect(() => {
    if (auth?.user?.id) {
      setAnalyticsUser({
        userId: auth.user.id,
        tenantId: auth.tenant_id,
        tenantCompanyName: auth.tenant_company_name,
        tenantSchemaName: auth.tenant_schema_name,
        isAdmin: auth.isAdmin,
        isOnboarded: auth.isOnboarded,
      });
    }
  }, [
    auth?.user?.id,
    auth?.tenant_id,
    auth?.tenant_company_name,
    auth?.tenant_schema_name,
    auth?.isAdmin,
    auth?.isOnboarded,
  ]);

  // Track every route & query parameter change + time spent on previous route
  useEffect(() => {
    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    if (prevUrlRef.current && prevUrlRef.current !== currentUrl) {
      const durationSec = Math.round(
        (Date.now() - pageEnterTimeRef.current) / 1000,
      );
      if (durationSec > 0) {
        trackEvent("page_time_spent", {
          previous_page: prevUrlRef.current,
          duration_seconds: durationSec,
        });
      }
    }

    pageEnterTimeRef.current = Date.now();
    prevUrlRef.current = currentUrl;

    trackPageView(currentUrl);
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalyticsTracker() {
  useEffect(() => {
    // 1. Global Click Tracker (Buttons, Links, Tabs, Menus, Switches, Modals)
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || typeof target.closest !== "function") return;

      const interactiveEl = target.closest(
        INTERACTIVE_SELECTOR,
      ) as HTMLElement | null;
      if (!interactiveEl) return;

      const tagName = interactiveEl.tagName.toLowerCase();
      const role = interactiveEl.getAttribute("role");
      const elementType = role || tagName;

      const label =
        sanitizeText(interactiveEl.getAttribute("data-track")) ||
        sanitizeText(interactiveEl.getAttribute("aria-label")) ||
        sanitizeText(interactiveEl.getAttribute("title")) ||
        sanitizeText(interactiveEl.innerText) ||
        sanitizeText((interactiveEl as HTMLInputElement).value) ||
        sanitizeText(interactiveEl.id) ||
        "unnamed_element";

      const actionCategory = inferActionCategory(label);
      const href =
        interactiveEl instanceof HTMLAnchorElement
          ? interactiveEl.getAttribute("href") || undefined
          : undefined;

      trackEvent("ui_click", {
        element_type: elementType,
        element_label: label,
        element_id: interactiveEl.id || undefined,
        action_category: actionCategory,
        link_url: href,
      });

      // Fire dedicated event for exports/downloads/prints for easier GA4 conversion marking
      if (actionCategory === "export_download" || actionCategory === "print") {
        trackEvent(actionCategory, {
          element_label: label,
        });
      }
    };

    // 2. Global Form Submission Tracker
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;

      const formLabel =
        sanitizeText(form.getAttribute("data-track")) ||
        sanitizeText(form.getAttribute("aria-label")) ||
        sanitizeText(form.getAttribute("name")) ||
        sanitizeText(form.id) ||
        "app_form";

      trackEvent("form_submit", {
        form_name: formLabel,
        form_id: form.id || undefined,
      });
    };

    // 3. Global Control & Search Input Change Tracker (Selects, Checkboxes, File Uploads, Search Boxes)
    const handleChange = (event: Event) => {
      const target = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (!target || !target.tagName) return;

      const tagName = target.tagName.toLowerCase();

      if (tagName === "select") {
        const selectEl = target as HTMLSelectElement;
        const selectedText =
          selectEl.options?.[selectEl.selectedIndex]?.text || selectEl.value;
        trackEvent("ui_select_change", {
          field_name:
            selectEl.name ||
            selectEl.id ||
            sanitizeText(selectEl.getAttribute("aria-label")) ||
            "select",
          selected_option: sanitizeText(selectedText, 60),
        });
        return;
      }

      if (tagName === "input") {
        const inputEl = target as HTMLInputElement;
        const inputType = (inputEl.type || "").toLowerCase();

        if (inputType === "checkbox" || inputType === "radio") {
          trackEvent("ui_toggle_change", {
            control_type: inputType,
            field_name:
              inputEl.name ||
              inputEl.id ||
              sanitizeText(inputEl.getAttribute("aria-label")) ||
              "toggle",
            checked: inputEl.checked,
          });
          return;
        }

        if (inputType === "file") {
          const files = inputEl.files;
          const fileCount = files?.length || 0;
          const firstExt =
            files?.[0]?.name?.split(".").pop()?.toLowerCase() || "unknown";
          trackEvent("file_upload_selected", {
            field_name: inputEl.name || inputEl.id || "file_input",
            file_count: fileCount,
            file_extension: firstExt,
          });
          return;
        }

        const placeholder = (inputEl.placeholder || "").toLowerCase();
        if (inputType === "search" || placeholder.includes("search")) {
          const searchTerm = sanitizeText(inputEl.value, 60);
          if (searchTerm.length >= 2) {
            trackEvent("search", {
              search_term: searchTerm,
            });
          }
        }
      }
    };

    // 4. Print & Runtime Error Listeners
    const handleBeforePrint = () => {
      trackEvent("document_print");
    };

    const handleRuntimeError = (event: ErrorEvent) => {
      trackException(
        `${event.message || "Runtime Error"} (${event.filename?.split("/").pop() || "unknown"}:${event.lineno || 0})`,
        false,
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason || "Unhandled Promise Rejection");
      trackException(reason, false);
    };

    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("submit", handleSubmit, { capture: true });
    document.addEventListener("change", handleChange, { capture: true });
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("error", handleRuntimeError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("submit", handleSubmit, { capture: true });
      document.removeEventListener("change", handleChange, { capture: true });
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("error", handleRuntimeError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return (
    <Suspense fallback={null}>
      <AnalyticsRouteAndUserTracker />
    </Suspense>
  );
}

