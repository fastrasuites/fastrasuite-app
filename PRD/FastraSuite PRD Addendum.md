**FastraSuite**  
**Product Requirements Document**

**Document Type:** FastraSuite PRD Addendum  
**Version:** 1.1  
**Date:** April 2026  
**Status:** Approved  
**Prepared For:** Technical and non-technical stakeholders

# **1\. Introduction & Purpose**

This document serves as a formal addendum to the existing FastraSuite Product Requirements Specification. It defines the functional requirements for two newly introduced modules:

* Project Costing Module: the central financial tracking and reporting hub for all project-related spending, powered by the Project Costing Engine.  
* Project Request Module: a mobile-first request initiation layer designed specifically for site workers and field teams.

These modules complement the existing Purchase, Inventory, and Invoice modules and complete the core operational loop of FastraSuite.

## **1.1 Core System Philosophy**

FastraSuite is designed to simplify ERP complexity by clearly separating operational responsibilities across four layers:

| Layer | Actor | Responsibility | Module(s) Used |
| :---- | :---- | :---- | :---- |
| Field (Mobile) | Site Workers | Initiate Requests | Project Request Module |
| Office (Operations) | Procurement, Inventory, Finance | Process Requests | Purchase, Inventory, Invoice |
| Finance | Accounts / Management | Approve & pay | Invoice Module |
| Management | Project Managers, Directors | Monitor & report | Project Costing Module |

The system must enforce strict alignment between what is requested on-site, what is approved within the project budget, and what is ultimately paid by finance. All spending must originate from validated site activity. Every transaction must be traceable to a project, a WBS element, and a cost category. Payments are only made for verified and validated work or deliveries.

## **1.2 System Architecture Note**

FastraSuite operates as a multi-tenant SaaS platform. Each registered company exists as an isolated tenant with its own data environment. No data is shared across companies. All companies share the same underlying codebase and infrastructure.

## **1.3 Subscription Model**

FastraSuite is offered on two subscription tiers. The Core tier includes four modules: Project Request Module, Project Costing Module, Invoice Module, and Inventory Module. The Enterprise tier includes all core modules plus sales (CRM, quotation, SO), purchase, HR, and asset management. Companies on the Core tier can upgrade to Enterprise at any time. All data created during the Core subscription is retained and carried over upon upgrade. The Purchase Order feature lives inside the Invoice Module on Core and moves to the Purchase Module on upgrade without any data loss.

 

## **1.4 Product Objectives & Success Metrics**

| Objective | Measurable Success Metric |
| :---- | :---- |
| Eliminate unbudgeted spending. | 100% of submitted requests pass through the Budget Validation Gate; no exceptions. |
| Full cost traceability | Every transaction carries a valid WBS reference and cost category. No transaction is recorded without both fields. |
| Prevent payment without delivery confirmation. | A 2-Point Match is enforced on all vendor invoices. No invoice paid without a matched site receipt |
| Real-time financial visibility | The BvA Dashboard reflects the current financial state within 5 minutes of any transaction across all modules. |
| Reduce manual financial reconciliation. | The finance team can process the payment queue without manually cross-referencing purchase orders, receipts, and invoices |
| Field accessibility | Project Request Module is fully functional on low-end mobile devices using a standard mobile browser |

 

# **2\. User Personas**

## **2.1 Site Supervisor / Site Worker**

| Attribute | Detail |
| :---- | :---- |
| Primary access | Mobile browser on Android or iOS device |
| Technical literacy | Low to medium — minimal typing; prefers dropdowns and tap interactions |
| Location | On-site — often in areas with unreliable internet connectivity |
| Primary actions | Submits spending requests, logs material receipts, records material consumption |
| Key frustration | Complex forms, too many fields, slow loading on low-end devices |
| What they need | A fast, simple interface that allows them to submit a request in under 2 minutes with minimal effort |

 

**2.2 Site Manager**

| Attribute | Detail |
| :---- | :---- |
| Primary access | Mobile browser (primary) and web browser (secondary) |
| Technical literacy | Medium |
| Primary actions | Submits requests, acts as first-level approver for site requests, confirms material receipts on behalf of the site team |
| Key frustration | No visibility into what has been requested and what budget remains before approving |
| What they need | A clear view of all requests on their project and enough budget information to make sound approval decisions |

## **2.3 Project Manager**

| Attribute | Detail |
| :---- | :---- |
| Primary access | Web browser. Both desktop and tablet |
| Technical literacy | Medium to high |
| Primary actions | Creates and manages projects, sets and manages budgets, reviews and approves requests, and monitors the BvA Dashboard. |
| Key frustration | Budget overruns discovered after the fact;  no early warning system |
| What they need | Real-time visibility into budget consumption at every level of the project hierarchy, with proactive alerts before budgets are exhausted |

## **2.4 Finance Officer / Accountant**

| Attribute | Detail |
| :---- | :---- |
| Primary access | Web browser — desktop |
| Technical literacy | Medium to high |
| Primary actions | Validates vendor invoices via 3-Way Match, manages the payment queue, approves payments, reviews the Cash Flow view |
| Key frustration | Processing invoices that do not match what was actually delivered or ordered—manual reconciliation is time-consuming and error-prone |
| What they need | A system that automatically flags mismatches and only surfaces invoices that are verified and ready to pay |

 **2.5 Company Admin**

| Attribute | Detail |
| :---- | :---- |
| Primary access | Web browser — desktop |
| Technical literacy | High |
| Primary actions | Creates and manages user accounts, configures access groups, manages the cost code library, adjusts system settings |
| Key frustration | Manual onboarding of users and repeated configuration for each new project |
| What they need | A simple admin panel that allows full user and configuration management without requiring technical support |

 

# **3\. Module Overview & Cross-Cutting Features**

## **3.1 Project Request Module**

The Project Request Module is the mandatory entry point for all site activity and spending requests. It is a streamlined, mobile-optimised interface designed for site workers and field teams. Every spending request must be tagged with a WBS element and is automatically validated by the budget validation gate before reaching any human approver. This module is strictly for initiating requests and routing approvals — it does not process payments.

This module covers six request types:

1. Purchase Request  
2. Labour Request  
3. Petty Cash Request  
4. Subcontractor Request — supports both lump-sum and milestone-based payment terms  
5. Plant & Equipment Request  
6. Material Consumption Request

## **3.2 Project Costing Module**

The Project Module is the financial management and reporting backbone of FastraSuite, powered by the Project Costing Engine—an active validation and tracking engine, not a passive reporting tool. It manages the work breakdown structure and runs the budget validation gate on every request submission, tracks committed and actual amounts in real time, and displays financial status via the BvA Dashboard.

## **3.3 User Onboarding, Authentication & Access Activation**

**Company Registration**

FastraSuite operates as a true SaaS platform. Companies self-register, verify their email addresses, and gain immediate access; no manual activation is required. The first person to register a company automatically becomes the company super admin.

**Registration Flow:**

1\.      A company representative visits the FastraSuite registration page and fills in the registration form

2\.      When you fill out the form, the system sends a link to your registered email address to confirm it.

3\.      The representative clicks the confirmation link, and the system gives them instant access to the dashboard.

4\.      A representative lands on the main dashboard as the company super admin.

5\.      A setup wizard dialog appears, guiding the Super Admin through initial company configuration

| Registration Field | Behaviour |
| :---- | :---- |
| Company Name | Text input — required |
| Contact Name | Text input — required |
| Email Address | Text input is required, checked for the right format, and blocked if there are duplicate emails. |
| Password | Text input is required and must follow the password policy. |

 

| Rule | Detail |
| :---- | :---- |
| Email verification | The company cannot log in until the confirmation link is clicked |
| Immediate access | After email verification, company gains full access—no further approval required |
| Super Admin assignment | The registering user automatically becomes the company super admin. |
| Industry selection | Recorded for the company's profile. Does not affect terminology, WBS structure, or any system behaviour. |
| Confirmation link expiry | The link is valid for 24 hours—expired links show a clear error with the option to request a new link |
| Duplicate detection | System blocks duplicate email registrations with a clear error message |

 

| Acceptance Criteria | Detail |
| :---- | :---- |
| Registration | A company can register and receive a confirmation email within seconds |
| Verification | Clicking the confirmation link grants immediate access to the dashboard |
| Super Admin | The registered user has Super Admin permissions from first login |
| Duplicate email | The second registration attempt with the same email is blocked with a clear error |
| Expired link | An expired confirmation link shows an error and offers a resend option |

**Setup Wizard: First Login**

On first login, a guided three-step wizard helps the Super Admin configure the company environment before any operational work begins.

| Step | What the Admin Does |
| :---- | :---- |
| Step 1: Company Settings | Updates the company logo, phone number, address, registration number, tax ID, company size, and language. Reviews and confirms the industry selection made at registration. Sets the base currency and default tax settings. |
| Step 2: Permission Setup | Admin configures permission templates if the company has large teams with shared permissions. Templates are optional. For smaller teams, the admin can configure each user's permissions individually during user creation.  |
| Step 3: User Creation | Creates user accounts for all team members. Assigns each user an access group and operational area (site or back office). Shares the login link and temporary password with each user directly. |

**Individual User Account Creation**

Users do not self-register. The company super admin creates all user accounts directly from the settings panel and shares credentials with each user. Users are forced to change their temporary password on first login before accessing any module.

| User Creation Field | Behaviour |
| :---- | :---- |
| Full Name | Text input — required |
| Email Address | Text input — required — must be unique within the company |
| Operational Area | Choose either "Site" or "Back Office." |
| Access Group | Select from existing access groups—required |
| Temporary Password | Auto-generated by the system — visible to the admin for sharing with the user |

 

| Rule | Detail |
| :---- | :---- |
| Admin-only creation | Only the Super Admin or users with user management permissions can create accounts |
| No self-registration | Individual users cannot register themselves. The admin creates all accounts |
| First login password change | System forces a password change on first login—the user cannot access any module until this is complete |
| Operational area — Site | The user lands on the mobile Project Request Module dashboard after login |
| Operational area — Back Office | The user lands on the desktop back-office dashboard based on their access group |
| Access group | Determines all permissions across all modules for that user |

 

| Acceptance Criteria | Detail |
| :---- | :---- |
| User creation | Admin can create a user account with all required fields |
| Temporary password | System generates a temporary password visible to the admin |
| First login | The user is forced to change password on first login before accessing any module |
| Site users | Land on the mobile Project Request Module dashboard after login |
| Back Office users | Land on the desktop back-office dashboard based on their access group |
| Duplicate email | Second user creation with the same email is blocked with a clear error |

**Password Reset & Account Recovery**

**User Flow:**

6\.      The user clicks "Forgot Password" on the login page

7\.      The user enters their registered email address and submits

8\.      System sends a time-limited password reset link to that email

9\.      The user clicks the link and is taken to a password reset form

10\.  The user enters and confirms their new password and submits

11\.  System confirms the change and redirects the user to the login page

 

| Rule | Detail |
| :---- | :---- |
| Reset link validity | 60 minutes from the time of sending |
| Expired link behaviour | System shows a clear error message with the option to request a new link |
| Password policy | Must match the existing policy, alphanumeric with at least one special character |
| Admin-triggered reset | Admins can force a password reset for any user from the Users panel in Settings without knowing the user's current password |
| Duplicate requests | If a new reset is requested before the first link expires, the first link is invalidated |

## **3.4 Security Policy**

**Password Policy:**

| Requirement | Detail |
| :---- | :---- |
| Minimum length | 8 characters |
| Character requirement | Must include at least one letter, one number, and one special character |
| Reuse restriction | Users cannot reuse their last 3 passwords |

**Session Policy:**

| Requirement | Detail |
| :---- | :---- |
| Session timeout | 30 minutes of inactivity |
| Timeout behaviour | The user is logged out and redirected to the login page |
| Re-authentication | Required after every session expiry |

**Account Lockout:**

| Trigger | Action |
| :---- | :---- |
| 5 consecutive failed login attempts | The account is temporarily locked |
| Unlock method | The user initiates a password reset, or the admin unlocks from Settings |

**Two-Factor Authentication (2FA):**

| Setting | Detail |
| :---- | :---- |
| Method | Email OTP (One-Time Password) |
| Availability | Available to all users |
| Admin control | Admin can make 2FA mandatory for all users or optional per role group |
| OTP validity | 10 minutes from the time of sending |

## **3.5 Notification System**

**Delivery Channels:**

| Channel | Description | Default State |
| :---- | :---- | :---- |
| In-app | Notification bell icon visible on the dashboard at all times | Enabled |
| Email | Sent to the user's registered email address | Enabled |
| Push notifications | Not in scope for version 1.0 | N/A |

**Channel Configuration:**

1. Users can disable either channel individually from their profile settings  
2. Admins can restrict which notification types are active system-wide from the Settings panel

**Notification Triggers:**

| Trigger Event | Who Is Notified |
| :---- | :---- |
| New request submitted | Assigned approver |
| Request approved | Original submitter |
| Request rejected | Original submitter (with rejection reason) |
| Clarification requested | Original submitter |
| Request flagged as over-budget in approval queue | Project Manager (within seconds) |
| Budget overrun alert threshold reached | Configurable per project — default PM and Finance |
| Payment confirmed | Project Manager and Finance |
| Stockkeeper confirms goods receipt on a PO—Path B | User with processor permission on the invoice module (within 2 minutes) |
| PM marks subcontractor work or milestones as complete  | User with Processor permission on the invoice module (within 2 minutes)  |
| Material receipt quantity mismatch | Finance and Project Manager (automatically) |
| Low stock alert triggered | Configurable. Default Site Manager and Project Manager |
| PM marks subcontractor work or milestones as complete  | User with Processor permission on the invoice module  |
| Equipment hire return date approaching or overdue  | Original requester and project manager  |
| Trial ending within 3 days  | Super Admin, |
| Payment failed, each attempt  | Super Admin, immediately  |
| Account moved to Locked  | Super Admin, |
| Account moved to Suspended  | Super Admin, |
| Downgrade scheduled  | Super Admin, in advance of the billing cycle end  |

**Notification Content Requirements:**

1. Every notification must include event type, record ID and name, the user who triggered the action, timestamp, and a direct link to the relevant record  
2. Notifications must be delivered within 2 minutes of the triggering event  
3. Unread in-app notifications must display a count badge on the notification bell

## **3.6 Platform & Mobile Strategy**

**Platform:**

| Attribute | Detail |
| :---- | :---- |
| Delivery type | Progressive Web App (PWA) |
| Installation | Installable on Android and iOS home screens without an app store |
| Browser support | All modern browsers (Chrome, Safari, Firefox, Edge) |
| Target device | Low-end Android smartphones. The Project Request module must be functional on devices with limited processing power and 3G connectivity |

 

**Device Optimization by Module:**

| Module | Primary Device | Optimisation Requirement |
| :---- | :---- | :---- |
| Project Request Module | Mobile | Fully mobile-optimized—large touch targets, minimal fields, minimal scrolling, minimal typing required |
| Inventory Module | Desktop | Desktop-primary, functionally usable on mobile |
| Invoice Module | Desktop | Desktop-primary, functionally usable on mobile |
| Project Costing Module | Desktop \+ Mobile | Responsive—usable on both without degradation |

 

**Offline Capability:**

| Feature | Offline Support |
| :---- | :---- |
| Request form draft saving — text fields only | Supported—drafts saved locally and synced on reconnection |
| Material Consumption draft saving—text fields only | Supported—drafts saved locally and synced on reconnection |
| Request form submission | Not supported — active connection required to submit |
| Photo capture and attachment upload | Not supported offline — active connection required (v1.1) |
| All back-office modules | Not supported offline — active connection required |

When a site worker loses connectivity mid-form, the system automatically saves their current form input as a local draft on their device. A clear visual indicator informs the user they are offline. When connectivity is restored, the draft syncs automatically to the server without requiring any action from the user. If a sync conflict occurs — for example, the same draft was modified on two devices — the most recently modified version takes precedence, and the user is notified.

## **3.7 System-Wide Audit Trail**

**What is Logged:**

| Field | Detail |
| :---- | :---- |
| Timestamp | Date and time of the action (to the second) |
| User | Full name and role of the user who performed the action |
| Action type | Created, Edited, Submitted, Approved, Rejected, Deleted, Paid, Overridden, Reallocated, Adjusted, etc. |
| Module | The module in which the action occurred |
| Record | The record type and unique ID affected |
| Field changes | The field name, previous value, and new value for any edits |

 

**Access & Permissions:**

| Rule | Detail |
| :---- | :---- |
| Who can view the global audit log | Admin-level users only, via Settings |
| Who can view a record-level audit trail | Any user with access to that record |
| Editability | The audit log is fully read-only. No user at any level can edit or delete entries |
| Export | The global audit log is exportable as CSV or PDF |
| Filtering | Filterable by user, module, action type, and date range |

**Immutable Entries:**

The following actions generate permanent audit log entries that can never be edited or deleted:

1. PM approves an over-budget flagged request —includes the override note and overrun amount  
2. PM rejects an over-budget flagged request — includes the rejection reason  
3. PM reallocate budget then approves  
4. Payment approval by Finance Officer  
5. Budget revision approval or rejection  
6. All manual inventory adjustments

 

## **3.8 Attachment & Document Management**

**Supported File Types & Limits:**

| Attribute | Detail |
| :---- | :---- |
| Accepted file types | PDF, JPG, PNG, DOCX, XLSX, and photos captured directly via device camera |
| Maximum file size | 10MB per file. Images captured via camera are automatically compressed before upload to reduce data usage on mobile connections. |
| Maximum attachments | 5 files per record |
| Storage | Cloud-based, encrypted at rest |
| Camera capture | Users can capture photos directly from their device camera within any form. The system requests camera permission on first use |
| Preview | Users see a thumbnail preview of each attachment before submitting the form |
| Progress indicator | Upload progress is shown to the user for each file during upload |

**Access Rules:**

| Rule | Detail |
| :---- | :---- |
| Who can view attachments | Any user with permission to view the parent record |
| Who can upload | Any user with edit access to the record |
| Who can delete (before approval) | The original uploader or an Admin |
| Who can delete (after approval) | Nobody. attachments are locked once a record is approved |
| Offline behaviour | Photo upload requires an active connection — offline photo queuing is not supported in v1.0 |

**Audit:**

1. All attachment activity (uploads and deletions) is captured in the record's audit trail  
2. Deleted files are logged but not recoverable by users

 

## **3.9 Work Breakdown Structure (WBS) Manager**

The Work Breakdown Structure (WBS) is a hierarchical breakdown of a project into configurable levels such as phases, sub-phases, and activities. Every budget line, request, commitment, and actual cost in FastraSuite must be tagged to a specific activity-level WBS element. This enables financial and operational tracking at any level of the project hierarchy, from the overall project down to an individual executable activity.

FastraSuite uses one unified work breakdown structure for every company, entered as a flat table with five fixed columns: Phase, Activity, Quantity, Rate, and Amount. These column headers are fixed and cannot be renamed. The PM builds this table either by typing rows directly through the interface or by importing it in bulk from an Excel file. The amount is always calculated automatically as Quantity multiplied by Rate, on both paths, if a typed or uploaded amount disagrees with the calculation, the system flags that row and prompts a correction. The system must block saving or uploading until that row is corrected. See Section 5.1.1 for the full import specification. 

The WBS structure distinguishes between the following:

1. Summary Elements (containers used for grouping)  
2. Activity Elements (lowest-level executable work items)

Only activity elements can receive the following:

1. budget lines  
2. requests  
3. commitments  
4. actual costs  
5. procurement transactions

Summary elements exist strictly for aggregation and roll-up reporting.

**WBS Structure Rules:**

| Rule | Detail |
| :---- | :---- |
| Configurable depth | The number of hierarchy levels is configurable by the company admin. There is no fixed limit set by the system |
| System-generated IDs | The system assigns a unique ID to each WBS element on creation. This ID cannot be manually edited after the first transaction is attached to that element |
| Activity-only budget attachment | Budget lines can only be attached to the activity elements. The system blocks budget attachment to any parent or summary element.  |
| Parent total rollup | All parent element values are automatically calculated as the sum of child elements. Manual entry at the parent level is not allowed.  |
| No deletion after transaction | A WBS element cannot be deleted after any transaction has been attached to it. It can only be marked as "Cancelled". |
| Cancelled elements | A Cancelled WBS element remains visible in history and reports but cannot receive any new transactions |
| New activity elements | New activity elements can be added to an Active project without triggering a full budget revision |
| Hierarchy integrity enforcement  | An Activity Element cannot exist without a valid parent Summary Element in the hierarchy chain.  |
| Transaction locking rule  | Once a transaction is posted against an element, structural modifications that affect hierarchy relationships are restricted.  |

In addition to building the WBS manually through the interface, the PM can import the full phase and activity structure, along with budget lines, in bulk from an Excel file. See Section 5.1.1 for the full import specification.

**WBS Hierarchy — Example:**

| Level | Default Name | Example (Construction Project) |
| :---- | :---- | :---- |
| Level 1 | Phase | Foundation |
| Level 2 | Activity | Concrete Pouring |

 ![][image1]

Budget lines are strictly attached at the activity level. All higher levels function as roll-up containers for reporting and control purposes. 

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a project manager, I want to build my project's WBS as a simple table so that I can enter or import my budget quickly without navigating a complex tree structure.  | 1\. PM creates a new project or opens an existing draft project. 2\. Navigates to the WBS section.  3\. The system displays an empty table with Phase, Activity, Quantity, Rate, and Amount as fixed column headers.  4\. The PM types a row, entering the phase name, activity name, quantity, and rate.  5\. The system calculates the amount automatically as quantity multiplied by rate.  6\. PM adds further rows, repeating the same phase name across multiple rows where several activities share one phase.  7\. The PM continues until the structure is complete or imports the full structure from Excel per Section 5.1.1.  8\. If any typed or imported amount disagrees with the calculated value, the system flags that row for correction.  9\. PM reviews the full table, including any flagged rows, and saves.  10\. Once the project is active, new rows can be added, but rows with transactions cannot be deleted.  | 1\. Phase, Activity, Quantity, Rate, and Amount are the five fixed column headers for every project. Headers cannot be renamed by any user, on either the manual entry table or the Excel import.  2\. PMs build the WBS by typing rows manually or importing them via Excel.  3\. The amount is always calculated automatically as quantity multiplied by rate, regardless of entry method.  4\. If a typed or uploaded amount differs from the calculated value, the system flags that row with a warning and requires correction before saving.  5\. The system assigns a unique ID to each row on creation.  6\. The row ID cannot be edited after the first transaction is attached to it.  7\. Phase level totals are calculated automatically as the sum of every row sharing that phase name.  8\. Rows with transactions can be marked 'Cancelled' but never deleted.  | 1\. PM can build a WBS table by typing rows directly, matching the same column structure as the Excel import.  2\. Every row has a unique system-generated ID.  3\. The amount is calculated automatically as quantity multiplied by rate on every row, typed or imported.  4\. Rows where Amount disagrees with the calculated value are flagged and must be corrected before the table can be saved.  5\. Budget lines exist at the row activity level. Phase-level figures are always a roll-up, never entered directly.  6\. The row ID cannot be edited after the first transaction is attached.  7\. Cancelled rows are visible in history and reports but cannot receive new transactions.  8\. New rows can be added to an Active project without triggering a budget revision.  |

