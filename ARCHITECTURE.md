# Fastra Suite Architecture Documentation

## 1. Project Overview

**Fastra Suite** (internal app name: `fastra-app-new`) is a comprehensive Enterprise Resource Planning (ERP) and business management web application. The platform is designed to govern and digitize essential operational workflows, catering predominantly to supply chain management, financial billing, procurement, and contact management.

## 2. Core Business Modules

The platform adopts a modular approach to handle specific business verticals, reflected in its routing structure:

- **Inventory Management (`/inventory`)**: 
  - Manages warehousing, stock levels, and item configurations.
  - Submodules handle logistical movements including operational components like *Delivery Orders* (outward goods processing).
- **Purchasing / Procurement (`/purchase`)**: 
  - Regulates the workflow for creating, issuing, and managing purchase orders for external supply interactions.
- **Invoicing (`/invoice`)**: 
  - Facilitates the accounting and billing layer, generating client-facing invoices and overseeing transactional and payment statuses.
- **Contact Management (`/contact`)**: 
  - Operates as the application's Customer Relationship Management (CRM) mechanism, regulating directories of vendors, clients, and partners.
- **Authentication & Security (`/auth`, `/protected`, `/unauthorized`)**: 
  - Governs user sessions, identity verification, and strict role-based access control (RBAC) ensuring appropriate separation of duties across the enterprise ecosystem.
- **Settings (`/settings`)**: 
  - A centralized zone for cross-module configurations, managing enterprise profiles, localization parameters, and user-level defaults.

## 3. Technology Stack

Fastra Suite represents a modern, performant, and scalable single-page application heavily leaning into server-side and client component paradigms.

### 3.1 Framework & Core Technologies
- **Next.js 15 (App Router)**: Anchoring the project, utilizing Next's file-based routing architecture for seamless SSR (Server-Side Rendering) and API capabilities.
- **React 19**: Providing the functional foundation for UI components and hooks.
- **TypeScript**: Enforcing strict typing across the codebase to reduce run-time errors, essential for financial and inventory calculations.

### 3.2 State Management & Data Fetching
- **Redux Toolkit**: Handling complex global application state across heavily interconnected modules (e.g., cart data, wizard progress).
- **Redux Persist**: Providing mechanisms to cache critical state subsets locally across browser reloads.
- **Axios**: Standardized HTTP client for querying and mutating external APIs/backend systems.

### 3.3 Styling & UI Infrastructure
- **Tailwind CSS 4**: A utility-first framework managing responsive and scalable interface styling.
- **Radix UI Primitives**: Ensuring high standards of web accessibility (WCAG) by utilizing unstyled, structural UI components like Menus, Dialogs, Tooltips, and Selectors.
- **Framer Motion & Vaul**: Facilitating polished interactive animations and touch-friendly drawer overlays.
- **Iconography**: Delivered seamlessly through a combination of `lucide-react`, `@hugeicons/react`, and `react-icons`.

### 3.4 Forms & Validation
- **React Hook Form**: Providing performant and flexible form architecture, heavily utilized considering the data-entry intensity of an ERP.
- **Zod**: Integrating directly with forms via resolvers to assure rigid schema parsing and comprehensive payload validations before transmission.

### 3.5 Specialized Enterprise Tooling
- **Digital Signatures**: Achieved via `react-signature-canvas`, establishing cryptographic/visual commitments directly within the browser for invoices or delivery processing.
- **Localization & Geography**: 
  - Date/Time handling provided by `date-fns` and `moment-timezone`.
  - Advanced international structuring governed by `i18n-iso-languages` and `@teclone/industries`.

## 4. Architecture Intent & Scalability

The clear physical separation of domains into domain-specific routes (`inventory`, `purchase`, `invoice`) creates a highly maintainable system architecture. As the ERP expands, engineering teams can treat these distinct pathways as isolated micro-frontends or bounded contexts, accelerating subsequent feature rollouts while minimizing cross-module regressions.
