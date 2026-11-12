'use client';

import React, { useState, useEffect, useRef } from 'react';
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

const guideColor = '#94a3b8';
const guideWidth = 1.5;

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
  const cursorGuide = useRef<SVGLineElement>(null);

  function hideCursorGuide() {
    cursorGuide.current?.setAttribute('visibility', 'hidden');
  }

  function moveCursorGuide(event: React.PointerEvent<HTMLDivElement>) {
    const line = cursorGuide.current;
    if (!line) return;

    // Plotly's drag rectangles mark the actual plotting area of each panel.
    const panel = event.target instanceof Element && event.target.closest('rect.nsewdrag');
    if (!panel || event.buttons !== 0 || event.pointerType === 'touch') {
      hideCursorGuide();
      return;
    }

    const bounds = panel.getBoundingClientRect();
    const origin = event.currentTarget.getBoundingClientRect();
    const y = String(event.clientY - origin.top);
    line.setAttribute('x1', String(bounds.left - origin.left));
    line.setAttribute('x2', String(bounds.right - origin.left));
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('visibility', 'visible');
  }

  if (data.length === 0) {
    return <div className="text-white text-center py-8">No data available for the selected range.</div>;
  }

  // Colors
  const greenColor = "#10b981";   // Longs
  const redColor = "#ef4444";     // Shorts
  const dateFormat = isMobile ? "%m/%d/%y" : "%m/%d/%Y";
  const chartHeight = isMobile ? 460 : 600;
  const axisTitleSize = isMobile ? 11 : undefined;
  const tickSize = isMobile ? 10 : undefined;
  const axisStyle = {
    showgrid: false,
    showline: true,
    linecolor: '#64748b',
    ticks: 'outside',
    ticklen: isMobile ? 3 : 5,
    tickcolor: '#64748b',
    tickfont: { color: '#e2e8f0', size: tickSize },
    fixedrange: isMobile
  };

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
      ? { l: 52, r: 12, t: 60, b: 34 }
      : { l: 68, r: 24, t: 48, b: 48 },
    barmode: 'relative',
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: isMobile ? 1.012 : 1.025,
      xanchor: isMobile ? 'left' : 'right',
      x: isMobile ? 0 : 0.78,
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
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: 'white' },
    // Lock axes on mobile: prevents touch-drag zoom/pan from mangling the
    // scales while scrolling the page.
    dragmode: isMobile ? false : 'zoom',
    xaxis: {
      ...axisStyle,
      domain: [0, 1],
      anchor: 'y2',
      spikecolor: guideColor,
      spikethickness: guideWidth,
      spikedash: 'dot',
      spikesnap: 'hovered data',
      tickformat: dateFormat,
      nticks: isMobile ? 4 : undefined,
      title: isMobile
        ? undefined
        : { text: 'Week', font: { color: 'white' } }
    },
    yaxis: {
      ...axisStyle,
      domain: [0.47, 1],
      anchor: 'x',
      title: { text: 'Contracts', font: { color: 'white', size: axisTitleSize } },
      zeroline: showNet,
      zerolinecolor: '#475569'
    },
    yaxis2: {
      ...axisStyle,
      domain: [0, 0.33],
      anchor: 'x',
      title: { text: 'Weekly Change', font: { color: 'white', size: axisTitleSize } },
      nticks: 8,
      zeroline: true,
      zerolinecolor: '#94a3b8'
    },
    annotations: [
      {
        text: '<b>Positions</b>',
        xref: 'paper',
        yref: 'paper',
        x: 0,
        y: isMobile ? 1.085 : 1.025,
        xanchor: 'left',
        yanchor: 'bottom',
        showarrow: false,
        font: { color: 'white', size: isMobile ? 13 : 16 }
      },
      {
        text: '<b>Δ Positions</b>',
        xref: 'paper',
        yref: 'paper',
        x: 0,
        y: 0.355,
        xanchor: 'left',
        yanchor: 'bottom',
        showarrow: false,
        font: { color: 'white', size: isMobile ? 13 : 16 }
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
    <div
      className="relative w-full"
      style={{ touchAction: 'pan-y' }}
      onPointerMove={moveCursorGuide}
      onPointerDownCapture={hideCursorGuide}
      onPointerLeave={hideCursorGuide}
      onPointerCancel={hideCursorGuide}
    >
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        useResizeHandler
        onRelayout={hideCursorGuide}
        style={{ width: '100%', height: `${chartHeight}px` }}
      />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <line
          ref={cursorGuide}
          visibility="hidden"
          stroke={guideColor}
          strokeWidth={guideWidth}
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
};

export default COTChart;
