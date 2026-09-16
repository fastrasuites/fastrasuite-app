# Frontend Permission System — Documentation

## 1. Overview

The permission system controls what each logged-in user can see and do. After login, the backend sends the user's permissions. The frontend stores them in Redux, normalizes them into a lookup map, and uses that map to show/hide modules, pages, buttons, and actions.

**Key rule**: Admin users bypass all checks. Regular users only see what their permissions allow.

---

## 2. Backend Response Structure

After login, the backend returns two permission fields:

```json
{
  "user_permissions": [
    { "module": "project_costing", "permission_type": "reviewer" },
    { "module": "invoice", "permission_type": "reviewer" }
  ],
  "permission_details": [
    {
      "module": "project_costing",
      "permissions": [
        {
          "permission_type": "reviewer",
          "entitlements": [
            "view_project",
            "view_reports",
            "view_financials",
            "view_dashboard",
            "view_budget_adjustments",
            "view_budget_adjustment_detail"
          ]
        }
      ]
    },
    {
      "module": "invoice",
      "permissions": [
        {
          "permission_type": "reviewer",
          "entitlements": [
            "view_approved_requests",
            "view_purchase_orders",
            "view_accounts_payable_queue",
            "view_cash_flow"
          ]
        }
      ]
    }
  ]
}
```

| Field                | Purpose                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `user_permissions`   | Simple list of `{module, permission_type}`. Used for quick module-level checks.                       |
| `permission_details` | Expanded list with full entitlements per permission type. Used for fine-grained button/action checks. |

**Admin detection**: The backend sends empty arrays `[]` for both fields for admin users. Admin status is also determined by checking if the `username` starts with `admin_` (e.g., `admin_lukudev`). This is a more reliable indicator than company_role.

---

## 3. Permission Data Flow

```
Backend Login API
       │
       ▼
Login Page (src/app/auth/login/page.tsx)
  - Stores user_permissions + permission_details in Redux
  - Fetches tenant profile to set isAdmin flag
       │
       ▼
Redux Store (src/lib/store/authSlice.ts)
  - auth.user_permissions: Array<{module, permission_type}>
  - auth.permission_details: PermissionDetail[]
  - auth.isAdmin: boolean
       │
       ▼
PermissionContext (src/contexts/PermissionContext.tsx)
  - Reads from Redux
  - Normalizes into: Record<module, Set<entitlement>>
  - Example: { "project_costing": Set(["view_project", "view_reports", ...]) }
       │
       ▼
usePermission() hook (src/hooks/usePermission.ts)
  - Exposes: can(), isAdmin, isLoading
       │
       ▼
PageGuard / PermissionGuard components
  - Use can() to show/hide pages and UI elements
```

---

## 4. Internal Permission Storage

After normalization, permissions are stored as:

```typescript
// The normalized structure
{
  isAdmin: false,
  permissions: {
    "project_costing": Set(["view_project", "view_reports", "view_financials", ...]),
    "invoice": Set(["view_approved_requests", "view_purchase_orders", ...])
  },
  isReady: true
}
```

**Key format**: Plain module names as keys (e.g., `"project_costing"`, `"invoice"`, `"inventory"`).

---

## 5. How to Use the Permission System

### 5.1 Protecting Entire Pages

Use `PageGuard` at the top of any page component:

```tsx
import { PageGuard } from "@/components/auth/PageGuard";

export default function MyPage() {
  return (
    <PageGuard module="project_costing" entitlement="view_project">
      <h1>Project Costing</h1>
      {/* page content */}
    </PageGuard>
  );
}
```

**What happens**:

- If user is admin → page renders immediately
- If permissions are loading → shows "Verifying access rights..." spinner
- If user has the entitlement → page renders
- If user lacks the entitlement → shows "Unauthorized" message

### 5.2 Protecting Buttons, Menus, and UI Elements

Use `PermissionGuard` (also exported as `ProtectedComponent`) for inline elements:

