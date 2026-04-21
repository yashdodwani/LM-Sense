"use client";

import { useState } from "react";
import { Download, FileText, Loader, Plus, ChevronDown } from "lucide-react";
import { reports } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MODELS = ["All Models", "GPT-4o", "Claude Sonnet 3.5", "Gemini 1.5 Pro"];

export default function ReportsPage() {
  const [format, setFormat] = useState<"PDF" | "CSV">("PDF");
  const [model, setModel] = useState("All Models");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-display font-bold text-white">Reports</h1>
        <p className="text-xs text-muted mt-1">Generate and download compliance-ready audit reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report list */}
        <div className="lg:col-span-2">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Past Reports</p>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {["Report Name", "Date Range", "Model", "Format", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] text-muted uppercase tracking-widest font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-muted shrink-0" />
                        <span className="text-white font-medium">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-fg font-mono text-[10px]">{r.dateRange}</td>
                    <td className="px-4 py-3 text-muted-fg">{r.model}</td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 bg-surface-2 border border-border text-muted-fg rounded text-[10px] font-mono">{r.format}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "Ready" ? (
                        <span className="flex items-center gap-1 text-success text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                          Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-warning text-[10px]">
                          <Loader size={10} className="animate-spin" />
                          Processing
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "Ready" && (
                        <button className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] rounded-lg hover:bg-accent/20 transition-all">
                          <Download size={10} /> {r.size}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate panel */}
        <div className="bg-surface border border-border rounded-xl p-5 h-fit space-y-4">
          <p className="text-xs text-muted uppercase tracking-widest">Generate Report</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-fg block mb-1.5">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  defaultValue="2026-04-01"
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50 [color-scheme:dark]"
                />
                <input
                  type="date"
                  defaultValue="2026-04-21"
                  className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50 [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-fg block mb-1.5">Model</label>
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-white appearance-none pr-8 focus:outline-none focus:border-accent/50"
                >
                  {MODELS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-fg block mb-1.5">Format</label>
              <div className="flex gap-2">
                {(["PDF", "CSV"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex-1 py-2 text-xs font-medium rounded-lg border transition-all",
                      format === f
                        ? "bg-accent/10 border-accent/30 text-accent"
                        : "border-border text-muted hover:text-white"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="w-full py-2.5 bg-accent hover:bg-accent-dim text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60 shadow-glow-sm flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader size={13} className="animate-spin" /> Generating…</>
            ) : generated ? (
              <><Download size={13} /> Download Report</>
            ) : (
              <><Plus size={13} /> Generate Report</>
            )}
          </button>

          {generated && (
            <p className="text-[10px] text-success text-center animate-fade-in">
              Report ready — click above to download
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