## 

## **3.10 Budget Check Flow**

The budget validation is an automated check that fires every time a request is submitted. It checks whether the requested amount is within the available budget for the specific WBS element tagged on the request. It fires before any human approver sees the request.

**Available Budget Formula:**

Available Budget \= Budgeted Amount − Actual Amount − Committed Amount

| Term | Definition |
| :---- | :---- |
| Budgeted Amount | The approved budget for a specific WBS element |
| Actual Amount | Confirmed payments already made against that WBS element and cost code |
| Committed Amount | Approved but not yet paid requests against that WBS element and cost code |
| Available Budget | What remains available for new spending on that specific line |

**Critical Rule:** Committed amounts are always deducted from the available budget in every validation check. A request that has been approved but not yet paid still consumes the available budget.

**Pre-Submission Budget Visibility:**

Before submitting any request, the site worker can see the available budget for the selected WBS element and cost code combination. The system displays the available budget amount only — the worker does not see the full breakdown of budgeted, actual, or committed amounts separately. This gives the worker enough information to self-check their request before submission without exposing sensitive financial details.

| Display Rule | Detail |
| :---- | :---- |
| What is shown | Available Budget amount for the tagged WBS element—updates in real time as the worker selects both fields |
| When it appears | Immediately after WBS element is selected, before the worker enters the requested amount |
| Format | Displayed as: 'Available Budget: ₦\[amount\]' — prominently positioned above the amount or cost fields |
| What is NOT shown | Budgeted Amount, Actual Amount, Committed Amount. These are never shown to site workers |
| Insufficient budget indicator | If the worker enters an amount that exceeds the available budget, a warning is shown before submission: 'This request exceeds the available budget and will require a budget review.' |

**Validation Gate Flow:**

| Step | Action | Result |
| :---- | :---- | :---- |
| 1 | A site worker selects a WBS element. | System displays the available budget amount |
| 2 | The worker completes the form and taps Submit | System intercepts the request before routing to any approver |
| 3 | System recalculates the available budget at the exact moment of submission | Budgeted − Actual − Committed for that WBS \+ Cost Code |
| 4a | Within budget | Request proceeds to the PM approval queue normally |
| 4b | Over budget | Request is flagged and proceeds to the PM approval queue with a clear over-budget indicator showing the overrun amount. |
| 5 | The worker sees the result | **Within budget**: standard confirmation. **Over budget**: 'This request requires a budget review before it can be processed. You will be notified of the outcome.' |

**Over-Budget Requests:**

When a request exceeds the available budget for the tagged WBS element, the request is not blocked and does not go to a separate queue. 

The PM sees the following information on the flagged request:

1. WBS Element  
2. Budgeted Amount  
3. Committed Amount  
4. Actual Amount  
5. Available Budget  
6. Requested Amount  
7. Overrun Amount

The PM has two options:

| Action | What Happens |
| ----- | ----- |
| Approve | Request is approved despite the overrun. The committed amount increases. A permanent audit log entry is created noting the overrun amount at the time of approval. |
| Reject | Request is rejected. The committed amount is not affected. The submitter is notified of the rejection reason. |

If the PM wants to accommodate recurring overruns on a particular WBS element, they can increase the budget for the entire project from within the Project Costing Module using the Budget Revision Workflow (Section 5.6). 

**Committed Amount Lifecycle:**

| Event | Effect on Committed Amount |
| :---- | :---- |
| Request approved — within budget | The requested amount added to Committed |
| Request approved with PM override | The requested amount added to Committed |
| Request rejected by PM | Committed amount released immediately back to Available Budget |
| Request cancelled | Committed amount released immediately back to Available Budget |
| Payment confirmed in Invoice Module | Amount removed from Committed and added to Actual |
| Material consumption validated | Material consumption is validated—stock on hand is reduced by the consumed quantity. Consumption recorded against WBS element for cost reporting purposes. No financial entry created in the Project Costing Module.  |

 

## **3.12 Overrun Alert System**

The Overrun Alert System monitors budget consumption across all WBS elements on every active project. When consumption reaches a configured threshold, the system sends an alert to the designated recipients. This is a proactive warning system — it fires before the budget is exhausted, giving the PM time to act.

**Alert Threshold Formula:**

* Alert fires when: (Actual Amount \+ Committed Amount) ÷ Budgeted Amount × 100 ≥ Threshold %

**Alert Threshold Configuration:**

| Setting | Detail |
| :---- | :---- |
| Company default threshold | A single default threshold percentage set at the company level. This applies to all projects and all cost categories unless overridden |
| Project-level override | The PM can override the company default threshold for each individual project |
| Category-level override | The PM can set different thresholds per cost category within the same project. For example, Labour at 75% and Materials at 85% |
| Alert recipients | Configurable per project. The default recipients are the PM and Finance team |

**Alert Behavior:**

1. Alert fires once when the threshold is first crossed. It does not fire repeatedly on every subsequent transaction  
2. Alert resets if budget is reallocated and consumption drops below the threshold. It will fire again the next time the threshold is crossed

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a project manager, I want to receive an alert when a budget line on my project is approaching its limit so that I can take preventive action before the budget is exhausted and requests start being flagged as over-budget in the PM approval queue. | 1\. PM creates a new project or opens an existing active project 2\. Navigates to Project Settings and clicks Alert Thresholds 3\. Sees the company default threshold pre-filled. For example, 80% 4\. PM accepts the default or overrides it at project level 5\. PM can further set different thresholds per cost category 6\. PM saves the thresholds 7\. As the project progresses and transactions are recorded, the system monitors consumption continuously 8\. When any WBS and cost code line reaches its configured threshold, the PM receives an in-system notification identifying the specific line, its current consumption percentage, and the remaining available budget. 9\. The BvA Dashboard highlights the line with the at-risk indicator. 10\. If the budget is subsequently reallocated and consumption drops below the threshold, the alert resets. | 1\.  Admin can set a company-wide default alert threshold in Settings 2\. PM can override the company default per project 3\. PM can set different thresholds per cost category within a project 4\. The system monitors consumption continuously, alerting fires as soon as the threshold is crossed 5\. Alert fires once per threshold crossing, not repeatedly 6\. Alert resets if budget is reallocated and consumption drops below the threshold 7\. PM can configure who receives alerts per project. | 1\. Admin can set and save a company-wide default threshold 2\. PM can set a project-level threshold that overrides the company default 3\. PM can set different thresholds per cost category. These override both project and company defaults 4\. Alert fires correctly when the formula reaches the threshold percentage 5\. Alert does not fire repeatedly; it fires once per threshold crossing 6\. Alert resets correctly if consumption drops below the threshold after a budget reallocation 7\. An alert appears in the notification bell for configured recipients. 8\. PM can add or remove alert recipients from project settings |

# 

## **3.13 Subscription & Billing**

FastraSuite is billed on a self-serve basis through Paystack. Every company starts on a 14-day free trial of the Core tier; no payment method is required to begin. Billing is managed exclusively by the company super admin. Consistent with the unrestricted access rule in Section 8.6, no other administrator permission level can view or change billing information. FastraSuite has exactly two fixed plans, Core and Enterprise. 

**Subscription Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Plan | Core or Enterprise. Fixed, not admin-defined. |
| Billing Cycle | Monthly or annual, selectable by the Super Admin |
| Trial End Date | Set automatically to 14 days after company registration |
| Payment Method | Card details are stored securely via Paystack, not on FastraSuite's own servers. |
| Subscription Status | Trial, Active, Payment Failed, Locked, Suspended, or Cancelled |
| Next Billing Date | Calculated automatically from the billing cycle |

**Subscription Status Definitions**

| Status | Description | Next Possible Statuses |
| ----- | ----- | ----- |
| Trial | Free 14-day access to Core. Full functionality. | Active, Locked |
| Active | Subscription paid and current. Full functionality. | Payment Failed, Cancelled |
| past\_due | The subscription payment is due but has not yet been successfully completed. The company can complete payment through the Billing screen to restore active status.  | active, expired  |
| expired  | The trial or paid subscription period has ended without successful renewal. Access to the platform is restricted until the subscription is renewed successfully.  | active  |

**Subscription Payment**

FastraSuite does not automatically charge customers. Subscription payments are initiated manually by the company super admin through Paystack.

During the 14-day free trial, the Super Admin can choose to subscribe to either Core or Enterprise. The Super Admin selects the required plan and billing cycle, reviews the subscription amount, and proceeds to Paystack to complete the payment.

After successful payment is confirmed by Paystack, FastraSuite activates the selected subscription and sets the applicable billing period and next billing date.

For renewal, the Super Admin is notified when payment is due and can initiate payment from the Billing screen. The Super Admin selects the applicable subscription and billing cycle and proceeds to Paystack to complete the payment.

FastraSuite does not store card details or retain a payment method for automatic charging.

All Paystack webhook events must be signature-verified before they are processed. Duplicate webhook deliveries for the same event must not result in duplicate payment processing or duplicate subscription extensions.

**Subscription Payment Journey**

1. The Super Admin registers the company and begins a 14-day free trial on Core.  
2. The Super Admin opens the Billing screen during the trial.  
3. The Super Admin selects Core or Enterprise as the subscription plan.  
4. The Super Admin selects monthly or annual billing.  
5. FastraSuite displays the selected plan, billing cycle, applicable amount, and billing period for confirmation.  
6. The Super Admin confirms the subscription and proceeds to Paystack.  
7. The Super Admin completes the payment through Paystack.  
8. Paystack sends payment confirmation to FastraSuite.  
9. FastraSuite verifies the payment confirmation.  
10. FastraSuite activates the subscription and records the billing period.  
11. The Super Admin is returned to FastraSuite and can view the active subscription and payment record.

**Billing Invoice Fields**

| Field | Behaviour |
| ----- | ----- |
| Invoice Number | Generated automatically on creation |
| Company | Prefilled from the subscription record |
| Plan | Core or Enterprise, prefilled |
| Billing Period | Start and end date of the cycle this invoice covers |
| Total Amount | Prefilled from the Plan and Billing Cycle. No tax or discount fields in this version. |
| Due Date | Set automatically from the next billing date |
| Payment Status | Paid, Pending, or Failed |

### 

**Upgrade Behaviour**

The Super Admin can upgrade from Core to Enterprise while the current subscription is active.

The upgrade takes effect immediately after successful payment. The price difference for the remaining period of the current billing cycle is calculated and charged on a prorated basis.

Once payment is confirmed, Enterprise features become available immediately. No existing data is removed or altered.

**Downgrade Behaviour (Enterprise to Core)**

If the Super Admin requests a downgrade while the subscription is still active, the downgrade is scheduled and takes effect at the end of the current paid billing cycle. Nothing changes until then, and the Super Admin is notified in advance.

If the subscription is already locked or suspended, the super admin chooses Core or Enterprise as part of reactivating, and it takes effect immediately on successful payment.

When the downgrade takes effect, every enterprise-only module currently becomes read-only immediately. Existing data in each remains visible but frozen; no new records can be created in any of them. No special blocking step is required for any module. This is one general rule applied uniformly, not separate behaviour defined per module. 

| Rule | Detail |
| ----- | ----- |
| Downgrade requested while active | Scheduled; takes effect at the end of the current billing cycle. The super admin was notified in advance. |
| Downgrade chosen during reactivation from Locked or Suspended | Takes effect immediately on payment |
| Enterprise-only modules on downgrade  | Becomes read-only immediately when the downgrade takes effect. No new transactions. |
| Data loss | None |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a Super Admin, I want to manage my company's subscription and billing so that I can keep FastraSuite running without interruption to my active projects. | 1\. Super Admin registers the company and begins a 14-day free trial on Core automatically.  2\. The Super Admin can open the Billing screen during the trial.  3\. The Super Admin selects Core or Enterprise and chooses monthly or annual billing.  4\. FastraSuite displays the selected plan, billing cycle, billing amount, and applicable billing period.  5\. Super Admin confirms the subscription and proceeds to Paystack.  6\. The super admin completes payment through Paystack.  7\. FastraSuite receives and verifies the payment confirmation.  8\. The subscription becomes active, and the applicable billing period begins.  9\. Before the next billing date, the Super Admin is notified that renewal payment is due.  10\. The super admin initiates the renewal payment through the billing screen and completes payment through Paystack.  11\. Successful renewal extends the subscription and updates the next billing date.  12\. The Super Admin can upgrade from Core to Enterprise while active.  13\. Super Admin can request a downgrade from Enterprise to Core, which takes effect at the end of the current paid billing cycle.  | 1\. Every company receives exactly 14 days of free access to Core without providing a payment method.  2\. Both Core and Enterprise are available as subscription plans.  3\. Both monthly and annual billing cycles are supported.  4\. All subscription payments are initiated manually by the Super Admin through Paystack.  5\. FastraSuite does not automatically charge a saved payment method.  6\. The Super Admin is the only user who can access or manage billing information.  7\. A successful Paystack payment changes the subscription to active and starts the applicable billing period.  8\. A subscription that reaches its billing date without successful renewal payment moves to past\_due.  9\. A subscription that remains unpaid after the applicable renewal period expires.  10\. A successful payment restores the subscription to active.  11\. Upgrade payments are prorated based on the remaining period of the current billing cycle.  12\. Downgrades requested during an active billing period take effect only at the end of that paid period.  13\. Enterprise-only functionality becomes read-only when an Enterprise subscription is downgraded to Core.  14\. Existing data is never deleted as a result of an upgrade or downgrade.  15\. Paystack webhook events are signature-verified before processing.  16\. Duplicate webhook events do not result in duplicate payment processing or subscription extensions.  17\. Every subscription and billing status change generates a permanent audit log entry.  | 1\. New companies automatically enter trialling status with full core functionality and no payment method required.  2\. The Super Admin can select a plan and billing cycle and proceed to Paystack from the Billing screen.  3\. The Super Admin can complete the subscription payment through Paystack.  4\. A verified successful payment changes the subscription to active.  5\. The active subscription displays the correct plan, billing cycle, billing period, and next billing date.  6\. A subscription that reaches its renewal date without payment changes to past\_due.  7\. An unpaid subscription eventually changes to expired according to the defined subscription period.  8\. Successful renewal payment changes the subscription back to active.  9\. Core to Enterprise upgrades take effect immediately after successful prorated payment.  10\. Enterprise to Core downgrades take effect at the end of the current paid billing cycle.  11\. Enterprise-only functionality becomes read-only after a downgrade, with existing data remaining visible and exportable.  12\. Unverified Paystack webhook events are rejected.  13\. Duplicate Paystack webhook events are not processed more than once.  14\. Subscription changes and billing events appear in the audit trail with a timestamp and the responsible user or system.  |

**Screen and State Requirements**

**Billing Screen**

A single billing screen is provided under the Company tab in Settings.

The screen shows the current plan, subscription status, billing cycle, next billing date, renewal or payment action, and billing history.

The Super Admin can initiate a subscription payment, change the billing cycle where permitted, upgrade or request a downgrade, and view previous subscription invoices.

Payment processing is completed through Paystack. FastraSuite does not store card details or automatically charge a saved payment method.

**Trialling State**

The company has full Core access during the 14-day trial.

The billing screen displays the trial end date and provides an option for the super admin to select a paid plan and complete payment.

**past\_due State**

The billing screen clearly indicates that payment is outstanding.

The Super Admin can proceed directly to payment through Paystack.

The system displays the applicable subscription end date and provides clear instructions for completing payment.

**expired state**

The subscription has ended without successful renewal.

Access to normal business functionality is restricted. The Super Admin is directed to the Billing screen to renew the subscription.

The company's data is retained and is not deleted solely because the subscription has expired.

A successful renewal restores the applicable plan and normal access immediately after payment has been verified.

# **4\. Project Request Module**

The Project Request Module is the mandatory entry point for all site spending. Every request must be tagged with a WBS element and a cost code before submission. The Budget Validation Gate fires automatically on every submission. The available budget for the tagged WBS element and cost code combination is displayed to the worker before they submit.

## **4.1 Module Access & Navigation**

The module is accessible from the main module dashboard. It is optimized for mobile screen sizes and touch interaction. Site users with the appropriate access role will see the Project Request module tile on their dashboard.

## **4.2 Request Type Definitions**

| Request Type | Description | Processed In |
| :---- | :---- | :---- |
| Purchase Request | Request to procure goods or materials needed on-site | Invoice Module: converted to PO by user with Processor permission  |
| Labour Request | Request for additional human resources (workers, contractors) | Invoice Module: payment processed directly |
| Petty Cash Request | Request for small cash disbursements for on-site expenses | Invoice Module: payment processed directly |
| Subcontractor Request | Request to engage a subcontractor — supports lump-sum and milestone-based payment terms | Invoice module: converted to PO by user with Processor permission |
| Plant & Equipment Request | Request for machinery, tools, or equipment needed on-site | Invoice module: converted to PO by user with Processor permission |
| Material Consumption Request | Record of materials consumed from inventory on-site | Inventory Module: stock deducted automatically |

## **4.3 Request Initiation**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a site worker, I want to raise a new request from my mobile device. so that I can initiate procurement, labour, or material needs without visiting the office. | 1\. Site worker logs into FastraSuite on mobile 2\. Selects the Project Request module from the dashboard 3\. Sees a list of available request types 4\. Taps the relevant request type 5\. A simplified form appears pre-filled with the worker's name, project, date, and site location 5\. The worker selects the WBS elements. 6\. The system immediately displays the available budget for that WBS element. 7\. The worker completes the remaining fields and submits 8\. Budget Validation gate fires automatically 9\. If within budget, request proceeds to approval queue with a confirmation message 9\. If over budget, request proceeds to approval queue while been flagged with a confirmation message | 1\. The system must support all 7 request types. 2\. Forms must be mobile-optimised. 3\. The project name must be selectable from a list of active projects. 4\. The WBS element must be selected from the activity elements of the selected project. This is mandatory. 5\. The available budget for the selected WBS element must be displayed immediately after both fields are selected. 6\. The submitting user is auto-populated from the logged-in account 7\. Request date is auto-filled with the current date 10\. System must validate mandatory fields before submission 11\. Each submitted request must receive a unique reference ID 12\. The system must support local draft saving when the device has no internet connectivity. No drafts must sync automatically when connectivity is restored | 1\. A Site worker can access the Project Request module on a mobile browser on a low-end device. 2\. All 7 request-type forms are available and accessible. 3\. The WBS Element field is present and mandatory on all six spending request forms 4\. The WBS dropdown shows only activity elements of the selected project. 5\. The available budget is displayed immediately after the WBS element is selected. This updates in real time. 6\. Mandatory fields are validated before submission 7\. A submitted request is assigned a unique ID (e.g., PR-2026-001). 8\. Worker receives a confirmation message on screen after submission 9\. Budget Validation Gate fires on every submission without exception 10\. Over-budget worker sees only the neutral review message; no financial figures are shown |

 

## **4.4 Purchase Request**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a site worker, I want to raise a Purchase Request for goods needed on-site, so that the procurement team can process the order. | 1\. Worker selects "Purchase Request" from the request type list 2\. Form is displayed with fields:    \- Request ID (auto-generated)    \- Project (select from active projects)    \- WBS Element (select from activity elements of the selected project)    \- Date (auto-filled with current date)    \- Requested By (auto-filled from logged-in user)    \- Site Location    \- Required By Date    \- Product Line (product name, description, quantity, estimated unit cost)    \- Notes / Justification 3\. After selecting WBS Element, the system displays the Available Budget for that combination 4\. Worker adds one or more product lines 5\. Worker submits the request 6\. Budget Validation Gate fires automatically 7\. If within budget — request is sent to the Invoice Module and worker receives a confirmation message 8\. If over budget, request proceeds to approval queue while been flagged with a confirmation message | 1\. At least one product line is required before submission 2\. WBS Element is mandatory; only activity elements of the selected project are selectable 3\. Available Budget must be displayed for the selected WBS element before the worker enters cost details 4\. The request must be linked to the originating project 5\. Budget Validation Gate fires automatically on every submission 6\. On approval, the approved amount is added to the Committed Amount in the Costing Engine for the tagged WBS element | 1\. Form cannot be submitted without at least one product line 2\. WBS Element dropdown is visible and mandatory — shows only activity elements 3\. Available Budget is displayed immediately after WBS Elements are selected 4\. A draft PR is automatically created in the Purchase Module upon submission, carrying the WBS element references 5\. The PR in the Purchase Module references the original Project Request ID 6\. The purchase team can view and process the request in the Purchase Module 7\. Budget Validation Gate fires on every submission 8\. Within-budget requests proceed to the approval queue. The over-budget requests proceed to the approval queue while being flagged. 10\. On approval, the Costing Engine Committed Amount increases by the approved request value |

 

## **4.5 Labour Request**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a site manager, I want to request additional labour resources so that staffing gaps on-site can be addressed promptly. | 1\. Manager selects a labour request from the request type list 2\. Form is displayed with fields:    \- Request ID (auto-generated)    \- Project (select from active projects)    \- WBS Element (select from activity elements of the selected project)    \- Date Required    \- Number of Workers    \- Role / Trade Type    \- Duration (numeric input with a Days or Weeks selector)    \- Estimated Daily Rate    \- Projected Cost (auto-calculated and read-only)    \- Justification Notes 3\. After selecting WBS Element, the system displays the Available Budget for that combination 4\. Manager submits the request 5\. Budget Validation Gate fires using the projected cost as the validation amount 6\. On approval, the projected cost is added to the Committed Amount in the Costing Engine and the request is routed to the Invoice Module | 1\. Role Type field must support free-text entry or selection from predefined roles 2\. The WBS element is mandatory. Only phase and activity elements of the selected project are selectable 3\. Available Budget must be displayed for the selected WBS element before the manager enters cost details 5\. Projected Cost Formula: Number of Workers × Duration in Days × Estimated Daily Rate 6\. If the manager selects Weeks as the duration unit, the system must automatically convert to days before calculating — 1 week \= 7 days 7\. The Projected Cost field must recalculate and display instantly whenever the Number of Workers, Duration, or Estimated Daily Rate fields change 8\. The Projected Cost field is auto-calculated and read-only—the manager cannot type into it directly 9\. Budget Validation Gate fires using the projected cost as the validation amount 10\. On approval, the projected cost is added to the Committed Amount in the Costing Engine | 1\. Labour request form captures all required fields 2\. WBS Element dropdown is visible and mandatory — shows only activity elements 3\. Available Budget is displayed immediately after WBS Elements are selected 4\. Projected cost formula is applied correctly: Workers × Duration in Days × Daily Rate 5\. When duration is entered in weeks, the system automatically converts to days before calculating — 2 weeks \= 14 days 6\. Projected cost recalculates instantly when any of the three input fields change 7\. Manager cannot manually edit the Projected Cost field 8\. Budget Validation Gate fires using the projected cost – not just the daily rate 9\. On approval, the Costing Engine Committed Amount increases by the projected cost value |

 

