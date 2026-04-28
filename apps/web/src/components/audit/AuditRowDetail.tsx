// Purpose: Expandable row detail panel for an audit entry.
// Shows debiased_response text and a simple word diff.

"use client";

import type { AuditEntry } from "@/lib/types";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { LayerBadge } from "@/components/ui/LayerBadge";

interface AuditRowDetailProps {
  entry: AuditEntry;
}

export function AuditRowDetail({ entry }: AuditRowDetailProps) {
  return (
    <div className="space-y-4 bg-gray-50/70 px-6 py-5">
      {/* Score comparison */}
      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-500">
          Score before:{" "}
          <ScoreBadge score={entry.bias_score_before.overall} size="sm" />
        </div>
        <span className="text-gray-300">→</span>
        <div className="text-xs text-gray-500">
          Score after:{" "}
          <ScoreBadge score={entry.bias_score_after.overall} size="sm" />
        </div>
      </div>

      {/* Layers applied */}
      <div className="flex flex-wrap gap-1.5">
        {entry.layers_applied.map((l) => (
          <LayerBadge key={l} layer={l} triggered />
        ))}
      </div>

      {/* Debiased response */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-500">
          Debiased Response
        </p>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 text-sm leading-relaxed text-gray-700">
          {entry.debiased_response}
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">
          Per-category Scores (After)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Gender", entry.bias_score_after.gender],
              ["Racial", entry.bias_score_after.racial],
              ["Age", entry.bias_score_after.age],
              ["Geographic", entry.bias_score_after.geographic],
              ["Socioeconomic", entry.bias_score_after.socioeconomic],
            ] as [string, number][]
          ).map(([label, score]) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-lg border border-gray-100 bg-white p-2">
              <span className="text-xs text-gray-400">{label}</span>
              <ScoreBadge score={score} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
