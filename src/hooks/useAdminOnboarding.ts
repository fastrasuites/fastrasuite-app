"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import { useGetInventoryProductsQuery } from "@/api/inventory/productsApi";
import { useGetVendorsQuery } from "@/api/invoice/vendorsApi";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";

const STORAGE_DISMISSED_KEY = "fastra_admin_onboarding_dismissed";
const STORAGE_MINIMIZED_KEY = "fastra_admin_onboarding_minimized";

const emptySubscribe = () => () => {};

export interface OnboardingStep {
  id: "location" | "product" | "vendor" | "project";
  title: string;
  description: string;
  isCompleted: boolean;
  href: string;
  actionLabel: string;
}

const extractEntityList = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.projects)) return data.projects;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data?.projects)) return data.data.projects;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return [];
};

const getEntityCount = (data: any): number => {
  if (!data) return 0;
  const list = extractEntityList(data);
  if (list.length > 0) return list.length;
  if (typeof data.count === "number") return data.count;
  if (typeof data?.data?.count === "number") return data.data.count;
  if (typeof data?.total === "number") return data.total;
  return 0;
};

export function useAdminOnboarding() {
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_MINIMIZED_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Redux auth state
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.access_token);
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const companyName = useSelector(
    (state: RootState) => state.auth.tenant_company_name
  );

  // Listen for storage changes in case dismissed in another tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_DISMISSED_KEY) {
        setIsDismissed(e.newValue === "true");
      }
      if (e.key === STORAGE_MINIMIZED_KEY) {
        setIsMinimized(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Live entity queries — only executed if user is an admin and logged in
  const queryEnabled = Boolean(isAdmin && token && !isDismissed);

  const { data: locationsData, isLoading: loadingLocations, error: locationsError } = useGetLocationsQuery(
    {},
    { skip: !queryEnabled, refetchOnMountOrArgChange: true }
  );

  const { data: productsData, isLoading: loadingProducts, error: productsError } = useGetInventoryProductsQuery(
    {},
    { skip: !queryEnabled, refetchOnMountOrArgChange: true }
  );

  const { data: vendorsData, isLoading: loadingVendors, error: vendorsError } = useGetVendorsQuery(
    {},
    { skip: !queryEnabled, refetchOnMountOrArgChange: true }
  );

  const { data: projectsData, isLoading: loadingProjects, error: projectsError } = useGetProjectCostingProjectsQuery(
    {},
    { skip: !queryEnabled, refetchOnMountOrArgChange: true }
  );

  // Diagnostic error logger
  useEffect(() => {
    if (projectsError) {
      console.warn("AdminOnboarding: Error querying Project Costing projects:", projectsError);
    }
    if (locationsError) {
      console.warn("AdminOnboarding: Error querying Locations:", locationsError);
    }
    if (productsError) {
      console.warn("AdminOnboarding: Error querying Products:", productsError);
    }
    if (vendorsError) {
      console.warn("AdminOnboarding: Error querying Vendors:", vendorsError);
    }
  }, [projectsError, locationsError, productsError, vendorsError]);

  // Location check: Must be an INTERNAL warehouse/site location (not system partner locations) and not hidden/inactive
  const hasLocation = useMemo(() => {
    const list = extractEntityList(locationsData);

    const activeInternalLocations = list.filter(
      (l: any) =>
        l.location_type === "internal" &&
        !l.is_hidden &&
        l.is_active !== false &&
        String(l.status || "").toUpperCase() !== "INACTIVE"
    );

    return activeInternalLocations.length > 0;
  }, [locationsData]);

  // Product check: Must have at least one active product catalog item
  const hasProduct = useMemo(() => {
    const list = extractEntityList(productsData);

    const activeProducts = list.filter(
      (p: any) =>
        !p.is_hidden &&
        p.is_active !== false &&
        String(p.status || "").toUpperCase() !== "INACTIVE"
    );

    return activeProducts.length > 0;
  }, [productsData]);

  // Vendor check: Must have at least one active vendor/supplier
  const hasVendor = useMemo(() => {
    const list = extractEntityList(vendorsData);

    const activeVendors = list.filter(
      (v: any) =>
        !v.is_hidden &&
        v.is_active !== false &&
        String(v.status || "").toUpperCase() !== "INACTIVE"
    );

    return activeVendors.length > 0;
  }, [vendorsData]);

  // Project check: Must have at least one project costing budget
  const hasProject = useMemo(
    () => getEntityCount(projectsData) > 0,
    [projectsData]
  );

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: "location",
        title: "Set up your first active Site or Warehouse Location",
        description:
          "An active, visible warehouse or site is required to receive goods, monitor stock on hand, and track site consumption.",
        isCompleted: hasLocation,
        href: "/inventory/configuration/locations",
        actionLabel: "+ Add Location",
      },
      {
        id: "product",
        title: "Add items to your Product Catalog",
        description:
          "Required for site material requisitions, purchase order lines, and inventory.",
        isCompleted: hasProduct,
        href: "/inventory/configuration/products",
        actionLabel: "+ Add Product",
      },
      {
        id: "vendor",
        title: "Register an approved Vendor / Supplier",
        description:
          "Required to issue Purchase Orders, convert field requests, and process vendor bills.",
        isCompleted: hasVendor,
        href: "/invoice/settings?tab=vendor",
        actionLabel: "+ Add Vendor",
      },
      {
        id: "project",
        title: "Create your first Project Costing budget",
        description:
          "Required to link field requisitions to active project WBS activities and budgets.",
        isCompleted: hasProject,
        href: "/project-costing/new",
        actionLabel: "+ Create Project",
      },
    ],
    [hasLocation, hasProduct, hasVendor, hasProject]
  );

  const completedCount = useMemo(
    () => steps.filter((step) => step.isCompleted).length,
    [steps]
  );
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isAllCompleted = completedCount === totalCount;
  const isLoading =
    loadingLocations || loadingProducts || loadingVendors || loadingProjects;

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, "true");
    } catch {}
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_MINIMIZED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setIsDismissed(false);
    setIsMinimized(false);
    try {
      localStorage.removeItem(STORAGE_DISMISSED_KEY);
      localStorage.removeItem(STORAGE_MINIMIZED_KEY);
    } catch {}
  }, []);

  return {
    hasMounted,
    isAdmin: Boolean(isAdmin),
    isDismissed,
    isMinimized,
    companyName: companyName || user?.username || "Admin",
    steps,
    completedCount,
    totalCount,
    progressPercent,
    isAllCompleted,
    isLoading,
    dismiss,
    toggleMinimize,
    reset,
  };
}
