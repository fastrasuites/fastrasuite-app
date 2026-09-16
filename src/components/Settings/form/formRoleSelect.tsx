import React, { useState, useEffect } from "react";
import FormSelect from "@/components/Settings/form/FormSelect";
import { useGetCompanyQuery } from "@/api/settings/companyApi";

export default function NewUserRoleSelect({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (value: number | null | undefined) => void;
}) {
  // Fetch company info including roles
  const { data: company, isLoading, error } = useGetCompanyQuery();
  console.log(company)

  // Map roles to select options
  const roleOptions =
    company?.roles?.map((role) => ({
      label: role.name,
      value: role.id,
    })) || [];

  return (
    <FormSelect
      label="Role"
      name="company_role"
      value={value && value !== 0 ? value : ""}
      onChange={(e) =>
        onChange(e.target.value ? Number(e.target.value) : undefined)
      }
      placeholder={isLoading ? "Loading roles..." : "Select role"}
      options={roleOptions}
    />
  );
}
