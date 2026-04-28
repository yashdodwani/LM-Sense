// Purpose: Expandable accordion panel showing per-layer trace data.
// One row per layer: name, triggered indicator, changes_made, duration_ms,
// score_before → score_after arrow, and optional notes.

"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import { clsx } from "clsx";
import type { LayerTrace } from "@/lib/types";
import { LayerBadge } from "@/components/ui/LayerBadge";

interface LayerTraceProps {
  traces: LayerTrace[];
}

export function LayerTracePanel({ traces }: LayerTraceProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <span>Layer Trace</span>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
            {traces.filter((t) => t.triggered).length}/{traces.length} fired
          </span>
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            "text-gray-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-2 border-b border-gray-100 px-5 py-2 text-xs font-medium text-gray-400">
            <span>Layer</span>
            <span>Triggered</span>
            <span>Changes</span>
            <span>Duration</span>
            <span>Score Δ</span>
          </div>

          {traces.map((trace, i) => (
            <div
              key={i}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] items-center gap-2 border-b border-gray-50 px-5 py-3 text-sm last:border-0 hover:bg-gray-50/60 transition-colors"
            >
              {/* Layer name */}
              <div className="flex flex-col gap-1">
                <LayerBadge layer={trace.layer} triggered={trace.triggered} />
                {trace.notes && (
                  <p className="text-xs text-gray-400 italic">{trace.notes}</p>
                )}
              </div>

              {/* Triggered */}
              <div>
                {trace.triggered ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-gray-300" />
                )}
              </div>

              {/* Changes */}
              <span className="font-mono text-xs text-gray-600">
                {trace.changes_made}
              </span>

              {/* Duration */}
              <span className="font-mono text-xs text-gray-600">
                {trace.duration_ms.toFixed(0)}ms
              </span>

              {/* Score change */}
              <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
                <span className="text-red-500">
                  {trace.score_before.toFixed(1)}
                </span>
                <span className="text-gray-300">→</span>
                <span className="text-emerald-600">
                  {trace.score_after.toFixed(1)}
                </span>
                <span
                  className={clsx(
                    "rounded-full px-1.5 text-xs",
                    trace.score_after >= trace.score_before
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500",
                  )}
                >
                  {trace.score_after >= trace.score_before ? "+" : ""}
                  {(trace.score_after - trace.score_before).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