## **4.6 Petty Cash Request**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a site worker, I want to request petty cash for minor on-site expenses. so that small purchases can be made without formal procurement. | 1\. Worker selects "Petty Cash Request" from the request type list 2\. Form is displayed with fields:    \- Request ID (auto-generated)    \- Project (select from active projects)    \- WBS Element (select from activity elements of the selected project)    \- Date    \- Amount Requested    \- Purpose / Expense Category    \- Description of Expense    \- Notes 3\. After selecting WBS elements, the system displays the Available Budget for that combination 4\. Worker submits the request 5\. Budget Validation Gate check runs on submission 6\. If over budget—the request is flagged while being moved to the approval queue. | 1\. A maximum petty cash limit per request must be configurable in system settings 2\. If the amount exceeds the petty cash limit, the system must warn the user and suggest a Purchase Request instead 3\. WBS Element is mandatory—only activity elements of the selected project are selectable 4\. Available Budget must be displayed for the selected WBS element before the worker enters the amount 5\. The Budget Validation Gate check must run on every submission 6\. Approved petty cash is recorded as an Actual Cost in the cost engine upon payment 7\. The finance team must be able to approve or reject petty cash requests | 1\. Amount field is validated against the configured maximum petty cash limit 2\. A warning is shown if the petty cash limit is exceeded 3\. WBS Element dropdown is visible and mandatory — shows only activity elements 4\. Available Budget is displayed immediately after WBS Elements are selected 5\. Both the petty cash limit check and the budget validation gate runs on every submission 6\. Finance receives a notification for approval 7\. On approval and disbursement, the actual cost is recorded in the Costing Module 8\. Rejected requests are visible to the requester with a rejection reason 9\. The over-budget requests proceed to the approval queue while being flagged. |

 

## 

## **4.7 Subcontractor Request**

The subcontractor request supports both lump-sum and milestone-based payment terms. When milestone-based is selected, the PM defines the milestones and their payment amounts at the time of the request. Each milestone payment is only released when the PM marks the corresponding milestone as complete.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a project manager, I want to formally request the engagement of a subcontractor with the option to define milestone-based payment terms so that specialised work can be outsourced through the proper financial process with payments tied to verified progress. | 1\. Manager selects "Subcontractor Request" from the request type list 2\. Form is displayed with fields:    \- Request ID (auto-generated)    \- Project (select from active projects)    \- WBS Element (select from activity elements of the selected project)    \- Subcontractor Name (select from existing vendors or enter as free text)    \- Scope of Work    \- Start Date / End Date    \- Payment Type (Lump Sum or Milestone-Based)    \- Contract Value (Estimated)    \- Payment Terms    \- Justification Notes 3\. If Milestone-Based is selected: PM adds milestone lines, each with a milestone name, percentage of the contract value, and completion criteria 4\. After selecting WBS Element and Cost Code, the system displays the Available Budget for that combination 5\. Manager submits the request 6\. Budget Validation Gate fires using the total contract value as the validation amount 7\. On approval: contract value is added to the Committed Amount; request is routed to the Invoice Module 8\. For milestone-based: each milestone payment is only processable after the PM marks that milestone as complete | 1\. The subcontractor’s name must be selectable from existing vendor records or entered as free text. If entered as free text, a corresponding vendor record must be automatically created in the Inventory Module upon approval 2\. Payment Type must support Lump Sum and Milestone-Based options 3\. For Milestone-Based: the PM must define at least two milestones—the percentage values of all milestones must total 100% 4\. The WBS element is mandatory. Only activity elements of the selected project are selectable 5\. Available Budget must be displayed before the PM enters the contract value 6\. Budget Validation Gate fires using the total contract value as the validation amount 7\. The WBS element and cost code references must carry through to all downstream records in the invoice module. | 1\. Request is linked to the project and includes all required scope and cost fields 2\. WBS Element dropdown is visible and mandatory—shows only activity elements 3\. Available Budget is displayed immediately after WBS Element is selected 4\. Lump Sum and milestone-based payment type options are available and functional 5\. For milestone-based: the milestone percentage total must equal 100%. The system blocks submission if the total does not equal 100% 6\. On approval, the contract value is recorded as a committed cost in the costing module. 7\. For milestone-based: each milestone payment is only processable after the PM marks that milestone as complete 8\. WBS element reference carry through to all downstream records |

When the PM raises a subcontractor request, the system routes it to a user with approver permission who is not the PM—consistent with the no self-approval rule in Section 8.6. The PM cannot approve their own subcontractor requests. 

**Vendor Record Handling:**

1. Subcontractor names are selectable from existing vendor records in the Invoice Module  
2. No separate vendor management feature is required for this module — it relies entirely on the existing vendor list in the inventory module.  
3. The subcontractor must exist as a vendor record in the Invoice Module before a subcontractor request can be raised. The PM selects the subcontractor from the existing vendor list on the request form. If the subcontractor does not yet exist in the system, the administrator must create their vendor record in Vendor Management before the PM can raise the request.   
4. Upon approval of the request, the system automatically creates a corresponding vendor record in the Invoice Module using the entered details  
5. On upgrade to Enterprise, the Purchase Module provides full vendor management, and historical subcontractor records can be formally created at that point.

When a subcontractor is created as a new vendor on approval of a subcontractor request, their bank details must be completed by a user with administrator permission before any payment can be processed to them. The system blocks payment processing to any vendor without confirmed bank details on file. 

## 

## **4.8 Plant & Equipment Request**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a site manager, I want to request a plant or equipment for the project site so that the required machinery is procured or hired on time. | 1\. The manager selects the plant and equipment. Request from the request type list.  2\. The Form is displayed with fields:  \- Request ID \- Select from active projects.  \- WBS: select from activity elements of the selected project \- Equipment Name or Description.  \- Quantity. Required  \- Date.  \- Payment Type  \- Purchase or Hire.  \- Estimated Cost.  \- Notes or Justification.  3\. If Payment Type is Hire, the Expected Return Date field appears and is required.  4\. After selecting the WBS element, the system displays the available budget for that combination.  5\. Manager submits the request.  6\. The budget check fires using the estimated cost as the validation amount.  7\. On approval, the estimated cost is added to the Committed Amount, and the request is routed to the Invoice Module. If Payment Type is Hire, a Hire record is created automatically once the PO is issued. See Section 9.2.4.  | 1\. The WBS Element is mandatory. Only activity elements of the selected project are selectable.  2\. The available budget must be displayed for the selected WBS element before the manager enters the estimated cost.  3\. The budget check fires using the estimated cost as the validation amount.  4\. On approval, the estimated cost is added to the Committed Amount in the Project Costing Module.  5\. All Plant and Equipment Requests are routed to the invoice module for payment processing.  6\. Payment Type must be selected as either 'purchase' or 'hire'. The Expected Return Date field is required when Hire is selected and hidden when Purchase is selected.  7\. Recurring hire payments are handled as individual manual entries.  | 1\. WBS Element dropdown is visible and mandatory. It shows only activity elements.  2\. The available budget is displayed immediately after the WBS element is selected.  3\. Payment type selection is mandatory before submission.  4\. Expected Return Date is required and validated when Payment Type is 'Hire' and does not appear when Payment Type is 'Purchase'.  5\. Committed cost is recorded in the Project Costing Module on approval.  6\. Actual cost is updated once the associated payment is confirmed in the invoice module.  7\. The request is routed to the Invoice Module upon approval for payment processing.  8\. For hire requests, a hire record is created automatically once the linked PO is issued.  |

 

## **4.9 Material Consumption Request**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a site worker, I want to record materials consumed from inventory on-site so that inventory levels are accurate and project material costs are tracked. | 1\. Worker selects the material consumption request from the request type list 2\. Form is displayed with fields:    \- Request ID (auto-generated)    \- Project (select from active projects)    \- WBS Element (select from activity elements of the selected project)    \- Date Consumed    \- Location / Warehouse    \- Product Line (product name, quantity, unit of measure, unit cost, total cost)    \- Notes 3\. If within available stock, the request is moved to the approval queue. 4\. If approved, the stock is deducted from the inventory module. 5\. If there is insufficient stock, the system blocks submission with a clear message. | 1\. Only products available in the linked inventory location can be selected 2\. The WBS element is mandatory. 3\. Available Budget must be displayed for the selected WBS element before the worker enters quantities 4\. The system must validate that sufficient stock exists before submission 5\. Consuming materials from inventory reduces the stock on hand and records of which WBS element the materials were used on for cost reporting purposes only. 6\. Stock is deducted from inventory automatically when the request is approved | 1\. Products shown in the form are filtered to available inventory items only 2\. WBS Element dropdown is visible and mandatory. 3\. Available Budget is displayed immediately after WBS element is selected 4\. The system prevents submission if the requested stock quantity exceeds the available stock on hand 6\. The consumption record is visible in the inventory module.  7\. Form cannot be submitted without at least one product line |

## 

## 

## **4.10 Request Approval Workflow**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As an approver, I want to review and approve or reject requests submitted from the site so that I can control project spending and ensure requests are valid. | 1\. The approver receives a notification (in-app and/or email) of a new pending request. 2\. Approver logs in and navigates to the Approver section in the Project Request Module. 3\. The approver sees a list of pending requests filtered by project and type 4\. Approver clicks on a request to view full details 5\. Approver can    a. Approve: The request moves to the processing queue in the relevant module.    b. Reject: The approver must provide a rejection reason.    c. Request Clarification: The request is returned to the submitter with comments. 6\. The submitter is notified of the outcome. | 1\. Approval roles must be configurable per request type and per project 2\. Approver must be able to view the full request form and all attachments 3\. All approval decisions must be logged with a timestamp and the approver's name 4\. The original requester can resubmit a rejected request after editing 5\. Approved requests must automatically trigger the relevant action in the back-office module | 1\. approver receives notification within 2 minutes of submission 2\. Approve, Reject, and Request Clarification options are all available 3\. Rejection requires a mandatory reason field 4\. All decisions are logged in the request audit trail 5\. Approval triggers the creation of the corresponding record in the back-office module 5\. The submitter receives a notification of the decision, including the reason if rejected 6\. Resubmission is allowed after rejection. |

**Request Status Definitions**

| Status | Description | Next Possible States |
| :---- | :---- | :---- |
| Draft | The request has been created but not yet submitted. | Submitted, Deleted |
| Submitted | Request has been submitted and is pending review. | Approved, Rejected, Clarification Needed |
| Clarification Needed | The approver has returned the request to the submitter for more information. | Submitted |
| Approved | Request has been approved and sent to the back office for processing. | In Progress |
| Rejected | Request has been declined. The reason is provided. | Resubmitted |
| In Progress | The back office is processing the request. | Completed |
| Completed | Request has been fully processed, and payment or action is confirmed. | Closed |

 

# **5\. Project Costing Module**

The Project Costing Module is the financial management and reporting backbone of FastraSuite. It manages the work breakdown structure, budget setup, budget checks, committed and actual tracking, overrun alerts, and the BvA Dashboard. The module's structure and labels are fixed and identical for every company. There is no per-company renaming or industry-based terminology.

## **5.1 Project Creation & Budget Setup**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a project manager, I want to create a new project and define its budget so that all subsequent financial activities can be tracked against an approved plan. | 1\. The PM logs into FastraSuite and navigates to the Project Costing Module. 2\. Clicks New Project 3\. Fills in project details:    \- Project Name    \- Project Code (auto-generated, editable)    \- Client Name    \- Project Type (Fixed Price / Time & Material / Cost Plus / Milestone-based)    \- Start Date    \- Expected End Date    \- Project Manager (auto-filled from logged-in user)    \- Description 4\. Navigates to the WBS menu and builds the project hierarchy 5\. Navigates to the Budget tab 6\. Attaches budget lines to activity WBS elements. 7\. A project cannot be activated without at least one budget line 8\. Saves the project in draft status 9\. Submits for approval. On approval, project status moves to active. | 1\. A project must have at least a name and a total budget to be saved. 2\. Budget must be broken down by WBS element. Not just by top-level category 3\. Budget lines can only be attached to activity WBS elements 4\. A project cannot be activated without at least one budget line attached to a activity WBS element 5\. Project status must follow the below: Draft → Pending Approval → Active → Completed / Closed 6\. Once active, budget lines cannot be deleted. They can be adjusted with PM-level permission only, and every adjustment generates an audit log entry. 7\. All budget revisions must be logged with the reason, old value, new value, and approving user. | 1\. The project creation form captures all required fields 2\. Budget breakdown by WBS element is required before a project can be activated 3\. Budget lines can only attach to activity elements — the system blocks attachment to parent elements 4\. Project moves to 'Active' status only after approval 5\. Budget edits on an Active project trigger a revision workflow 6\. All budget revision history is accessible in the project record 7\. Each project has a unique system-generated project code  |

 

## **5.1.1 Budget Import via Excel**

The PM can build a project's WBS and budget in bulk by uploading an Excel file instead of creating phases and activities one at a time through the interface. This creates the phase and activity structure and the budget line for each activity in a single step.

**Mandatory Columns**

| Column | Detail |
| ----- | ----- |
| S/N | A sequential row number. Used only for reference during upload, not stored as project data. |
| Phase | The name of the Level 1 Phase this row belongs to. |
| Activity | The name of the Level 2 Activity this row belongs to. |
| Quantity | Numeric input. |
| Rate | Numeric input. |
| Amount | The budget for this activity. Calculated automatically as quantity multiplied by rate. If the uploaded value differs from the calculated value, the system blocks the import entirely. The PM must correct the file and re-upload it. |

**Additional Columns**

The uploaded file can include columns beyond the six mandatory ones. Any extra column is added to the WBS record but stored as plain text, with no calculation or system logic applied to it. The PM can add or remove non-mandatory columns from the upload template as needed.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a project manager, I want to import my project's WBS and budget from an Excel file so that I can set up a large project structure quickly instead of building it line by line. | 1\. The PM opens the project and navigates to the WBS or Budget section.  2\. Clicks Import from Excel.  3\. Selects an Excel file from their device.  4\. The system checks that the six mandatory columns are present. If any is missing, the upload is rejected with a message naming the missing column.  5\. The system creates a phase for each unique phase name and an activity under the correct phase for each row.  6\. The system calculates the amount for each activity as quantity multiplied by rate. If any uploaded Amount differs from the calculated value, the import is rejected, and the PM is shown which rows failed and why.  7\. Any additional columns in the file are added to the WBS and stored as text.  8\. PM reviews the imported structure before confirming. If any rows failed the amount check, nothing is imported until the file is corrected and re-uploaded.  9\. PM confirms, and the WBS and budget lines are saved. | 1\. The upload requires exactly six mandatory columns: S/N, Phase, Activity, Quantity, Rate, and Amount. The import is rejected if any is missing.  2\. The amount is always calculated as Quantity multiplied by Rate, regardless of the value in the uploaded Amount column.  3\. If any uploaded amount does not match the calculated value, the system blocks the import entirely. No partial import occurs.  4\. Columns beyond the six mandatory ones are added to the WBS but stored as text, with no calculation applied.  5\. The PM can add or remove non-mandatory columns from the upload template.  6\. Budget lines created through import follow the same rule as manual entry; they can only attach to activity elements.  7\. Importing into a project that already has WBS elements adds to the existing structure rather than replacing it. | 1\. Import is rejected with a clear message if any mandatory column is missing.  2\. Phases and activities are created correctly from the phase and activity columns.  3\. The amount is calculated correctly as quantity multiplied by rate for every row.  4\. The system rejects the entire import if any row's uploaded amount differs from the calculated value and clearly identifies which rows failed.  5\. Extra columns appear on the WBS record as text only.  6\. The PM can customise the upload template by adding or removing non-mandatory columns.  7\. Imported budget lines attach only to activity elements, consistent with manually created ones. |

## **5.2 Project Dashboard & Analytics**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a project manager or stakeholder, I want to view a comprehensive project dashboard so that I can immediately understand project financial performance at a glance. | 1\. The user navigates to the project module and selects a project. 2\. Dashboard loads and displays:    \- Header: project name, status, PM name, start date, expected end date    \- Financial KPI cards: Budget, Actual, Committed, Remaining, Variance    \- Budget utilization bar (visual progress indicator)    \- Spend by category breakdown (chart)    \- Timeline view: spend over time vs the budget curve    \- Recent transactions list    \- Pending requests count and value    \- Budget health indicator (On Track / At Risk / Over Budget) 3\. The user expands WBS elements to view the financial breakdown at every hierarchy level.  4\. The user clicks on any financial figure to view underlying transactions. 5\. User applies filters by: Date range WBS element 6\. User reviews budget vs. actual analysis across all project activities  7\. User exports the financial summary as PDF. | 1\. The dashboard must display project financial data at every level of the WBS hierarchy.  2\. All financial figures must update in real time as transactions occur.  3\. The dashboard must support WBS drill-down from parent elements to activity level  4\. Clicking any financial figure must open the filtered list of contributing transactions.  5\. Budget health status must be calculated automatically using configured variance thresholds.  6\. The dashboard must support filtering by date range and WBS element. 7\. The spend-over-time chart must support comparison against the planned spend curve.  8\. Dashboard data must refresh automatically without manual page reload.  9\. The dashboard must load within 3 seconds for projects with up to 500 transactions.  10\. Dashboard data must be exportable as PDF and Excel.  11\. The export must include all visible KPIs, charts, and analysis tables  12\. The Pending Requests widget must display the count and total value of requests awaiting approval.  | 1\. The dashboard displays all required KPI cards correctly. 2\. All 8 budget vs. actual analysis columns display correctly for every WBS element. 3\. Financial figures update automatically when transactions occur 4\. Expanding a parent WBS element displays all child elements with their own financial data.  5\. Budget health indicators display correctly based on configured thresholds.  6\. Clicking any KPI or financial figure opens the correct filtered transaction list.  7\. Spend-by-category charts accurately reflect confirmed payments by category.  8\. Timeline charts update automatically as new payments are confirmed.  9\. Date range filters update all dashboard widgets and analysis tables simultaneously.  10\. Dashboard loads within 3 seconds for projects with up to 500 transactions  11\. PDF and Excel exports generate properly formatted reports with all visible dashboard data  12\. The Pending Requests widget displays the correct count and total value of outstanding approvals.  |

## 

## **5.3 Budget vs Actual Analysis**

**Dashboard Data Columns:**

For every WBS element, the dashboard displays:

| Column | Definition |
| :---- | :---- |
| WBS Element | The project phase, sub-phase, or activity using the company's configured terminology |
| Cost Category | The spending category |
| Budgeted Amount | The approved budget for this WBS element and cost code combination |
| Committed Amount | Approved but unpaid requests against this line |
| Actual Amount | Confirmed payments against this line |
| Remaining Budget | Budgeted − Committed − Actual |
| % Consumed | (Committed \+ Actual) ÷ Budgeted × 100 |
| Budget Health | On Track, At Risk, or Over Budget based on configured thresholds. |

**Budget Health Indicators:**

| Status | Condition |
| :---- | :---- |
| On Track | % Consumed is below the configured alert threshold. |
| At Risk | % Consumed is at or above the alert threshold but below 100%. |
| Over Budget | The actual amount plus the committed amount exceeds the budgeted amount. |

**5.3.1 Project Report Export**

The PM can export the BvA Dashboard for any project as a PDF, suitable for printing or sharing outside the system, for example with Hafeez or a client who doesn't have platform access.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a PM, I want to export my project's budget dashboard as a printable report so that I can share financial status with people outside the system or keep a dated record for my own files. | 1\. PM opens a project's BvA dashboard.  2\. Clicks Export or Print.  3\. The system generates a PDF containing the project summary and the full phase and activity breakdown exactly as shown on screen.  4\. PM downloads or prints the file. | 1\. The export reflects the dashboard's data at the exact moment of export, not a live link.  2\. The report includes the project summary and the full WBS breakdown, matching what is visible on the BvA Dashboard.  3\. The export is available to any user with view access to that project's BvA Dashboard.  4\. Exported reports are not stored in the system; they are generated on demand each time. | 1\. Clicking Export generates a PDF matching the current dashboard state.  2\. The PDF includes project summary figures and the phase and activity breakdown table.  3\. Only users with existing view access to the dashboard can trigger the export.  4\. The export completes within the same 5-second target already set for report generation in Section 11.1. |

 

## 

## **5.4 Budget Revision Workflow**

The project budget is displayed in a three-column grid. The Original Approved Budget column is permanently locked and can never be edited. The Approved Revision column accumulates all approved adjustment entries. The current budget column is always system-calculated as the original plus all approved revisions and can never be manually edited. 

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a project manager, I want to submit structured budget adjustments when project scope changes so that all budget changes are properly controlled, traceable, and approved without modifying the original approved budget.  | 1\. PM identifies the need for a budget change. 2\. PM opens the project and clicks Add Budget Adjustment 3\. PM adds one or more adjustment lines:     \- Adjust Existing Activity (select WBS activity and enter adjustment amount)      \- Add New Activity (create new WBS activity with budget) 4\. PM reviews the adjustment summary showing:      \- Original Approved Budget      \- Total Adjustment Value       \- New Calculated Budget 5\. PM submits the adjustment for approval. 6\. The approver reviews and either approves or rejects. 7\. On approval, the system applies adjustments and recalculates all budgets and WBS rollups. 8\. On rejection, no changes are applied, and the PM is notified of the reason. | 1\. The original approved budget must be locked after project activation. 2\. All budget changes must be stored as adjustment entries and never overwrite original values. 3\. Budget adjustments must be linked to WBS activities and cost codes. 4\. The system must support both:    \- Adjusting existing WBS activities    \- Adding new WBS activities 5\. All adjustments must go through an approval workflow before becoming active. 6\. Budget decreases are only allowed if enabled in system settings. 7\. The current approved budget must always be system-calculated. 8\. All adjustments must be fully auditable and stored in the revision history. 9\. New activities created through adjustment must automatically be added to the WBS. 10\. All WBS rollups must be updated. automatically after approval. | 1\. PM can access Add Budget Adjustment on active projects. 2\. PM can add both existing activity adjustments and new activities in one request. 3\. The system displays the original budget as read-only. 4\. The system calculates the updated budget before submission. 5\. An adjustment cannot be submitted if the WBS or cost code is missing. 6\. The approver receives notification when the adjustment is submitted. 7\. On approval, the system updates the WBS and budget automatically. 8\. On rejection, no financial or structural changes are applied. 9\. All approved adjustments are permanently stored and immutable. 10\. The current approved budget always equals the original budget plus approved adjustments.  |

# 

# **6\. Module Integration & Data Flows**

## **6.1 Overview**

All modules in FastraSuite are interconnected. The following describes how data originates in the Project Request Module and flows through the system, ultimately landing in the Project Costing Module as tracked financial data. Every transaction carries a mandatory WBS element reference that ensures costs are tracked at the correct level of the project hierarchy. Every payment processed in the Invoice Module is also automatically posted to the corresponding account in the Chart of Accounts based on the cost category-to-account mapping configured in Settings.

## **6.2 End-to-End Data Flow**

