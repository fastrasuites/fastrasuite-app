"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  ODOO_AUTH_METHODS,
  ODOO_VERSIONS,
  getConnectionBaseUrl,
  getConnectionCompany,
  getConnectionStatus,
  getErrorDetail,
  isOdooCredentialType,
  isTestConnectionSuccessful,
  useGetConnectionQuery,
  usePatchConnectionMutation,
  useTestConnectionMutation,
  useUpdateConnectionMutation,
  type OdooCredentialType,
  type SaveConnectionRequest,
} from "@/api/settings/integrationsApi";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import {
  Banner,
  Button,
  FieldLabel,
  PageHeader,
  Pill,
  Select,
  Skeleton,
  TextInput,
} from "../shared/primitives";
import { DetailField } from "../shared/DetailModal";
import type { SetupStepId } from "./steps";

const connectionFormSchema = z.object({
  base_url: z
    .string()
    .min(1, "Odoo base URL is required")
    .refine(
      (v) =>
        /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z0-9-]+(\/\S*)?$/i.test(v.trim()),
      "Enter a valid Odoo URL, e.g. https://mycompany.odoo.com",
    ),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  odoo_version: z.string().min(1, "Select a version"),
  credential_type: z
    .string()
    .min(1, "Select a method")
    .pipe(z.enum(["password", "api_key"])),
  /** Blank in edit mode = keep the stored secret. */
  secret: z.string(),
});

type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
/** RHF field type – credential_type is a plain string before validation. */
type ConnectionFormInput = z.input<typeof connectionFormSchema>;

interface TestResult {
  ok: boolean;
  message?: string;
  version?: string;
  at: string;
}

/**
 * "Odoo connection" step – create / edit / view modes per the prototype.
 *
 * API behaviour (swagger 12 Nov 2026):
 * - POST /connection/test/ has NO body: it always tests the SAVED
 *   connection. In create/edit mode the "Test connection" button
 *   therefore saves the current fields first, then tests.
 * - PUT performs a full save (used to create), PATCH partial validation
 *   (used to edit; omit `secret` to keep the stored one).
 * - Disconnect is PATCH { is_active: false } – see README for the note
 *   on this assumption.
 */
