"use client";

import { useState } from "react";
import {
  Banner,
  Button,
  PageHeader,
  Pill,
  Select,
} from "../shared/primitives";

/**
 * "Tax mapping" step.
 *
 * TODO(backend): the swagger dated 12 Nov 2026 still includes no tax
 * endpoints. The screen is fully built against local state below; once
 * the backend ships something like
 *   GET  /accounting/odoo/taxes/
 *   GET  /accounting/odoo/tax-mappings/
 *   POST /accounting/odoo/tax-mappings/{id}/confirm/
 * swap LOCAL_TAX_ROWS for the queries in integrationsApi.ts and delete
 * the local mock. The rest of the UI can stay as-is.
 */

interface TaxRow {
  /** FastrSuite tax label, e.g. "VAT 7.5%". */
  local: string;
  /** Currently selected Odoo tax label, or null when unmapped. */
  odoo: string | null;
}

const LOCAL_TAX_ROWS: TaxRow[] = [
  { local: "VAT 7.5%", odoo: "VAT 7.5% (Purchases)" },
  { local: "WHT 5%", odoo: null },
  { local: "WHT 10%", odoo: "WHT 10% (Purchases)" },
];

export function TaxMappingStep() {
  const [rows, setRows] = useState<TaxRow[]>(LOCAL_TAX_ROWS);

  const unmapped = rows.filter((r) => !r.odoo).length;

  return (
    <div>
      <PageHeader
        title="Tax mapping"
        subtitle="Match FastrSuite taxes to Odoo taxes where applicable."
        actions={
          /* TODO(backend): enable once the tax-mapping save endpoint exists. */
          <Button type="button" disabled title="Available once the tax endpoints are documented">
            Save
          </Button>
        }
      />

      {unmapped > 0 ? (
        <Banner
          variant="error"
          title={`${unmapped} tax${unmapped === 1 ? " needs" : "es need"} mapping`}
          className="mt-4"
        >
          Bills that use this tax cannot sync until it is mapped.
        </Banner>
      ) : (
        <Banner variant="success" title="All taxes are mapped" className="mt-4">
          Vendor bills using these taxes can sync to Odoo.
        </Banner>
      )}

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600">
            <th className="rounded-l-md px-4 py-2.5 font-normal">FastrSuite tax</th>
            <th className="px-4 py-2.5 font-normal">Odoo tax</th>
            <th className="rounded-r-md px-4 py-2.5 font-normal">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr key={row.local}>
              <td className="px-4 py-3 font-medium text-gray-900">{row.local}</td>
              <td className="px-4 py-3">
                <div className="w-full max-w-sm">
                  <Select
                    placeholder="Search Odoo taxes"
                    value={row.odoo}
                    onChange={(v) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, odoo: v } : r)),
                      )
                    }
                    options={
                      /* TODO(backend): populate from GET /taxes/ when available. */
                      []
                    }
                    disabled
                    title="Odoo tax list is not available yet – pending backend documentation"
                    className="h-9"
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                {row.odoo ? (
                  <Pill variant="success">Complete</Pill>
                ) : (
                  <Pill variant="danger">Needs attention</Pill>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