| Step | Action | Module Involved | Financial Impact on Project Costing |
| :---- | :---- | :---- | :---- |
| 1 | The user selects WBS components on site.  | Project Request Module | The user selects WBS components on-site. Project Request Module The available budget is displayed for reference.  |
| 2 | A site worker submits a request.  | Project Request Module | Request is created in the system (no financial impact). |
| 3 | The budget validation gate fires automatically. | Project Costing Module | System validates availability (no financial change).  |
| 4a | Request is within budget and proceeds to the approval queue.  | Project Request Module | Request is routed to the PM approval queue.  |
| 4b | Request exceeds budget threshold | Project Request Module | Request is flagged for attention but still proceeds to the PM approval queue. |
| 5 | The PM approves the request.  | Project Request Module | Request is marked as **committed** and linked to the WBS element and cost code.  |
| 6 | The back office processes the request; a PO is generated. | Invoice Module | A PO is issued and tracked (commitment remains active).  |
| 7 | PO approved and sent to vendor | Invoice Module | Committed amount maintained |
| 8 | Goods are received on-site; the supervisor confirms receipt and uploads supporting evidence.  | Inventory Module | Stock on hand is updated based on received quantity.  |
| 8b | System detects a quantity variance between the PO and the material receipt. | Inventory Module and Invoice Module | A variance alert is triggered, and Finance \+ PM are notified automatically.  |
| 9 | The processor opens the PO and clicks Create Bill. The vendor bill form opens pre-filled with confirmed received quantities (Path B) or PO quantities (Path A).  | Invoice Module | No change yet |
| 10 | The processor uploads the vendor invoice document and confirms quantities and unit prices. System flags any discrepancies inline on the form. The processor acknowledges discrepancies and submits the vendor bill.  | Invoice Module | No change yet  |
| 11 | The vendor bill appears in the payment queue  | Invoice Module | No change yet  |
| 12 | Finance approves payment. | Invoice Module | Committed amount releases; the actual amount increases for the tagged WBS element. |
| 13 | Project Costing Dashboard updates in real time | Project Costing Module | All KPIs recalculate: Budgeted, Committed, Actual, Remaining, % Consumed |
| 14 | For material consumption, stock deducted on validation | Inventory Module | Stock on hand is reduced by consumed quantity. Consumption recorded against WBS element for cost reporting purposes only. No new financial entry is created in the Project Costing Module.  |

## **6.3 Integration Rules**

1. A request in the Project Request Module must always be linked to an active project. Closed projects cannot receive new requests  
2. Every transaction across all modules must carry a valid WBS element reference. No transaction can be submitted without this field. Every payment processed in the Invoice Module must also be posted to an account in the Chart of Accounts based on the cost category-to-account mapping.  
3. The WBS element referenced must be a activity element; parent elements cannot receive transactions  
4. The Budget Validation Gate fires on every request submission across all modules without exception  
5. The WBS element reference must carry through from the originating request to every downstream module. The Cost Category assigned on the originating request determines which account the payment is posted to in the Invoice Module ledger   
6. Payment cancellation or reversal in the Invoice Module must trigger a reversal of the actual cost entry in the Project Costing Module  
7. The user with processor permission must be automatically notified when the stockkeeper confirms receipt so they can proceed to create the vendor bill. Finance must also be notified of any quantity shortfall between the PO quantity and the confirmed received quantity

## **6.4 Budget Commitment Logic**

| Event | Effect on Costing Engine |
| :---- | :---- |
| Request approved (within budget) | The committed amount increases by the approved value for the tagged WBS element and cost code |
| Request approved with PM override | The committed amount increases by the approved value |
| Request Rejected by PM  | The committed amount (if previously reserved) is released immediately.  |
| Approved Request Cancelled before Payment  | The committed amount is released immediately |
| Purchase Order Cancelled after Approval  | The committed amount is released immediately.  |
| Payment confirmed in Invoice Module | The committed amount is released, and the actual amount increases for the tagged WBS element and cost code. |
| Material consumption validated | Stock on hand is reduced by consumed quantity. Consumption recorded against WBS element for cost reporting. No financial entry in the Project Costing Module.  |
| Material consumption cancelled | The previously recorded actual amount is reversed immediately.  |
| Material Receipt confirmed | Inventory stock on hand increases by the actual quantity received |

# 

# **7\. Settings & Configuration**

Settings is not a business module. It has no requests, approvals, or financial or stock impact of its own; it exists to configure how the four business modules behave. Access is restricted to users with administrator permission on settings.

Settings are organized into four tabs:

1. **Company,** company details, registration info, base currency, industry selection, two-factor authentication policy, and subscription and billing.   
2. **User**, user account creation, and management per Section 3.3.  
3. **Permission Templates**, reusable permission configurations, per Section 8.5.  
4. **Modules**, configuration specific to each business module, organized into four sections: 7.1 Project Request Module Settings, 7.2 Project Costing Module Settings, 7.3 Invoice Module Settings, 7.4 Inventory Module Settings.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with administrator permission, I want to configure module-specific settings from one place so that I can adjust system behavior without navigating into each business module separately. | 1\. Administrator opens Settings and selects the Modules tab.  2\. Sees a list of the four business modules: Project Request, Project Costing, Invoice, and Inventory.  3\. Selects a module to view its settings.  4\. Sees that module's settings displayed as a list, each with its current value.  5\. The administrator changes a value, a number, a toggle, or a dropdown selection or opens a linked configuration screen where applicable.  6\. Administrator saves the change.  7\. The system confirms the change was saved.  8\. The new value applies immediately across the module – no restart or delay.  9\. The administrator can switch to a different module's settings at any time without losing unsaved changes elsewhere, since each module's settings save independently. | 1\. Only users with administrator permission can access the Modules tab or change any setting within it.  2\. Each of the four modules has its own settings section, matching Sections 7.1 through 7.4.  3\. Every setting change takes effect immediately upon saving, with no separate deployment or restart step.  4\. Settings changes are not individually recorded in the audit trail.  5\. Settings with a fixed default show that default clearly until changed.  6\. A setting that links to a fuller configuration screen, such as Request Type to Account Mapping, opens that screen rather than editing inline. | 1\. The Modules tab displays all four business modules.  2\. Selecting a module shows only that module's settings.  3\. Administrator permission is required to view or edit any setting under Modules.  4\. Saving a change updates the value immediately and shows a confirmation.  5\. No audit trail entry is created for settings changes. 6\. Settings that link to a separate screen, rather than an inline value, open that screen correctly. |

## **7.1 Project Request Module Settings**

| Setting | Description |
| :---- | :---- |
| Notify on Submission | Send a notification to the approver on new submission. Enabled by default |
| Notify on Approval | Send a notification to the submitter on approval or rejection. This is enabled by default |
| Auto-create Back-Office Record on Submission | Automatically create a draft PR or invoice on request submission. This is enabled by default |
| Allow Resubmission After Rejection | Allow submitters to revise and resubmit rejected requests. Enabled by default |

## **7.2 Project Costing Module Settings**

| Setting | Description |
| :---- | :---- |
| Company Default Alert Threshold | Default consumption percentage that triggers the Overrun Alert System; default: 80% |
| Budget Revision Requires Approval | Require formal approval for all budget changes on active projects, enabled by default. |
| Allow Budget Decrease | Allow the project budget to be reduced via revision; disabled by default |
| Default Project Currency | Set the base currency for all project financial data: system default. |
| Dashboard Auto-Refresh Interval | How often the dashboard refreshes financial data: default: 5 minutes |

## **7.3 Invoice Module Settings**

| Setting | Description |
| ----- | ----- |
| Petty Cash Limit | The maximum amount permitted on a single petty cash request. Configurable by the administrator. If a request exceeds this limit, the system warns the user and suggests a purchase request instead. |
| Request Type to Account Mapping | Configuration linking each request type to its expense account in the Chart of Accounts. See Section 9.7. |
| Payment Path | Company-wide choice of Pay Before Receiving, Path A, or Receive Before Paying, Path B. Set once by the administrator. Applies to every goods-based purchase order. |

## **7.4 Inventory Module Settings**

| Setting | Description |
| ----- | ----- |
| Optional Waybill Photo on Receipt | When enabled, it requires the stockkeeper to upload a photo or document before a receipt can be validated. When disabled, photo upload is optional. Default: disabled. |
| Low Stock Alert Recipients | Configurable list of users who receive low-stock notifications. Default: users with manager permission on the inventory module. |
| Default Location | The default warehouse location for all inventory operations. Automatically set when the company creates its first location. |

# **8\. Access Control & Roles**

## **8.1 Design Principle**

FastraSuite does not enforce fixed job title roles across all companies. Different organisations are structured differently, use different job titles, and assign responsibilities differently. Forcing every company into a predefined role structure creates friction and limits the flexibility that a SaaS platform should offer.

Instead, FastraSuite uses a permission-based access control system. When a company admin creates a user account, they configure that user's permissions directly across all modules in one screen. There are no mandatory role assignments and no group structures that every user must fit into.

For companies with large teams where many users share the same permissions, the admin can create optional permission templates to speed up user creation. Templates are not mandatory. They exist only to save time.

## **8.2 The Seven Permission Types**

FastraSuite has seven permission types. These are defined by the system and do not change. They describe what a user can do, not what their job title is.

| Permission Type | What It Allows |
| ----- | ----- |
| Requester | Create and submit requests. The user can initiate activity in the system. |
| Reviewer | View records, dashboards, and reports. The user can see what is happening but cannot take any action. |
| Approver | Approve or reject requests, budgets, and adjustments submitted by others. A user with this permission cannot approve their own submissions. |
| Processor | Convert approved requests into purchase orders and manage the payment queue. |
| Payer | Authorize and execute payments. This is the most sensitive permission in the system. |
| Manager | Create projects, build the WBS, set and adjust budgets, and configure project-level settings. |
| Administrator | Manage users, configure permissions, manage cost codes, and configure company-wide settings. |

## **8.3 Permission Types by Module**

Not every permission type applies to every module. Where a permission type has no relevance to a module, it is not shown on that module's column in the permissions grid and cannot be selected.

**Project Request Module**

| Permission Type | What the User Can Do |
| ----- | ----- |
| Requester | Create and submit purchase requests, labour requests, petty cash requests, plant and equipment requests, and material consumption requests. |
| Reviewer | View all requests across their assigned projects. Cannot submit, approve, or take any action. |
| Approver | Approve or reject requests submitted by others. Cannot approve requests they submitted themselves. |
| Manager | Submit Subcontractor Requests. Subcontractor requests are restricted to users with manager permission because they involve contracts and significant financial commitments. View all requests across all projects. |
| Administrator | Full access, including managing the chart of accounts, managing vendor profiles and bank details, and configuring the request type to account mapping.  |

**Project Costing Module**

| Permission Type | What the User Can Do |
| ----- | ----- |
| Reviewer | View the BvA Dashboard, project financial summary, and all reports. Cannot make any changes. |
| Approver | Approve or reject project budgets and budget adjustment requests submitted by others. |
| Manager | Create projects, build the WBS, set up project budgets, submit budget adjustment requests, configure project-level alert thresholds, and generate and export reports. |
| Administrator | Full access including closing and archiving projects, configuring company-wide alert thresholds, and managing the cost category library. |

**Invoice Module**

| Permission Type | What the User Can Do |
| ----- | ----- |
| Reviewer | View approved requests, purchase orders, the payment queue, and the cash flow view. Cannot take any action. |
| Approver | Approve invoices for payment processing. |
| Processor | Convert approved requests to purchase orders, manage the payment queue, and mark hired equipment as returned in Equipment Hire Tracking. |
| Payer | Execute payments directly from the payment queue. The Pay button is only active for users with Payer permission. No other permission type grants the ability to complete a payment. |
| Administrator | Full access, including configuring the 2-point match tolerance. |

**Inventory Module**

| Permission Type | What the User Can Do |
| ----- | ----- |
| Requester | Submit Material Consumption Requests. |
| Reviewer | View stock on hand and the inventory ledger. Cannot make any changes. |
| Approver | Confirm material receipts. Approve material consumption requests. |
| Manager | Configure low stock alert thresholds per material item per site. |
| Administrator | Full access including manual stock adjustments. Every manual adjustment requires a mandatory reason and generates a permanent audit log entry. |

**Settings**

| Permission Type | What the User Can Do |
| ----- | ----- |
| Administrator | Manage users, configure permissions, manage permission templates, and configure company-wide settings. Only users with administrator permission on settings can access the settings module. |

## **8.4 How User Permissions Are Configured**

When the company admin creates a new user account, they configure that user's permissions directly in one screen. There are no separate group screens or group assignments. The admin sees a single permissions grid covering all modules and ticks exactly what that specific user needs.

**The Permissions Grid**

The grid has modules as rows and permission types as columns. The admin ticks the permissions relevant to that user. Where a permission type does not apply to a module, that cell is not shown and cannot be selected.

| Module | Requester | Reviewer | Approver | Processor | Payer | Manager | Administrator |
| :---- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Project Request Module | ☐ | ☐ | ☐ |  |  | ☐ | ☐ |
| Project Costing Module |  | ☐ | ☐ |  |  | ☐ | ☐ |
| Invoice Module |  | ☐ | ☐ | ☐ | ☐ |  | ☐ |
| Inventory Module | ☐ | ☐ | ☐ |  |  | ☐ | ☐ |
| Settings |  |  |  |  |  |  | ☐ |

The admin saves the configuration, and the user's permissions are active immediately

## **8.5 Permission Templates**

For companies with large teams where many users share the same permissions, the Company Admin can create named permission templates. A template is a pre-saved permissions grid configuration that the admin can apply when creating a new user to pre-fill their permissions grid.

How templates work:

1. Admin navigates to Settings and selects Permission Templates  
2. Clicks Create New Template  
3. Enters a template name of their choosing  
4. Configures the permissions grid for that template  
5. Saves the template

When creating a new user, the admin can optionally select a template to pre-fill the permissions grid. After applying the template, the admin can still adjust individual permissions for that specific user before saving. The template is a starting point, not a fixed assignment.

**Important:** Templates are entirely optional. A company with a small team or unique user structures can configure every user individually without creating any templates. The system works fully without them.

**Template rules:**

A template can be edited at any time. Editing a template does not retroactively change the permissions of users who were previously created using that template. Each user's permissions are independent once saved. A template can be archived when it is no longer needed. An archived template cannot be applied to new users, but existing users are not affected.

## **8.6 Unbreakable System Rules**

These rules apply regardless of how permissions are configured. They cannot be overridden by any admin or any permission configuration.

**Rule 1:** No Self-Approval

A user cannot approve any request, budget, or adjustment they submitted themselves. If a user has both Requester and Approver permissions, the system automatically routes their own submissions to another user with approver permission. If no other approver is available, the submission is held and the administrator is notified.

**Rule 2:** Super Admin Is Unrestricted

The Company Super Admin, the first person to register the company on FastraSuite, has full access to all actions across all modules at all times. This cannot be restricted by any permission configuration.

## **8.7 General Permission Rules**

**Immediate effect:** Changes to a user's permissions take effect immediately. The user does not need to log out and log back in.

**Hidden not disabled:** If a user does not have permission for an action, that action is not visible to them at all. They do not see a greyed-out button. The option simply does not appear on their screen.

**Exception—Pay Button:** The Pay button in the payment queue is an exception to the "hidden, not disabled" rule. It is visible to all users who can access the queue but is active only for users with Payer permission. This exception exists so that processors and reviewers can see the payment status of a vendor bill without being able to execute the payment. 

**Minimum permission:** A user with no permissions ticked on a module cannot access that module at all. The module tile does not appear on their dashboard.

**Cumulative permissions:** Permissions within the same module are independent of each other. A user can have Reviewer and Approver permissions on the Project Costing Module simultaneously, giving them the ability to view and also approve budgets.

## **8.8 Typical Permission Configurations by Function**

These are examples only. Companies can configure permissions in any way that fits their structure.

| Typical Function | Suggested Permissions |
| ----- | ----- |
| Field worker submitting requests | Requester on Project Request Module and Inventory Module |
| Person reviewing and approving site requests | Reviewer and Approver on Project Request Module |
| Person managing projects and budgets | Manager on Project Costing Module and Approver on Project Request Module |
| Person monitoring financial performance only | Reviewer on Project Costing Module and Invoice Module |
| Person processing purchase orders | Processor on Invoice Module and Reviewer on Project Request Module |
| Person authorising payments | Payer and Approver on Invoice Module |
| Person managing stock on site | Approver and Reviewer on Inventory Module |
| Person managing the whole system | Administrator on Settings |

The following roles and permissions apply across both new modules. These are configurable via the existing Access Groups feature in the Settings module.

 

# **9\. Invoice Module**

The Invoice Module is the payment control hub for FastraSuite Core. It receives approved requests from the Project Request Module, converts applicable requests into purchase orders, checks vendor invoices for discrepancies before payment, manages the payment queue, and processes all payments. Every financial transaction processed in this module updates the Project Costing Module in real time.

## **9.1 Module Overview**

The invoice module handles four distinct areas:

| Area | What It Does |
| ----- | ----- |
| Purchase Orders | Converts approved spending requests into formal Purchase Orders issued to vendors |
| Vendor Bills | Converts Purchase Orders into Vendor Bills for payment processing. Supports Pay Before Receiving and Receive Before Paying paths for goods-based requests and completion-based payment for subcontractor requests. |
| Direct Payments | Processes labour requests and petty cash requests directly without a purchase order. |
| Payment Queue | Holds all submitted vendor bills and disbursements ready for payment. |
| Account Ledger | Complete chronological record of all financial transactions posted to each account in the Chart of Accounts. |
| Chart of Accounts | The structured list of all financial accounts the company uses to record transactions |
| Vendor Management | Maintains complete vendor profiles including bank details used for payment processing |

## 

## **9.2 Purchase Orders and Vendor Bills** 

In the Core tier, purchase orders live inside the invoice module. When a spending request is approved in the Project Request Module, it appears in the Invoice Module as a pending item. The user with processor permission converts it into a purchase order and issues it to the vendor. When it is time to process payment, the processor converts the PO into a vendor bill.

Not all request types require a purchase order. Labour requests and petty cash requests are processed as direct payments without a PO. Material consumption requests involve no external payment.

| Request Type | Requires PO |
| ----- | ----- |
| Purchase Request | Yes |
| Subcontractor Request | Yes |
| Plant and Equipment Request | Yes |
| Labour Request | No. Processed as a direct Vendor Bill without a PO |
| Petty Cash Request | No. Processed as a direct disbursement without a PO |
| Material Consumption Request | No. No external payment is made |

The PO-to-vendor bill conversion follows one of three paths depending on the nature of the request.

**Path A** is used when the company chooses to pay before receiving goods.  
**Path B** is used when the company chooses to receive goods before paying.  
**ath C** is used for all subcontractor requests regardless of payment type.

### **9.2.1 Path A and Path B — Goods-Based PO to Vendor Bill**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with processor permission, I want to convert approved spending requests into purchase orders and then into vendor bills so that all external vendor payments are formally documented and based on verified information before money is released. | **PO Creation (both paths):**  1\. A user with processor permission opens the Invoice Module and navigates to the Approved Request menu.  2\. Sees a list of approved requests that require a PO, each showing the request ID, request type, vendor name, WBS element, and request cost.  3\. Selects a request and clicks Convert to Purchase Order.  4\. Fills and reviews the pre-filled PO details—vendor name, line items, quantities, agreed unit price, WBS element, and payment terms.  5\. Confirms and issues the PO.  6\. The PO is assigned a unique system-generated ID.  7\. The Committed Amount in the Project Costing Module is maintained against the tagged WBS element.  **Path A — Pay Before Receiving:**  1\. processor opens the issued PO and clicks Create Bill without waiting for goods to arrive.  2\. The Vendor Bill form opens pre-filled with the PO quantities and unit prices. 3\. The processor uploads the vendor invoice document as a PDF or image.  4\. The processor confirms the unit price from the vendor invoice on each line item.  5\. The processor reviews the pre-filled line items against the vendor invoice document and adjusts any figures where the vendor has billed differently from the PO.  6\. The processor selects the company bank account the payment will go out from. 7\. The processor clicks Submit. 8\. If the processor also holds payer permission, the Pay button becomes active on the same page, and they click Pay to complete payment immediately. 9\. If not, the vendor bill moves to the Payment Queue in the 'In Payment Queue' status. A user with Payer permission opens it, can change the selected bank account if needed, and clicks Pay. 10\. The committed amount is released, and the actual amount increases in the Project Costing Module. 11\. When goods arrive later, the stockkeeper confirms receipt in the inventory module. 12\. The Received column on the PO updates automatically with the confirmed quantities. 13\. Stock on hand increases by the confirmed received quantities. **Path B — Receive Before Paying:**  1\. Goods arrive on site.  2\. The stockkeeper opens the inventory module, navigates to expected deliveries, and confirms the actual quantities received for each line item on the PO. 3\. The Received column on the PO updates automatically with the confirmed quantities.  4\. Stock on hand increases by the confirmed received quantities.  5\. The system sends a notification to Finance that receipt has been confirmed, and the PO is ready to be billed.  6\. The Create Bill button becomes active on the PO record.  7\. The processor opens the PO and clicks Create Bill.  8\. The vendor bill form opens pre-filled with the confirmed received quantities from the stockkeeper.  9\. If the pre-filled quantity differs from the original PO quantity on any line, the system notifies the processor of the difference. The processor can still proceed.  10\. The Processor uploads the vendor invoice document as a PDF or image.  11\. The processor confirms the unit price from the vendor invoice on each line item.  12\. The processor reviews the pre-filled quantities and unit prices against the vendor invoice and adjusts where the vendor has billed differently. Any difference is handled by the processor directly with the vendor outside the system. The processor adds the bank account selection before submission. 13\. If the processor also holds payer permission, the Pay button becomes active on the same page, and they click Pay to complete payment immediately.  14\. If not, the vendor bill moves to the Payment Queue in In Payment Queue status. A user with Payer permission opens it and can change the selected bank account if needed, and clicks Pay.   15\. The committed amount is released, and the actual amount increases in the Project Costing Module.  | 1\. Only approved requests from the Project Request Module can be converted to a PO. The processor cannot create a PO from scratch. 2\. Every PO carries the WBS element and the originating Project Request ID. 3\. For Path A, Create Bill is available immediately after the PO is issued. For Path B, it becomes active only after the stockkeeper confirms at least one delivery. 4\. Finance is notified automatically when the stockkeeper confirms receipt, and the PO is ready to be billed. 5\. The vendor bill pre-fills with PO quantities for Path A and confirmed received quantities for Path B. 6\. Vendor invoice upload is optional and never blocks submission. 7\. If the processor enters a unit price or quantity that differs from the PO, the system notifies them before submission but does not block it. The unit price field is editable. 8\. Partial billing and partial payment are supported. Each partial payment releases only the corresponding portion of the Committed Amount. The PO stays open until fully billed or manually closed. 9\. Cancelling a PO releases the full committed amount immediately. 10\. On upgrade to enterprise, all PO data migrate automatically to the Purchase Module. 11\. If a Path A receipt shows less than what was paid for, the system flags the payment and prompts a supplier return. The payment is not reversed, and the flag stays until an administrator resolves it. 12\. The processor selects the company bank account the payment will go out from when creating the vendor bill. If the processor also holds payer permission, Pay activates on the same page after submission. Otherwise, the Vendor Bill enters the payment queue, where the payer can change the bank account before confirming.  | 1\. Approved requests appear in the Purchase Orders section automatically after PM approval, prefilled from the originating request. 2\. Every PO and every vendor bill is assigned a unique system-generated ID. 3\. Create Bill activates correctly for both paths: immediately for Path A and after stockkeeper confirmation for Path B. 4\. The vendor bill prefills correctly for each path. 5\. The system notifies the Processor of any price or quantity difference from the PO without blocking submission. 6\. Partial bills and partial payments work correctly, and the PO remains open until fully billed or closed. 7\. Cancelling a PO releases the full Committed Amount immediately. 8\. The PO list is filterable by vendor, status, WBS element, and date range. 9\. The processor selects a company bank account before the vendor bill can be submitted. 10\. Payment activates on the same page immediately after Submit for users holding both Processor and Payer permission. 11\. Users without payer permission see the vendor bill move to the payment queue after submission, where the payer can change the bank account before paying.  |

