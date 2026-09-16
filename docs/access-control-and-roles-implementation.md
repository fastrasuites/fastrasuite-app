# Access Control & Roles Implementation Guide
*(PRD Section 8 to 8.8)*

This document outlines the frontend implementation of the permission-based access control system and role templates for **FastraSuite**.

---

## 1. Overview of the Implementation

The access control system shifts from legacy application-level access groups to direct, granular permissions. Administrators can configure user permissions on a single screen using a 5x7 permissions grid. 

To save time, administrators can manage and apply **Permission Templates**, which pre-fill the grid for new or existing users.

### Key Features Implemented
- **Direct Permissions Grid**: Unified screen with 5 module rows and 7 permission column types. Non-applicable cells are hidden or disabled.
- **Permission Templates Manager**: Complete CRUD operations for pre-saved grids (active and archived states).
- **Rule Enforcement**:
  - **Minimum Permission**: Dashboard tiles are filtered out if the user has no permissions ticked for that module.
  - **Hidden Not Disabled**: Specific buttons or actions (such as making or approving requests) are hidden from the UI if the user's permissions do not cover them.
  - **Immediate Effect**: Local storage and custom events update the UI reactively without requiring a logout/login flow.
  - **Legacy Compatibility**: Retains the legacy "Access Rights" / Access Groups tab to ensure existing permission flows are not disrupted.

---

## 2. Folder and File Structure

Below are the new and modified files in the codebase:

```
fastra-suite-new/
├── docs/
│   └── access-control-and-roles-implementation.md   # [NEW] This documentation
├── src/
│   ├── app/
│   │   ├── page.tsx                                 # [MODIFY] Filter dashboard tiles based on permissions
│   │   ├── project-request/
│   │   │   └── page.tsx                             # [MODIFY] Hide make/approve request cards based on permissions
│   │   └── settings/
│   │       ├── layout.tsx                           # [MODIFY] Add Permission Templates to sub-nav & controls
│   │       ├── permission-templates/                # [NEW] Template Management Directory
│   │       │   ├── page.tsx                         # [NEW] List templates (grid/list, search, archive toggle)
│   │       │   ├── new/
│   │       │   │   └── page.tsx                     # [NEW] Create template form
│   │       │   └── [id]/
│   │       │       └── page.tsx                     # [NEW] View/Edit/Delete/Archive template details
│   │       └── users/
│   │           ├── [id]/
│   │           │   └── page.tsx                     # [MODIFY] Add "Module Permissions" tab & template application
│   │           └── newUser/
│   │               └── page.tsx                     # [MODIFY] Add "Module Permissions" tab to user wizard
│   ├── components/
│   │   └── Settings/
│   │       └── PermissionsGrid.tsx                  # [NEW] 5x7 Checkbox Matrix component
│   ├── hooks/
│   │   └── useModulePermissions.ts                  # [NEW] React Hook to check user permissions
│   └── utils/
│       └── modulePermissionsStore.ts                # [NEW] LocalStorage store & default PRD mock templates
```

---

## 3. Component Hierarchy

```
[SettingsLayout]
  └── NavBar (Links: Company, User, Access Groups, Permission Templates)
  └── SettingsControlBar (New Template button, Grid/List view switcher)
  └── Main Content Renderers:
      ├── [PermissionTemplatesPage] (List View)
      │     └── ReusableTable OR Grid Cards
      ├── [NewPermissionTemplatePage] & [PermissionTemplateDetailsPage] (Form Views)
      │     └── PermissionsGrid
      ├── [UsersDetails] & [NewUser] (Tabbed Forms)
      │     ├── Basic Settings (Tab 1)
      │     ├── Access Rights (Tab 2 - Legacy Access Groups)
      │     └── Module Permissions (Tab 3 - NEW PermissionsGrid + Template Dropdown Selector)
```

---

## 4. Expected REST API Specifications (For Backend Integration)

Since no backend endpoints exist yet, the frontend simulates API calls via `localStorage`. The following REST endpoints, payloads, and response JSON schemas are designed for backend developers to implement later.

### 4.1. Permission Templates Endpoints

