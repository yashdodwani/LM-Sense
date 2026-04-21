"use client";

import { useState } from "react";
import {
  Upload, ChevronDown, ChevronRight, Download, Filter,
  FileText, CheckSquare, Square, AlertTriangle,
} from "lucide-react";
import { auditResults } from "@/lib/mock-data";
import { cn, severityColor, biasScoreColor } from "@/lib/utils";

const BIAS_DIMS = ["Gender", "Race", "Age", "Socioeconomic", "Geographic", "All"];
const MODELS = ["GPT-4o", "Claude Sonnet 3.5", "Gemini 1.5 Pro", "Custom Endpoint"];

function UploadTab() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [model, setModel] = useState("GPT-4o");
  const [dims, setDims] = useState<string[]>(["All"]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleDim = (d: string) => {
    if (d === "All") { setDims(["All"]); return; }
    setDims((prev) => {
      const next = prev.filter((x) => x !== "All");
      return next.includes(d) ? next.filter((x) => x !== d) : [...next, d];
    });
  };

  const runAudit = () => {
    setRunning(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); return 100; }
        return p + 4;
      });
    }, 80);
  };

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]?.name ?? null); }}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all cursor-pointer",
          dragging ? "border-accent bg-accent/5" : "border-border hover:border-border-2 bg-surface-2"
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
          <Upload size={20} className={dragging ? "text-accent" : "text-muted"} />
        </div>
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-white">{file}</p>
            <p className="text-xs text-muted mt-1">Ready to scan</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-white">Drop your dataset here</p>
            <p className="text-xs text-muted mt-1">CSV, JSONL, or plain text · max 50 MB</p>
          </div>
        )}
        <label className="px-3 py-1.5 text-xs bg-accent/10 border border-accent/20 text-accent rounded-lg cursor-pointer hover:bg-accent/20 transition-all">
          Browse files
          <input type="file" className="hidden" accept=".csv,.jsonl,.txt" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
        </label>
      </div>

      {/* Config row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model selector */}
        <div>
          <label className="block text-xs text-muted mb-2 uppercase tracking-widest">Source Model</label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-white appearance-none pr-8 focus:outline-none focus:border-accent/50"
            >
              {MODELS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>

        {/* Bias dimensions */}
        <div>
          <label className="block text-xs text-muted mb-2 uppercase tracking-widest">Bias Dimensions</label>
          <div className="flex flex-wrap gap-2">
            {BIAS_DIMS.map((d) => {
              const active = dims.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDim(d)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all",
                    active
                      ? "bg-accent/10 border-accent/30 text-accent"
                      : "border-border text-muted hover:text-white hover:border-border-2"
                  )}
                >
                  {active ? <CheckSquare size={11} /> : <Square size={11} />}
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Run button + progress */}
      <div className="space-y-3">
        <button
          onClick={runAudit}
          disabled={running && progress < 100}
          className="px-5 py-2.5 bg-accent hover:bg-accent-dim text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-glow-sm"
        >
          {running && progress < 100 ? "Scanning…" : progress === 100 ? "Scan Complete ✓" : "Run Audit"}
        </button>
        {running && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted">
              <span>Processing dataset…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsTab() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? auditResults : auditResults.filter((r) => r.severity === filter);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Scanned", value: "1,284", sub: "queries" },
          { label: "Flagged", value: "34.2%", sub: "439 outputs", color: "text-warning" },
          { label: "Top Bias Type", value: "Gender", sub: "58% of flags", color: "text-accent" },
          { label: "Overall Score", value: "71", sub: "/ 100", color: "text-warning" },
        ].map((c) => (
          <div key={c.label} className="bg-surface-2 border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted uppercase tracking-widest mb-1">{c.label}</p>
            <p className={cn("text-2xl font-display font-bold", c.color ?? "text-white")}>{c.value}</p>
            <p className="text-xs text-muted mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter + export bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-muted" />
          <span className="text-xs text-muted">Severity:</span>
          {["All", "High", "Medium", "Low"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-2 py-0.5 text-xs rounded border transition-all",
                filter === s ? "border-accent/30 bg-accent/10 text-accent" : "border-border text-muted hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted hover:text-white hover:border-border-2 transition-all">
            <Download size={12} /> CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted hover:text-white hover:border-border-2 transition-all">
            <FileText size={12} /> PDF Report
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="text-left px-4 py-2.5 text-muted font-medium uppercase tracking-widest text-[10px]">Query</th>
              <th className="text-left px-4 py-2.5 text-muted font-medium uppercase tracking-widest text-[10px]">Bias Type</th>
              <th className="text-left px-4 py-2.5 text-muted font-medium uppercase tracking-widest text-[10px]">Severity</th>
              <th className="text-left px-4 py-2.5 text-muted font-medium uppercase tracking-widest text-[10px]">Debiased Preview</th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <>
                <tr
                  key={row.id}
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                  className="border-b border-border hover:bg-surface-2 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white max-w-xs">
                    <p className="truncate">{row.query}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-fg">{row.biasType}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded border font-medium text-[10px]", severityColor(row.severity))}>
                      {row.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-fg max-w-xs">
                    <p className="truncate">{row.debiasedPreview}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {expanded === row.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </td>
                </tr>
                {expanded === row.id && (
                  <tr key={`${row.id}-exp`} className="bg-surface-2/50">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-danger uppercase tracking-widest mb-2 font-medium">Raw Response</p>
                          <p className="text-xs text-muted-fg leading-relaxed">
                            {row.rawResponse.split(" ").map((word, i) => (
                              <span
                                key={i}
                                className={cn(
                                  row.changedTokens.some(t => word.includes(t))
                                    ? "bg-danger/20 text-danger px-0.5 rounded"
                                    : ""
                                )}
                              >
                                {word}{" "}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-success uppercase tracking-widest mb-2 font-medium">Debiased Output</p>
                          <p className="text-xs text-muted-fg leading-relaxed">{row.debiasedPreview}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [tab, setTab] = useState<"upload" | "results">("upload");

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-display font-bold text-white">Bias Audit</h1>
        <p className="text-xs text-muted mt-1">Upload datasets or query logs, run bias scans, and review flagged outputs.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {(["upload", "results"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-all",
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-white"
            )}
          >
            {t === "upload" ? "Upload & Scan" : "Audit Results"}
          </button>
        ))}
      </div>

      {tab === "upload" ? <UploadTab /> : <ResultsTab />}
    </div>
  );
}
