import React from "react";
import MaterialConsumptionForm from "./MaterialConsumptionForm";
import { PageGuard } from "@/components/auth/PageGuard";

export default function NewMaterialConsumptionRequestPage() {
  return (
    <PageGuard module="project_request" entitlement="create">
      <MaterialConsumptionForm />
    </PageGuard>
  );
}
