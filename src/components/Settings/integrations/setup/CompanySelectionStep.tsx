"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getConnectionCompany,
  getErrorDetail,
  useGetCompaniesQuery,
  useGetConnectionQuery,
  useSelectCompanyMutation,
  type OdooCompany,
} from "@/api/settings/integrationsApi";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import {
  Banner,
  Button,
  PageHeader,
  Pill,
  Skeleton,
} from "../shared/primitives";
import { cn } from "../shared/utils";
import type { SetupStepId } from "./steps";

/** "Company Selection" step: radio list of Odoo companies + active banner. */
export function CompanySelectionStep({
  onNavigate,
}: {
  onNavigate: (step: SetupStepId) => void;
}) {
  const companiesQuery = useGetCompaniesQuery();
  const connectionQuery = useGetConnectionQuery();
  const [selectCompany, selectState] = useSelectCompanyMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCompany, setPendingCompany] = useState<OdooCompany | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /* GET /connection/ returns configured=false when not set up. */
  const configured = connectionQuery.data?.configured === true;
  const connection = configured ? connectionQuery.data : null;
  const activeCompany = getConnectionCompany(connection);
  const hasActiveCompany = activeCompany.id !== null;

  /* Preselect the active company once data is available. */
  useEffect(() => {
    if (selectedId === null && hasActiveCompany) {
      setSelectedId(String(activeCompany.id));
    }
  }, [hasActiveCompany, activeCompany.id, selectedId]);

  const doSelect = async (company: OdooCompany) => {
    const res = await selectCompany({ companyId: company.id });
    if (res.error) {
      setActionError(
        getErrorDetail(res.error) ??
          "Could not select the company. Check the connection and try again.",
      );
      return false;
    }
    setActionError(null);
    return true;
  };

  const handlePick = (company: OdooCompany) => {
    const id = String(company.id);
    if (id === selectedId) return;
    if (hasActiveCompany && String(activeCompany.id) !== id) {
      setPendingCompany(company);
      setConfirmOpen(true);
      return;
    }
    setSelectedId(id);
    void doSelect(company);
  };

  const handleConfirmChange = () => {
    if (!pendingCompany) return;
    const company = pendingCompany;
    setConfirmOpen(false);
    setSelectedId(String(company.id));
    void doSelect(company);
    setPendingCompany(null);
  };

  if (connectionQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[68px] w-full" />
        <Skeleton className="h-[68px] w-full" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div>
        <PageHeader
          title="Odoo company"
          subtitle="Choose the Odoo company FastrSuite should use."
        />
        <Banner
          variant="error"
          title="Not connected to Odoo"
          className="mt-4"
          action={
            <Button type="button" variant="outline" onClick={() => onNavigate("odoo_connection")}>
              Go to connection
            </Button>
          }
        >
          Connect FastrSuite to your Odoo database before selecting a company.
        </Banner>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Odoo company"
        subtitle="Choose the Odoo company FastrSuite should use."
        actions={
          <Button
            type="button"
            variant="outline"
            loading={companiesQuery.isFetching}
            onClick={() => void companiesQuery.refetch()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh companies
          </Button>
        }
      />

      {companiesQuery.isError ? (
        <Banner
          variant="error"
          title="We could not load your Odoo companies"
          className="mt-4"
          action={
            <Button type="button" variant="outline" onClick={() => void companiesQuery.refetch()}>
              Try again
            </Button>
          }
        >
          Make sure the connection is still active, then refresh.
        </Banner>
      ) : actionError ? (
        <Banner variant="error" title="Something went wrong" className="mt-4">
          {actionError}
        </Banner>
      ) : hasActiveCompany ? (
        <Banner
          variant="success"
          title={`Active company: ${activeCompany.name ?? "—"} (ID ${activeCompany.id})`}
          className="mt-4"
        >
          FastrSuite uses this company for vendor bills and payments.
        </Banner>
      ) : (
        <Banner variant="info" title="No company selected yet" className="mt-4">
          Pick a company below – FastrSuite will use it for vendor bills and payments.
        </Banner>
      )}

      <div className="mt-5 space-y-3" role="radiogroup" aria-label="Odoo companies">
        {companiesQuery.isLoading ? (
          <>
            <Skeleton className="h-[68px] w-full" />
            <Skeleton className="h-[68px] w-full" />
            <Skeleton className="h-[68px] w-full" />
          </>
        ) : (
          (companiesQuery.data ?? []).map((company) => {
            const id = String(company.id);
            const selected = id === selectedId;
            const isActive =
              hasActiveCompany && String(activeCompany.id) === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => handlePick(company)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  selected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-blue-600" : "border-gray-400",
                  )}
                >
                  {selected ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-gray-900">
                    {company.name}
                  </span>
                  <span className="block text-sm text-gray-500">ID {id}</span>
                </span>
                {isActive ? (
                  <Pill variant="success" className="ml-auto">
                    Active company
                  </Pill>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change Odoo company?"
        description={`Your vendor and account mappings were made for ${activeCompany.name ?? "the current company"}. Changing company will remove them and they will need to be suggested again.`}
        confirmLabel="Change company"
        loading={selectState.isLoading}
        onConfirm={handleConfirmChange}
      />
    </div>
  );
}
