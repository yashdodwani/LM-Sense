// Purpose: Single output pane for the sandbox — renders raw or debiased text
// with highlighted spans (red for bias, green for improvements).

"use client";

import { clsx } from "clsx";
import type { FlaggedSpan } from "@/lib/types";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

interface OutputPaneProps {
  title: string;
  text: string;
  spans: FlaggedSpan[];
  score: number;
  variant: "raw" | "debiased";
  loading?: boolean;
}

export function OutputPane({
  title,
  text,
  spans,
  score,
  variant,
  loading,
}: OutputPaneProps) {
  if (loading) {
    return (
      <div className="flex h-64 animate-pulse flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-32 rounded bg-gray-100" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-gray-100" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // Build highlighted segments
  interface Segment {
    text: string;
    span?: FlaggedSpan;
    type: "neutral" | "bias" | "fix";
  }

  function buildSegments(): Segment[] {
    if (!text) return [];
    const sortedSpans = [...spans].sort((a, b) => a.start_char - b.start_char);
    const result: Segment[] = [];
    let cursor = 0;

    for (const span of sortedSpans) {
      if (span.start_char > cursor) {
        result.push({ text: text.slice(cursor, span.start_char), type: "neutral" });
      }
      result.push({
        text: variant === "debiased" && span.replacement ? span.replacement : text.slice(span.start_char, span.end_char),
        span,
        type: variant === "raw" ? "bias" : "fix",
      });
      cursor = span.end_char;
    }
    if (cursor < text.length) {
      result.push({ text: text.slice(cursor), type: "neutral" });
    }
    return result;
  }

  const segments = buildSegments();

  return (
    <div
      className={clsx(
        "flex flex-col rounded-xl border shadow-sm",
        variant === "raw"
          ? "border-red-100 bg-white"
          : "border-emerald-100 bg-white",
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          "flex items-center justify-between rounded-t-xl border-b px-5 py-3",
          variant === "raw"
            ? "border-red-100 bg-red-50/40"
            : "border-emerald-100 bg-emerald-50/40",
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              variant === "raw" ? "bg-red-400" : "bg-emerald-400",
            )}
          />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <ScoreBadge score={score} size="sm" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-gray-700">
        {text ? (
          <p>
            {segments.map((seg, i) =>
              seg.type === "neutral" ? (
                <span key={i}>{seg.text}</span>
              ) : seg.type === "bias" ? (
                <mark
                  key={i}
                  title={`Bias: ${seg.span?.bias_type} (${seg.span?.severity})`}
                  className="rounded bg-red-100 px-0.5 text-red-800 underline decoration-red-300 decoration-dashed cursor-help"
                >
                  {seg.text}
                </mark>
              ) : (
                <mark
                  key={i}
                  title={`Fixed: ${seg.span?.bias_type} → ${seg.text}`}
                  className="rounded bg-emerald-100 px-0.5 text-emerald-800 cursor-help"
                >
                  {seg.text}
                </mark>
              ),
            )}
          </p>
        ) : (
          <p className="italic text-gray-400">
            {variant === "raw"
              ? "Paste a raw LLM response and click Run…"
              : "Debiased output will appear here after running…"}
          </p>
        )}
      </div>
    </div>
  );
}
