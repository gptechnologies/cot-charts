"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string; // yyyy-MM-dd
  onChange: (v: string) => void;
  min?: string; // yyyy-MM-dd
  max?: string; // yyyy-MM-dd
  inputClassName?: string;
  buttonClassName?: string;
  ariaLabel?: string;
};

function parseYMD(s?: string): Date | null {
  if (!s) return null;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (isNaN(dt.getTime())) return null;
  // Ensure month/day didn’t overflow
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function fmtYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clamp(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function DateInput({ value, onChange, min, max, inputClassName = "input-field w-full", buttonClassName = "", ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef<string>("");

  const minDate = useMemo(() => parseYMD(min), [min]);
  const maxDate = useMemo(() => parseYMD(max), [max]);
  const current = useMemo(() => parseYMD(value) ?? clamp(new Date(), minDate, maxDate), [value, minDate, maxDate]);

  const [viewYear, setViewYear] = useState<number>(current.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(current.getMonth());

  // Ensure view follows value when it changes
  useEffect(() => {
    const d = parseYMD(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const years: number[] = useMemo(() => {
    const start = (minDate ?? new Date(1990, 0, 1)).getFullYear();
    const end = (maxDate ?? new Date().setFullYear(new Date().getFullYear() + 5) && new Date()).getFullYear();
    const list: number[] = [];
    for (let y = start; y <= end; y++) list.push(y);
    return list;
  }, [minDate, maxDate]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun..6=Sat
  const totalDays = daysInMonth(viewYear, viewMonth);

  function isDisabled(d: Date) {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  function selectDate(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (isDisabled(d)) return;
    onChange(fmtYMD(d));
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            prevValueRef.current = value;
            if (value) onChange("");
          }}
          onBlur={(e) => {
            if (!e.target.value) {
              onChange(prevValueRef.current);
            }
          }}
          min={min}
          max={max}
          aria-label={ariaLabel}
          className={inputClassName}
        />
        <button
          type="button"
          aria-label="Open calendar"
          className={`p-2 rounded bg-slate-700 hover:bg-slate-600 text-gray-200 border border-slate-600 ${buttonClassName}`}
          onClick={() => setOpen((v) => !v)}
        >
          {/* Calendar icon (inline SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9ZM5 9h14V6H5v3Z" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded border border-slate-600 bg-slate-800 shadow-lg p-3 text-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <select
              className="select-field text-sm"
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <select
              className="select-field text-sm"
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {/* leading blanks */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`pad-${i}`} className="py-1" />
            ))}
            {/* days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const d = new Date(viewYear, viewMonth, day);
              const disabled = isDisabled(d);
              const selected = value && parseYMD(value)?.getTime() === d.getTime();
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(day)}
                  className={[
                    "py-1 rounded border",
                    selected ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-700 border-slate-600 hover:bg-slate-600",
                    disabled ? "opacity-40 cursor-not-allowed" : ""
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