export function OdooConnectionStep({
  onNavigate,
}: {
  onNavigate: (step: SetupStepId) => void;
}) {
  const connectionQuery = useGetConnectionQuery();
  const [updateConnection, updateState] = useUpdateConnectionMutation();
  const [patchConnection, patchState] = usePatchConnectionMutation();
  const [testConnection, testState] = useTestConnectionMutation();

  const [editing, setEditing] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /* GET returns 200 with configured=false when no connection exists. */
  const configured = connectionQuery.data?.configured === true;
  const connection = configured ? connectionQuery.data : null;
  const connected = getConnectionStatus(connection) === "connected";
  const company = getConnectionCompany(connection);
  /** View mode only when the connection exists, is connected, and we are
   *  not editing. A not-connected integration shows the form directly. */
  const viewMode = connected && !editing;
  const busy =
    updateState.isLoading || patchState.isLoading || testState.isLoading;

  const form = useForm<ConnectionFormInput, any, ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      base_url: "",
      database: "",
      username: "",
      odoo_version: "",
      credential_type: "",
      secret: "",
    },
  });

  /* Fill the form once the saved connection arrives (edit mode). */
  useEffect(() => {
    if (!connection) return;
    form.reset({
      base_url: getConnectionBaseUrl(connection),
      database: connection.database ?? "",
      username: connection.username ?? "",
      odoo_version: connection.odoo_version ?? "",
      credential_type: isOdooCredentialType(connection.credential_type)
        ? connection.credential_type
        : "",
      secret: "",
    });
  }, [connection, form]);

  const buildPayload = (
    values: ConnectionFormValues,
  ): SaveConnectionRequest => {
    const payload: SaveConnectionRequest = {
      name: connection?.name?.trim() || "Odoo",
      base_url: values.base_url.trim(),
      database: values.database.trim(),
      username: values.username.trim(),
      credential_type: values.credential_type as OdooCredentialType,
      is_active: true,
    };
    const secret = values.secret.trim();
    if (secret) payload.secret = secret;
    return payload;
  };

  /**
   * Persist the form fields. Create → PUT (full), edit → PATCH (partial;
   * a blank secret keeps the stored one, per the swagger's partial
   * validation note).
   */
  const saveConnection = async (
    values: ConnectionFormValues,
  ): Promise<{ ok: boolean; errorDetail?: string }> => {
    const payload = buildPayload(values);
    const res = connection
      ? await patchConnection(payload)
      : await updateConnection(payload);
    if (res.error) {
      return {
        ok: false,
        errorDetail:
          getErrorDetail(res.error) ??
          "Could not save the connection settings. Check your details and try again.",
      };
    }
    return { ok: true };
  };

  const handleTest = form.handleSubmit(async (values) => {
    setActionError(null);
    if (!connection && !values.secret.trim()) {
      form.setError("secret", {
        type: "manual",
        message: "Enter password or API key",
      });
      return;
    }
    if (!viewMode) {
      /* The test endpoint has no body – it tests the saved config.
       * Save the current fields first so the test uses them. */
      const saved = await saveConnection(values);
      if (!saved.ok) {
        setActionError(saved.errorDetail ?? null);
        return;
      }
    }
    const res = await testConnection();
    const at = format(new Date(), "d MMM yyyy, HH:mm");
    if (res.error) {
      /* Failed tests come back as HTTP 400 with a detail message. */
      setTestResult({
        ok: false,
        message:
          getErrorDetail(res.error) ??
          "Check the base URL, database name and your login details, then test again.",
        at,
      });
      return;
    }
    setTestResult({
      ok: isTestConnectionSuccessful(res.data),
      message: isTestConnectionSuccessful(res.data)
        ? undefined
        : (getErrorDetail(res.error) ?? res.data?.detail ?? undefined),
      version: res.data?.version,
      at,
    });
  });

  const handleSave = form.handleSubmit(async (values) => {
    setActionError(null);
    if (!connection && !values.secret.trim()) {
      form.setError("secret", {
        type: "manual",
        message: "Enter password or API key",
      });
      return;
    }
    const saved = await saveConnection(values);
    if (!saved.ok) {
      setActionError(saved.errorDetail ?? null);
      return;
    }
    setEditing(false);
    setTestResult(null);
  });

  const handleDisconnect = async () => {
    /* TODO(backend): the swagger documents no dedicated disconnect action;
     * PATCH { is_active: false } uses the documented partial body to take
     * the integration offline. Confirm the semantics with the backend. */
    const res = await patchConnection({ is_active: false });
    setDisconnectOpen(false);
    if (res.error) {
      setActionError(
        getErrorDetail(res.error) ??
          "Could not disconnect from Odoo. Please try again.",
      );
      return;
    }
    setEditing(false);
    setTestResult(null);
  };

  if (connectionQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  /* ----------------------------- View mode ----------------------------- */
  if (viewMode && connection) {
    const authLabel =
      ODOO_AUTH_METHODS.find((m) => m.value === connection.credential_type)
        ?.label ??
      (connection.credential_type as string | undefined) ??
      "—";
    return (
      <div>
        <PageHeader
          title="Odoo connection"
          subtitle="Your saved connection to Odoo."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                loading={testState.isLoading}
                onClick={() => void handleTest()}
              >
                Test connection
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Connection options"
                    className="px-2.5"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
                  >
                    <DropdownMenu.Item
                      onSelect={() => setEditing(true)}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-gray-700 outline-none data-[highlighted]:bg-gray-50"
                    >
                      Edit connection
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => setDisconnectOpen(true)}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 outline-none data-[highlighted]:bg-red-50"
                    >
                      Disconnect
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          }
        />

        {actionError ? (
          <Banner variant="error" title="Something went wrong" className="mt-4">
            {actionError}
          </Banner>
        ) : null}

        {testResult ? (
          testResult.ok ? (
            <Banner
              variant="success"
              title="Connection test passed"
              className="mt-4"
            >
              {testResult.version
                ? `Odoo ${testResult.version} responded. Last tested ${testResult.at}.`
                : `Odoo responded. Last tested ${testResult.at}.`}
            </Banner>
          ) : (
            <Banner
              variant="error"
              title="We could not connect to Odoo"
              className="mt-4"
            >
              {testResult.message ??
                "Check the base URL, database name and your login details, then test again."}
            </Banner>
          )
        ) : null}

        {company.id === null ? (
          <Banner
            variant="info"
            title="Next step: choose your Odoo company"
            className="mt-4"
            action={
              <Button
                type="button"
                onClick={() => onNavigate("company_selection")}
              >
                Select company
              </Button>
            }
          >
            FastrSuite needs to know which company in your Odoo database to use.
          </Banner>
        ) : null}

        <div className="mt-6 divide-y divide-gray-100 border-y border-gray-100">
          <div className="grid grid-cols-3 gap-6 py-5">
            <DetailField label="Platform">Odoo</DetailField>
            <DetailField label="Status">
              <Pill variant="success">Connected</Pill>
            </DetailField>
            <DetailField label="Odoo version">
              {connection.odoo_version ?? "—"}
            </DetailField>
          </div>
          <div className="grid grid-cols-3 gap-6 py-5">
            <DetailField label="Odoo address">
              {getConnectionBaseUrl(connection) || "—"}
            </DetailField>
            <DetailField label="Database">
              {connection.database ?? "—"}
            </DetailField>
            <DetailField label="Username">
              {connection.username ?? "—"}
            </DetailField>
          </div>
          <div className="grid grid-cols-3 gap-6 py-5">
            <DetailField label="Authentication method">{authLabel}</DetailField>
            <DetailField
              label={authLabel === "API Key" ? "API key" : "Password"}
            >
              {connection.has_secret ? "••••••••" : "Not set"}
            </DetailField>
            <DetailField label="Active company">
              {company.name ? (
                company.name
              ) : (
                <span className="font-normal text-gray-400">
                  Not selected yet
                </span>
              )}
            </DetailField>
          </div>
        </div>

        <ConfirmDialog
          open={disconnectOpen}
          onOpenChange={setDisconnectOpen}
          title="Disconnect from Odoo?"
          description={`Your saved connection details will be removed from FastrSuite. Vendor bills and payments will stop syncing until you connect again.${
            company.name
              ? ` Mappings made for ${company.name} will also be cleared.`
              : ""
          }`}
          confirmLabel="Disconnect"
          danger
          loading={patchState.isLoading}
          onConfirm={handleDisconnect}
        />
      </div>
    );
  }

  /* ----------------------------- Form mode ----------------------------- */
  const isEditSession = editing && !!connection;
  const errors = form.formState.errors;

  return (
    <div>
      {isEditSession ? (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
      ) : null}

      <PageHeader
        title={isEditSession ? "Edit connection" : "Odoo connection"}
        subtitle={
          isEditSession
            ? "Changes are saved when you select Save changes."
            : "Enter your Odoo details to connect."
        }
        actions={
          <Pill variant={connected ? "success" : "neutral"}>
            {connected ? "Connected" : "Not connected"}
          </Pill>
        }
      />

      {connectionQuery.isError ? (
        <Banner
          variant="error"
          title="Could not load your saved connection"
          className="mt-4"
        >
          Showing a blank form. Check your network and refresh the page.
        </Banner>
      ) : null}

      {actionError ? (
        <Banner variant="error" title="Something went wrong" className="mt-4">
          {actionError}
        </Banner>
      ) : null}

      {testResult && !testResult.ok ? (
        <Banner
          variant="error"
          title="We could not connect to Odoo"
          className="mt-4"
        >
          {testResult.message ??
            "Check the base URL, database name and your login details, then test again."}
        </Banner>
      ) : null}

      {testResult && testResult.ok ? (
        <Banner
          variant="success"
          title="Connection test passed"
          className="mt-4"
        >
          {testResult.version
            ? `Odoo ${testResult.version} responded. Last tested ${testResult.at}.`
            : `Odoo responded. Last tested ${testResult.at}.`}
        </Banner>
      ) : null}

      <form
        className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        noValidate
      >
        <div>
          <FieldLabel htmlFor="base_url">Odoo base URL</FieldLabel>
          <TextInput
            id="base_url"
            placeholder="mycompany.odoo.com"
            {...form.register("base_url")}
          />
          {errors.base_url ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.base_url.message}
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="database">Database name</FieldLabel>
          <TextInput
            id="database"
            placeholder="Database name"
            {...form.register("database")}
          />
          {errors.database ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.database.message}
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <TextInput
            id="username"
            placeholder="name@company.com"
            {...form.register("username")}
          />
          {errors.username ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.username.message}
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="odoo_version">Odoo version</FieldLabel>
          <Select
            id="odoo_version"
            placeholder="Select version"
            value={form.watch("odoo_version") || null}
            onChange={(v) =>
              form.setValue("odoo_version", v, { shouldValidate: true })
            }
            options={ODOO_VERSIONS.map((v) => ({ value: v, label: v }))}
          />
          {errors.odoo_version ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.odoo_version.message}
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="credential_type">
            Authentication method
          </FieldLabel>
          <Select
            id="credential_type"
            placeholder="Select method"
            value={form.watch("credential_type") || null}
            onChange={(v) =>
              form.setValue("credential_type", v as OdooCredentialType, {
                shouldValidate: true,
              })
            }
            options={ODOO_AUTH_METHODS.map((m) => ({
              value: m.value,
              label: m.label,
            }))}
          />
          {errors.credential_type ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.credential_type.message}
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="secret">Password or API key</FieldLabel>
          <TextInput
            id="secret"
            type="password"
            placeholder={
              isEditSession ? "••••••••••••••" : "Enter password or API key"
            }
            {...form.register("secret")}
          />
          {errors.secret ? (
            <p className="mt-1 text-xs text-red-600">{errors.secret.message}</p>
          ) : null}
          {isEditSession ? (
            <p className="mt-1 text-xs text-gray-400">
              Leave blank to keep the current{" "}
              {authMethodNoun(form.watch("credential_type"))}.
            </p>
          ) : null}
        </div>

        <div className="col-span-2 mt-2 flex items-center justify-end gap-3">
          {isEditSession ? (
            <Button
              type="button"
              variant="neutral"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            loading={busy}
            onClick={() => void handleTest()}
          >
            Test connection
          </Button>
          <Button
            type="submit"
            loading={updateState.isLoading || patchState.isLoading}
          >
            {isEditSession ? "Save changes" : "Save connection"}
          </Button>
        </div>
      </form>

      <p className="mt-8 border-t border-gray-100 pt-5 text-sm text-gray-500">
        FastrSuite keeps its own General Ledger. Connecting does not change your
        FastrSuite records.
      </p>
    </div>
  );
}

function authMethodNoun(method: string | undefined): string {
  if (method === "password") return "password";
  if (method === "api_key") return "API key";
  return "credentials";
}
