"use client";

import { IntegrationsPanel } from "@/components/Settings/integrations/IntegrationsPanel";

/**
 * /settings/integrations – Accounting Software (Odoo) integration.
 *
 * Move this file next to your other settings pages (same route group
 * as settings/users etc.) if your app uses a route group layout.
 * The settings layout renders the NavBar, breadcrumbs and the
 * Integrations nav item; this page only renders the tabbed panel.
 */
export default function IntegrationsPage() {
  return <IntegrationsPanel />;
}
