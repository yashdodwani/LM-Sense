// Purpose: Sandbox page — the main demo screen. Split-pane view showing raw
// (biased) vs debiased LLM output with token-level diff and layer trace.

"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw, GitCompare } from "lucide-react";
import { useDebias } from "@/hooks/useDebias";
import { PromptInput } from "@/components/sandbox/PromptInput";
import { OutputPane } from "@/components/sandbox/OutputPane";
import { DiffOverlay } from "@/components/sandbox/DiffOverlay";
import { LayerTracePanel } from "@/components/sandbox/LayerTrace";
import type { DebiasRequest } from "@/lib/types";

// ── Mock demo response used when API is unavailable ───────────────────────────

const MOCK_RESULT = {
  request_id: "demo-001",
  model: "gpt-4o",
  raw_response:
    "He should have 5+ years of experience in backend systems. The ideal candidate is a motivated young man who thrives in fast-paced environments. We're looking for someone from a top-tier university who can hit the ground running.",
  debiased_response:
    "The candidate should have 5+ years of experience in backend systems. The ideal candidate is a motivated professional who thrives in fast-paced environments. We're looking for someone with a strong technical background who can hit the ground running.",
  action_taken: "rewrite",
  bias_score_before: { overall: 42, gender: 28, racial: 55, age: 38, geographic: 50, socioeconomic: 39 },
  bias_score_after: { overall: 88, gender: 91, racial: 85, age: 86, geographic: 90, socioeconomic: 88 },
  flagged_spans: [
    { original: "He", replacement: "The candidate", bias_type: "gender", severity: "high", start_char: 0, end_char: 2 },
    { original: "young man", replacement: "professional", bias_type: "gender", severity: "high", start_char: 74, end_char: 83 },
    { original: "top-tier university", replacement: "strong technical background", bias_type: "socioeconomic", severity: "medium", start_char: 149, end_char: 168 },
  ],
  layer_trace: [
    { layer: "QLoRA+CDA", triggered: true, changes_made: 2, score_before: 42, score_after: 68, duration_ms: 112, notes: "Gender bias detected and corrected via CDA" },
    { layer: "RLDF", triggered: true, changes_made: 1, score_before: 68, score_after: 81, duration_ms: 234, notes: "Reward model flagged socioeconomic bias" },
    { layer: "PostProcess", triggered: true, changes_made: 0, score_before: 81, score_after: 88, duration_ms: 45, notes: "Projection alignment fine-tuned" },
  ],
  processing_time_ms: 391,
  layers_applied: ["qlora", "rldf", "postprocess"],
};

export default function SandboxPage() {
  const { mutate, loading, error, result, reset } = useDebias();
  const [showDiff, setShowDiff] = useState(false);
  const [usedMock, setUsedMock] = useState(false);

  const display = result ?? (usedMock ? MOCK_RESULT : null);

  async function handleRun(req: DebiasRequest) {
    setUsedMock(false);
    setShowDiff(false);
    try {
      await mutate(req);
    } catch {
      // If API fails, fall back to mock
      setUsedMock(true);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prompt Sandbox</h2>
          <p className="text-sm text-gray-500">
            Test the debiasing pipeline interactively — see token-level changes in real time
          </p>
        </div>
        {display && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Processed in {display.processing_time_ms}ms</span>
            <button
              onClick={() => {
                reset();
                setUsedMock(false);
                setShowDiff(false);
              }}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={12} />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Input panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <PromptInput onRun={handleRun} loading={loading} />
      </div>

      {/* Error state */}
      {error && !usedMock && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              API error — showing demo data instead
            </p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
          <button
            onClick={() => setUsedMock(true)}
            className="ml-auto shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            Load Demo
          </button>
        </div>
      )}

      {/* Diff toggle */}
      {display && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowDiff((s) => !s)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              showDiff
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <GitCompare size={13} />
            {showDiff ? "Hide Diff" : "Show Diff"}
          </button>
        </div>
      )}

      {/* Split pane output */}
      {(display || loading) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OutputPane
            title="Raw Output"
            text={display?.raw_response ?? ""}
            spans={display?.flagged_spans ?? []}
            score={display?.bias_score_before.overall ?? 0}
            variant="raw"
            loading={loading}
          />
          <OutputPane
            title="Debiased Output"
            text={display?.debiased_response ?? ""}
            spans={display?.flagged_spans ?? []}
            score={display?.bias_score_after.overall ?? 0}
            variant="debiased"
            loading={loading}
          />
        </div>
      )}

      {/* Diff overlay */}
      {showDiff && display && (
        <DiffOverlay
          rawText={display.raw_response}
          debiasedText={display.debiased_response}
        />
      )}

      {/* Layer trace accordion */}
      {display && !loading && (
        <LayerTracePanel traces={display.layer_trace} />
      )}

      {/* Empty state */}
      {!display && !loading && !error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
          <div className="rounded-full bg-indigo-50 p-4">
            <span className="text-3xl">🧪</span>
          </div>
          <p className="text-sm font-medium">Enter a prompt and click Run to begin</p>
          <p className="text-xs">Results appear in split-pane view below</p>
        </div>
      )}
    </div>
  );
}
