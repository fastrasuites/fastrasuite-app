"use client";

import { GridCardIcon } from "@/components/icons/gridCardIcon";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { ReusableTable } from "@/components/Settings/settingsReusableTable";
import { useGetCompanyQuery } from "@/api/settings/companyApi";
import { SettingsCard } from "@/components/Settings/settingsCard";
import { useRouter } from "next/navigation";
import { LoadingDots } from "@/components/shared/LoadingComponents";
import { PageGuard } from "@/components/auth/PageGuard";
import { useEffect } from "react";

export default function Settings() {
  const viewMode = useSelector((state: RootState) => state.viewMode.mode);
  const router = useRouter();
  const tenant_company_name = useSelector(
    (state: any) => state.auth.tenant_company_name,
  );
  const userEmail = useSelector((state: any) => state.auth.user.email);

  const { data: company, isLoading, isError } = useGetCompanyQuery();
  console.log("industry", company?.industry);

  if (isLoading)
    return (
      <div className="p-6 flex justify-center items-center">
        <LoadingDots count={3} />
      </div>
    );

  if (isError)
    return <p className="p-6 text-red-500">Failed to load company</p>;
  if (!company) return <p className="p-6">No company has been created yet</p>;

  const roleName =
    Array.isArray(company.roles) && company.roles.length > 0
      ? company.roles[0].name
      : "—";

  const cardData = [
    {
      id: company.id,
      title: company.industry || "Company",
      icon: <GridCardIcon />,
      data: [roleName, userEmail, company.phone].filter(Boolean),
    },
  ];

  const tableData = [
    {
      ...company,
      role: roleName,
      email: userEmail,
    },
  ];

  const handleCardClick = (id: string | number) => {
    router.push(`/settings/company/${id ?? 1}`);
  };

  const headers = [
    { key: "industry", label: "Industry" },
    { key: "role", label: "Role" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  console.log("company", company);
  return (
    <PageGuard module="settings" entitlement="view_company">
      <div className="py-4 w-full">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardData.map((item) => (
              <SettingsCard
                key={item.id ?? 1}
                icon={item.icon}
                title={tenant_company_name}
                data={item.data}
                className="w-[60%]"
                onClick={() => handleCardClick(item.id)}
              />
            ))}
          </div>
        ) : (
          <ReusableTable
            headers={headers}
            data={tableData}
            striped
            checkbox
            icon={<GridCardIcon />}
            headerClassName="bg-[#F1F2F4]"
            className="bg-white p-4"
            headerTextColor="text-[#7A8A98]"
            bodyTextColor="text-[#1A1A1A]"
            iconWrapperClassName="bg-[#E8EFFD]"
            onRowClick={handleCardClick}
          />
        )}
      </div>
    </PageGuard>
  );
}
