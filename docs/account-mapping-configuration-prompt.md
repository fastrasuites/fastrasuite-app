# Account Mapping Configuration Prompt

You are the senior frontend developer on this project.
Your task is to implement the financial setup and account-mapping configuration flow for FastraSuite.

## Context

This feature is part of the invoicing and financial configuration layer. It allows the system to map approved project request types to the correct GL expense accounts before payment processing can occur.

The backend is already partly structured around invoice and chart-of-accounts APIs, and a `request-account-mappings` endpoint exists conceptually for this feature. The implementation should be designed to be production-ready and easy to integrate with backend services later.

## Goal

Create a complete configuration experience that lets an administrator:

- view and maintain the company chart of accounts
- configure company bank accounts
- configure default payment terms
- manage vendors and vendor bank accounts
- configure request-to-account mappings for each request type
- ensure deletions are safe and historical data is preserved
- create a clean UI that supports setup order and validation

## Required setup order

The configuration sequence matters. The app should guide the user in the correct order:

1. Chart of Accounts
2. Company Bank Accounts
3. Payment Terms
4. Vendors
5. Vendor Bank Accounts
6. Request Mapping
7. Purchase Order Generation
8. Vendor Bills
9. Payments

This order is important because each stage depends on the previous one. For example, requests cannot be mapped to an account if there is no valid chart of accounts; vendor payments cannot be processed without bank account setup and payment term configuration.

## Functional requirements

### 1. Chart of Accounts configuration

Implement an account manager for the general ledger.

Required capabilities:

- list all accounts in a searchable, sortable table
- show account number, account name, type, subtype, status, parent account, and balance
- allow create, edit, deactivate, and view details
- support active/inactive state without permanently deleting accounts that are still referenced
- show account hierarchy for parent/child account structures
- allow filtering by account type and active status

Important business rules:

- Accounts with ledger transactions, child accounts, bank details, or request mappings must not be hard-deleted.
- A safer alternative is to deactivate the account using `is_active = false`.
- The UI should clearly explain this to the user before any deletion is attempted.

### 2. Company Bank Accounts

Implement a configuration screen for company bank accounts.

Required capabilities:

- list all company bank accounts
- link each account to the correct chart-of-accounts record
- capture bank name, account name, account number, IBAN or routing info, and default status
- allow marking one bank account as the default payment account
- allow edit and deactivate actions
- display validation if a bank account is missing required details

### 3. Payment Terms configuration

Implement payment terms management for purchase orders and vendor bills.

Required capabilities:

- create and edit payment terms
- define terms such as net 7, net 14, net 30, or custom values
- assign a default payment term to the company
- show expiry or status metadata if supported by backend
- ensure purchase orders and vendor bills can inherit default terms automatically

### 4. Vendor and vendor bank account management

Implement vendor setup screens.

Required capabilities:

- create and edit vendors
- maintain vendor contact metadata
- maintain vendor bank accounts
- allow a vendor to have multiple bank accounts if needed
- mark a bank account as primary/default
- show validation if a vendor is missing required payment information

### 5. Request mapping configuration

This is the primary feature for this task.

The system should let administrators define which expense account is used for each request type.

Supported request types:

- labour
- material
- petty_cash
- plant_equipment
- purchase

Required functionality:

- list all active and inactive mappings
- filter by request type or account
- create a new mapping from a request type to an expense account
- update an existing mapping
- deactivate a request mapping without deleting it
- display the mapped account name alongside the request type
- identify invalid mappings if the chosen account is inactive or deleted
- prevent deletion of an account that is actively used by a request mapping

Data model:

```ts
export type RequestMappingType =
  | "labour"
  | "material"
  | "petty_cash"
  | "plant_equipment"
  | "purchase"
  | string;

export interface RequestAccountMapping {
  id: number;
  expense_account_name: string;
  request_type: RequestMappingType;
  created_at: string;
  is_active: boolean;
  expense_account: number;
}
```

### 6. Business validations

The feature must include validation rules to protect financial integrity:

- A request mapping must always point to a valid active account.
- Request mappings must be unique per request type unless the system intentionally supports multiple active mappings by policy.
- If a mapped account is deactivated, the mapping should be flagged and hidden from default usage until corrected.
- Hard delete should be blocked if there are dependencies such as ledger transactions, child accounts, vendor records, or financial mappings.
- The UI should present a friendly explanatory message instead of a raw backend error when a delete is blocked.