### **9.2.2 Path C — Subcontractor Payment**

The subcontractor request supports two payment structures: lump sum and milestone-based. The verification trigger for subcontractor payment is the PM confirming work completion, not the stockkeeper confirming goods receipt. There is no physical delivery to confirm.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with processor permission, I want to convert an approved subcontractor. Request a purchase order and then a vendor bill based on confirmed work completion so that subcontractor payments are tied to verified progress and cannot be released without proper authorization. | **PO Creation:**  1\. A user with processor permission opens the Invoice Module and navigates to approved requests.  2\. Sees the approved Subcontractor Request showing the subcontractor name, scope of work, contract value, payment type (lump sum or milestone-based), and WBS element.  3\. Clicks Convert to Purchase Order.  4\. Reviews the pre-filled PO details. For milestone-based, the PO displays all defined milestones with their individual values and completion criteria.  5\. Confirms and issues the PO to the subcontractor.  6\. The full contract value is maintained as the committed amount in the project costing module.  **Lump Sum Path:**  1\. Subcontractor completes the work.  2\. The PM opens the PO record in the Invoice Module and clicks Mark as Complete.  3\. PM enters a mandatory completion note confirming the work was completed satisfactorily.  4\. The system records the completion confirmation with the PM name, timestamp, and completion note.  5\. The Create Bill button becomes active on the PO record.  6\. Processor opens the PO and clicks Create Bill.  7\. The vendor bill form opens pre-filled with the full contract value and the PM completion confirmation details.  8\. Processor uploads the subcontractor invoice document as a PDF or image.  9\. Processor confirms the billed amount from the subcontractor invoice. If it differs from the PO contract value, the system flags the discrepancy. 10\. Processor selects the company bank account the payment will go out from.  11\. The processor submits the vendor bill.  12\. If the processor also holds payer permission, the Pay button becomes active on the same page, and they click Pay to complete payment immediately.   13\. If not, the vendor bill moves to the Payment Queue in the 'In Payment Queue' status. A user with Payer permission opens it, can change the selected bank account if needed, and clicks Pay.  14\. The Committed Amount is released, and the actual amount increases in the project costing module.  **Milestone-Based Path:**  1\. Subcontractor completes Milestone 1\.  2\. The PM opens the PO record and clicks Mark Milestone 1 as Complete.  3\. PM enters a mandatory completion note for Milestone 1\.  4\. The system records the completion with the PM name, timestamp, and note.  5\. The Create Bill button becomes active for Milestone 1 only. Remaining milestones remain locked.  6\. The processor creates a vendor bill for the Milestone 1 value only.  7\. Processor uploads the subcontractor invoice for Milestone 1\.  8\. The processor confirms the billed amount for Milestone 1\. If it differs from the Milestone 1 value on the PO, the system flags the discrepancy.  9\. Processor selects the company bank account the payment will go out from. 10\. Processor clicks Submit. 11\. If the processor also holds payer permission, the Pay button becomes active on the same page, and they click Pay to complete the Milestone 1 payment immediately.  12\. If not, the vendor bill moves to the Payment Queue in In Payment Queue status. A user with Payer permission opens it, can change the selected bank account if needed, and clicks Pay.  13\. Only the Milestone 1 committed amount is released. Remaining milestone committed amounts stay active.  14\. Process repeats for each subsequent milestone as the PM marks them complete. | 1\. The Subcontractor Request must have been approved by a user with Approver permission who is not the PM who raised the request. The no self-approval rule applies.  2\. The Create Bill button on a Subcontractor PO becomes active only after the PM has marked the work or the relevant milestone as complete. There is no stockkeeper involvement in subcontractor payments.  3\. The PM must enter a mandatory completion note when marking work or a milestone as complete. The system blocks completion confirmation without it.  4\. The PM who raised the Subcontractor Request cannot financially approve their own request. However, the PM can confirm work or milestone completion on the subcontractor engagement. Work completion confirmation is an operational action performed by the PM as the person responsible for the project and is not subject to the no-self-approval rule.  5\. For a lump sum, marking the work as complete activates the Create Bill button for the full contract value.  6\. For milestones – Based on this, marking a milestone as complete activates the Create Bill button for that milestone value only. Subsequent milestones remain locked until the PM marks each one complete in sequence.  7\. The Vendor Bill form pre-fills with the contract value for a lump sum or the individual milestone value for milestones.  8\. The processor must upload the subcontractor invoice document before the vendor bill. can be submitted.  9\. The system flags any discrepancy between the subcontractor invoice amount and the PO value or milestone value before submission.  10\. For the milestone, based on payments, each milestone payment releases only that milestone's portion of the Committed Amount. Remaining milestone committed amounts stay active until each milestone is paid.  11\. The PM completion confirmation is permanently recorded on the PO record with the PM name, timestamp, and completion note. This entry is immutable.  12\. If a subcontractor PO is cancelled, the full remaining Committed Amount is released immediately in the Project Costing Module. 13\. The processor selects the company bank account when creating the vendor bill. If they also hold payer permission, Pay activates on the same page after submit. Otherwise, the Vendor Bill enters the Payment Queue as In Payment Queue, where the Payer can change the bank account before paying. Vendor bank details stay locked and auto-filled throughout.  | 1\. Approved subcontractor requests appear in the Purchase Orders section automatically.  2\. For a lump sum, the Create Bill button is inactive until the PM marks the work as complete.  3\. For Milestone-Based, each milestone's The Create Bill button is inactive until the PM marks that specific milestone as complete.  4\. System blocks completion confirmation without a mandatory completion note.  5\. The PM can confirm work or milestone completion regardless of whether they raised the original request. The no-self-approval rule applies only to the approval of the request.  6\. PM completion confirmation is permanently recorded on the PO with name, timestamp, and note. This entry cannot be edited or deleted.  7\. The vendor bill pre-fills with the correct value—full contract value for lump sums and individual milestone value for milestone-based ones. 8\. Uploading a subcontractor invoice document is optional. The system does not block submission without one.  9\. When the processor enters a unit price or quantity that differs from the PO value on any line, the system notifies the processor to process the difference before submission. The processor can still proceed. Submission is not blocked.  10\. For the milestone: Based on that, each milestone payment releases only that milestone's committed amount. Remaining milestones stay committed.  11\. Cancelling a Subcontractor PO releases the full remaining Committed Amount immediately.  12\. Each Vendor Bill is assigned a unique system-generated ID. |

### **9.2.3 PO Status Definitions**

| Status | Description | Next Possible Statuses |
| ----- | ----- | ----- |
| Draft | PO has been created but not yet issued to the vendor | Issued, Cancelled |
| Issued | PO has been confirmed and sent to the vendor | Partially Received, Fully Received, Partially Billed, Fully Billed, Cancelled |
| Partially Received | Some but not all line items have been confirmed received by the stockkeeper | Fully Received, Partially Billed, Cancelled |
| Fully Received | All line items have been confirmed received by the stockkeeper | Partially Billed, Fully Billed |
| Partially Billed | A Vendor Bill has been created for part of the PO value. Outstanding balance remains. | Fully Billed, Cancelled |
| Fully Billed | Vendor Bills have been created for the full PO value | Closed |
| Cancelled | The PO was cancelled before full payment. The committed amount was released immediately. | None |

For Subcontractor POs, the status definitions follow the same pattern but replace receipt-based statuses with completion-based statuses:

| Status | Description | Next Possible Statuses: |
| ----- | ----- | ----- |
| Draft | PO created but not yet issued | Issued, Cancelled |
| Issued | PO issued to subcontractor. Work not yet started or in progress. | Partially Complete, Fully Complete, Cancelled |
| Partially Complete | Some milestones have been marked complete by the PM. Applies to milestone-based only. | Fully Complete, Partially Billed, Cancelled |
| Fully Complete | PM has marked all work or all milestones as complete | Partially Billed, Fully Billed |
| Partially Billed | A vendor bill was created for some milestones. Outstanding milestones remain. | Fully Billed, Cancelled |
| Fully Billed | Vendor bills were created for the full contract value | Closed |
| Closed | All payments confirmed and PO is complete | None |
| Cancelled | The PO was cancelled before full payment. The remaining committed amount is released immediately. | None |

### **9.2.4 Equipment Hire Tracking**

Equipment Hire Tracking covers hired or rented equipment only. Purchased equipment has no tracking beyond the standard payment record. There is no goods receipt step for hired equipment, since payment is made before the equipment arrives on site. This tracking does not affect or delay payment processing in any way.

**Hire Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Hire ID | Generated automatically on creation |
| Related PO | Prefilled from the originating purchase order. Not editable. |
| Equipment Description | Prefilled from the originating request. Not editable. |
| Vendor | Prefilled from the originating PO. Not editable. |
| Hire Start Date | Filled automatically with the date the PO is issued |
| Expected Return Date | Prefilled from the originating request. Editable by a user with Processor permission if the hire period changes. |
| Status | On Hire, Overdue, or Returned |

**Hire Status Definitions**

| Status | Description | Next Possible Statuses |
| ----- | ----- | ----- |
| On Hire | The equipment is currently out on hire. The Expected Return Date has not yet passed. | Returned, Overdue |
| Overdue | The expected return date has passed, and the equipment has not been marked returned. | Returned |
| Returned | A user has confirmed the equipment has been returned. | None |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with processor permission on the invoice module, I want to track hired equipment and know when it is due back so that the company avoids unnecessary extension charges and always knows what equipment is currently off-site. | 1\. An approved Plant and Equipment Request with Payment Type set to 'Hire' is converted to a PO by the processor.  2\. Once the PO is issued, a hire record is created automatically, prefilled with the equipment description, vendor, and expected return date from the originating request.  3\. The hire record status is set to on hire.  4\. If the Expected Return Date passes with no action taken, the status changes automatically to Overdue.  5\. The system sends a notification to the original requester and the project manager as the expected return date approaches and again if it passes with no action taken.  6\. When the equipment is physically returned, a user with processor permission opens the hire record and clicks Mark Returned.  7\. The status updates to Returned.  8\. Payment processing for the original PO and vendor bill continues on its own path in Section 9.2.1, entirely unaffected by the hire record status. | 1\. A hire record is created automatically only when the originating request has the payment type set to 'hire'. Purchase requests never create a hire record.  2\. The hire record is created at the point the PO is issued, not at any later confirmation step, since there is no goods receipt for hired equipment.  3\. The expected return date on the hire record is prefilled from the originating request and can be edited by a user with processor permission if the hire period changes.  4\. The system checks Expected Return Dates continuously and updates any On Hire record to Overdue automatically once the date has passed without a Mark Returned action.  5\. The system sends a notification to the original requester and the project manager as the return date approaches and again if it becomes overdue.  6\. Only a user with Processor permission can mark a hire record as returned.  7\. The hire record has no effect on the committed amount, actual amount, or any step in the payment process. It is purely an operational record. | 1\. A hire record appears automatically once a PO with payment type 'hire' is issued.  2\. The hire record pre-fills correctly from the originating request.  3\. Status changes automatically from On Hire to Overdue when the Expected Return Date passes with no action.  4\. Notifications fire correctly as the return date approaches and again if it becomes overdue.  5\. Only users with processor permission can edit the Expected Return Date or click Mark Returned.  6\. Marking a record Returned updates its status immediately and permanently.  7\. No Hire record activity changes any figure in the Project Costing Module. |

## 

## **9.3 Direct Payments—Labour and Petty Cash**

Labour requests and petty cash requests do not require a purchase order. When approved, they appear in the Invoice Module as direct payment items under the approved request menu. The processor creates a vendor bill directly from the approved request without a PO conversion step.

### 

### **9.3.1 Labour Request Direct Payment**

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with processor permission, I want to process payment for an approved labour request directly as a vendor bill without a purchase order so that labour costs are paid promptly and recorded accurately against the correct project and WBS element. | 1\. A user with processor permission opens the Invoice Module and navigates to Approved Request.  2\. Sees a list of approved requests that require direct payment, including labour requests, each showing the request ID, request ID, WBS element, cost, and approval date.  3\. Selects the labor request and clicks Create a vendor bill.  4\. The vendor bill form opens pre-filled with the following details from the approved request: Vendor Bill ID (auto-generated), labour supplier name or contractor name, WBS element, projected cost as the bill amount, and payment terms.  5\. The processor optionally uploads the labour invoice or timesheet document from the supplier as a PDF or image.  6\. Processor confirms the billed amount from the supplier invoice.  7\. If the supplier invoice amount differs from the approved projected cost, the system flags the discrepancy on the form before submission.  8\. The processor acknowledges any flagged discrepancy and submits the vendor bill.  9\. Processor selects the company bank account the payment will go out from. 10\. Processor clicks Submit. 11\. If the processor also holds payer permission, the Pay button becomes active on the same page, and they click Pay to complete payment immediately. 12\. If not, the vendor bill moves to the payment queue in 'In Payment Queue' status. A user with Payer permission opens it, can change the selected bank account if needed, and clicks Pay.  13\. The committed amount is released, and the actual amount increases in the Project Costing Module for the tagged WBS Element.  | 1\. Labour requests direct payments do not require a purchase order. The processor creates the vendor bill directly from the approved request.  2\. The vendor bill form pre-fills with all details from the approved labour request.  3\. Document upload is optional and never blocks submission. 4\. The system flags any discrepancy between the supplier invoice amount and the approved projected cost before submission. 5\. The processor selects the company bank account when creating the vendor bill. If they also hold payer permission, Pay activates on the same page after submission. Otherwise, the Vendor Bill enters the Payment Queue, where the Payer can change the bank account before paying.   6\. The committed amount is released and the actual amount increases when payment is confirmed. 7\. Payment is made to the labour supplier's bank account as stored in their vendor record. Bank details cannot be edited at the point of payment.  8\. The labour supplier must exist as a vendor with confirmed bank details before payment can be processed.  | 1\. Approved labour requests appear in the Direct Payments section of the Invoice Module automatically after PM approval.  2\. The Vendor Bill form pre-fills with all details from the approved request.  3\. Document upload does not block submission. 4\. Discrepancies between the supplier invoice amount and the approved projected cost are flagged before submission.   5\. The Processor selects a company bank account before the Vendor Bill can be submitted. 6\. Pay activates on the same page immediately after Submit for users holding both Processor and Payer permission. 7\. Users without Payer permission see the Vendor Bill move to the Payment Queue after Submit, where the Payer can change the bank account before paying. 8\. Payment releases the Committed Amount and increases the Actual Amount in the Project Costing Module. 9\. The system blocks payment if the labour supplier has no confirmed bank details on file.  10\. Each Vendor Bill is assigned a unique system generated ID.  |

### 

### **9.3.2 Petty Cash Request Direct Payment**

Petty cash disbursements do not involve a vendor. The processor selects the actual expense account the money was spent against and the account the money is paid from, directly on the disbursement form. Both selections are made by the same person, at the same time. 

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with Processor permission, I want to process a disbursement for an approved petty cash request directly so that the site worker receives the funds promptly and the cost is recorded accurately against the correct project and WBS element. | 1\. A user with processor permission opens the invoice. Module and navigates to Direct Payments.  2\. Sees the approved petty cash request showing the request ID, requester name, WBS element, amount requested, purpose, and date.  3\. Selects the Petty Cash Request and clicks Process Disbursement.  4\. Disbursement form opens pre-filled with the following details: Petty Cash Reference  (auto-generated), requester name, WBS element, petty cash and miscellaneous, amount approved, and purpose.  5\. Processor selects the company bank account the disbursement is going out from. The dropdown shows all active bank accounts configured under Assets in the Chart of Accounts.   6\. **For bank transfer**: the processor enters the recipient's bank account details.  **For physical cash handouts,** the processor selects the petty cash float account the cash is coming from, records the name of the person receiving the cash, and ticks a confirmation that the cash was physically handed over. The processor is encouraged to upload a photo of the signed petty cash voucher as supporting evidence — this is not mandatory, but its absence is noted in the audit trail.  7\. Processor submits the disbursement.  8\. The disbursement appears in the Payment Queue. The user with payer permission clicks 'pay', and the disbursement is processed.  9\. Payment is made to the requester.  10\. On payment, the account ledger automatically posts a debit to the petty cash and miscellaneous expense account and a credit to the selected company bank account.   | 1\. Petty cash request disbursements do not require a purchase order.  2\. The disbursement form pre-fills with all details from the approved petty cash request.  3\. The processor must select the company bank account the disbursement is going out from before submission.  4\. The disbursement supports two payment methods: bank transfer to the requester's account or physical cash handout recorded manually by the processor.  5\. For bank transfer disbursements, the recipient bank account details must be entered before submission.  6\. For physical cash handouts, the processor records the recipient's name and confirms the handover before finalising. A photo showing acknowledgement is encouraged but not mandatory.  7\. A Petty Cash Request creates a Committed Amount at the point of submission. It releases if the request is rejected or cancelled. It converts to the actual amount when disbursement is paid.  8\. The disbursement amount cannot exceed the petty cash limit configured in Settings. The system blocks submission if it does.  9\. All petty cash disbursements are logged in the account ledger. against the selected company bank account and the petty cash and miscellaneous expense account. | 1\. Approved petty cash requests appear in the Direct Payments section of the Invoice Module automatically after approval.  2\. The disbursement form pre-fills with all details from the approved request.  3\. Processor must select a company bank account before submission.  4\. Both bank transfer and cash handout disbursement methods are supported and functional.  5\. System blocks submission if the disbursement amount exceeds the configured petty cash limit.  6\. The disbursement appears in the Payment Queue. Only a user with Payer permission can process it using the Pay button. The Pay button is visible to all users but active only for users with Payer permission.   7\. The Committed Amount increases in the Project Costing Module at the point of submission. It releases immediately if the request is rejected or cancelled. It converts to the actual amount when the disbursement is approved and paid.  8\. The disbursement is posted to the petty cash and the miscellaneous expense account and the selected bank account in the account ledger automatically.  9\. Each disbursement is assigned a unique system-generated petty cash reference.  |

### **9.3.3 Direct Payment Status Definitions**

| Status | Description | Next Possible Statuses: |
| ----- | ----- | ----- |
| Pending | The approved request is waiting for the processor to create the vendor bill or disbursement. | In Payment Queue, Cancelled |
| In Progress  | The processor has started building the vendor bill or disbursement but has not yet submitted it. The draft is saved and can be resumed later.  | In Payment Queue, Cancelled |
| In Payment Queue | The vendor bill or disbursement has been created and submitted by the processor. | Paid, Rejected, Cancelled |
| Paid | Payment has been confirmed and processed. | Closed |
| Rejected | The payer rejected the payment. The processor is notified of the rejection reason. | Pending |
| Closed | Payment fully confirmed and recorded | None |
| Cancelled | The item was cancelled before payment. Committed amount released where applicable. | None |

## 

## **9.4 payment queue**

The payment queue is the central list of all vendor bills and disbursements that have been submitted by the processor and are ready for payment authorisation. Finance manages all pending payments from this queue.

**Payment Queue List View**

| Column | Detail |
| ----- | ----- |
| Invoice ID | Unique invoice identifier |
| Vendor | Vendor name or supplier name |
| PO Reference | Linked Purchase Order ID, where applicable |
| Request Reference | Originating Project Request ID |
| Invoice Date | Date on the vendor invoice or disbursement |
| Due Date | Payment due date based on agreed payment terms |
| Amount | Total amount due |
| Discrepancy Flag | Indicates whether any line item discrepancy was flagged and acknowledged by the processor during vendor bill creation. |
| WBS Element | The project WBS element/activity this cost is tagged to |
| Days Until Due | Countdown to the payment due date |
| Status | Awaiting payment or paid |

The queue sorts by Days Until Due in ascending order by default. The most urgent invoices appear at the top.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a user with processor permission, I want a structured queue of vendor bills that have been submitted and are ready for payment authorisation so that I can process payments in order of urgency without manually searching for eligible invoices.  | 1\. User with Processor permission opens the Invoice Module and navigates to the payment queue 2\. Sees all submitted Vendor Bills sorted by days until due 3\. Clicks on an invoice to open the full detail view 4\. Reviews the invoice including vendor details, PO reference, request reference, match result, WBS element, cost code, payment terms, and amount 5\. If the user has payer permission, they click the Pay button to process payment directly.  | 1\. Vendor bills appear in the AP queue automatically after the processor submits them. 2\. The queue must show days until due clearly for every invoice 3\. The queue sorts by days until due in ascending order by default 4\. Every invoice must display its WBS element and cost code 5\. The queue is filterable by vendor, due date range, status, and WBS element. | 1\. Vendor bills appear in the AP queue automatically after submission by the processor. 2\. All columns display correctly for every invoice in the queue 3\. Queue sorts by ascending days until due by default 4\. All filters work correctly and can be combined 5\. WBS element and cost code display correctly on every invoice 6\. Payment approval request routes correctly to the user with Payer permission |

## 

## **9.5 Payment Processing**

