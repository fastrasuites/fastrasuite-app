import { PermissionAction } from "../types/permissions";

export interface NormalizedPermissions {
  isAdmin: boolean;
  permissions: Record<string, Set<PermissionAction>>;
  isReady: boolean;
}

export interface PermissionDetail {
  module: string;
  permissions: Array<{
    permission_type: string;
    entitlements: string[];
  }>;
}

export interface PermissionDetailsResponse {
  permissions: Array<{
    module: string;
    permission_type: string;
  }>;
  permission_details: PermissionDetail[];
}

/**
 * Maps Django permission codenames to frontend (application:module) keys.
 *
 * Django codename format: "<app_label>.<action>_<model_name>"
 * Frontend key format:    "<application>:<module>"
 *
 * We map the Django app_label → application and model_name → module,
 * and map Django CRUD verbs → our PermissionAction vocabulary.
 */
const DJANGO_ACTION_MAP: Record<string, PermissionAction> = {
  view: "view",
  add: "create",
  change: "edit",
  delete: "delete",
  approve: "approve",
  reject: "reject",
};

/**
 * Some Django app labels differ from our frontend application names.
 * Add mappings here as needed.
 */
const APP_LABEL_MAP: Record<string, string> = {
  inventory: "inventory",
  purchase: "purchase",
  invoice: "invoice",
  sales: "sales",
  settings: "settings",
  contact: "contact",
  project_request: "project-request",
  projectrequest: "project-request",
  project_costing: "project-costing",
  projectcosting: "project-costing",
};

/**
 * Normalizes the new backend permission format into the frontend permission map.
 *
 * Input: permission_details array from backend
 *
 * Output: NormalizedPermissions with a Record of "module" → Set<entitlement>
 */
function expandPermissionType(type: string): PermissionAction[] {
  const actions: PermissionAction[] = [];
  const normalizedType = type.toLowerCase();
  
  if (normalizedType === "reviewer" || normalizedType === "viewer") {
    actions.push("view");
  } else if (normalizedType === "processor" || normalizedType === "editor") {
    actions.push("view", "create" as any, "add" as any, "edit" as any, "change" as any);
  } else if (normalizedType === "creator") {
    actions.push("view", "create" as any, "add" as any);
  } else if (
    normalizedType === "manager" ||
    normalizedType === "admin" ||
    normalizedType === "administrator"
  ) {
    actions.push("view", "create" as any, "add" as any, "edit" as any, "change" as any, "delete" as any);
  } else if (normalizedType === "approver") {
    actions.push("view", "approve" as any, "reject" as any);
  } else if (normalizedType === "requester") {
    // Requester has specific granular entitlements; do not give blanket module-wide view/create
    actions.push("requester" as PermissionAction);
  } else {
    actions.push(type as PermissionAction);
  }
  
  return actions;
}

