"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useGetSubscriptionStatusQuery } from "@/api/settings/subscriptionApi";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
import { useGetUsersQuery } from "@/api/settings/usersApi";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";

export type PlanTier = "starter" | "professional" | "enterprise" | "trial";

export interface PlanLimits {
  tier: PlanTier;
  planName: string;
  status: string;
  isAccessGranted: boolean;
  isLoading: boolean;

  // Projects
  currentProjects: number;
  maxProjects: number;
  canCreateProject: boolean;

  // Users
  currentUsers: number;
  maxUsers: number;
  canAddUser: boolean;

  // Warehouses
  currentWarehouses: number;
  maxWarehouses: number;
  canAddWarehouse: boolean;
  isMultiLocationAllowed: boolean;

  // Tier-gated feature flags
  canManageMultiCompany: boolean;
  canCreateCustomRoles: boolean;
  canUseAdvancedApproval: boolean;
  canUseCostLedgerForecasting: boolean;
  canUseAdvancedReports: boolean;

  // Access restriction helpers for downgraded expired subscriptions
  isProjectAccessible: (projectId: number | string) => boolean;
  isUserAccessible: (userId: number | string) => boolean;
  restrictedProjectsCount: number;
  restrictedUsersCount: number;

  // Helpers
  isModuleAllowed: (moduleName: string) => boolean;
}