No payment can be processed without formal authorisation from a user with payer permission. This is the final gate before any money is released. This is the final gate before money is released. The company bank account and vendor bank details are already selected at the point the processor created the payment record. The payer reviews them, can change the bank account if needed, and confirms payment. 

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a user with Payer permission, I want to review and confirm a submitted payment from the Payment Queue so that approved payments are released quickly and accurately. | 1\. The user opens the invoice module and navigates to the payment queue.  2\. Sees all submitted vendor bills and disbursements sorted by days until due. 3\. Clicks on an item to open the full detail view. 4\. Reviews the item, including vendor or recipient details, the company bank account already selected by the processor, WBS element, and amount. 5\. If needed, change the company bank account to pay from.   6\. Clicks Pay.  7\. Confirms the payment.  8\. The system processes the payment.  9\. The committed amount is released, and the actual amount increases in the Project Costing Module for the tagged WBS Element.  10\. The account ledger updates automatically with two entries, one to the mapped expense account and one to the selected bank account.  11\. The item status updates to Paid. | 1\. Only users with Payer permission can complete a payment.  2\. The Pay button is visible to everyone with queue access but active only for payer permission.  3\. The company bank account is chosen by the processor at creation and can be changed by the payer before confirming.  4\. Vendor bank details are locked and cannot be edited by either role. 5\. Payment is blocked without confirmed vendor bank details.  6\. On confirmation, the project costing module updates committed and actual amounts, and the ledger posts two entries automatically. 7\. Payments cannot be reversed, only corrected through an administrator adjustment. 8\. A user holding both processor and payer permission can submit and pay on the same page without a queue detour. | 1\. The Pay button is visible on every item in the Payment Queue.  2\. The Pay button is active and clickable only for users with Payer permission. For all other users, it is visible but not active.  3\. The Payer can change the company bank account before confirming payment.  4\. The system blocks payment if the selected vendor or recipient has no confirmed bank details on file and displays a message directing the administrator to complete the record.  5\. On payment confirmation, the committed amount is released, and the actual amount increases in the Project Costing Module in real time.  6\. The account ledger posts two automatic entries on payment confirmation.  7\. Item status updates to Paid immediately after confirmation. 8\. The payment transaction is permanently logged in the audit trail. 9\. A user holding both processor and payer permission can complete submission and payment on the same page without a queue detour.  |

## 

## **9.6 Chart of Accounts** 

The Chart of Accounts is the structured list of all financial accounts the company uses to record transactions in FastraSuite. Every payment processed in the Invoice Module is automatically posted to the appropriate account based on the request type-to-account mapping configured in the settings. The company admin sets up the chart of accounts once during the initial company configuration. The system pre-loads a standard set of accounts that the admin can customise to match the company's financial structure.

**The Five Account Types**

FastraSuite organises the Chart of Accounts into five fixed account types. The Admin cannot add or remove these five types. They can only create accounts within each type.

| Account Type | What It Represents | Account Number Series |
| ----- | ----- | ----- |
| Assets | What the company owns. Includes bank accounts, cash, and inventory. | 1000 series |
| Liabilities | What the company owes. Includes accounts payable and outstanding obligations. | 2000 series |
| Equity | The owner's stake in the business. Includes retained earnings. | 3000 series |
| Income | Money coming into the company. Includes contract revenue. | 4000 series |
| Expenses | Money going out of the company. Includes all project costs. | 5000 series |

**Standard Pre-Loaded Accounts**

When a company registers, FastraSuite pre-loads the following standard accounts. The admin can rename, add, or deactivate accounts after registration.

| Account Number | Account Name | Type |
| ----- | ----- | ----- |
| 1110 | Main Operating Account | Asset |
| 1120 | Petty Cash Account | Asset |
| 1200 | Accounts Receivable | Asset |
| 1300 | Inventory | Asset |
| 2100 | Accounts Payable | Liability |
| 2200 | Accrued Expenses | Liability |
| 3100 | Owner Equity | Equity |
| 3200 | Retained Earnings | Equity |
| 4100 | Contract Revenue | Income |
| 4200 | Other Income | Income |
| 5100 | Labour Costs | Expense |
| 5200 | Materials Costs | Expense |
| 5300 | Subcontractor Costs | Expense |
| 5400 | Plant and Equipment Costs | Expense |
| 5500 | Petty Cash and Miscellaneous | Expense |
| 5600 | Overhead Costs | Expense |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a user with administrator permission on the Invoice Module, I want to set up and manage the company's chart of accounts so that every financial transaction is posted to the correct account automatically without requiring manual classification by the finance team.  | 1\. Admin navigates to the Invoice Module and selects Chart of Accounts 2\. Sees the five account types displayed as expandable sections 3\. Expands each type to see the pre-loaded accounts within it 4\. Clicks Add Account to create a new account within a type 5\. Enters the account name and confirms—the system assigns a unique account number within the appropriate series 6\. To deactivate an account, the admin clicks "Deactivate". The system blocks deactivation if any transaction has been posted to that account. The admin must first reassign those transactions. 7\. Saves the Chart of Accounts configuration  | 1\. The five account types are fixed and cannot be added, removed, or renamed by any user 2\. The Admin can create new accounts within any of the five types 3\. The Admin can rename existing accounts at any time 4\. An account that has received at least one transaction cannot be deleted. It can only be deactivated. 5\. Deactivated accounts remain visible in historical records and reports but cannot receive new transactions 6\. The system assigns a unique account number to each new account within the correct number series for its type 7\. Only users with Administrator permission on the Invoice Module can manage the Chart of Accounts 8\. The system pre-loads a standard set of accounts when a company registers. The admin can customise these after registration. | 1\. Admin can view all five account types and the accounts within each type 2\. Admin can create a new account within any type and the system assigns the correct account number 3\. Admin can rename any existing account at any time 4\. System blocks deletion of any account that has received at least one transaction 5\. Deactivated accounts are removed from selection dropdowns but remain visible in historical records 6\. Only Administrator permission holders can access the Chart of Accounts management screen 7\. Pre-loaded standard accounts are present on first login after company registration |

# 

## **9.7 Request to Account Mapping**

The request type to account mapping is a one-time configuration that tells the system which expense account in the Chart of Accounts to post payments to based on the cost category of the originating request. Once configured by the admin, the mapping works automatically on every payment. The finance team does not need to manually select an account when processing payments.

**How the Mapping Works**

Every request submitted in the Project Request Module has a request type: purchase, labour, petty cash, subcontractor, plant and equipment, or material consumption. When a request results in a payment in the Invoice Module, the system reads the request type and automatically posts the payment to the mapped expense account. A single request other than Petty Cash cannot contain line items that span more than one expense category, so Request Type alone is sufficient to determine the correct account for those types. 

**Example Mapping**

| Request Type | Posts to Expense Account |
| ----- | ----- |
| Labour Request | 5100 Labour Costs |
| Materials Request | 5200 Materials Costs |
| Subcontractors Request | 5300 Subcontractor Costs |
| Plant and Equipment Request | 5400 Plant and Equipment Costs |
| Petty Cash Request | Not automatically mapped. See note below |

Petty cash requests are excluded from automatic mapping. Since a single petty cash disbursement can cover any type of expense, from materials to minor equipment repairs, the processor selects the debit account manually at the point of disbursement, as described in Section 9.3.2. The mapping in this section applies only to labour, purchase, subcontractor, and plant and equipment requests, which each post to a single, fixed expense account automatically. 

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a user with administrator permission, I want to map each request type to the correct expense account in the chart of accounts so that every payment is automatically posted to the right account without any manual effort from the finance team.  | 1\. The admin navigates to Settings and selects the request type as 'Account Mapping'. 2\. It sees a list of all active request type on the left and a dropdown for selecting the corresponding account on the right 3\. For each request type, selects the appropriate expense account from the Chart of Accounts dropdown 4\. Saves the mapping 5\. From this point forward, every payment processed in the Invoice Module is automatically posted to the mapped account based on the request type of the originating request  | 1\. Every active request type must be mapped to at least one expense account before the mapping configuration can be saved 2\. The mapping dropdown shows only expense-type accounts from the Chart of Accounts 3\. If a payment is processed and no mapping exists for its request type, the system posts it to a default Unclassified Expenses account and notifies the Admin to complete the mapping 4\. Changes to the mapping apply to new transactions only and do not retroactively change already-posted transactions 5\. Only users with Administrator permission can configure the request type to Account mapping | 1\. Admin can map each request type to an expense account from the Chart of Accounts 2\. The mapping dropdown shows only Expense type accounts 3\. Payments are automatically posted to the mapped account on approval without any manual input from finance. 4\. If no mapping exists for a request type, the payment is posted to Unclassified Expenses and the Admin is notified 5\. Mapping changes apply only to new transactions after the change is saved |

# 

## **9.8 Vendor Management**

Vendor management allows the company to maintain a complete record of all vendors and subcontractors, including their contact details and bank account information. Vendor bank details are stored securely and used automatically when processing payments. No user can change a vendor's bank details at the point of payment. All changes to bank details are restricted to administrator permission holders and generate permanent audit log entries.

**Vendor Profile Fields**

| Field | Behaviour |
| ----- | ----- |
| Vendor Name | Text input — required |
| Vendor Code | Generated automatically by the system on creation.  |
| Contact Name | Text input — optional |
| Email Address | Text input — optional |
| Phone Number | Text input — optional |
| Address | Text input — optional |
| Tax ID | Text input — optional |
| Bank Account Name | Text input — required before any payment can be processed to this vendor |
| Bank Account Number | Text input — required before any payment can be processed to this vendor |
| Bank Nam e | Text input — required before any payment can be processed to this vendor |
| Branch or Sort Code | Text input — optional depending on the bank |
| Status | Active or Inactive |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a user with processor permission on the invoice module, I want to manage a complete list of vendors with their bank details so that payments can be processed accurately and securely without re-entering vendor information on each transaction. | 1\. The user navigates to the Invoice Module and selects Vendors. 2\. Sees a list of all active vendors with their name, vendor code, and status 3\. Clicks Add Vendor to create a new vendor record 4\. Fills in the vendor profile fields 5\. Saves the vendor record 6\. To add or update bank details — user with Administrator permission navigates to the vendor record and updates the bank details section 7\. System generates a permanent audit log entry recording the previous bank details and the new bank details along with the timestamp and the name of the user who made the change 8\. When a payment is processed for this vendor in the Invoice Module, the system pulls the bank details automatically from the vendor record | 1\. Vendor records can be created by users with Processor or Administrator permission on the invoice module. 2\. Bank details can only be added or edited by users with administrator permission. 3\. Every change to a vendor's bank details generates a permanent immutable audit log entry capturing the previous details, the new details, the timestamp, and the name of the user who made the change 4\. The system blocks payment processing to any vendor that does not have confirmed bank details on file 5\. A vendor record can be deactivated but not deleted if it has transactions against it 6\. Deactivated vendors cannot be selected on new transactions but remain visible in historical records | 1\. Users with processor or administrator permission can create vendor records 2\. Bank details fields are visible to all users with access to the vendor record but are editable only by users with Administrator permission 3\. Every change to bank details generates a permanent immutable audit log entry 4\. System blocks payment processing to vendors without confirmed bank details and displays a clear message directing the Administrator to complete the vendor profile 5\. Deactivated vendors are removed from selection dropdowns but remain in historical transaction records 6\. Each vendor has a unique system-generated vendor code |

## **9.9 Account Ledger**

![][image2]

The account ledger is the complete chronological record of all financial transactions posted to each account in the chart of accounts. Every payment processed in the Invoice Module automatically generates entries in the account ledger. The ledger shows the running balance of each account, giving Finance a real-time view of the company's financial position.

The account ledger also serves as the forward-looking cash flow tool. It shows confirmed historical transactions alongside projected future outflows based on approved invoices and their due dates, giving Finance both a historical record and a 30-day projection in one view.

**What the Account Ledger Shows**

The ledger can be viewed at two levels:

**All Accounts View**  
A summary showing every account in the Chart of Accounts with its current balance and the total debits and credits posted to date.

**Single Account View**  
 A detailed chronological list of every transaction posted to a selected account showing:

| Column | Detail |
| ----- | ----- |
| Date | Date the transaction was posted |
| Description | Vendor name, request reference, and PO reference |
| WBS Element | The project WBS element the transaction is tagged to |
| Debit | Amount posted as a debit to this account |
| Credit | Amount posted as a credit to this account |
| Running Balance | The account balance after each transaction |

**How Entries Are Created Automatically**

The system posts entries to the ledger automatically when payments are approved. The user does not create ledger entries manually. For every payment approved in the Invoice Module, the system posts two automatic entries:

Entry 1 posts to the Expense Account mapped to the Request Type of the originating request. The amount is posted as a debit, increasing the expense.

Entry 2 posts to the bank account selected at the point of payment. The amount is posted as a credit, reducing the bank balance.

Both entries happen simultaneously when payment is made. Neither entry can be edited or deleted after posting.

**30-Day Forward Projection**

In addition to historically confirmed transactions, the account ledger shows a forward projection section displaying the following:

| Element | Detail |
| ----- | ----- |
| Expected outflows | Approved invoices grouped by their payment due date for the next 30 days |
| Committed but not yet invoiced | Approved requests that have not yet reached the invoice stage shown as expected future outflows |
| Projected bank balance | The estimated bank account balance after all expected outflows for the next 30 days |

The forward projection is clearly separated from confirmed historical entries so Finance can distinguish between what has already happened and what is expected to happen.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a user with payer or reviewer permission on the invoice module, I want to view a complete chronological record of all financial transactions posted to each account along with a forward-looking 30-day projection so that I can understand the company's current financial position and plan cash availability for upcoming payments. | 1\. User opens the Invoice Module and navigates to the Account Ledger 2\. Sees the All Accounts summary showing every account with its current balance 3\. Clicks on a specific account to open the Single Account View 4\. Sees a chronological list of all transactions posted to that account with running balances 5\. Scrolls past the confirmed transactions to see the 30-day forward projection section 6\. Applies filters by date range, WBS element, or vendor 7\. Clicks on any transaction to see the full detail and the link back to the originating invoice and request 8\. Exports the ledger data as PDF or Excel | 1\. Ledger entries are created automatically by the system when payments are made. No user creates ledger entries manually. 2\. Every payment approval creates two automatic entries: one to the mapped expense account and one to the selected bank account. 3\. All ledger entries are permanent and immutable. No user at any level can edit or delete a posted entry. 4\. The 30-day forward projection is calculated from approved invoice due dates and committed amounts from approved requests not yet invoiced. 5\. The forward projection is clearly separated from confirmed historical transactions in the ledger view. 6\. The account balance displayed on each account reflects all confirmed posted transactions only. The projected balance is shown separately. 7\. The ledger is filterable by date range, account, WBS element, and vendor. 8\. The ledger is exportable as PDF and Excel. 9\. The system must display the correct running balance after every transaction in the single account view. | 1\. All account summaries show every account in the Chart of Accounts with its current confirmed balance 2\. Single Account View shows a chronological list of all transactions with debit, credit, and running balance columns 3\. Every payment automatically generates two ledger entries without any manual action from finance. 4\. All ledger entries are read-only. No edit or delete option exists for any user at any level. 5\. The 30-day forward projection section appears below confirmed transactions and is clearly labelled as "projected". 6\. Expected outflows in the projection are correctly calculated from approved invoice due dates 7\. Committed amounts from approved requests not yet invoiced appear as expected future outflows in the projection 8\. All filters work correctly and update the ledger view in real time 9\. Clicking any confirmed transaction links back to the originating invoice and the originating project request 10\. PDF and Excel exports include all visible data in a clean formatted layout 11\. The ledger loads within 3 seconds for accounts with up to 1,000 transactions. |

## **9.10 Bank Account Management**

Bank accounts are set up under the Assets section of the Chart of Accounts. The company's bank accounts are used in the Invoice Module when a payer selects which account to pay from when approving a payment.

**Setting Up a Bank Account**

The admin creates bank accounts by adding them as asset accounts in the Chart of Accounts. Each bank account entry captures:

| Field | Detail |
| ----- | ----- |
| Account Name | The name of the bank account is as the company refers to it internally. For example, the Main Operating Account. |
| Account Number | The company's actual bank account number |
| Bank Name | The name of the bank |
| Branch or Sort Code | The branch code of the bank \- Optional |
| Currency | The currency of the account. Defaults to the company's base currency. |

**How Bank Accounts Are Used on Payments**

When a processor is creating a vendor bill for payment, they select which company bank account the payment is going out from. The system shows only active bank accounts configured under Assets in the Chart of Accounts.

The vendor's bank details are displayed automatically from the vendor record. The Payer cannot edit the vendor's bank details at the point of payment. They can only select the company bank account to pay from and confirm the amount.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a user with administrator permission on the invoice module. I want to set up and manage the company's bank accounts within the Chart of Accounts so that payments can be processed accurately from the correct account and every outgoing transaction is properly recorded against the right bank balance.  | 1\. Admin navigates to the Invoice Module and opens the Chart of Accounts 2\. Expands the Assets section 3\. Clicks ‘Add Account' and selects 'Bank Account' as the account subtype 4\. Fills in the bank account details: Account Name, Account Number, Bank Name, Branch or Sort Code, and Currency 5\. Saves the bank account record—the system assigns a unique account number in the 1000 series 6\. The bank account is now available for selection when a Payer processes a payment 7\. To edit bank account details — Admin opens the bank account record, makes the changes, and saves. The system generates a permanent audit log entry recording the previous details, the new details, the timestamp, and the name of the user who made the change. 8\. To deactivate a bank account, the admin clicks Deactivate. The system confirms that no pending payments are assigned to this account before allowing deactivation. If pending payments exist, the admin must reassign them first. 9\. When a Payer processes a payment, they see a dropdown of all active company bank accounts and select the one the payment is going out from. The selected bank account balance reduces in the account ledger by the payment amount. | 1\. Bank accounts are created and managed under the Assets section of the Chart of Accounts. 2\. Only users with Administrator permission can add, edit, or deactivate bank accounts 3\. At least one active bank account must exist before any payment can be processed 4\. The processor selects a company bank account when creating the payment record. The Payer can change it before confirming.  5\. The system displays the vendor's bank details automatically from the vendor record at the point of payment 6\. The vendor's bank details cannot be edited at the point of payment. Only users with administrator permission can edit vendor bank details from the vendor record. 7\. All bank account transactions are recorded in the Account Ledger against the selected bank account 8\. Deactivating a bank account does not reverse or affect historical transactions already posted to it | 1\. Admin can create a bank account under the Assets section of the Chart of Accounts 2\. Bank account selection dropdown appears on the vendor bill and payment approval screen showing all active company bank accounts 3\. Vendor bank details are displayed automatically on the payment screen from the vendor record and cannot be edited at that point 4\. System blocks payment process if no company bank account is selected 5\. System blocks payment approval if the selected vendor has no confirmed bank details on file 6\. Every payment reduces the balance of the selected company bank account in the account ledger. 7\. Bank account management is restricted to Administrator permission holders |

**P**

# **10\. Inventory Module**

The inventory module manages all physical stock movement for FastraSuite Core. It is the single source of truth for what materials are available on site, what has been received from vendors, what has been consumed on projects, and what has been scrapped due to damage or loss. Every stock movement in this module connects directly to at least one other module—the Invoice Module for purchase receipts, the Project Request Module for consumption requests, and the Project Costing Module for cost allocation tracking.

## **10.1 Module Overview**

The inventory module handles five distinct areas in the core tier:

| Area | What It Does |
| ----- | ----- |
| Product Management | Maintains the company-wide catalogue of all products and materials used across all modules |
| Incoming Products | Confirms goods received on-site against approved Purchase Orders from the Invoice Module |
| Material Consumption | Records materials consumed from stock against specific project WBS elements |
| Stock Management | Provides real-time stock on-hand visibility, stock adjustment, and scrap recording |
| Inventory Ledger | Maintains a complete chronological record of all stock movements |

The following features from the original platform are confirmed out of scope for the Core tier and must not be built:

| Feature | Reason |
| ----- | ----- |
| Delivery Orders | Not applicable in this tier |
| Customer Returns | Not applicable in this tier |
| Manufacturing Receipt | Out of scope — future phase |
| Multi-Location Inventory | Enterprise tier only |
| Internal Transfer | Enterprise tier only—depends on Multi-Location |

## 

## 

## 

## **10.2 Product Management**

The Product Management section is the company-wide catalogue of all materials and items used across FastraSuite. Every module that references a product draws from this list. No user in any module can enter a product name as free text. They always select from this pre-configured list. The company admin or a user with administrator permission on the inventory module creates and manages the product list.

**Product Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Product Name | Text input — required — must be unique within the company |
| Product Code | Auto-generated by the system on creation — unique |
| Unit of Measure | Select from the company's configured units of measure—required |
| Product Category | Select from the company's configured product categories—optional—used for grouping in reports |
| Reorder Point | Numeric input. The stock level that triggers a low stock alert. It is optional, and it can be set later. A user with Manager permission can edit this field without full product edit rights. See Section 10.8 for alert behaviour. |
| Description | Text input — optional |
| Status | Active or Inactive. Cannot be set to inactive while the product is on an open purchase order, has an unpaid vendor bill, or has stock on hand.  |

**Unit of Measure Configuration**

Units of measure are configured by the admin in the inventory module configuration before products are created. Standard preloaded units include **Weight:** Kilograms (kg), Tonnes (t), Grams (g); **Volume:** Litres (L), Cubic metres (m³), Gallons; **Length:** Metres (m), Millimetres (mm), Centimetres (cm), Feet (ft); **Area:** Square metres (m²); **Count, whole items:** Pieces, Units, Bags, Rolls, Sheets, Boxes, Sets, Pairs, Coils. The admin can add custom units. A unit of measure cannot be deactivated while it is assigned to an active product. 

**Product Category Configuration**

Product categories are configured by the admin in the inventory module under 'configuration'. They are used for grouping products in reports and filtering. Examples include cement products, steel and iron, finishing materials, electrical, and plumbing. The admin can create, rename, and deactivate categories. A category cannot be deactivated while it is assigned to an active product. Deactivated categories are removed from selection on new products but remain visible on historical records for reporting. 

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with administrator permission on the inventory module, I want to create and manage a complete list of products so that all modules in FastraSuite reference a consistent and controlled set of product records. | 1\. The admin navigates to the inventory module and selects products.  2\. Sees a list of all existing products with their name, product code, unit of measure, category, and status.  3\. Clicks 'Add Product' to create a new product.  4\. Fills in the product name, selects the unit of measure, selects the product category if applicable, and optionally enters the reorder point and description.  5\. Saves the product. The system assigns a unique product code automatically.  6\. The product is now available for selection across all modules—Purchase Requests, Material Consumption Requests, Incoming Product Confirmations, and all inventory operations.  7\. To deactivate a product, the admin clicks Deactivate. The system blocks deactivation if the product has an open purchase order, an unpaid vendor bill, or stock on hand and notifies the admin of the reason. 8\. Deactivated products disappear from all selection dropdowns but remain visible in historical records. | 1\. Only users with administrator permission on the inventory module can create, edit, or deactivate products.  2\. Product names must be unique within the company. The system blocks duplicate product names with a clear error message.  3\. The system assigns a unique product code to each product on creation.  4\. Every product must have a unit of measure—the system blocks saving without one.  5\. A product cannot be deactivated while it has an open purchase order, an unpaid vendor bill, or stock on hand.  6\. Deactivated products are removed from all selection dropdowns across all modules but remain visible in historical records and reports. 7\. Products are available for selection across all modules immediately after creation. 8\. The product list is filterable by category, status, and unit of measure. 9\. The product list is exportable as CSV or PDF. | 1\. The admin can create a product with all required fields, and the system assigns a unique product code.  2\. Duplicate product names are blocked with a clear error message.  3\. Every product requires a unit of measure—system blocks are saved without one.  4\. Newly created products are immediately available for selection across all modules.  5\. Deactivating a product removes it from all selection dropdowns without affecting historical records.  6\. System blocks deactivation if the product has an open purchase order, an unpaid vendor bill, or stock on hand and displays a clear message stating the reason.   7\. Product list is filterable and exportable. 8\. Only Administrator permission holders can create, edit, or deactivate products. |