export function normalizePermissionDetails(
  permissionDetails: PermissionDetail[] | undefined,
): NormalizedPermissions {
  const permissions: Record<string, Set<PermissionAction>> = {};

  if (!Array.isArray(permissionDetails)) {
    return { isAdmin: false, permissions, isReady: false };
  }

  for (const detail of permissionDetails) {
    if (!detail.permissions || !Array.isArray(detail.permissions)) continue;
    for (const perm of detail.permissions) {
      if (!permissions[detail.module]) {
        permissions[detail.module] = new Set();
      }

      // Add the raw permission_type and its expanded actions (e.g. administrator/admin/reviewer)
      if (perm.permission_type) {
        permissions[detail.module].add(perm.permission_type as PermissionAction);
        const expanded = expandPermissionType(perm.permission_type);
        for (const act of expanded) {
          permissions[detail.module].add(act);
        }
      }

      // Add any explicit entitlements
      if (perm.entitlements && Array.isArray(perm.entitlements)) {
        for (let entitlement of perm.entitlements) {
          // --- TEMPORARY WORKAROUND FOR BACKEND TYPOS & MISMATCHES ---
          const toAdd: string[] = [];
          
          if (entitlement === "edit_unit_of_measurecreate_location") {
            toAdd.push("change_unitofmeasure", "add_location");
          } else if (entitlement === "view_unit_of_measureview_location") {
            toAdd.push("view_unitofmeasure", "view_location");
          } else if (entitlement === "create_stock_movecreate_location") {
            toAdd.push("add_stockmove", "add_location");
          } else {
            toAdd.push(entitlement);
          }

          // Map new backend names to the old Django names the frontend UI expects (and vice-versa)
          const TEMPORARY_MAP: Record<string, string[]> = {
            // Stock on Hand / Inventory
            "view_stock_on_hand": ["view_inventory", "view_stock_on_hand"],
            "view_inventory": ["view_stock_on_hand", "view_inventory"],
            "export_stock_on_hand": ["export_inventory", "export_stock_on_hand"],
            "view_stock_detail": ["view_inventory_detail", "view_stock_detail"],

            // Product Categories (singular & plural)
            "view_product_categories": ["view_productcategory", "view_product_category", "view_product_categories"],
            "view_product_category": ["view_productcategory", "view_product_categories"],
            "create_product_categories": ["add_productcategory", "create_product_category", "create_product_categories"],
            "create_product_category": ["add_productcategory", "create_product_categories"],
            "edit_product_categories": ["change_productcategory", "edit_product_category", "edit_product_categories"],
            "edit_product_category": ["change_productcategory", "edit_product_categories"],
            "delete_product_categories": ["delete_productcategory", "delete_product_category", "delete_product_categories"],
            "delete_product_category": ["delete_productcategory", "delete_product_categories"],

            // Units of Measure
            "view_unit_of_measure": ["view_unitofmeasure", "view_unit_of_measure"],
            "create_unit_of_measure": ["add_unitofmeasure", "create_unit_of_measure"],
            "edit_unit_of_measure": ["change_unitofmeasure", "edit_unit_of_measure"],
            "delete_unit_of_measure": ["delete_unitofmeasure", "delete_unit_of_measure"],

            // Products
            "view_products": ["view_product", "view_products"],
            "create_products": ["add_products", "add_product", "create_products"],
            "edit_products": ["change_products", "change_product", "edit_products"],
            "delete_products": ["delete_products", "delete_product"],

            // Locations (singular & plural)
            "view_locations": ["view_location", "view_locations"],
            "view_location": ["view_locations", "view_location"],
            "create_locations": ["add_location", "create_location", "create_locations"],
            "create_location": ["add_location", "create_locations"],
            "edit_locations": ["change_location", "edit_location", "edit_locations"],
            "edit_location": ["change_location", "edit_locations"],
            "delete_locations": ["delete_location", "delete_locations"],
            "delete_location": ["delete_locations", "delete_location"],
            "view_locations_stock": ["view_location_stock", "view_locations_stock"],

            // Stock Adjustment
            "view_stock_adjustment": ["view_stockadjustment", "view_stock_adjustment"],
            "create_stock_adjustment": ["add_stockadjustment", "create_stock_adjustment"],
            "edit_stock_adjustment": ["change_stockadjustment", "edit_stock_adjustment"],
            "validate_stock_adjustment": ["validate_stockadjustment", "validate_stock_adjustment"],
            "cancel_stock_adjustment": ["cancel_stockadjustment", "cancel_stock_adjustment"],

            // Scrap
            "view_scrap": ["view_scrap"],
            "create_scrap": ["add_scrap", "create_scrap"],
            "edit_scrap": ["change_scrap", "edit_scrap"],
            "delete_scrap": ["delete_scrap"],
            "validate_scrap": ["validate_scrap"],

            // Supplier Return & Delivery Return
            "view_supplier_return": ["view_returnincomingproduct", "view_supplier_return", "view_supplierreturn"],
            "create_supplier_return": ["add_returnincomingproduct", "create_supplier_return", "add_supplierreturn"],
            "edit_supplier_return": ["change_returnincomingproduct", "edit_supplier_return", "change_supplierreturn"],
            "delete_supplier_return": ["delete_returnincomingproduct", "delete_supplier_return"],
            "validate_supplier_return": ["validate_returnincomingproduct", "validate_supplier_return"],
            "cancel_supplier_return": ["cancel_returnincomingproduct", "cancel_supplier_return"],
            "create_delivery_return": ["add_returnincomingproduct", "create_delivery_return"],
            "edit_delivery_return": ["change_returnincomingproduct", "edit_delivery_return"],
            "delete_delivery_return": ["delete_returnincomingproduct", "delete_delivery_return"],

            // Incoming Product
            "view_incoming_product": ["view_incomingproduct", "view_incoming_product"],
            "create_incoming_product": ["add_incomingproduct", "create_incoming_product"],
            "edit_incoming_product": ["change_incomingproduct", "edit_incoming_product"],
            "delete_incoming_product": ["delete_incomingproduct", "delete_incoming_product"],
            "validate_incoming_product": ["validate_incomingproduct", "validate_incoming_product"],
            "cancel_incoming_product": ["cancel_incomingproduct", "cancel_incoming_product"],

            // Material Consumption
            "view_material_consumption": ["view_materialconsumption", "view_materialconsumptionrequest", "view_material_consumption"],
            "create_material_consumption": ["add_materialconsumption", "add_materialconsumptionrequest", "create_material_consumption"],
            "edit_material_consumption": ["change_materialconsumption", "change_materialconsumptionrequest", "edit_material_consumption"],
            "delete_material_consumption": ["delete_materialconsumption", "delete_material_consumption"],
            "release_material_consumption": ["release_materialconsumption", "release_material_consumption"],

            // Backorder
            "view_backorder": ["view_backorder", "view_back_order"],
            "create_backorder": ["add_backorder", "create_backorder", "add_back_order"],
            "validate_backorder": ["validate_backorder", "validate_back_order"],

            // Inventory Ledger / Stock Moves
            "view_inventory_ledger": ["view_stockmove", "view_inventory_ledger"],
            "export_inventory_ledger": ["export_stockmove", "export_inventory_ledger"],
            "view_stock_move_detail": ["view_stockmove_detail", "view_stock_move_detail"],
            "create_stock_move": ["add_stockmove", "create_stock_move"],
          };

          for (const rawEnt of toAdd) {
            if (!rawEnt || typeof rawEnt !== "string" || !rawEnt.trim()) continue;

            // Add raw entitlement
            permissions[detail.module].add(rawEnt as PermissionAction);

            // Add mapped aliases
            const mappedList = TEMPORARY_MAP[rawEnt];
            if (mappedList) {
              for (const m of mappedList) {
                const action = DJANGO_ACTION_MAP[m] ?? m;
                permissions[detail.module].add(action as PermissionAction);
              }
            } else {
              const action = DJANGO_ACTION_MAP[rawEnt] ?? rawEnt;
              permissions[detail.module].add(action as PermissionAction);
            }
          }
        }
      }
    }
  }

  return { isAdmin: false, permissions, isReady: true };
}

