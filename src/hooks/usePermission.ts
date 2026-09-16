import { useCallback } from "react";
import { usePermissionContext } from "../contexts/PermissionContext";
import { CanParamsV2, PermissionAction } from "../types/permissions";

const LEGACY_ACTION_TO_ENTITLEMENT_PREFIX: Record<string, string> = {
  view: "view",
  create: "create",
  edit: "edit",
  delete: "delete",
  approve: "approve",
  reject: "reject",
};

function matchesSubmodule(entitlementStr: string, moduleStr: string): boolean {
  const normEnt = entitlementStr.toLowerCase().replace(/[-_]/g, "");
  const normMod = moduleStr.toLowerCase().replace(/[-_]/g, "");

  if (normEnt.includes(normMod) || normMod.includes(normEnt)) {
    return true;
  }

  // Handle plural/singular variations (e.g. unitsofmeasure vs unitofmeasure, products vs product)
  const stripPlurals = (s: string) =>
    s.replace(/ies\b/g, "y").replace(/s\b/g, "").replace(/s(?=[a-z])/g, "");
  const stemEnt = stripPlurals(normEnt);
  const stemMod = stripPlurals(normMod);

  if (stemEnt.includes(stemMod) || stemMod.includes(stemEnt)) {
    return true;
  }

  // Handle specific aliases
  if (normMod.includes("delivery") && normMod.includes("return")) {
    return (
      normEnt.includes("deliveryreturn") ||
      normEnt.includes("supplierreturn") ||
      normEnt.includes("returnincomingproduct")
    );
  }
  if (normMod.includes("stockmove") || normMod.includes("ledger")) {
    return normEnt.includes("stockmove") || normEnt.includes("inventoryledger");
  }
  if (normMod.includes("stockonhand") || normMod.includes("inventory")) {
    return normEnt.includes("stockonhand") || normEnt.includes("inventory");
  }

  return false;
}

export function usePermission() {
  const { isAdmin, permissions, isReady } = usePermissionContext();

  const can = useCallback(
    ({ application, module, action, entitlement }: CanParamsV2): boolean => {
      if (isAdmin) {
        return true;
      }

      // New API: direct module/application + entitlement check
      if (entitlement) {
        // Resolve target permissions from module, or fallback to application if module is empty or not in permissions
        const targetPerms =
          (module && permissions[module]) ||
          (application && permissions[application]);

        if (targetPerms) {
          const hasDirect = targetPerms.has(entitlement as PermissionAction);
          if (hasDirect) {
            return true;
          }

          // Administrator / Admin / Manager role has access to all actions in this module
          if (
            targetPerms.has("administrator" as PermissionAction) ||
            targetPerms.has("admin" as PermissionAction) ||
            targetPerms.has("manager" as PermissionAction)
          ) {
            return true;
          }

          // Fallback: If user has generic "view" entitlement, and the check is for a view entitlement
          if (entitlement.startsWith("view") && targetPerms.has("view" as PermissionAction)) {
            return true;
          }

          // Fallback: If user has generic "create" or "add" entitlement, and the check is for an add/create entitlement
          if (
            (entitlement.startsWith("add") || entitlement.startsWith("create")) &&
            (targetPerms.has("create" as PermissionAction) || targetPerms.has("add" as PermissionAction))
          ) {
            return true;
          }

          // Fallback: If user has generic "edit" or "change" entitlement, and the check is for a change/edit entitlement
          if (
            (entitlement.startsWith("change") || entitlement.startsWith("edit")) &&
            (targetPerms.has("edit" as PermissionAction) || targetPerms.has("change" as PermissionAction))
          ) {
            return true;
          }

          // Fallback: If user has generic "delete" entitlement, and the check is for a delete entitlement
          if (entitlement.startsWith("delete") && targetPerms.has("delete" as PermissionAction)) {
            return true;
          }
        }

        // If module was specified but targetPerms on module failed, also check application key (e.g. module="adjustment", application="inventory")
        if (module && application && permissions[application] && targetPerms !== permissions[application]) {
          const appPerms = permissions[application];
          if (
            appPerms.has(entitlement as PermissionAction) ||
            appPerms.has("administrator" as PermissionAction) ||
            appPerms.has("admin" as PermissionAction) ||
            appPerms.has("manager" as PermissionAction)
          ) {
            return true;
          }
        }

        return false;
      }

      // Legacy API: application:module + action check
      if (application && module && action !== undefined) {
        // First try new format: module as direct key
        const newFormatActions = permissions[module];
        if (newFormatActions && newFormatActions.size > 0) {
          // Map legacy action to entitlement prefix for new format
          const prefix = LEGACY_ACTION_TO_ENTITLEMENT_PREFIX[action] ?? action;
          return Array.from(newFormatActions).some((ent) =>
            ent.startsWith(prefix) || ent === action
          );
        }

        // Check if top-level application exists as a direct key (e.g. permissions["inventory"])
        const appActions = permissions[application];
        if (appActions && appActions.size > 0) {
          // Administrator / Admin / Manager role has access to all actions in this application
          if (
            appActions.has("administrator" as PermissionAction) ||
            appActions.has("admin" as PermissionAction) ||
            appActions.has("manager" as PermissionAction)
          ) {
            return true;
          }

          // Check for sub-module specific entitlements inside appActions
          const prefix = LEGACY_ACTION_TO_ENTITLEMENT_PREFIX[action] ?? action;
          const hasMatchingEntitlement = Array.from(appActions).some((ent) => {
            const entStr = ent as string;
            const matchesAction =
              entStr.startsWith(prefix) ||
              entStr.startsWith(action) ||
              (action === "create" && entStr.startsWith("add")) ||
              (action === "edit" && entStr.startsWith("change"));

            return matchesAction && matchesSubmodule(entStr, module);
          });

          if (hasMatchingEntitlement) {
            return true;
          }

          // Fallback: Check if application directly contains the action
          if (appActions.has(action)) {
            return true;
          }
        }

        // Fall back to old format: application:module as key
        const legacyKey = `${application}:${module}`;
        const legacyActions = permissions[legacyKey];
        if (legacyActions) {
          return legacyActions.has(action);
        }

        // Final fallback: check if any key ends with :module
        const moduleKey = Object.keys(permissions).find((k) =>
          k.endsWith(`:${module}`)
        );
        if (moduleKey) {
          return true;
        }
        return false;
      }

      return false;
    },
    [isAdmin, permissions]
  );

  return {
    can,
    isAdmin,
    isLoading: !isReady,
  };
}
