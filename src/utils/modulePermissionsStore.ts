"use client";

export interface ModulePermissions {
  requester?: boolean;
  reviewer?: boolean;
  approver?: boolean;
  processor?: boolean;
  payer?: boolean;
  manager?: boolean;
  administrator?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserPermissions {
  projectRequest: ModulePermissions;
  projectCosting: ModulePermissions;
  invoice: ModulePermissions;
  inventory: ModulePermissions;
  settings: ModulePermissions;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  permissions: UserPermissions;
  isArchived: boolean;
  createdAt: string;
}

export const MODULE_PERMISSIONS_MAPPING = {
  projectRequest: {
    label: "Project Request Module",
    allowed: ["requester", "reviewer", "approver", "manager", "administrator"],
  },
  projectCosting: {
    label: "Project Costing Module",
    allowed: ["reviewer", "approver", "manager", "administrator"],
  },
  invoice: {
    label: "Invoice Module",
    allowed: ["reviewer", "approver", "processor", "payer", "administrator"],
  },
  inventory: {
    label: "Inventory Module",
    allowed: ["requester", "reviewer", "approver", "manager", "administrator"],
  },
  settings: {
    label: "Settings",
    allowed: ["administrator"],
  },
};

export const ALL_PERMISSION_TYPES = [
  { key: "requester", label: "Requester" },
  { key: "reviewer", label: "Reviewer" },
  { key: "approver", label: "Approver" },
  { key: "processor", label: "Processor" },
  { key: "payer", label: "Payer" },
  { key: "manager", label: "Manager" },
  { key: "administrator", label: "Administrator" },
];

export const createEmptyPermissions = (): UserPermissions => ({
  projectRequest: {},
  projectCosting: {},
  invoice: {},
  inventory: {},
  settings: {},
});

export const MODULE_KEY_MAP: Record<keyof UserPermissions, string> = {
  projectRequest: "project_request",
  projectCosting: "project_costing",
  invoice: "invoice",
  inventory: "inventory",
  settings: "settings",
};

export const REVERSE_MODULE_KEY_MAP: Record<string, keyof UserPermissions> = {
  project_request: "projectRequest",
  project_costing: "projectCosting",
  invoice: "invoice",
  inventory: "inventory",
  settings: "settings",
};

export interface PermissionTemplateItem {
  module: string;
  permission_types: Array<{
    permission_type: string;
    is_selected: boolean;
  }>;
}

export function convertPermissionsToApiItems(
  permissions: UserPermissions,
): PermissionTemplateItem[] {
  const items: PermissionTemplateItem[] = [];

  for (const [moduleKey, modulePerms] of Object.entries(permissions)) {
    const backendKey = MODULE_KEY_MAP[moduleKey as keyof UserPermissions];
    if (!backendKey) continue;

    const permissionTypes = ALL_PERMISSION_TYPES.map((type) => ({
      permission_type: type.key,
      is_selected: !!modulePerms[type.key],
    }));

    items.push({
      module: backendKey,
      permission_types: permissionTypes,
    });
  }

  return items;
}

export function convertPermissionsToApiFormat(
  permissions: UserPermissions,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const [moduleKey, modulePerms] of Object.entries(permissions)) {
    const backendKey = MODULE_KEY_MAP[moduleKey as keyof UserPermissions];
    if (!backendKey) continue;

    const actions: string[] = [];
    for (const [permKey, value] of Object.entries(modulePerms)) {
      if (value) {
        actions.push(permKey);
      }
    }

    if (actions.length > 0) {
      result[backendKey] = actions;
    }
  }

  return result;
}

export function convertApiItemsToPermissions(
  items: any[] | undefined,
): UserPermissions {
  const result = createEmptyPermissions();

  if (!items) return result;

  for (const item of items) {
    const frontendKey = REVERSE_MODULE_KEY_MAP[item.module];
    if (!frontendKey) continue;

    // Handle simple format: { module: "project_request", permission_type: "requester" }
    if (item.permission_type && typeof item.permission_type === "string") {
      result[frontendKey][item.permission_type] = true;
      continue;
    }

    // Handle nested PermissionTemplateItem format: { module: "...", permission_types: [...] }
    if (item.permission_types && Array.isArray(item.permission_types)) {
      for (const perm of item.permission_types) {
        if (typeof perm === "string") {
          result[frontendKey][perm] = true;
        } else if (perm && typeof perm === "object" && "permission_type" in perm) {
          result[frontendKey][perm.permission_type] = perm.is_selected;
        }
      }
    }
  }

  return result;
}

export const convertApiTemplateToFrontend = (
  apiTemplate: any,
): PermissionTemplate => {
  return {
    id: String(apiTemplate.id),
    name: apiTemplate.name,
    permissions: convertApiItemsToPermissions(apiTemplate.items),
    isArchived: !apiTemplate.is_active,
    createdAt: apiTemplate.created_at || new Date().toISOString(),
  };
};

export const convertFrontendTemplateToApi = (
  frontendTemplate: PermissionTemplate,
): { name: string; is_active: boolean; items: PermissionTemplateItem[] } => {
  return {
    name: frontendTemplate.name,
    is_active: !frontendTemplate.isArchived,
    items: convertPermissionsToApiItems(frontendTemplate.permissions),
  };
};
