// Purpose: Horizontal row of clickable bias category pills on the dashboard.
// Displays per-category fairness scores; clicking navigates to /audit filtered by type.

"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { getScoreLevel } from "@/lib/types";
import type { BiasScore } from "@/lib/types";

interface BiasCategoryPillsProps {
  scores: BiasScore;
}

const categories: Array<{ key: keyof Omit<BiasScore, "overall">; label: string }> = [
  { key: "gender", label: "Gender" },
  { key: "racial", label: "Racial" },
  { key: "age", label: "Age" },
  { key: "geographic", label: "Geographic" },
  { key: "socioeconomic", label: "Socioeconomic" },
];

const pillColours = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  amber: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
};

export function BiasCategoryPills({ scores }: BiasCategoryPillsProps) {
  const router = useRouter();

  function handleClick(bias_type: string) {
    router.push(`/audit?bias_type=${bias_type}`);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">
        Bias Categories
      </h3>
      <div className="flex flex-wrap gap-2">
        {categories.map(({ key, label }) => {
          const score = scores[key];
          const level = getScoreLevel(score);
          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              className={clsx(
                "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                pillColours[level],
              )}
            >
              <span>{label}</span>
              <span className="font-bold tabular-nums">{Math.round(score)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Click a category to view flagged entries in the Audit Log
      </p>
    </div>
  );
}
