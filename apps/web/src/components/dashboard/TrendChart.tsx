// Purpose: 7/30/90-day line chart showing bias score before (red dashed) and after
// (green solid) debiasing over time. Built with recharts ResponsiveContainer.

"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { clsx } from "clsx";
import type { TrendDataPoint } from "@/lib/types";

interface TrendChartProps {
  data: TrendDataPoint[];
  onRangeChange?: (days: number) => void;
}

const ranges = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-gray-500">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-sm font-semibold" style={{ color: p.color }}>
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.name}: {p.value.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ data, onRangeChange }: TrendChartProps) {
  const [activeRange, setActiveRange] = useState(7);

  function handleRange(days: number) {
    setActiveRange(days);
    onRangeChange?.(days);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Fairness Score Trend
          </h3>
          <p className="text-xs text-gray-400">Before vs after debiasing</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-1">
          {ranges.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => handleRange(days)}
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                activeRange === days
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          <Line
            type="monotone"
            dataKey="score_before"
            name="Before"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="score_after"
            name="After"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
