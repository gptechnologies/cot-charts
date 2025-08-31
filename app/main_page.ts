'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { loadDataFrame, COTData } from '@/lib/data_loader';
import COTChart from '@/components/COTChart';
import { format } from 'date-fns';

const DEFAULT_DATA_URL = 'https://raw.githubusercontent.com/gptechnologies/COTData/refs/heads/main/cot.csv';

export default function Home() {
  const [data, setData] = useState<COTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [showNet, setShowNet] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Load data on component mount
  useEffect(() => {
    const dataUrl = process.env.NEXT_PUBLIC_DATA_URL || DEFAULT_DATA_URL;
    
    loadDataFrame(dataUrl)
      .then((loadedData) => {
        setData(loadedData);
        setError(null);
        
        if (loadedData.length > 0) {
          // Set default symbol to first available
          const symbols = Array.from(new Set(loadedData.map(d => d.symbol))).sort();
          if (symbols.length > 0) {
            setSelectedSymbol(symbols[0]);
          }
          
          // Set default date range to the most recent date
          const dates = loadedData.map(d => d.date).sort((a, b) => b.getTime() - a.getTime());
          const latestDate = dates[0];
          const dateStr = format(latestDate, 'yyyy-MM-dd');
          setStartDate(dateStr);
          setEndDate(dateStr);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
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
    return {
      min: format(dates[0], 'yyyy-MM-dd'),
      max: format(dates[dates.length - 1], 'yyyy-MM-dd')
    };
  }, [data]);

  // Filter data for chart
  const filteredData = useMemo(() => {
    if (!selectedSymbol || !startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
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
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">COT — Non-Commercial Positions</h1>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          {/* Asset Selection */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="select-field w-full"
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Type to search and select the asset name.
            </p>
          </div>

          {/* Show Net Checkbox */}
          <div className="md:col-span-3 flex items-end">
            <label className="flex items-center space-x-2 pb-2">
              <input
                type="checkbox"
                checked={showNet}
                onChange={(e) => setShowNet(e.target.