export function useSubscriptionLimits(): PlanLimits {
  const auth = useSelector((state: RootState) => state.auth);
  const isAuthenticated = Boolean(auth?.access_token || auth?.user);

  // Subscription status
  const { data: subStatus, isLoading: isSubLoading } =
    useGetSubscriptionStatusQuery(undefined, {
      skip: !isAuthenticated,
    });

  // Projects query
  const { data: projects = [], isLoading: isProjectsLoading } =
    useGetProjectCostingProjectsQuery({}, { skip: !isAuthenticated });

  // Users query
  const { data: users = [], isLoading: isUsersLoading } = useGetUsersQuery(
    undefined,
    { skip: !isAuthenticated }
  );

  // Locations / Warehouses query
  const { data: locations = [], isLoading: isLocationsLoading } =
    useGetLocationsQuery({}, { skip: !isAuthenticated });

  const isLoading =
    isSubLoading || isProjectsLoading || isUsersLoading || isLocationsLoading;

  // Resolve tier
  const rawTier = (
    subStatus?.plan?.tier ||
    subStatus?.tier ||
    ""
  ).toLowerCase();

  const isTrial =
    subStatus?.status === "trialing" || (!rawTier && !subStatus?.plan);

  let tier: PlanTier = "starter";
  if (isTrial) {
    tier = "trial";
  } else if (rawTier === "enterprise") {
    tier = "enterprise";
  } else if (rawTier === "professional") {
    tier = "professional";
  } else {
    tier = "starter";
  }

  const planName = isTrial
    ? "Free Trial"
    : subStatus?.plan?.name ||
      (tier === "enterprise"
        ? "Enterprise"
        : tier === "professional"
        ? "Professional"
        : "Starter");

  // Max projects
  const maxProjects = useMemo(() => {
    if (
      subStatus?.plan?.max_active_projects &&
      subStatus.plan.max_active_projects > 0
    ) {
      return subStatus.plan.max_active_projects;
    }
    if (tier === "enterprise") return 9999;
    if (tier === "professional") return 15;
    return 3; // starter or trial
  }, [subStatus?.plan?.max_active_projects, tier]);

  // Current active projects count
  const currentProjects = useMemo(() => {
    if (!Array.isArray(projects)) return 0;
    return projects.filter((p) => {
      const s = (p.status || "").toUpperCase();
      return !["ARCHIVED", "COMPLETED", "REJECTED", "CANCELLED"].includes(s);
    }).length;
  }, [projects]);

  const canCreateProject = currentProjects < maxProjects;

  // Chronological accessibility for projects (oldest first up to maxProjects)
  const accessibleProjectIds = useMemo(() => {
    if (!Array.isArray(projects)) return new Set<number | string>();
    const activeProjects = projects.filter((p) => {
      const s = (p.status || "").toUpperCase();
      return !["ARCHIVED", "COMPLETED", "REJECTED", "CANCELLED"].includes(s);
    });

    const sorted = [...activeProjects].sort((a: any, b: any) => {
      const timeA = a.created_at || a.date_created ? new Date(a.created_at || a.date_created).getTime() : 0;
      const timeB = b.created_at || b.date_created ? new Date(b.created_at || b.date_created).getTime() : 0;
      if (timeA !== timeB && timeA > 0 && timeB > 0) return timeA - timeB;
      return Number(a.id || 0) - Number(b.id || 0);
    });

    const allowed = sorted.slice(0, maxProjects);
    return new Set<number | string>(allowed.map((p) => p.id));
  }, [projects, maxProjects]);

  const isProjectAccessible = (projectId: number | string) => {
    if (!Array.isArray(projects)) return true;
    if (currentProjects <= maxProjects) return true;
    return accessibleProjectIds.has(projectId);
  };

  const restrictedProjectsCount = useMemo(() => {
    if (!Array.isArray(projects)) return 0;
    return Math.max(0, currentProjects - maxProjects);
  }, [currentProjects, maxProjects, projects]);

  // Max users
  const maxUsers = useMemo(() => {
    if (
      subStatus?.plan?.max_active_users &&
      subStatus.plan.max_active_users > 0
    ) {
      return subStatus.plan.max_active_users;
    }
    if (tier === "enterprise") return 9999;
    if (tier === "professional") return 25;
    return 5; // starter or trial
  }, [subStatus?.plan?.max_active_users, tier]);

  // Current users count
  const currentUsers = useMemo(() => {
    if (!Array.isArray(users)) return 1;
    return users.length;
  }, [users]);

  const canAddUser = currentUsers < maxUsers;

  // Chronological accessibility for users (oldest first up to maxUsers)
  const accessibleUserIds = useMemo(() => {
    if (!Array.isArray(users)) return new Set<number | string>();
    const sorted = [...users].sort((a: any, b: any) => {
      const timeA = a.date_created || a.created_at ? new Date(a.date_created || a.created_at).getTime() : 0;
      const timeB = b.date_created || b.created_at ? new Date(b.date_created || b.created_at).getTime() : 0;
      if (timeA !== timeB && timeA > 0 && timeB > 0) return timeA - timeB;
      return Number(a.id || a.user_id || 0) - Number(b.id || b.user_id || 0);
    });

    const allowed = sorted.slice(0, maxUsers);
    const ids = new Set<number | string>();
    allowed.forEach((u: any) => {
      if (u.id !== undefined) ids.add(u.id);
      if (u.user_id !== undefined) ids.add(u.user_id);
    });
    return ids;
  }, [users, maxUsers]);

  const isUserAccessible = (userId: number | string) => {
    if (!Array.isArray(users)) return true;
    if (currentUsers <= maxUsers) return true;
    return accessibleUserIds.has(userId);
  };

  const restrictedUsersCount = useMemo(() => {
    if (!Array.isArray(users)) return 0;
    return Math.max(0, currentUsers - maxUsers);
  }, [currentUsers, maxUsers, users]);

  // Max warehouses / locations
  const maxWarehouses = useMemo(() => {
    if (tier === "enterprise") return 9999;
    if (tier === "professional") return 3;
    return 1; // starter or trial
  }, [tier]);

  const currentWarehouses = useMemo(() => {
    if (!Array.isArray(locations)) return 1;
    return locations.length;
  }, [locations]);

  const canAddWarehouse = currentWarehouses < maxWarehouses;
  const isMultiLocationAllowed = tier === "professional" || tier === "enterprise";

  // Tier-gated features
  const canManageMultiCompany = tier === "enterprise";
  const canCreateCustomRoles =
    tier === "professional" || tier === "enterprise";
  const canUseAdvancedApproval =
    tier === "professional" || tier === "enterprise";
  const canUseCostLedgerForecasting =
    tier === "professional" || tier === "enterprise";
  const canUseAdvancedReports =
    tier === "professional" || tier === "enterprise";

  // Module check helper
  const allowedModules = useMemo(() => {
    if (!subStatus?.allowed_modules) return [];
    if (Array.isArray(subStatus.allowed_modules)) {
      return subStatus.allowed_modules.map((m) =>
        String(m).toLowerCase().trim()
      );
    }
    if (typeof subStatus.allowed_modules === "string") {
      return subStatus.allowed_modules
        .split(",")
        .map((m) => m.toLowerCase().trim())
        .filter(Boolean);
    }
    return [];
  }, [subStatus?.allowed_modules]);

  const isModuleAllowed = (moduleName: string) => {
    if (allowedModules.length === 0) return true;
    return allowedModules.includes(moduleName.toLowerCase().trim());
  };

  return {
    tier,
    planName,
    status: subStatus?.status || "trialing",
    isAccessGranted: subStatus?.is_access_granted ?? true,
    isLoading,

    currentProjects,
    maxProjects,
    canCreateProject,

    currentUsers,
    maxUsers,
    canAddUser,

    currentWarehouses,
    maxWarehouses,
    canAddWarehouse,
    isMultiLocationAllowed,

    canManageMultiCompany,
    canCreateCustomRoles,
    canUseAdvancedApproval,
    canUseCostLedgerForecasting,
    canUseAdvancedReports,

    isProjectAccessible,
    isUserAccessible,
    restrictedProjectsCount,
    restrictedUsersCount,

    isModuleAllowed,
  };
}
