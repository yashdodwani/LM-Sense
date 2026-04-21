"use client";

import { useState } from "react";
import { ChevronDown, Diff, Save, Link2, ChevronUp, Layers } from "lucide-react";
import { sandboxMockData } from "@/lib/mock-data";
import { cn, biasScoreColor, biasScoreBg } from "@/lib/utils";

const MODELS = ["GPT-4o", "Claude Sonnet 3.5", "Gemini 1.5 Pro", "Custom Endpoint"];

export default function SandboxPage() {
  const [model, setModel] = useState("GPT-4o");
  const [prompt, setPrompt] = useState(sandboxMockData.prompt);
  const [showDiff, setShowDiff] = useState(false);
  const [traceOpen, setTraceOpen] = useState(true);

  const diffTokens = ["She", "Her", "her", "John", "his", "guy", "masculine"];

  function renderWithDiff(text: string) {
    if (!showDiff) return <span className="text-muted-fg text-sm leading-relaxed whitespace-pre-wrap">{text}</span>;
    const words = text.split(/(\s+)/);
    return (
      <span className="text-sm leading-relaxed whitespace-pre-wrap">
        {words.map((word, i) => {
          const hit = diffTokens.some((t) => word.includes(t));
          return (
            <span key={i} className={hit ? "bg-warning/20 text-warning font-medium rounded-sm px-0.5" : "text-muted-fg"}>
              {word}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-display font-bold text-white">Prompt Sandbox</h1>
        <p className="text-xs text-muted mt-1">Test any prompt live — see raw LLM output vs LMSense debiased output side-by-side.</p>
      </div>

      {/* Model selector + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white appearance-none pr-8 focus:outline-none focus:border-accent/50"
          >
            {MODELS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>

        <button
          onClick={() => setShowDiff(!showDiff)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all",
            showDiff
              ? "bg-warning/10 border-warning/30 text-warning"
              : "border-border text-muted hover:text-white"
          )}
        >
          <Diff size={13} />
          Diff Overlay {showDiff ? "ON" : "OFF"}
        </button>

        <div className="flex gap-2 ml-auto">
          <button className="flex items-center gap-2 px-3 py-2 text-xs bg-surface border border-border rounded-lg text-muted hover:text-white hover:border-border-2 transition-all">
            <Save size={13} /> Save to Audit Log
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-xs bg-surface border border-border rounded-lg text-muted hover:text-white hover:border-border-2 transition-all">
            <Link2 size={13} /> Share Link
          </button>
        </div>
      </div>

      {/* Prompt textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-surface border border-border rounded-xl p-4 text-sm text-white resize-none focus:outline-none focus:border-accent/50 placeholder:text-muted"
          placeholder="Enter a prompt to test…"
          maxLength={2000}
        />
        <span className="absolute bottom-3 right-3 text-[10px] text-muted font-mono">
          {prompt.length}/2000
        </span>
      </div>

      {/* Split pane outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Raw output */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted uppercase tracking-widest">Raw LLM Output</span>
              <span className="text-[10px] text-muted">· {model}</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium",
              biasScoreBg(sandboxMockData.rawScore)
            )}>
              <span className={biasScoreColor(sandboxMockData.rawScore)}>{sandboxMockData.rawScore}</span>
              <span className="text-muted-fg text-[10px]">{sandboxMockData.rawBiasType}</span>
            </div>
          </div>
          <div className="p-4">
            {renderWithDiff(sandboxMockData.rawOutput)}
          </div>
        </div>

        {/* Debiased output */}
        <div className="bg-surface border border-success/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-success/20 bg-success/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-success/80 uppercase tracking-widest">LMSense Debiased</span>
              <span className="text-[10px] text-muted">· 3 layers applied</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium",
              biasScoreBg(sandboxMockData.debiasedScore)
            )}>
              <span className={biasScoreColor(sandboxMockData.debiasedScore)}>{sandboxMockData.debiasedScore}</span>
              <span className="text-muted-fg text-[10px]">{sandboxMockData.debiasedBiasType}</span>
            </div>
          </div>
          <div className="p-4">
            <span className="text-muted-fg text-sm leading-relaxed whitespace-pre-wrap">
              {sandboxMockData.debiasedOutput}
            </span>
          </div>
        </div>
      </div>

      {/* Layer trace */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setTraceOpen(!traceOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-accent" />
            <span className="text-sm font-medium text-white">Layer Trace</span>
            <span className="text-[10px] text-muted px-1.5 py-0.5 bg-surface-2 rounded border border-border">
              2 triggered
            </span>
          </div>
          {traceOpen ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
        </button>

        {traceOpen && (
          <div className="border-t border-border divide-y divide-border">
            {sandboxMockData.layerTrace.map((layer) => (
              <div key={layer.layer} className="flex items-start gap-4 px-4 py-3">
                <div className={cn(
                  "mt-0.5 w-2 h-2 rounded-full shrink-0",
                  layer.triggered ? "bg-success shadow-[0_0_4px_#22C55E]" : "bg-muted"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white">{layer.layer}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border",
                      layer.triggered ? "text-success bg-success-dim border-success/20" : "text-muted bg-surface-2 border-border"
                    )}>
                      {layer.triggered ? "Triggered" : "Skipped"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg mt-0.5">{layer.changes}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
