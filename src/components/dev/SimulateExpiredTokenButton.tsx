"use client";

/**
 * Dev-only helper to simulate an expired access token and verify
 * createTenantBaseQuery() refresh + retry.
 *
 * Usage (any client page):
 *   import { SimulateExpiredTokenButton } from "@/components/dev/SimulateExpiredTokenButton";
 *   ...
 *   <SimulateExpiredTokenButton />
 *
 * Does not render in production builds.
 */
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { setAuthData } from "@/lib/store/authSlice";

type Props = {
  /** Optional className for layout */
  className?: string;
  /** If true, also clears refresh_token (tests forced logout path) */
  clearRefreshToo?: boolean;
};

export function SimulateExpiredTokenButton({
  className = "",
  clearRefreshToo = false,
}: Props) {
  const dispatch = useDispatch();
  const access = useSelector((s: RootState) => s.auth.access_token);
  const refresh = useSelector((s: RootState) => s.auth.refresh_token);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const invalidateAccess = useCallback(() => {
    dispatch(
      setAuthData({
        access_token: "expired.fake.token",
        ...(clearRefreshToo ? { refresh_token: null } : {}),
      }),
    );
    setLastAction(
      clearRefreshToo
        ? "Cleared access + refresh (expect login redirect)"
        : "Access set to expired.fake.token — trigger any API call",
    );
  }, [dispatch, clearRefreshToo]);

  const restoreHint = useCallback(() => {
    setLastAction(
      "Reload the page to restore tokens from redux-persist (if still saved), or log in again.",
    );
  }, []);

  // Never show in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-[9999] max-w-xs rounded-lg border border-amber-300 bg-amber-50 p-3 shadow-lg ${className}`}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        Dev · Token test
      </p>
      <p className="mb-2 text-[10px] text-amber-700/80">
        Access: {access ? `${access.slice(0, 12)}…` : "null"} · Refresh:{" "}
        {refresh ? "present" : "null"}
      </p>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={invalidateAccess}
          className="rounded bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
        >
          {clearRefreshToo
            ? "Expire access + clear refresh"
            : "Simulate expired access"}
        </button>
        <button
          type="button"
          onClick={restoreHint}
          className="rounded border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          How to restore
        </button>
      </div>
      {lastAction && (
        <p className="mt-2 text-[10px] leading-snug text-amber-900">
          {lastAction}
        </p>
      )}
    </div>
  );
}
