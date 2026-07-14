'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { COTData } from '@/lib/data_loader';

const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96">Loading chart...</div>
});

interface COTChartProps {
  data: COTData[];
  showNet: boolean;
}

// Detect small screens so we can lock axes (touch zoom/pan glitches with page
// scrolling on mobile) and compact the layout.
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}

const COTChart: React.FC<COTChartProps> = ({ data, showNet }) => {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return <div className="text-white text-center py-8">No data available for the selected range.</div>;
  }

  // Colors
  const greenColor = "#10b981";   // Longs
  const redColor = "#ef4444";     // Shorts
  const dateFormat = isMobile ? "%m/%d/%y" : "%m/%d/%Y";
  const chartHeight = isMobile ? 440 : 600;
  const axisTitleSize = isMobile ? 11 : undefined;
  const tickSize = isMobile ? 10 : undefined;

  // Prepare data
  const dates = data.map(d => d.date);
  const longs = data.map(d => d.long);
  const shorts = data.map(d => d.short);
  const nets = data.map(d => d.net);
  const d_longs = data.map(d => d.d_long);
  const d_shorts = data.map(d => d.d_short);
  const d_nets = data.map(d => d.d_net);

  // Invert delta shorts for visualization (covering is positive)
  const d_shorts_inv = d_shorts.map(x => -x);

  // Custom data for hover
  const customData = data.map(d => [
    d.long,
    d.short, 
    d.net,
    d.d_long,
    d.d_short,
    d.d_net
  ]);

  // Unified hover template
  const unifiedHover = `<b>%{x}</b><br>` +
    `<span style='color:${greenColor}'>● Long</span>: %{customdata[0]:,} &nbsp;&nbsp;` +
    `<span style='color:${redColor}'>● Short</span>: %{customdata[1]:,}<br>` +
    `Net: %{customdata[2]:+,}<br>` +
    `<span style='color:${greenColor}'>ΔLong</span>: %{customdata[3]:+,} &nbsp;&nbsp;` +
    `<span style='color:${redColor}'>ΔShort</span>: %{customdata[4]:+,}<br>` +
    `ΔNet: %{customdata[5]:+,}<extra></extra>`;

  const plotData: any[] = [
    // Invisible hover carrier
    {
      x: dates,
      y: longs,
      type: 'scatter',
      mode: 'lines',
      line: { color: 'rgba(0,0,0,0)', width: 0 },
      customdata: customData,
      hovertemplate: unifiedHover,
      showlegend: false,
      xaxis: 'x',
      yaxis: 'y'
    },
    // Long positions
    {
      x: dates,
      y: longs,
      type: 'scatter',
      mode: 'lines',
      name: 'Long',
      line: { color: greenColor, width: 2 },
      hoverinfo: 'skip',
      showlegend: true,
      xaxis: 'x',
      yaxis: 'y'
    },
    // Short positions
    {
      x: dates,
      y: shorts,
      type: 'scatter',
      mode: 'lines',
      name: 'Short',
      line: { color: redColor, width: 2 },
      hoverinfo: 'skip',
      showlegend: true,
      xaxis: 'x',
      yaxis: 'y'
    },
    // Delta Long bars
    {
      x: dates,
      y: d_longs,
      type: 'bar',
      name: 'ΔLong',
      marker: { color: greenColor, opacity: 0.7 },
      hoverinfo: 'skip',
      showlegend: false,
      xaxis: 'x',
      yaxis: 'y2'
    },
    // Delta Short bars (inverted)
    {
      x: dates,
      y: d_shorts_inv,
      type: 'bar',
      name: '−ΔShort',
      marker: { color: redColor, opacity: 0.7 },
      hoverinfo: 'skip',
      showlegend: false,
      xaxis: 'x',
      yaxis: 'y2'
    }
  ];

  // Add net line if requested
  if (showNet) {
    plotData.push({
      x: dates,
      y: nets,
      type: 'scatter',
      mode: 'lines',
      name: 'Net',
      line: { color: '#6b7280', width: 1, dash: 'dot' },
      hoverinfo: 'skip',
      showlegend: true,
      xaxis: 'x',
      yaxis: 'y'
    });
  }

  const layout = {
    margin: isMobile
      ? { l: 40, r: 10, t: 30, b: 30 }
      : { l: 50, r: 20, t: 40, b: 40 },
    barmode: 'relative',
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'left',
      x: 0,
      bgcolor: 'rgba(0,0,0,0)',
      borderwidth: 0,
      font: { color: 'white', size: isMobile ? 11 : 12 }
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#1f2937',
      font: { size: isMobile ? 11 : 12, family: 'sans-serif', color: 'white' },
      bordercolor: '#374151'
    },
    height: chartHeight,
    plot_bgcolor: '#0f172a',
    paper_bgcolor: '#0f172a',
    font: { color: 'white' },
    // Lock axes on mobile: prevents touch-drag zoom/pan from mangling the
    // scales while scrolling the page.
    dragmode: isMobile ? false : 'zoom',
    xaxis: {
      domain: [0, 1],
      anchor: 'y2',
      tickformat: dateFormat,
      showgrid: true,
      gridwidth: 1,
      gridcolor: '#334155',
      linecolor: '#475569',
      tickfont: { color: 'white', size: tickSize },
      nticks: isMobile ? 6 : undefined,
      fixedrange: isMobile,
      title: isMobile
        ? undefined
        : { text: 'Week', font: { color: 'white' } }
    },
    yaxis: {
      domain: [0.35, 1],
      anchor: 'x',
      title: { text: 'Contracts', font: { color: 'white', size: axisTitleSize } },
      showgrid: true,
      gridwidth: 1,
      gridcolor: '#334155',
      linecolor: '#475569',
      tickfont: { color: 'white', size: tickSize },
      fixedrange: isMobile
    },
    yaxis2: {
      domain: [0, 0.3],
      anchor: 'x',
      title: { text: 'Weekly Change', font: { color: 'white', size: axisTitleSize } },
      showgrid: true,
      gridwidth: 1,
      gridcolor: '#334155',
      linecolor: '#475569',
      tickfont: { color: 'white', size: tickSize },
      fixedrange: isMobile
    },
    shapes: showNet ? [
      // Zero line for positions (if showing net)
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 1,
        yref: 'y',
        y0: 0,
        y1: 0,
        line: { color: '#475569', width: 1, dash: 'dot' },
        opacity: 0.5
      },
      // Zero line for changes
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 1,
        yref: 'y2',
        y0: 0,
        y1: 0,
        line: { color: '#475569', width: 1 }
      }
    ] : [
      // Zero line for changes only
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 1,
        yref: 'y2',
        y0: 0,
        y1: 0,
        line: { color: '#475569', width: 1 }
      }
    ],
    annotations: [
      {
        text: 'Positions',
        xref: 'paper',
        yref: 'paper',
        x: 0.02,
        y: 0.98,
        xanchor: 'left',
        yanchor: 'top',
        showarrow: false,
        font: { color: 'white', size: isMobile ? 12 : 14 }
      },
      {
        text: 'Weekly Changes',
        xref: 'paper',
        yref: 'paper',
        x: 0.02,
        y: 0.32,
        xanchor: 'left',
        yanchor: 'top',
        showarrow: false,
        font: { color: 'white', size: isMobile ? 12 : 14 }
      }
    ]
  };

  const config = {
    // Hide the modebar on mobile (zoom/pan tools are disabled there anyway)
    displayModeBar: !isMobile,
    displaylogo: false,
    scrollZoom: false,
    responsive: true,
    modeBarButtonsToRemove: [
      'pan2d',
      'select2d',
      'lasso2d',
      'autoScale2d',
      'hoverClosestCartesian',
      'hoverCompareCartesian',
      'toggleSpikelines'
    ]
  };

  return (
    // touch-action pan-y lets vertical swipes over the chart scroll the page
    // instead of being captured by Plotly's touch handlers.
    <div className="w-full" style={{ touchAction: 'pan-y' }}>
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        useResizeHandler
        style={{ width: '100%', height: `${chartHeight}px` }}
      />
    </div>
  );
};

export default COTChart;