```tsx
import { PermissionGuard } from "@/components/ProtectedComponent";

export default function Toolbar() {
  return (
    <div>
      {/* Everyone with view_project can see this button */}
      <PermissionGuard module="project_costing" entitlement="view_project">
        <button>View Project</button>
      </PermissionGuard>

      {/* Only managers with configure_budget can see this */}
      <PermissionGuard module="project_costing" entitlement="configure_budget">
        <button>Configure Budget</button>
      </PermissionGuard>

      {/* Fallback example */}
      <PermissionGuard
        module="project_costing"
        entitlement="configure_budget"
        fallback={<span>Upgrade to Manager to configure budget</span>}
      >
        <button>Configure Budget</button>
      </PermissionGuard>
    </div>
  );
}
```

### 5.3 Checking Permissions in Logic (Hooks)

Use `usePermission()` for conditional logic:

```tsx
import { usePermission } from "@/hooks/usePermission";

export default function ProjectActions() {
  const { can, isAdmin, isLoading } = usePermission();

  if (isLoading) return <Spinner />;

  return (
    <div>
      {/* New API: module + entitlement */}
      {can({ module: "project_costing", entitlement: "create_project" }) && (
        <button>Create Project</button>
      )}

      {/* Check multiple permissions */}
      {can({ module: "invoice", entitlement: "edit_invoice" }) && (
        <button>Edit Invoice</button>
      )}
    </div>
  );
}
```

### 5.4 Legacy API (Still Supported)

The old `{application, module, action}` format still works for backward compatibility:

```tsx
{/* Old style — still functional */}
<PageGuard application="settings" module="user" action="view">
  <UserList />
</PageGuard>

<PermissionGuard application="inventory" module="product" action="create">
  <button>Add Product</button>
</PermissionGuard>
```

**How legacy works**: It maps `action` to entitlement prefixes. For example:

- `action="view"` matches entitlements starting with `"view"` (e.g., `view_project`, `view_reports`)
- `action="create"` matches entitlements starting with `"create"` (e.g., `create_project`, `create_wbs`)
- `action="edit"` matches entitlements starting with `"edit"` (e.g., `edit_project`, `edit_invoice`)

---

## 6. Finding the Right Module and Entitlement Names

### Module Names

Use the exact module name from the backend. Examples from `permission_rules_used_in_backend.md`:

| Backend Module Name | Frontend Usage                             |
| ------------------- | ------------------------------------------ |
| `project_request`   | `<PageGuard module="project_request" ...>` |
| `project_costing`   | `<PageGuard module="project_costing" ...>` |
| `invoice`           | `<PageGuard module="invoice" ...>`         |
| `inventory`         | `<PageGuard module="inventory" ...>`       |
| `purchase`          | `<PageGuard module="purchase" ...>`        |

### Entitlement Names

Use the exact entitlement strings defined in the backend rules. Examples:

| Module            | Permission Type | Entitlements                                                                                                                    |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `project_costing` | reviewer        | `view_project`, `view_reports`, `view_financials`, `view_dashboard`, `view_budget_adjustments`, `view_budget_adjustment_detail` |
| `project_costing` | manager         | `create_project`, `edit_project`, `configure_budget`, `submit_budget_adjustment`, ...                                           |
| `invoice`         | reviewer        | `view_approved_requests`, `view_purchase_orders`, `view_accounts_payable_queue`, `view_cash_flow`                               |
| `invoice`         | processor       | `view_invoices`, `convert_approved_requests_to_purchase_orders`, `manage_accounts_payable_queue`, `edit_invoice`                |
| `inventory`       | manager         | `view_products`, `create_products`, `edit_products`, `create_unit_of_measure`, ...                                              |

**Where to find them**: Ask the backend team for the `permission_rules_used_in_backend.md` file or the Django permission rules file for the module you're working on.

---

## 7. Adding Permissions for a New Module

### Step 1: Backend Team Defines Rules

The backend team creates permission rules for the new module, similar to:

```python
NEW_MODULE_ACTIONS = {
    "view_something": ["viewer", "editor", "admin"],
    "create_something": ["creator", "admin"],
    "edit_something": ["editor", "admin"],
}

NEW_MODULE_PERMISSION_DETAILS = {
    "viewer": ["view_something"],
    "editor": ["view_something", "edit_something"],
    "creator": ["view_something", "create_something"],
    "admin": ["view_something", "create_something", "edit_something", "delete_something"],
}
```

### Step 2: Frontend Uses the Entitlements

Once the backend sends `permission_details` for the new module, use it like:

```tsx
<PageGuard module="new_module" entitlement="view_something">
  <NewModulePage />
</PageGuard>

<PermissionGuard module="new_module" entitlement="create_something">
  <button>Create New Thing</button>
</PermissionGuard>
```

### Step 3: Test with Different Roles

Log in as users with different permission types to verify:

- Users with `viewer` can view but not create/edit
- Users with `editor` can view and edit
- Users with `admin` can do everything

---

## 8. Legacy Hook: useModulePermissions

Some older pages use `useModulePermissions()` instead of `usePermission()`. This hook is still supported:

```tsx
import { useModulePermissions } from "@/hooks/useModulePermissions";

export default function OldPage() {
  const { hasAccess, canDo, isAdmin } = useModulePermissions();

  // Check if user has ANY access to a module
  if (hasAccess("inventory")) {
    return <InventoryPage />;
  }

  // Check specific permission type
  if (canDo("inventory", "create")) {
    return <button>Create Inventory Item</button>;
  }
}
```

**Mapping**: Legacy module keys (e.g., `projectRequest`, `inventory`) are automatically mapped to backend module names (e.g., `project_request`, `inventory`).

---

## 9. Key Files Reference

| File                                    | Purpose                                                |
| --------------------------------------- | ------------------------------------------------------ |
| `src/utils/normalizePermissions.ts`     | Converts backend response into frontend permission map |
| `src/contexts/PermissionContext.tsx`    | React context providing normalized permissions         |
| `src/hooks/usePermission.ts`            | Main hook exposing `can()`, `isAdmin`, `isLoading`     |
| `src/hooks/useModulePermissions.ts`     | Legacy hook for backward compatibility                 |
| `src/components/ProtectedComponent.tsx` | Inline permission guard component                      |
| `src/components/auth/PageGuard.tsx`     | Page-level permission guard component                  |
| `src/lib/store/authSlice.ts`            | Redux slice storing raw permission data                |
| `src/types/permissions.ts`              | TypeScript types for permission interfaces             |
| `src/app/auth/login/page.tsx`           | Stores permissions in Redux after login                |

---

## 10. Troubleshooting

### "I can't see any modules after login"

1. Check if `isAdmin` is set correctly in Redux DevTools
2. Check if `permission_details` has data in Redux DevTools
3. Check the browser console for any permission context errors
4. Verify the backend is sending `permission_details` in the login response

### "A user can see a module they shouldn't"

1. Check what entitlements the user actually has in `permission_details`
2. Verify the `entitlement` prop matches exactly (case-sensitive)
3. Check if the legacy fallback is incorrectly matching

### "A user can't see a module they should"

1. Verify the backend assigned the correct permissions to the user
2. Check the exact module name and entitlement string
3. Use `console.log` inside `usePermission` to debug the lookup

---

## 11. Quick Reference Card

| What you want to do          | Use this                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| Protect an entire page       | `<PageGuard module="x" entitlement="y">`                               |
| Hide/show a button           | `<PermissionGuard module="x" entitlement="y">`                         |
| Check in JavaScript logic    | `const { can } = usePermission(); can({module, entitlement})`          |
| Check module access (legacy) | `const { hasAccess } = useModulePermissions(); hasAccess("inventory")` |
| Protect with old style       | `<PageGuard application="x" module="y" action="z">`                    |

**Remember**:

- Always use the **new API** (`module` + `entitlement`) for new code
- The **legacy API** (`application` + `module` + `action`) still works but will be deprecated
- Module names and entitlement strings must match the backend exactly