export function normalizePermissionsFromBackend(
  user_permissions: string[] | Array<{ module: string; permission_type: string }>
): NormalizedPermissions {
  const permissions: Record<string, Set<PermissionAction>> = {};

  if (!Array.isArray(user_permissions) || user_permissions.length === 0) {
    return { isAdmin: false, permissions, isReady: true };
  }

  // New format: array of {module, permission_type}
  if (typeof user_permissions[0] === "object" && "module" in user_permissions[0]) {
    for (const entry of user_permissions as Array<{ module: string; permission_type: string }>) {
      const key = entry.module;
      if (!permissions[key]) {
        permissions[key] = new Set();
      }
      const expanded = expandPermissionType(entry.permission_type);
      for (const act of expanded) {
        permissions[key].add(act);
      }
      permissions[key].add(entry.permission_type as PermissionAction);
    }
    return { isAdmin: false, permissions, isReady: true };
  }

  // Old format: array of Django codenames
  for (const codename of user_permissions as string[]) {
    const parts = codename.split(".");
    let appLabel: string;
    let actionAndModel: string;

    if (parts.length === 2) {
      [appLabel, actionAndModel] = parts;
    } else if (parts.length === 1) {
      continue;
    } else {
      continue;
    }

    const underscoreIdx = actionAndModel.indexOf("_");
    if (underscoreIdx === -1) continue;

    const djangoAction = actionAndModel.substring(0, underscoreIdx);
    const modelName = actionAndModel.substring(underscoreIdx + 1);

    const action = DJANGO_ACTION_MAP[djangoAction];
    if (!action) continue;

    const application = APP_LABEL_MAP[appLabel] ?? appLabel;
    const key = `${application}:${modelName}`;

    if (!permissions[key]) {
      permissions[key] = new Set();
    }
    permissions[key].add(action);
  }

  return { isAdmin: false, permissions, isReady: true };
}

// ---------------------------------------------------------------------------
// Legacy support — kept for backward compatibility with any remaining callers
// ---------------------------------------------------------------------------

export interface AccessRightDetails {
  name: string;
}

export interface AccessGroup {
  application_module: string;
  access_right_details: AccessRightDetails;
}

export interface UserAccess {
  application: string;
  access_groups: string | AccessGroup[];
}

export interface User {
  user_accesses?: UserAccess[];
}

/** @deprecated Use normalizePermissionsFromBackend instead. */
export function normalizePermissions(user: User): NormalizedPermissions {
  const permissions: Record<string, Set<PermissionAction>> = {};
  let isAdmin = false;

  if (!user.user_accesses || !Array.isArray(user.user_accesses)) {
    return { isAdmin, permissions, isReady: false };
  }

  for (const access of user.user_accesses) {
    if (
      access.application === "all_apps" &&
      access.access_groups === "all_access_groups"
    ) {
      isAdmin = true;
      break;
    }

    if (typeof access.access_groups === "string") {
      continue;
    }

    for (const group of access.access_groups) {
      const key = `${access.application}:${group.application_module}`;
      if (!permissions[key]) {
        permissions[key] = new Set();
      }

      const actionName = group.access_right_details.name.toLowerCase() as PermissionAction;
      permissions[key].add(actionName);
    }
  }

  return { isAdmin, permissions, isReady: true };
}
