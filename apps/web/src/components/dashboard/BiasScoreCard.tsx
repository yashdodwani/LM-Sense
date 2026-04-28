// Purpose: Large circular gauge card showing the overall bias fairness score (0–100).
// Green ≥ 80, amber 60–79, red < 60. Animates on load using CSS stroke-dashoffset.

"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { getScoreLevel } from "@/lib/types";

interface BiasScoreCardProps {
  score: number;
  label?: string;
  subtitle?: string;
  change?: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

const colourMap = {
  green: { stroke: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50" },
  amber: { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" },
  red: { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-50" },
};

export function BiasScoreCard({
  score,
  label = "Overall Fairness Score",
  subtitle,
  change,
}: BiasScoreCardProps) {
  const [animated, setAnimated] = useState(false);
  const level = getScoreLevel(score);
  const colours = colourMap[level];

  const displayScore = animated ? score : 0;
  const offset = CIRCUMFERENCE * (1 - displayScore / 100);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>

      {/* SVG gauge */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="10"
          />
          {/* Fill */}
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            stroke={colours.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>

        {/* Score text centred inside gauge */}
        <div className="absolute flex flex-col items-center">
          <span
            className={clsx(
              "text-4xl font-bold tabular-nums",
              colours.text,
            )}
          >
            {Math.round(score)}
          </span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div
          className={clsx(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            change >= 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600",
          )}
        >
          {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)} pts vs avg
        </div>
      )}

      {subtitle && (
        <p className="text-center text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
