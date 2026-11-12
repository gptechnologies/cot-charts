'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { loadDataFrame, COTData } from '@/lib/data_loader';
import { loadPolicyRates, PolicyRate } from '@/lib/policy_rates';
import COTChart from '../components/cot_chart';
import FxPositionsTable from '../components/fx_positions_table';
import DateInput from '../components/DateInput';
import SearchableSelect from '../components/SearchableSelect';
import { format, parseISO } from 'date-fns';

const DEFAULT_DATA_URL = 'https://raw.githubusercontent.com/gptechnologies/COTData/refs/heads/main/cot.csv';
const DEFAULT_POLICY_RATES_URL = 'https://raw.githubusercontent.com/gptechnologies/COTData/refs/heads/main/policy_rates.csv';

export default function Home() {
  const [data, setData] = useState<COTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policyRates, setPolicyRates] = useState<PolicyRate[]>([]);
  const [policyRatesError, setPolicyRatesError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [showNet, setShowNet] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const prevStartRef = useRef<string>('');
  const prevEndRef = useRef<string>('');

  // Load data on component mount
  useEffect(() => {
    const dataUrl = process.env.NEXT_PUBLIC_DATA_URL || DEFAULT_DATA_URL;
    
    loadDataFrame(dataUrl)
      .then((loadedData) => {
        setData(loadedData);
        setError(null);
        
        if (loadedData.length > 0) {
          // Set default symbol to EURO FX if available, otherwise first
          const symbols = Array.from(new Set(loadedData.map(d => d.symbol))).sort();
          if (symbols.length > 0) {
            const euroFx = symbols.find(s => s.toUpperCase() === 'EURO FX');
            setSelectedSymbol(euroFx || symbols[0]);
          }
          
          // Set default date range: Start = 1 year ago (clamped to dataset min), End = today
          const datesDesc = loadedData.map(d => d.date).sort((a, b) => b.getTime() - a.getTime());
          const latestDataDate = datesDesc[0];
          const earliestDataDate = datesDesc[datesDesc.length - 1];

          const today = new Date();
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(today.getFullYear() - 1);

          const defaultStart = oneYearAgo < earliestDataDate ? earliestDataDate : oneYearAgo;
          const defaultEnd = today;

          setStartDate(format(defaultStart, 'yyyy-MM-dd'));
          setEndDate(format(defaultEnd, 'yyyy-MM-dd'));
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Policy rates load independently so an upstream outage never blocks COT data.
  useEffect(() => {
    const ratesUrl = process.env.NEXT_PUBLIC_POLICY_RATES_URL || DEFAULT_POLICY_RATES_URL;

    loadPolicyRates(ratesUrl)
      .then((loadedRates) => {
        setPolicyRates(loadedRates);
        setPolicyRatesError(null);
      })
      .catch((err) => {
        setPolicyRatesError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  // Get unique symbols sorted
  const symbols = useMemo(() => {
    return Array.from(new Set(data.map(d => d.symbol))).sort();
  }, [data]);

  // Get date range
  const dateRange = useMemo(() => {
    if (data.length === 0) return { min: '', max: '' };
    
    const dates = data.map(d => d.date).sort((a, b) => a.getTime() - b.getTime());
    const today = new Date();
    return {
      min: format(dates[0], 'yyyy-MM-dd'),
      // Allow selecting today even if data hasn't updated yet
      max: format(today, 'yyyy-MM-dd')
    };
  }, [data]);

  // Filter data for chart
  const filteredData = useMemo(() => {
    if (!selectedSymbol || !startDate || !endDate) return [];
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    // Ensure start <= end
    const actualStart = start <= end ? start : end;
    const actualEnd = start <= end ? end : start;
    
    return data.filter(d => 
      d.symbol === selectedSymbol && 
      d.date >= actualStart && 
      d.date <= actualEnd
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, selectedSymbol, startDate, endDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading COT data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 grid grid-cols-2 items-start gap-x-3 gap-y-3 sm:mb-6 sm:gap-x-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_10rem_10rem] lg:gap-x-6">
          <h1 className="col-span-full text-2xl font-bold text-white lg:col-span-1 lg:mt-6 lg:flex lg:min-h-10 lg:items-center xl:text-3xl">
            COT — Non-Commercials
          </h1>

          <div className="col-span-full min-w-0 md:col-span-1">
            <label htmlFor="asset-selector" className="mb-1 block text-sm font-medium text-gray-300">Asset</label>
            <SearchableSelect
              id="asset-selector"
              value={selectedSymbol}
              options={symbols}
              onChange={setSelectedSymbol}
              placeholder="Search assets..."
            />
            <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-300 md:mx-auto">
              <input
                type="checkbox"
                checked={showNet}
                onChange={(e) => setShowNet(e.target.checked)}
                className="checkbox-field"
              />
              Show Net Positions
            </label>
          </div>

          <div className="w-full min-w-0 max-w-40">
            <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-gray-300">Start Date</label>
            <DateInput
              id="start-date"
              value={startDate}
              onChange={setStartDate}
              min={dateRange.min}
              max={dateRange.max}
              ariaLabel="Start date"
            />
          </div>
          <div className="w-full min-w-0 max-w-40">
            <label htmlFor="end-date" className="mb-1 block text-sm font-medium text-gray-300">End Date</label>
            <DateInput
              id="end-date"
              value={endDate}
              onChange={setEndDate}
              min={dateRange.min}
              max={dateRange.max}
              ariaLabel="End date"
              alignCalendar="right"
            />
          </div>
        </header>

        {/* Chart */}
        <div className="bg-slate-800 rounded-lg p-2 sm:p-6">
          <COTChart data={filteredData} showNet={showNet} />
        </div>

        {/* FX Positions Table */}
        <FxPositionsTable
          data={data}
          policyRates={policyRates}
          policyRatesError={policyRatesError}
        />

        {/* Data Info */}
        {filteredData.length > 0 && (
          <div className="mt-6 text-sm text-gray-400">
            <p>Showing {filteredData.length} data points for {selectedSymbol}</p>
            <p>Date range: {format(filteredData[0].date, 'MMM dd, yyyy')} to {format(filteredData[filteredData.length - 1].date, 'MMM dd, yyyy')}</p>
          </div>
        )}
      </div>
    </main>
  );
}
