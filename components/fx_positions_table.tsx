'use client';

import React, { useMemo } from 'react';
import { COTData } from '@/lib/data_loader';
import { PolicyRate } from '@/lib/policy_rates';
import { format, parseISO } from 'date-fns';

interface FxPositionsTableProps {
  data: COTData[];
  policyRates: PolicyRate[];
  policyRatesError?: string | null;
}

const FX_SYMBOLS: [string, string, string][] = [
  ['EUR', 'EURO FX', 'EUR'],
  ['JPY', 'JAPANESE YEN', 'JPY'],
  ['GBP', 'BRITISH POUND', 'GBP'],
  ['CHF', 'SWISS FRANC', 'CHF'],
  ['CAD', 'CANADIAN DOLLAR', 'CAD'],
  ['AUD', 'AUSTRALIAN DOLLAR', 'AUD'],
  ['NZD', 'NZ DOLLAR', 'NZD'],
  ['MXN', 'MEXICAN PESO', 'MXN'],
  ['BRL', 'BRAZILIAN REAL', 'BRL'],
  ['DXY', 'USD INDEX', 'USD'],
];

const fmt = new Intl.NumberFormat('en-US');
const fmtSigned = new Intl.NumberFormat('en-US', { signDisplay: 'always' });
const fmtRate = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

interface FxRow {
  label: string;
  long: number;
  short: number;
  net: number;
  dLong: number;
  dShort: number;
  dNet: number;
  date: Date;
  rateCurrency: string;
}

function ChangeValue({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-xs text-gray-500">{fmtSigned.format(value)}</span>;
  }
  return (
    <span className={`text-xs ${value > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {fmtSigned.format(value)}
    </span>
  );
}

const FxPositionsTable: React.FC<FxPositionsTableProps> = ({
  data,
  policyRates,
  policyRatesError,
}) => {
  const { rows, reportDate } = useMemo(() => {
    const symbolSet = new Set(FX_SYMBOLS.map(([, symbol]) => symbol));

    const latestBySymbol = new Map<string, COTData>();
    for (const row of data) {
      if (!symbolSet.has(row.symbol)) continue;
      const existing = latestBySymbol.get(row.symbol);
      if (!existing || row.date > existing.date) {
        latestBySymbol.set(row.symbol, row);
      }
    }

    const result: FxRow[] = [];
    let reportDate: Date | null = null;

    for (const [label, symbol, rateCurrency] of FX_SYMBOLS) {
      const latest = latestBySymbol.get(symbol);
      if (!latest) continue;

      result.push({
        label,
        long: latest.long,
        short: latest.short,
        net: latest.net,
        dLong: latest.d_long,
        dShort: latest.d_short,
        dNet: latest.d_net,
        date: latest.date,
        rateCurrency,
      });

      if (!reportDate || latest.date > reportDate) {
        reportDate = latest.date;
      }
    }

    return { rows: result, reportDate };
  }, [data]);

  const { rateByCurrency, latestRateDate } = useMemo(() => {
    const byCurrency = new Map(policyRates.map((rate) => [rate.currency, rate]));
    const latestDate = policyRates.reduce<string | null>(
      (latest, rate) => (!latest || rate.asOfDate > latest ? rate.asOfDate : latest),
      null,
    );
    return { rateByCurrency: byCurrency, latestRateDate: latestDate };
  }, [policyRates]);

  if (rows.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-4 sm:p-6 mt-4 sm:mt-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-white">FX Positioning — Non-Commercial</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-400">
          {reportDate && <span>COT report: {format(reportDate, 'MMM dd, yyyy')}</span>}
          {latestRateDate ? (
            <span>
              Rates: {format(parseISO(latestRateDate), 'MMM dd, yyyy')} ·{' '}
              <a
                href="https://data.bis.org/topics/CBPOL"
                target="_blank"
                rel="noreferrer"
                className="text-gray-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
              >
                BIS
              </a>
            </span>
          ) : policyRatesError ? (
            <span className="text-amber-400">Rates temporarily unavailable</span>
          ) : (
            <span>Loading rates…</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-gray-400 font-medium py-2 pr-2 sm:pr-4">Currency</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 sm:px-4">Long</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 sm:px-4">Short</th>
              <th className="text-right text-gray-400 font-medium py-2 pl-2 sm:pl-4">Net</th>
              <th className="text-right text-gray-400 font-medium py-2 pl-3 sm:pl-5">Policy Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const policyRate = rateByCurrency.get(row.rateCurrency);
              return (
                <tr key={row.label} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-2.5 sm:py-3 pr-2 sm:pr-4 font-medium text-white">{row.label}</td>
                  <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right whitespace-nowrap">
                    <div className="text-white">{fmt.format(row.long)}</div>
                    <ChangeValue value={row.dLong} />
                  </td>
                  <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right whitespace-nowrap">
                    <div className="text-white">{fmt.format(row.short)}</div>
                    <ChangeValue value={row.dShort} />
                  </td>
                  <td className="py-2.5 sm:py-3 pl-2 sm:pl-4 text-right whitespace-nowrap">
                    <div className={row.net >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {fmtSigned.format(row.net)}
                    </div>
                    <ChangeValue value={row.dNet} />
                  </td>
                  <td className="py-2.5 sm:py-3 pl-3 sm:pl-5 text-right whitespace-nowrap">
                    {policyRate ? (
                      <div title={`${policyRate.source}, as of ${policyRate.asOfDate}`}>
                        <div className="font-medium tabular-nums text-sky-300">
                          {fmtRate.format(policyRate.rate)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(parseISO(policyRate.asOfDate), 'MMM dd')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500" aria-label={`Policy rate unavailable for ${row.rateCurrency}`}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FxPositionsTable;
