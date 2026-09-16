import { redirect } from "next/navigation";

export default function AuditTrailRedirect() {
  redirect("/settings/audit-trail");
}
