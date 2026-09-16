"use client";

import React from "react";
import { useParams } from "next/navigation";
import MaterialConsumptionForm from "../../new/MaterialConsumptionForm";

export default function EditMaterialConsumptionRequestPage() {
  const params = useParams();
  const id = Number(params?.id);

  return <MaterialConsumptionForm requestId={isNaN(id) ? undefined : id} />;
}