## **10.3 Incoming Products — Receipt from Purchase Order**

When a purchase order is approved and issued to a vendor in the Invoice Module, a corresponding incoming product record is automatically created in the Inventory Module in draft status. The stockkeeper finds this draft record, confirms the actual quantities received, and validates the receipt. For Path B, this confirmation is the trigger that activates the Create Bill button on the PO in the Invoice Module. For Path A, Create Bill is already active from the point the PO is issued and does not depend on this confirmation. 

**Incoming Product Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Receipt ID | Auto-generated format: Location Code \+ IN \+ sequential number—for example MAIN/IN/0001 |
| Receipt Type | Pre-filled as a vendor receipt for PO-linked records—not editable |
| Receipt Date | Auto-filled with the date the record was created |
| Vendor | Pre-filled from the PO — not editable |
| Related PO | Pre-filled with the PO ID—links back to the PO in the Invoice Module—not editable |
| Source Location | Hidden from the user, the default value is "Supplier Location". |
| Destination Location | Auto-filled with the stockkeeper's assigned location—not editable in the Core single-location tier |
| Product Lines | Pre-filled from the PO—each line shows Product Name, Unit of Measure (auto-filled), Expected Quantity (from PO), Quantity Received (entered by stockkeeper) |

**Receipt Status Definitions**

| Status | Description | Next Possible Statuses |
| ----- | ----- | ----- |
| Draft | Record created automatically from PO approval. Not yet processed by stockkeeper. Stock on hand not yet updated. | Validated, Cancelled |
| Validated | The stockkeeper has confirmed quantities received. Stock on hand updated. Cannot be edited or cancelled. | None |
| Cancelled | The receipt was cancelled before validation. Stock on hand not affected. Cannot be edited or validated. | None |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a stockkeeper with Approver permission on the inventory module, I want to confirm the actual quantities of goods received on site against the expected purchase order so that stock on hand is accurate and the finance team can proceed to create a vendor bill for payment. | 1\. The stockkeeper opens the inventory module and navigates to operations, then incoming products.  2\. Sees a list of all incoming product records, including draft records created automatically from approved POs. Each record shows receipt ID, vendor, related PO, expected quantities and status.  3\. Selects the relevant draft record linked to the delivery that has arrived.  4\. Reviews the prefilled product lines showing the product names, units of measure, and expected quantities from the PO.  5\. Enters the actual quantity received for each product line.  6\. Before validating, the system checks that no quantity received field is empty. If any field is empty, the system blocks validation with a clear message.  7\. If the quantity received is less than the expected quantity on any line, the system prompts the stockkeeper to create a backorder before validating. See Section 10.3.1 for backorder flow. 8\. If the quantity received is more than the expected quantity on any line, the system alerts the stockkeeper that more goods have arrived than were ordered and asks whether to accept the extra quantity or return it to the supplier. 9\. If all quantities received match the expected quantities exactly, the stockkeeper clicks Validate.  10\. The system updates stock on hand by the confirmed received quantities.  11\. The receipt status changes to Validated.  12\. The system automatically notifies the user with the processor permission in the Invoice Module that the receipt has been confirmed and the PO is ready for vendor bill creation.  13\. The Create Bill button becomes active on the linked PO in the Invoice module.  | 1\. Incoming product records are created automatically in draft status when a PO is approved and issued in the invoice module. The stockkeeper does not create these records manually.  2\. The product lines on the incoming product record prefill from the PO. The stockkeeper only enters the actual quantities received.  3\. The system must block validation if any quantity received field is empty.  4\. The system must block validation if the record has no product lines.  5\. On validation, stock on hand must increase by the exact confirmed received quantity, not the PO quantity.  6\. The system must automatically notify the user with processor permission in the Invoice Module within seconds of validation.  7\. The Create Bill button on the linked PO in the Invoice Module must become active immediately after the receipt is validated.  8\. Photo or document upload is optional; it should be configurable in settings. The absence of a photo does not block validation unless the setting is enabled.  9\. A validated receipt cannot be edited or cancelled.  10\. A cancelled receipt does not affect stock on hand.  11\. If quantity received is less than expected on any line, the system must prompt the stockkeeper to create a backorder before the receipt can be validated.  12\. If the quantity received is more than expected on any line, the system must alert the stockkeeper and offer the option to accept the extra quantity or initiate a return to the supplier. | 1\. Incoming product records appear automatically in draft status in the inventory module when a PO is approved in the invoice module.  2\. Product lines prefill from the PO. The stockkeeper only enters quantities received.  3\. System blocks validation if any "quantity received" field is empty.  4\. System blocks validation if the record has no product lines.  5\. On validation, stock on hand increases by the confirmed received quantities.  6\. A user with processor permission in the Invoice Module receives a notification within seconds of validation.  7\. The Create Bill button becomes active on the linked PO in the Invoice Module immediately after validation.  8\. Photo upload is optional unless the company setting requires it.  9\. Validated receipts cannot be edited or cancelled.  10\. Cancelled receipts do not affect stock on hand. 11\. Receipt status is visible on the record and the list view. 12\. List view columns: Receipt ID, Vendor, Related PO, Source Location, Destination Location, Date Created, Status  |

### **10.3.1 Backorder**

A backorder is created when the stockkeeper confirms a quantity received that is less than the expected quantity on one or more product lines. The backorder creates a new incoming product record for the outstanding quantities and updates the linked PO status to Partially Delivered in the Invoice Module. 

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a stockkeeper, I want the system to prompt me to create a backorder when I confirm receiving less than the expected quantity so that the outstanding balance is tracked and the PO remains open until fully delivered. | 1\. The stockkeeper enters a quantity received that is less than the expected quantity on at least one product line.  2\. The Stockkeeper clicks Validate.  3\. The system detects the shortfall and displays a prompt asking whether to create a backorder for the remaining quantity.  4\. If the stockkeeper selects Yes, the current receipt is validated for the quantities actually received. Stock on hand increases by the received quantities only.  5\. A new incoming product record is automatically created in draft status. This new record is prefilled with all the details of the original receipt.  6\. The new record includes a backorder field prefilled with the original receipt ID.  7\. The new record shows two tabs. Tab 1 shows the outstanding quantities still expected. Tab 2 shows the original demand from the previous receipt for reference.  8\. The linked PO status in the Invoice Module updates to "Partially Delivered" automatically. 9\. The user with processor permission in the Invoice Module is notified that a partial receipt has been confirmed and a backorder has been created.  10\. If the stockkeeper selects No: The system updates the expected quantity on each line to match the quantity received. The remaining quantity is discarded. 11\. The receipt is validated for the confirmed quantities. Stock on hand increases by the confirmed quantities.  12\. The linked PO status in the Invoice Module updates to Partially Delivered.  13\. The user with processor permission in the Invoice Module is notified. | 1\. The system must detect any quantity received that is less than the expected quantity before allowing validation to proceed.  2\. The system must display a clear prompt asking the stockkeeper whether to create a back order before validating.  3\. If "Yes" is selected, the original receipt must be validated for received quantities only, and a new Draft Incoming Product record must be auto-created for the outstanding quantities.  4\. The backorder record must carry a backorder field referencing the original receipt ID.  5\. The backorder record must show two tabs: outstanding quantities and original demand.  6\. The linked PO status in the Invoice Module must update to 'Partially Delivered' automatically when a back order is created or when 'No' is selected.  7\. If "No" is selected, the expected quantity on each line must update to match the received quantity, and the shortfall is discarded.  8\. The user with processor permission in the invoice module must be notified in both scenarios within seconds. | 1\. The system detects a quantity shortfall and displays a backorder prompt before validation proceeds.  2\. If Yes is selected, the original receipt is validated for received quantities, and a new draft record is created for outstanding quantities.  3\. The backorder record carries a backorder of a field referencing the original receipt ID.  4\. The backorder record shows two tabs correctly.  5\. Linked PO status updates to "Partially Delivered" automatically in the invoice module.  6\. If "No" is selected, expected quantities update to match received quantities, and the receipt validates.  7\. A user with processor permission was granted it within seconds in both scenarios.  8\. A backorder record appears in the Incoming Products list view with 'Backorder' status visible. |

### **10.3.2 Supplier Returns**

A supplier return is initiated when the stockkeeper has received goods that need to be sent back to the supplier. This can happen because the goods are damaged or incorrect or because more goods arrived than were ordered and the company chooses to return the excess.

**Return Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Return ID | Format generated automatically: Location Code \+ RET \+ sequential number |
| Source Document | Prefilled with the original incoming product receipt ID. Not editable |
| Return Date | Filled automatically with the current date — editable |
| Reason for Return | Text input — required |
| Product Lines | Pre-filled from the original receipt. Stockkeepers can remove lines for products not being returned. Each line shows product name, quantity received, and quantity to return. |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a stockkeeper, I want to initiate a return of goods to the supplier when received items are damaged, incorrect, or in excess so that inventory records remain accurate and the supplier is formally notified. | 1\. The stockkeeper opens the inventory module and navigates to Operations, then Incoming Products.  2\. Finds the validated receipt record for the goods to be returned. The Return button is visible only on records in Validated status.  3\. Clicks Return.  4\. A return form opens pre-filled with the receipt details.  5\. The stockkeeper enters the reason for return.  6\. Reviews the pre-filled product lines. Removes any lines for products not being returned.  7\. Enters the quantity to return for each remaining line.  8\. Clicks Send.  9\. The system generates a return document containing the receipt details and return information.  10\. The system directs the user to their email interface with the return document attached.  11\. User enters the supplier email address and sends.  12\. On confirmation that the return has been accepted, stock on hand is reduced by the returned quantity 13\. The return is logged in the inventory ledger automatically.  14\. The return record is visible in the incoming products list with the status "returned". | 1\. The Return button is visible only on Incoming Product records in Validated status.  2\. The return form must pre-fill product lines from the original validated receipt.  3\. Stockkeepers can remove product lines for items not being returned.  4\. The stockkeeper cannot enter a return quantity greater than the received quantity on any line.  5\. A mandatory reason for return must be entered before the form can be submitted.  6\. The system must generate a return document and open the user's email interface with the document attached.  7\. Stock on hand must be reduced by the returned quantity when the return is confirmed.  8\. The return record must be permanently logged in the Inventory Ledger.  9\. The return form cannot be saved without at least one product line.  10\. The return form cannot be saved if the return quantity on any line is zero. | 1\. The return button is visible only on validated receipt records.  2\. The return form pre-fills product lines from the original receipt.  3\. A stockkeeper can remove lines for products not being returned.  4\. System blocks return quantity greater than received quantity on any line.  5\. The mandatory reason field blocks submission if empty.  6\. System generates return document and opens email interface with document attached.  7\. Stock on hand is reduced by the returned quantity on confirmation.  8\. The return record is logged in the inventory ledger automatically.   9\. Form cannot be saved without at least one product line with a non-zero return quantity. |

## **10.4 Material Consumption**

Material consumption records materials requested from inventory for use in a specific project activity. It is initiated from the Project Request Module by a site worker and processed in the Inventory Module. When a material consumption request is approved, it becomes available to the storekeeper for release. Inventory is reduced only when the storekeeper releases the materials. At that point, the consumption is recorded against the WBS Activity element for cost reporting purposes in the Project Costing Module. No financial entry is created in the Project Costing Module. The cost was already recorded as actual when the original purchase was paid.

**How Material Consumption Connects to Other Modules**

| Module | Connection |
| ----- | ----- |
| Project Request Module | A site worker submits a material consumption request, selecting the project, WBS phase, WBS activity, product and quantity. The request goes through the approval workflow. |
| Inventory Module | Approved requests appear in the storekeeper's release queue. Upon release, stock on hand is reduced, a material consumption record is created and the inventory ledger is updated. |
| Project Costing Module | Material consumption is recorded against the WBS activity for cost reporting and budget vs actual dashboard visibility after materials are released. |

**Stock Visibility for Site Workers**

Before a site worker enters the quantity to consume on a Material Consumption Request form, the system displays the current stock on hand for the selected product. This allows the worker to self-check before submitting.

The display shows:

> **Stock Available: \[Quantity\] \[Unit of Measure\]**

This is displayed immediately after the worker selects the product.

If the worker enters a quantity greater than the available stock, the system displays the following warning before submission:

> **"The quantity you have entered exceeds the available stock. Please adjust the quantity or raise a purchase request for additional stock.”**

**Material Consumption Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Consumption Request ID | Generated automatically in the format **MCR-0001**. |
| Project | Select from Active Projects — Required. |
| WBS Phase | Select from the WBS phase elements of the selected project – required. |
| WBS Activity | Select from the activity elements under the selected phase — required. |
| Created By | Filled automatically from the logged-in user. Not editable. |
| Date Created | Filled automatically with the current date. Not editable. |
| Location | Filled automatically with the user's assigned location. |
| Request Status | Displays the current request status (Pending Approval, Approved, Partially Released, Released, Rejected or Cancelled). |
| Consumption Lines | Each line captures the following: Product Name, Requested Quantity, Unit of Measure (auto-filled), and Stock Available (display only). |

**Material Release Fields (Inventory Module)**

| Field | Behaviour |
| ----- | ----- |
| Material Consumption ID | Generated automatically upon the first release in the format **MC-0001**. |
| Request Reference | Reference the approved material consumption request. |
| Released By | Filled automatically from the logged-in storekeeper. |
| Release Date | Filled automatically when materials are released. |
| Release Status | Displays Partially Released or Released. |
| Product | Read-only from the approved request. |
| Requested Quantity | Read-only. |
| Released Quantity | Entered by the storekeeper. Cannot exceed the outstanding quantity or available stock. |
| Outstanding Quantity | Calculated automatically. |
| Unit of Measure | Auto-filled from the product record. |
| Unit Cost | Auto-filled from the last purchase price recorded in the system. Not editable. |
| Total Cost | Calculated automatically as Released Quantity × Unit Cost. |
| Release Remarks | Optional. |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| As a site worker with requester permission on the inventory module, I want to record materials required for a specific project activity so that the request can be approved, released from inventory by the storekeeper and tracked against the project for cost reporting. | 1\. The site worker opens the Project Request Module on their mobile device. 2\. Selects **Material Consumption Request** from the request type list. 3\. Selects the project from the list of active projects. 4\. Selects the WBS phase from the selected project's WBS elements. 5\. Selects the WBS activity under the selected phase. 6\. Adds a product line by selecting a product from the active product list. 7\. The system immediately displays the current stock on hand for the selected product. 8\. The worker enters the required quantity. 9\. If the entered quantity exceeds available stock, the system displays a warning before submission. 10\. The worker adds additional product lines if required. 11\. The worker submits the request. 12\. The request enters the approval workflow. 13\. A user with approver permission reviews and approves the request. 14\. Approved requests become available in the storekeeper's release queue in the inventory module. 15\. The storekeeper reviews the request and enters the quantity to release for each product line. 16\. The system validates stock availability again before release. 17\. The storekeeper releases all or part of the requested materials. 18\. Upon release: \- Stock on hand is reduced by the released quantity. \- A material consumption record is created. \- The inventory ledger records the consumption transaction. \- Consumption is recorded against the selected WBS Activity in the Project Costing Module. 19\. If only part of the requested quantity is released, the request status changes to **Partially Released** until the remaining quantity is released. | 1\. Material consumption requests shall be submitted only through the Project Request Module. 2\. Project, WBS Phase and WBS Activity are mandatory fields. 3\. The WBS Phase dropdown shall display only Level 1 WBS elements of the selected project. 4\. The WBS Activity dropdown shall display only Level 2 Activity elements under the selected phase. 5\. Only products with available stock greater than zero shall be available for selection. 6\. The system shall display the current stock on hand immediately after the worker selects a product. 7\. The system shall block submission if the requested quantity exceeds the available stock on hand and display the message: *"The quantity you have entered exceeds the available stock. Please adjust the quantity or raise a purchase request for additional stock."*  8\. Approval of a material consumption request shall not reduce inventory. 9\. Approved requests shall appear in the storekeeper's release queue. 10\. Only users with Storekeeper or Material Release permission shall be able to release materials. 11\. The system shall validate stock availability again before releasing materials. 12\. Before releasing materials, the system shall validate the current stock on hand again. If the requested quantity is no longer available, the storekeeper may release only the available quantity or wait until sufficient stock becomes available.  13\. Inventory shall be reduced only by the quantity released. 14\. Unit cost shall be fetched automatically from the latest purchase price and shall not be editable. 15\. Total Cost shall be calculated automatically based on Released Quantity × Unit Cost. 16\. A material consumption record shall be created when materials are first released. 17\. The Inventory Ledger shall record an entry for every released product line. 18\. Material consumption shall be recorded against the selected WBS activity for reporting purposes only. No new actual cost or committed cost shall be created in the project costing module. 19\. Closed Projects shall not be selectable on the Material Consumption Request form. 20\. The request shall contain at least one product line before submission. | 1\. Site workers can submit material consumption requests from the project request module. 2\. Project, WBS Phase and WBS Activity are mandatory. 3\. The WBS Phase dropdown shows only Level 1 WBS elements of the selected project. 4\. The WBS Activity dropdown shows only Level 2 Activity elements under the selected phase. 5\. Product selection is limited to items with available stock greater than zero. 6\. Current stock on hand is displayed immediately after product selection. 7\. The system blocks submission when the requested quantity exceeds available stock. 8\. Approval does not reduce inventory. 9\. Approved requests appear in the storekeeper's release queue. 10\. Only authorised storekeepers can release materials. 11\. Stock is validated again before release. 12\. The storekeeper can perform full or partial releases. 13\. Stock on hand is reduced only by the released quantity. 14\. Material consumption records are created when materials are released. 15\. Inventory ledger entries are created for every released product line. 16\. Consumption is recorded against the selected WBS activity for reporting purposes only, with no new financial entry created. 17\. Closed projects cannot be selected. 18\. Requests cannot be submitted without at least one product line. |

## 

## **10.5 Stock Adjustment**

Stock adjustments are used to correct stock quantities when a physical count reveals a discrepancy between the system record and the actual quantity on hand. Only users with administrator permission on the inventory module can perform stock adjustments. Every adjustment requires a mandatory reason and generates a permanent audit log entry.

**Stock Adjustment Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Adjustment ID | Auto-generated format: Location Code \+ ADJ \+ sequential number |
| Adjustment Type | Fixed as a stock level update |
| Adjustment Date | Auto-filled with the current date |
| Location | Auto-filled with the user's location — selectable if multi-location is active |
| Notes | Text input — optional additional detail |
| Product Lines | Each line captures the product name, unit of measure (auto-filled), current quantity (auto-filled from system stock on hand), and adjusted quantity (entered by admin). |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with administrator permission on the inventory module, I want to adjust stock quantities when a physical count reveals a discrepancy so that inventory records remain accurate and all adjustments are fully traceable. | 1\. Admin navigates to the Inventory Module and selects Stocks, then Stock Adjustment.  2\. Clicks New to create a new adjustment record.  3\. The form opens with the adjustment ID auto-generated, the date auto-filled, and the location auto-filled.  4\. Admin adds a product line by selecting the product. The current quantity auto-fills from the system stock on hand.  5\. Admin enters the adjusted quantity — the correct quantity that should be on hand after the adjustment.  6\. Admin enters a mandatory reason for the adjustment.  7\. Admin adds additional product lines if multiple products need adjustment.  8\. Admin clicks Validate to confirm the adjustment.  9\. System updates stock on hand to the adjusted quantity for each product line.  10\. The inventory ledger records an entry for each adjusted line with the previous quantity, the adjusted quantity, the reason, and the admin username.  11\. The system-wide audit trail records the adjustment. | 1\. Stock adjustments are restricted to users with administrator permission on the inventory module.  2\. A mandatory reason must be provided for the entire adjustment record before it can be validated. The system blocks validation without a reason.  3\. The current quantity on each product line auto-fills from the system stock on hand and is not editable.  4\. The admin enters only the adjusted quantity — the target quantity after the adjustment. The system calculates the difference automatically.  5\. The adjustment record cannot be validated. without at least one product line.  6\. On validation, stock on hand updates to the adjusted quantity for each product line immediately.  7\. Every validated adjustment is recorded in the inventory ledger with a timestamp, admin username, previous quantity, adjusted quantity, and reason.  8\. Every validated adjustment is recorded in the system-wide audit trail.  9\. A validated adjustment cannot be edited or cancelled. | 1\. Stock adjustment is restricted to users with administrator permission.  2\. The mandatory reason field blocks validation if empty.  3\. Current quantity auto-fills from system stock on hand and is not editable.  4\. The system blocks validation without at least one product line. 5\. On validation, stock on hand updates immediately to the adjusted quantity. 6\. Inventory ledger entry created for each adjusted product line with all required fields.  7\. System-wide audit trail entry created for every validated adjustment.  8\. Validated adjustments cannot be edited or cancelled.  9\. List view columns: Adjustment ID, Adjustment Type, Location, Date Created, Status. |

#### 

## **10.6 Scrap**

Scrap is used to record the deliberate removal of damaged or lost items from inventory. Unlike stock adjustment, which corrects counting errors, scrap documents a known loss with a specific cause. Every scrap record requires a cause—damage or loss—and generates a permanent audit log entry. Scrap records reduce stock on hand by the scrapped quantity.

**Scrap Record Fields**

| Field | Behaviour |
| ----- | ----- |
| Scrap ID | Generated automatically in the format: Location Code \+ SP \+ sequential number |
| Cause | Select — Damage or Loss — required |
| Scrap Date | Filled automatically with the current date |
| Project | Select from existing projects |
| Location | Filled automatically with the project's location |
| Notes | Text input — optional |
| Product Lines | Each line captures the following: Product Name, Unit of Measure (Filled automatically), Scrap Quantity (entered by user) |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with approver permission on the inventory module, I want to record damaged or lost items as scrapped so that the inventory accurately reflects what is physically available and all losses are documented. | 1\. The user navigates to the Inventory Module and selects Operations, then Scrap.  2\. Clicks New to create a new scrap record.  3\. The form opens with the Scrap ID auto-generated and the date auto-filled.  4\. The user selects the cause: damage or loss.  5\. User adds a product line by selecting the product and entering the scrap quantity.  6\. User adds any additional product lines if multiple products are being scrapped.  7\. User optionally adds notes.  8\. User clicks Validate to confirm the scrap.  9\. System deducts the scrapped quantity from stock on hand for each product line immediately.  10\. The inventory ledger records an entry for each scrapped line.  11\. The System-wide audit trail records the scrap. | 1\. Scrap records can be created by users with approver or administrator permission on the inventory module.  2\. The cause field, Damage or Loss, is mandatory. The system blocks validation without a cause selected.  3\. The scrap record cannot be validated without at least one product line.  4\. The scrap quantity on each line cannot exceed the current stock on hand for that product. The system blocks validation if it does and displays a clear message.  5\. On validation, stock on hand is reduced by the scrapped quantity immediately for each product line.  6\. Every validated scrap record is logged in the inventory ledger with a timestamp, user name, cause, product, quantity scrapped, and running balance after the deduction.  7\. Every validated scrap record is logged in the system-wide audit trail.  8\. A validated scrap record cannot be edited or cancelled. | 1\. Scrap is accessible to users with approver or administrator permission.  2\. Cause field is mandatory. System blocks validation without a selection.  3\. System blocks validation without at least one product line.  4\. System blocks validation if scrap quantity exceeds available stock on hand and displays a clear message.  5\. On validation, stock on hand is reduced by the scrapped quantity immediately.  6\. Inventory ledger entry created for each scrapped product line.  7\. System-wide audit trail entry created for every validated scrap.  8\. Validated scrap records cannot be edited or cancelled.  9\. List view columns: Scrap ID, Cause, Location, Date Created. |