#### `GET /api/v1/settings/permission-templates/`
Fetch all permission templates.
- **Query Params**: `is_archived` (boolean, optional)
- **Response `200 OK`**:
```json
[
  {
    "id": "tpl-1",
    "name": "Field worker submitting requests",
    "is_archived": false,
    "created_at": "2026-06-09T00:00:00Z",
    "permissions": {
      "projectRequest": { "requester": true },
      "projectCosting": {},
      "invoice": {},
      "inventory": { "requester": true },
      "settings": {}
    }
  }
]
```

#### `POST /api/v1/settings/permission-templates/`
Create a new permission template.
- **Payload**:
```json
{
  "name": "Project Manager",
  "permissions": {
    "projectRequest": { "approver": true },
    "projectCosting": { "manager": true },
    "invoice": {},
    "inventory": {},
    "settings": {}
  }
}
```
- **Response `201 Created`**: Returns the created template object including `id` and `created_at`.

#### `PATCH /api/v1/settings/permission-templates/:id/`
Update a template's name, active status, or permissions.
- **Payload**:
```json
{
  "name": "Updated Project Manager",
  "is_archived": false,
  "permissions": {
    "projectRequest": { "approver": true },
    "projectCosting": { "manager": true, "reviewer": true },
    "invoice": {},
    "inventory": {},
    "settings": {}
  }
}
```
- **Response `200 OK`**: Returns the updated template object.

#### `DELETE /api/v1/settings/permission-templates/:id/`
Permanently delete a permission template.
- **Response `204 No Content`**

---

### 4.2. User Direct Permissions Endpoints

#### `GET /api/v1/users/:id/permissions/`
Fetch direct permissions for a specific user.
- **Response `200 OK`**:
```json
{
  "user_id": 42,
  "is_super_admin": false,
  "permissions": {
    "projectRequest": { "requester": true, "reviewer": true },
    "projectCosting": { "reviewer": true },
    "invoice": { "reviewer": true, "processor": true },
    "inventory": { "requester": true, "reviewer": true },
    "settings": {}
  }
}
```

#### `PUT /api/v1/users/:id/permissions/`
Update direct permissions for a specific user.
- **Payload**:
```json
{
  "permissions": {
    "projectRequest": { "requester": true, "reviewer": true },
    "projectCosting": { "reviewer": true },
    "invoice": { "reviewer": true, "processor": true },
    "inventory": { "requester": true, "reviewer": true },
    "settings": {}
  }
}
```
- **Response `200 OK`**: Returns the updated permissions object.

---

## 5. Notes for Backend Developers

1. **Permission Schema**:
   Store the permissions column mapping in a JSON field (e.g. `JSONB` in PostgreSQL) or in a relational mapping table linking `User` -> `Module` -> `PermissionType`. A JSONB column on the `UserPermissions` model is recommended for speed and flexibility.
2. **Super Admin Bypass**:
   The Super Admin (the first registered user in the tenant company) must bypass permission checks. The policy/middleware checking permissions must return `true` immediately if the requesting user's `is_super_admin` flag is `true`.
3. **No Self-Approval Rule**:
   When routing approval workflows for requests, budgets, or adjustments, the backend must check if the submitter's ID equals the approver's ID. If so, block self-approval and automatically route to another user with approver permissions on that module.
4. **Retroactive Template Edits**:
   Edits to templates must **not** retroactively update user permissions. The database must copy the permissions payload from the template to the user's permission record during template application.

---

## 6. Summary for the Project Manager (PM)

- **Interactive Verification**: The entire access control system runs in high fidelity on the frontend. The `localStorage` setup lets you immediately test the visual features. If you edit a user or select a template, the change is saved instantly.
- **Prepopulated Templates**: The system automatically boots with the 8 typical roles defined in PRD Section 8.8 (Field worker, Project Manager, CFO, etc.) preloaded, so you don't have to configure them from scratch.
- **Clean Responsive Styling**: The permissions grid uses premium Tailwind-based tables with rounded corners, harmonious muted headers (`#F1F2F4`), and distinct brand blue highlights (`#3B7CED`) for checked states. Unmapped cells render as a clean dash (`—`) rather than empty boxes, avoiding visual clutter.
- **Preserved Safety**: The legacy Access Groups feature remains fully functional under the "Access Rights" tab on user screens, keeping it safe for future work as requested.
