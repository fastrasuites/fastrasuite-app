"use client";

import { Banner, PageHeader, Pill, Select } from "../shared/primitives";

/**
 * "Currency mapping" step – reference-only view of the currencies both
 * systems use.
 *
 * TODO(backend): the swagger dated 12 Nov 2026 still includes no
 * currency endpoints. Rows below mirror the prototype; when the
 * backend exposes e.g. GET /accounting/odoo/currencies/, replace
 * LOCAL_CURRENCY_ROWS with the query and drive the banner from the
 * company payload.
 */

interface CurrencyRow {
  code: string;
  name: string;
  /** Whether an active currency with this code exists in Odoo. */
  activeInOdoo: boolean;
}

const LOCAL_CURRENCY_ROWS: CurrencyRow[] = [
  { code: "NGN", name: "Nigerian Naira", activeInOdoo: true },
  { code: "USD", name: "US Dollar", activeInOdoo: true },
  { code: "EUR", name: "Euro", activeInOdoo: false },
];

const COMPANY_CURRENCY = { code: "NGN", name: "Nigerian Naira" };

export function CurrencyMappingStep() {
  return (
    <div>
      <PageHeader
        title="Currency mapping"
        subtitle="The currencies FastrSuite and Odoo both use."
      />

      <Banner
        variant="info"
        title={`Company currency: ${COMPANY_CURRENCY.code} (${COMPANY_CURRENCY.name})`}
        className="mt-4"
      >
        Currencies come from Odoo and are shown here for reference.
      </Banner>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600">
            <th className="rounded-l-md px-4 py-2.5 font-normal">FastrSuite currency</th>
            <th className="px-4 py-2.5 font-normal">Odoo currency</th>
            <th className="rounded-r-md px-4 py-2.5 font-normal">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {LOCAL_CURRENCY_ROWS.map((row) => (
            <tr key={row.code}>
              <td className="px-4 py-3 font-medium text-gray-900">{row.code}</td>
              <td className="px-4 py-3">
                <div className="w-full max-w-sm">
                  <Select
                    /* TODO(backend): populate options from the currencies
                       endpoint once it is documented. */
                    value={row.activeInOdoo ? row.code : null}
                    onChange={() => {
                      /* Reference-only screen – no mutable mapping. */
                    }}
                    options={
                      row.activeInOdoo
                        ? [{ value: row.code, label: row.code }]
                        : []
                    }
                    placeholder="Not available"
                    disabled
                    className="h-9"
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                {row.activeInOdoo ? (
                  <Pill variant="success">Active in Odoo</Pill>
                ) : (
                  <Pill variant="danger">Not active in Odoo</Pill>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