#### 

## **10.7 Inventory Ledger**

The inventory ledger is the complete chronological record of every stock movement in the Inventory Module. Every receipt, consumption, adjustment, scrap, and return generates a ledger entry automatically. No user creates ledger entries manually. The ledger is fully read-only. No entry can be edited or deleted by any user at any level.

**Ledger Entry Fields**

| Field | Detail |
| ----- | ----- |
| Date and Time | Timestamp of the movement to the second |
| User | Full name of the user who performed the action |
| Movement Type | Incoming Receipt, Consumption, Stock Adjustment, Scrap, Supplier Return |
| Product | Product name and code |
| Quantity Change | Positive for increases, negative for decreases |
| Running Balance | Stock on hand after this movement |
| WBS Phase | The WBS phase the movement is tagged to, if applicable  |
| WBS Activity | The WBS Activity the movement is tagged to, if applicable  |
| Source Document | Reference ID of the originating record, receipt ID, consumption ID, adjustment ID, scrap ID, or return ID |

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with reviewer, approver or manager permission on the inventory module, I want to view a complete chronological record of all stock movements so that I can trace every product from receipt to consumption and verify inventory accuracy at any point in time. | 1\. The user opens the inventory module and navigates to Stocks, then Stock moves.  2\. The system displays a chronological list of all stock movements for the location.  3\. The user applies filters: date range, product, movement type, WBS phase, WBS activity, or source document type.  4\. User clicks on any ledger entry to see the full detail and a link back to the originating record.  5\. User exports the ledger as CSV or PDF. | 1\. Every stock movement across all inventory module operations must generate a ledger entry automatically. No manual entry is permitted.  2\. Each entry must capture all fields defined in the Ledger Entry Fields table above.  3\. The ledger is fully read-only. No entry can be edited or deleted by any user at any level, including administrators.  4\. WBS Phase and WBS Activity fields are populated only on consumption entries. They are blank on receipt, adjustment, scrap, and return entries.  5\. The ledger must capture all movement types: Incoming Receipt, Consumption, Stock Adjustment, Scrap, and Supplier Return.  6\. The ledger must be filterable by all fields defined in the Ledger Entry Fields table.  7\. The ledger must be exportable as CSV and PDF.  8\. Clicking any ledger entry must link back to the originating source document. | 1\. The Ledger displays a chronological list of all stock movements.  2\. Every stock movement generates a ledger entry automatically. No manual entry exists.  3\. All ledger entry fields display correctly for every movement type.  4\. WBS Phase and WBS Activity fields appear only on consumption entries.  5\. The ledger is fully read-only. No edit or delete option exists for any user.  6\. All filters work correctly and can be combined.  7\. Clicking any entry links back to the originating record.  8\. CSV and PDF export include all visible data.  9\. All movement types are captured correctly. |

## **10.8 Low Stock Alerts**

The system monitors stock on hand continuously after every stock movement and alerts the configured recipients when any product falls below its defined reorder point. The alert fires once when the threshold is first crossed and resets when stock is replenished above the reorder point.

| User Story | User Journey | Business Requirements | Acceptance Criteria |
| ----- | ----- | ----- | ----- |
| As a user with manager permission on the inventory module, I want to be automatically alerted when any product falls below its reorder point so that I can raise a purchase request before operations are disrupted by a stockout. | 1\. Admin sets the reorder point for each product either during product creation or by editing an existing product record.  2\. The system monitors stock on hand continuously after every stock movement.  3\. When any product's stock on hand falls below its reorder point, the system sends an in-system and email notification to the configured recipients.  4\. The notification includes the product name, product code, current stock on hand, reorder point, and a direct link to raise a purchase request for that product.  5\. The alert fires once when the threshold is first crossed. It does not fire again until the stock is replenished above the reorder point and falls below it again.  6\. When stock is replenished above the reorder point through a validated receipt, the alert resets automatically. | 1\. The reorder point is configurable per product, set in the product record in Product Management.  2\. The alert fires immediately after any stock movement that causes stock on hand to fall below the reorder point.  3\. The alert fires once per threshold crossing. It does not fire repeatedly on subsequent movements while below the threshold.  4\. Alert recipients are configurable in inventory module settings. Default recipients are the users with manager permission on the inventory module.  5\. The notification must include the product name, product code, current stock on hand, reorder point, and a direct link to raise a purchase request.  6\. The alert resets automatically when stock is replenished above the reorder point through a validated receipt.  7\. Products without a configured reorder point do not trigger alerts. | 1\. Admin can set a reorder point per product in the product record.  2\. Alert fires immediately after any stock movement that causes stock on hand to fall below the reorder point.  3\. The alert fires once per threshold crossing. It does not fire repeatedly while below the threshold.  4\. Alert resets when stock is replenished above the reorder point.  5\. The notification contains all required information, including a direct link to raise a purchase request.  6\. Alert recipients receive both in-system notifications and email.  7\. Alert recipients are configurable in inventory module settings.  8\. Products without a reorder point do not trigger alerts. |

## **10.9 Module Integration Summary**

This section documents every connection between the Inventory Module and all other modules so developers have a complete picture of all cross-module interactions.

**Inventory Module to Invoice Module**

| Event in Inventory Module | Effect in Invoice Module |
| ----- | ----- |
| A stockkeeper validates a full receipt | The Create Bill button becomes active on the linked PO. Users with processor permission are notified within seconds. |
| The stockkeeper validates a partial receipt and creates a backorder. | PO status updates to Partially Delivered. The user with processor permission is notified within seconds. |
| The stockkeeper validates a partial receipt and selects "No" for backorder. | PO status updates to Partially Delivered. The user with processor permission is notified within seconds. |
| The stockkeeper confirms receipt under Path A, after payment has already been made  | Stock on hand increases by the confirmed quantity. No effect on the PO or vendor bill, since payment was already processed before receipt.  |

**Invoice Module to Inventory Module**

| Event in Inventory Module | Effect in Invoice Module |
| ----- | ----- |
| PO approved and issued in Invoice Module | An incoming product record created automatically in Draft status in the Inventory Module |

**Project Request Module to Inventory Module**

| Event | Connection |
| ----- | ----- |
| Material Consumption Request submitted | Submitted from Project Request Module. Approval is managed in the Project Request Module. |
| Material Consumption Request approved | The inventory module deducts stock on hand. Consumption record created in the inventory module. |

**Inventory Module to Project Request Module**

| Event | Connection |
| ----- | ----- |
| Stock on hand displayed before submission | When a worker selects a product on the Material Consumption form, current stock on hand is pulled from the Inventory Module and displayed on the form in real time. |

**Inventory Module to Project Costing Module**

| Event | Connection |
| ----- | ----- |
| Material Consumption record created and stock deducted | Consumption is recorded against WBS phase and WBS activity in the project costing module for cost-reporting purposes. No new actual amount or committed amount is created. |
| Inventory Ledger entries with WBS references | WBS Phase and WBS Activity fields on consumption ledger entries enable cost reporting in the Project Costing Module BvA Dashboard. |

**Inventory Module to Settings**

| Configuration | Where It Is Set |
| ----- | ----- |
| Units of Measure | Inventory Module, Configuration, Units of Measure |
| Product Categories | Inventory Module, Configuration, Product Categories |
| Low Stock Alert Recipients | Inventory Module, Settings |
| Optional Waybill Photo on Receipt | Inventory Module, Settings. Configurable on or off |

## **10.10 Inventory Module Settings**

| Setting | Description |
| ----- | ----- |
| Optional Waybill Photo on Receipt | When enabled, requires the stockkeeper to upload a photo or document before a receipt can be validated. When disabled, photo upload is optional. Default: disabled. |
| Low Stock Alert Recipients | Configurable list of users who receive low stock notifications. Default: users with manager permission on the inventory module. |
| Default Location | The default warehouse location for all inventory operations. Automatically set when the company creates their first location. |

## 

## **10.11 Inventory Module — Access Matrix**

| Action | Requester | Reviewer | Approver | Manager | Administrator |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Create and manage products | No | No | No | No | Yes |
| View product list | Yes | Yes | Yes | Yes | Yes |
| View stock on hand | Yes | Yes | Yes | Yes | Yes |
| Confirm incoming product receipts | No | No | Yes | Yes | Yes |
| Create Back Orders | No | No | Yes | Yes | Yes |
| Initiate supplier returns | No | No | Yes | Yes | Yes |
| Submit Material Consumption Requests | Yes | No | No | No | No |
| Approve Material Consumption Requests | No | No | Yes | Yes | Yes |
| View Inventory Ledger | No | Yes | Yes | Yes | Yes |
| Create Stock Adjustments | No | No | No | No | Yes |
| Create Scrap Records | No | No | Yes | No | Yes |
| Configure low stock alert thresholds | No | No | No | Yes | Yes |
| Configure Inventory Module settings | No | No | No | No | Yes |
| Configure Units of Measure | No | No | No | No | Yes |
| Configure Product Categories | No | No | No | No | Yes |

# **11\. Non-Functional Requirements**

## **11.1 Performance**

| Requirement | Target |
| :---- | :---- |
| BvA Dashboard load time | Under 3 seconds for projects with up to 500 transactions |
| Budget check response time | Under 3 seconds on every request submission. |
| Notification delivery | All notifications delivered within 2 minutes of the triggering event |
| Report generation | Standard project reports generated within 5 seconds |
| Vendor Bill form load time | The vendor bill form must open and pre-fill with PO, receipt or approved request data within 3 seconds of the Processor clicking Create Bill |
| Mobile form load time | Any request form must load within 4 seconds on a 3G connection on a low-end mobile device |

## **11.2 Scalability**

| Requirement | Detail |
| :---- | :---- |
| Multi-tenancy | Each company's data must be fully isolated. All data queries must enforce company-level filtering without exception |
| Concurrent users | The system must support up to 100 concurrent users per company without performance degradation |
| Transaction volume | The system must handle up to 10,000 transactions per project without degradation in BvA Dashboard performance |
| File storage | File attachments must be stored in a cloud storage service, not on application servers, to allow independent scaling |

 

## **11.3 Reliability & Availability**

| Requirement | Target |
| :---- | :---- |
| Uptime | 99.5% monthly uptime excluding scheduled maintenance windows |
| Scheduled maintenance | Communicated to Company Admins at least 48 hours in advance |
| Data backup | All data is backed up daily. Backups are retained for a minimum of 30 days |
| Offline sync reliability | Local draft sync must succeed on reconnection. If sync fails, the user must be notified immediately with a retry option |

 

## **11.4 Security**

| Requirement | Detail |
| :---- | :---- |
| Data isolation | No cross-company data access under any circumstance. Enforced at both the application and database levels |
| Transport security | All data transmitted over HTTPS. No unencrypted connections are permitted |
| Data at rest | All stored data and file attachments are encrypted at rest |
| Session management | Sessions expire after 30 minutes of inactivity. The user is logged out and redirected to the login page |
| Audit trail integrity | Audit log entries are immutable. They cannot be modified or deleted by any user or any automated process |
| Security testing | The platform must undergo a security test before the production launch |

 

## **11.5 Usability**

| Requirement | Detail |
| :---- | :---- |
| Mobile form completion time | A site worker must be able to complete and submit a standard Purchase Request in under 2 minutes on a mobile device |
| Minimal typing | All forms must use dropdown selections, auto-population, and pre-filled defaults wherever possible to minimise manual text entry on mobile devices |
| Touch targets | All interactive elements on mobile must meet a minimum touch target size of 44px |
| Error messages | All validation error messages must be written in plain language. No technical codes or jargon shown to field users |
| Accessibility | All web-facing interfaces must meet WCAG 2.2 Level AA accessibility standards |

 

# **12\. Assumptions & Constraints**

## **12.1 Assumptions**

1. All companies using FastraSuite have at least one person in an admin or super admin role who is responsible for user management and configuration.  
2. Site workers have access to a smartphone, Android or iOS, with a web browser and intermittent internet connectivity.  
3. Base company registration, authentication, and user account management already exist on the platform at the point this addendum is built on top of it. The Project Request Module, Project Costing Module, Invoice Module, and Inventory Module described in this document are being built as part of this addendum, not assumed to already exist.  
4. Vendor Management, creating and managing vendor records with bank details, is built fresh as part of the Invoice Module for Core per Section 9.8. It is not inherited from any prior version of the platform.  
5. The company's existing budget files are in Excel format for the Budget Import feature to function, per Section 5.1.1.  
6. A single base currency per company is sufficient for v1.0. Multi-currency support is not required in this delivery.  
7. No live users exist at the time of development. All testing is conducted using dummy development environment accounts.

## **12.2 Constraints**

1. Deadline: end of July 2026\. This is a hard deadline with direct revenue implications for the organisation, following a missed deadline of the end of June 2026\.  
2. Team: Lukman and Favour, frontend developers. Seyi, a backend developer, is the sole remaining backend developer on the project. Abidemi, designer. Barki, project manager. No dedicated QA resource.  
3. Testing responsibility falls on the PM and developers. No external QA team is available for this delivery.  
4. In-platform email and in-app notifications are in scope for v1.0. A centralised notification delivery service is deferred.  
5. Automated server provisioning for new clients is deferred. Manual processes are acceptable for v1.0.  
6. Multi-company or multi-subsidiary financial consolidation is out of scope.

# **13\. Glossary**

| Term | Definition |
| :---- | :---- |
| Account Ledger | The complete chronological record of all financial transactions posted to each account in the Chart of Accounts. Every payment processed in the Invoice Module generates automatic entries in the account ledger. The ledger shows confirmed historical transactions and a 30-day forward projection of expected outflows. All entries are permanent and immutable.  |
| Activity Element | The lowest-level executable work item in the Work Breakdown Structure. Activity elements are the only WBS nodes that can receive budget lines, requests, commitments, actual costs, and procurement transactions. All higher-level elements exist only for grouping and roll-up reporting purposes.  |
| Actual Amount | Total confirmed payments made against a specific WBS activity element, sourced from the Invoice Module.  |
| Available Budget | The budget remaining for new spending on a specific WBS activity. Formula: Budgeted Amount minus Actual Amount minus Committed Amount. |
| Back-Office Module | The internal processing modules are Project Costing, Inventory, and Invoice.  |
| BvA Dashboard | Budget vs Actual Dashboard: the real-time financial performance view showing Budgeted, Committed, Actual, Remaining, and Percentage Consumed for every WBS element on a project, broken down by cost category.  |
| Budget Check | The automated check that fires on every request submission. It checks the available budget for the tagged WBS element and either allows the request to proceed normally or flags it as over budget in the PM approval queue.  |
| Budget Health | A system-calculated indicator for each WBS element, On Track, At Risk, or Over Budget, based on configured alert thresholds.  |
| Budget Revision | A formal request to change the approved project budget on an active project, subject to an approval workflow. Every revision is logged in the audit trail. |
| Budget Template | The column structure used to import a project's WBS and budget via Excel. Six columns, S/N, Phase, Activity, Quantity, Rate, and Amount, are fixed and mandatory. The PM can add or remove additional, non-mandatory columns, which are stored as plain text with no calculation applied. |
| Chart of Accounts | The structured list of all financial accounts the company uses to record transactions in FastraSuite. Organised into five fixed account types: Assets, Liabilities, Equity, Income, and Expenses. The Company Admin creates and manages accounts within each type. The system pre-loads a standard set of accounts on registration.  |
| Committed Amount | The total value of approved but not yet paid requests and purchase orders against a specific WBS activity element. Committed amounts are always deducted from the available budget in all validation checks. |
| Committed to Actual | The conversion that occurs when a user with payer permission confirms payment on a vendor bill. The Committed Amount for the tagged WBS element releases, and the Actual Amount increases by the paid amount in the Project Costing Module.  |
| Cost Category  | A project-level spending classification used only in the Project Costing Module to organise budget lines and track financial performance by type of expenditure. Cost categories do not appear on request forms or in the Invoice or Inventory modules. Examples include labour, materials, and subcontractors.  |
| Direct Payment  | A payment in the Invoice Module that does not require a purchase order. Labour requests and petty cash requests are processed as direct payments. Labour requests result in a vendor bill. Petty cash requests result in a disbursement.  |
| Disbursement  | A direct payment made in the Invoice Module for an approved petty cash request. Supports bank transfer to the requester or physical cash handout recorded manually by the processor.  |
| Equipment Hire Tracking  | A feature covering hired or rented equipment only, tracking the expected return date and hire status of equipment linked to an approved plant and equipment request. It has no effect on payment processing, which continues on its normal path regardless of hire status.  |
| Inventory Ledger | A complete chronological record of all stock movements at a site, including timestamp, user, movement type, quantity change, running balance, project, WBS element, and source document reference.  |
| Invoice Verification | The process of checking a vendor invoice against the originating purchase order or approved request before payment. If the processor enters a price or quantity that differs from the original, the system flags the discrepancy but does not block submission.  |
| Material Receipt Confirmation  | The on-site confirmation by a stockkeeper in the Inventory Module of the actual quantity of goods received against a purchase order. This confirmation is the site receipt data point used in invoice verification before a vendor invoice is cleared for payment.  |
| Milestone-Based Payment | A payment structure for subcontractor requests where the total contract value is divided into defined milestones. Each milestone payment is only released when the PM marks the corresponding milestone as complete.  |
| Over-Budget Flag | A visual indicator applied to requests in the PM approval queue that exceed the available budget for their tagged WBS element. Flagged requests proceed to the normal approval queue alongside standard requests. The PM sees the full financial breakdown on flagged requests and can approve or reject them.  |
| Path A | The payment path in the Invoice Module where the company chooses to pay a vendor before receiving goods. The processor creates the vendor bill directly from the issued PO, selects the company bank account, and submits it without waiting for a stockkeeper receipt confirmation.  |
| Path B | The payment path in the Invoice Module where the company chooses to receive goods before paying. The processor creates the vendor bill only after the stockkeeper confirms receipt of goods in the inventory module.  |
| Path C | The payment path in the Invoice Module for Subcontractor Requests. The processor creates the vendor bill only after the PM confirms work completion or milestone completion. No stockkeeper involvement.  |
| Payment Queue  | The central list of all submitted vendor bills and disbursements ready for payment. The Pay button is visible to all users with queue access but is active only for users with payer permission.  |
| Petty Cash Reference  | The unique system-generated identifier assigned to a petty cash disbursement record on creation.  |
| Project Budget | The formally approved total spending limit for a project, broken down by WBS element. |
| Project Request | A field-initiated request submitted via the Project Request Module for goods, labour, cash, services, or material recording.  |
| Remaining Budget | Project Budget minus total Committed Amount minus total Actual Amount. |
| Request Type to Account Mapping  | A one-time configuration in Settings that connects each request type to the corresponding expense account in the Chart of Accounts. Once configured, every payment processed in the Invoice Module is automatically posted to the correct account without manual input from finance. Petty cash is excluded from this mapping, since the processor selects the expense account manually at the point of disbursement.  |
| Vendor Bill | A payment obligation created internally in the Invoice Module by a user with processor permission. For goods-based requests, the vendor bill is created by converting a purchase order after goods are received, Path B, or directly from the PO, Path A. For subcontractor requests, the vendor bill is created after the PM confirms work completion. The Vendor Bill must be paid by a user with Payer permission before payment is released.  |
| Variance | The difference between the project budget and the actual amount spent to date.  |
| Vendor Management  | The feature in the Invoice Module that allows the company to maintain a complete record of all vendors and subcontractors, including their contact details and bank account information. Vendor bank details are stored securely and pulled automatically when processing payments.  |
| WBS | Work Breakdown Structure, the hierarchical breakdown of a project into two fixed levels in Core, Phase and Activity. Every budget line and transaction must be tagged to a specific activity element.  |
| WBS Element | A single node in the Work Breakdown Structure, either a Phase or an Activity. Only activity elements can receive budget lines and transactions. |

 

FastraSuite  |  Confidential — Internal Document  |  Version 3.0  |  April 2026

[image1]: <data:image/png;base64,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xJUz7Q1vREREwQbHzZUrV6owR4EhaAIcERERdQw+MSElJcVspk7EAEdERETkMAxwRERERA7DAEdERETkMAxwRERERA7DAEdERETkMAxwRERERA4TUAEOXzmFz2VjsVhds/DVdiwWi8W6/QqoAIdfBN9iwGKxumYREZFvBFSAIyIiIqLWMcAREREROQwDHBEREZHDMMAREREROQwDHBEREZHDMMAREREROQwDHBEREZHDMMAREREROQwDXAeFhISYTW7Gjh1rNimfffaZ23JCQoIsWbLErWpra9228WbNmjVmExEREQUJBrgOmjp1qoSFhZnNlrYGOG3IkCEt3p+JAY6IiCh4McB1QHh4uFRVVanQZbdo0SL59NNPZcOGDfLFF19Y7SNHjlSF0NeWALd69Wq1/ccffyxnz5612v7zn/9YP1MHuIKCAhk9erRUVlY23RERERF1eQxw7YR/1qRJk9T8l19+6dY+efJkNT9nzhwraJ0+fVr27NkjDQ0Ncvjw4TYFuB9++EF9bySmI0aMUG3Dhw9X05qaGjXVAe6rr76Sr7/+Ws0TERFRcGCAa6d169apHi+4fv26nDp1Ss1v375d/SM13QNn9tK1JcDV19fLjh071DCsvj2miYmJ1s9AgEOPH3rgiIiIKLgwwLUTgtT58+clKSlJlQ5YCHAIXoDeNgyB6u3t2hLgMFQKOTk5brfPzc2VadOmSVlZmQpwsbGxsn//fms9ERERBQcGuHZAbxeGQ+3mzp2rAhuGPBHaELKmTJli9dLhHLYVK1ZIfHy8GnptS4DDPO7nm2++sQIceuRSU1Nl5syZahhVD6Hu2rXLIyQSERFR18YA1w4RERGSl5fn1hYVFaV64mD58uUqTJWUlMisWbOsbcaMGaMCHXruZsyYYbXbTZw4UU6cOKHm8VEiuJ/s7Gx1jhtgOHXUqFGydOlStYxAB3jwcNFEenp60x0RERFRl8cAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDsMAR0REROQwDHBEREREDqMD3P8HMkqARyYgVIoAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,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>