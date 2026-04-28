// Purpose: Feed of the 10 most recently flagged audit entries on the dashboard.
// Each row shows model badge, action badge, bias type, score improvement arrow, and relative timestamp.

"use client";

import { clsx } from "clsx";
import { ArrowRight, AlertTriangle } from "lucide-react";
import type { AuditEntry } from "@/lib/types";
import { getScoreLevel } from "@/lib/types";

interface RecentActivityProps {
  entries: AuditEntry[];
  loading?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const actionColours: Record<string, string> = {
  rewrite: "bg-blue-50 text-blue-700",
  flag: "bg-amber-50 text-amber-700",
  block: "bg-red-50 text-red-700",
  pass: "bg-emerald-50 text-emerald-700",
};

const scoreColour = (s: number) =>
  getScoreLevel(s) === "green"
    ? "text-emerald-600"
    : getScoreLevel(s) === "amber"
      ? "text-amber-600"
      : "text-red-600";

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 py-3">
      <div className="h-5 w-16 rounded-full bg-gray-100" />
      <div className="h-4 flex-1 rounded bg-gray-100" />
      <div className="h-4 w-12 rounded bg-gray-100" />
    </div>
  );
}

export function RecentActivity({ entries, loading }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        <a href="/audit" className="text-xs font-medium text-indigo-600 hover:underline">
          View all →
        </a>
      </div>

      <div className="divide-y divide-gray-50 px-6">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : entries.length === 0
            ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <AlertTriangle size={24} className="opacity-50" />
                <p className="text-sm">No flagged entries yet</p>
              </div>
            )
            : entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  {/* Model badge */}
                  <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600">
                    {entry.model}
                  </span>

                  {/* Action badge */}
                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      actionColours[entry.action_taken] ?? "bg-gray-100 text-gray-600",
                    )}
                  >
                    {entry.action_taken}
                  </span>

                  {/* Bias types */}
                  <span className="flex-1 truncate text-xs text-gray-500">
                    {entry.bias_types_detected.join(", ") || "—"}
                  </span>

                  {/* Score improvement */}
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums">
                    <span className={scoreColour(entry.bias_score_before.overall)}>
                      {Math.round(entry.bias_score_before.overall)}
                    </span>
                    <ArrowRight size={12} className="text-gray-300" />
                    <span className={scoreColour(entry.bias_score_after.overall)}>
                      {Math.round(entry.bias_score_after.overall)}
                    </span>
                  </span>

                  {/* Time */}
                  <span className="shrink-0 text-xs text-gray-400">
                    {timeAgo(entry.created_at)}
                  </span>
                </div>
              ))}
      </div>
    </div>
  );
}
