'use client';

import React, { useMemo } from 'react';
import { COTData } from '@/lib/data_loader';
import { format } from 'date-fns';

interface FxPositionsTableProps {
  data: COTData[];
}

const FX_SYMBOLS: [string, string][] = [
  ['EUR', 'EURO FX'],
  ['JPY', 'JAPANESE YEN'],
  ['GBP', 'BRITISH POUND'],
  ['CHF', 'SWISS FRANC'],
  ['CAD', 'CANADIAN DOLLAR'],
  ['AUD', 'AUSTRALIAN DOLLAR'],
  ['NZD', 'NZ DOLLAR'],
  ['MXN', 'MEXICAN PESO'],
  ['BRL', 'BRAZILIAN REAL'],
  ['DXY', 'USD INDEX'],
];

const fmt = new Intl.NumberFormat('en-US');
const fmtSigned = new Intl.NumberFormat('en-US', { signDisplay: 'always' });

interface FxRow {
  label: string;
  long: number;
  short: number;
  net: number;
  dLong: number;
  dShort: number;
  dNet: number;
  date: Date;
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

const FxPositionsTable: React.FC<FxPositionsTableProps> = ({ data }) => {
  const { rows, reportDate } = useMemo(() => {
    const symbolSet = new Set(FX_SYMBOLS.map(([, sym]) => sym));

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

    for (const [label, symbol] of FX_SYMBOLS) {
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
      });

      if (!reportDate || latest.date > reportDate) {
        reportDate = latest.date;
      }
    }

    return { rows: result, reportDate };
  }, [data]);

  if (rows.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 mt-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">FX Positioning — Non-Commercial</h2>
        {reportDate && (
          <span className="text-sm text-gray-400">
            Report: {format(reportDate, 'MMM dd, yyyy')}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-gray-400 font-medium py-2 pr-4">Currency</th>
              <th className="text-right text-gray-400 font-medium py-2 px-4">Long</th>
              <th className="text-right text-gray-400 font-medium py-2 px-4">Short</th>
              <th className="text-right text-gray-400 font-medium py-2 pl-4">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="py-3 pr-4 font-medium text-white">{row.label}</td>
                <td className="py-3 px-4 text-right">
                  <div className="text-white">{fmt.format(row.long)}</div>
                  <ChangeValue value={row.dLong} />
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="text-white">{fmt.format(row.short)}</div>
                  <ChangeValue value={row.dShort} />
                </td>
                <td className="py-3 pl-4 text-right">
                  <div className={row.net >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {fmtSigned.format(row.net)}
                  </div>
                  <ChangeValue value={row.dNet} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FxPositionsTable;