### 7. Purchase order generation and payment flow

The configuration should be built with the downstream flow in mind.

- Approved purchase and plant/equipment requests convert into purchase orders.
- Purchase orders and vendor bills inherit default payment terms.
- The correct bank account is used when payment is processed.
- Vendor bills and payment batches reference the mapped chart-of-account data.

The UI should not simply be a static list; it should clearly communicate that the mappings are part of the payment and accounting workflow.

## UI requirements

- Build the implementation using the existing project design system and color palette.
- Use a clean, professional layout suitable for finance and admin users.
- Ensure the interface is responsive across desktop, tablet, and mobile sizes.
- Keep the configuration screens modular and reusable.
- Provide clear empty states, validation notices, loading states, and confirmation dialogs.
- Show warning banners where a record is inactive or is blocking a delete action.

## Recommended screen structure

Create new pages or sections beneath the settings/invoicing area:

```text
src/
  app/
    settings/
      finance/
        page.tsx
        chart-of-accounts/
          page.tsx
        bank-accounts/
          page.tsx
        payment-terms/
          page.tsx
        vendors/
          page.tsx
        request-mappings/
          page.tsx
```

Suggested modules:

- `ChartOfAccountsTable`
- `BankAccountForm`
- `PaymentTermsTable`
- `VendorManagementTable`
- `RequestAccountMappingTable`
- `MappingFormDialog`
- `DeleteGuardMessage`

## Expected backend API contracts

Use the following contract shape as the expected integration model for the backend.

### Chart of accounts

#### `GET /chart-of-accounts/`

Returns an array of accounts.

```json
[
  {
    "id": 1,
    "account_number": "1000",
    "account_name": "Cash and Cash Equivalents",
    "account_type": "ASSET",
    "subtype": "cash",
    "is_active": true,
    "is_control_account": true,
    "control_type": "cash",
    "parent_account": null,
    "balance": "0.00",
    "children": []
  }
]
```

#### `POST /chart-of-accounts/`

Create a new account.

```json
{
  "account_number": "1010",
  "account_name": "Main Bank Account",
  "account_type": "ASSET",
  "subtype": "bank",
  "is_active": true,
  "is_control_account": true,
  "control_type": "bank",
  "parent_account": null
}
```

### Request account mappings

#### `GET /invoicing/request-account-mappings/`

```json
[
  {
    "id": 1,
    "expense_account_name": "Materials Expense",
    "request_type": "material",
    "created_at": "2026-07-01T12:00:00Z",
    "is_active": true,
    "expense_account": 12
  }
]
```

#### `POST /invoicing/request-account-mappings/`

```json
{
  "request_type": "labour",
  "is_active": true,
  "expense_account": 44
}
```

#### `PATCH /invoicing/request-account-mappings/:id/`

```json
{
  "request_type": "labour",
  "is_active": false,
  "expense_account": 45
}
```

#### `DELETE /invoicing/request-account-mappings/:id/`

This should not perform a hard delete if the record is in historical use. Prefer soft deactivation or a blocked-delete validation response.

### Delete protection rules for chart accounts

The backend should implement safe delete handling:

- Allow hard delete only when there are no dependencies.
- Block deletion with validation if the account has:
  - ledger transactions
  - child accounts
  - bank details
  - request mappings
- Return a user-friendly validation error and instruct the finance admin to deactivate the account instead.

## Notes for backend developers

1. The request mapping table should be intentionally simple but strongly validated; it sits at the heart of the invoicing/accounting workflow.
2. The `is_active` field should be treated as the default soft-delete mechanism across all configuration records.
3. All financial setup screens should be audit-friendly and should preserve historical records.
4. Frontend validation should call out inactive accounts and invalid mappings before submission.
5. The product must preserve accounting integrity over convenience; a blocked delete is preferable to accidental data loss.

## Expected output

Deliver:

- a clean production-ready frontend implementation
- reusable form and table components
- API-ready mappings for backend integration
- documentation in Markdown describing the implementation and business intent

## Summary for the project manager

This feature creates the accounting backbone for the project request lifecycle. Without accurate request-to-account mapping, approved requests cannot be converted reliably into invoice transactions, vendor payments, or GL postings. The configuration screens give finance and operations teams control over the setup process while enforcing safeguards to protect financial integrity and historical reporting accuracy.
