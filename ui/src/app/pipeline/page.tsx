"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type CdaPair = { id: number; from: string; to: string };

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex w-9 h-5 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-surface-2 border border-border"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
        checked && "translate-x-4"
      )} />
    </button>
  );
}

function Accordion({ title, badge, defaultOpen = false, children }: {
  title: string; badge?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-white">{title}</span>
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-mono">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
      </button>
      {open && <div className="border-t border-border px-5 py-5 space-y-5">{children}</div>}
    </div>
  );
}

function LayerToggleRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-fg">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs", enabled ? "text-success" : "text-muted")}>{enabled ? "Enabled" : "Disabled"}</span>
        <Toggle checked={enabled} onChange={onChange} />
      </div>
    </div>
  );
}

function SliderField({ label, min, max, value, onChange, tooltip }: {
  label: string; min: number; max: number; value: number; onChange: (v: number) => void; tooltip?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-fg">{label}</label>
          {tooltip && <Info size={11} className="text-muted" />}
        </div>
        <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-[10px] text-muted mt-1">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [simpleView, setSimpleView] = useState(false);
  const [aggression, setAggression] = useState(50);

  // Layer 1
  const [l1Enabled, setL1Enabled] = useState(true);
  const [loraRank, setLoraRank] = useState(16);
  const [alpha, setAlpha] = useState("32");
  const [cdaPairs, setCdaPairs] = useState<CdaPair[]>([
    { id: 1, from: "he", to: "she" },
    { id: 2, from: "doctor", to: "nurse" },
    { id: 3, from: "businessman", to: "businesswoman" },
    { id: 4, from: "chairman", to: "chairperson" },
  ]);

  // Layer 2
  const [l2Enabled, setL2Enabled] = useState(true);
  const [rewardModel, setRewardModel] = useState("GPT-4o");
  const [lambda, setLambda] = useState(0.7);
  const [debateRounds, setDebateRounds] = useState(3);
  const [expertOpen, setExpertOpen] = useState(false);
  const [ppoClip, setPpoClip] = useState("0.2");

  // Layer 3
  const [l3Enabled, setL3Enabled] = useState(true);
  const [action, setAction] = useState<"Rewrite" | "Flag & Pass" | "Block">("Rewrite");
  const [projStrength, setProjStrength] = useState(65);
  const [sensitivity, setSensitivity] = useState<"Low" | "Medium" | "High">("Medium");
  const [blocklist, setBlocklist] = useState("");

  const addPair = () => setCdaPairs((p) => [...p, { id: Date.now(), from: "", to: "" }]);
  const removePair = (id: number) => setCdaPairs((p) => p.filter((x) => x.id !== id));
  const updatePair = (id: number, field: "from" | "to", val: string) =>
    setCdaPairs((p) => p.map((x) => x.id === id ? { ...x, [field]: val } : x));

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-display font-bold text-white">Pipeline Config</h1>
          <p className="text-xs text-muted mt-1">Configure the three-layer debiasing stack for your deployment.</p>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-muted">Simple view</span>
          <Toggle checked={simpleView} onChange={setSimpleView} />
        </div>
      </div>

      {simpleView ? (
        /* Simple view */
        <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-white mb-1">Bias Aggressiveness</p>
            <p className="text-xs text-muted">Controls how aggressively LMSense debiases outputs across all three layers.</p>
          </div>
          <div className="space-y-3">
            <input
              type="range" min={0} max={100} value={aggression}
              onChange={(e) => setAggression(Number(e.target.value))}
              className="w-full"
            />
            <div className="grid grid-cols-3 text-center">
              {["Low", "Balanced", "Strict"].map((l, i) => (
                <div key={l} className={cn("text-xs", aggression < 34 && i === 0 ? "text-accent" : aggression < 67 && i === 1 ? "text-accent" : i === 2 && aggression >= 67 ? "text-accent" : "text-muted")}>
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Balanced", desc: "Sensible defaults", val: 50 },
              { label: "Strict", desc: "Maximum debiasing", val: 85 },
              { label: "Conservative", desc: "Minimal intervention", val: 20 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setAggression(preset.val)}
                className="px-3 py-2.5 bg-surface-2 hover:bg-border border border-border rounded-lg text-left transition-all"
              >
                <p className="text-xs font-medium text-white">{preset.label}</p>
                <p className="text-[10px] text-muted mt-0.5">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Expert view */
        <div className="space-y-4">
          {/* Layer 1 */}
          <Accordion title="Layer 1 — QLoRA + CDA" badge="Training-time" defaultOpen={true}>
            <LayerToggleRow label="Enable Layer 1" enabled={l1Enabled} onChange={setL1Enabled} />
            <div className={cn("space-y-5", !l1Enabled && "opacity-40 pointer-events-none")}>
              {/* CDA pairs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-fg">CDA Term Pairs</label>
                  <button onClick={addPair} className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-dim transition-colors">
                    <Plus size={11} /> Add pair
                  </button>
                </div>
                <div className="space-y-2">
                  {cdaPairs.map((pair) => (
                    <div key={pair.id} className="flex items-center gap-2">
                      <input
                        value={pair.from}
                        onChange={(e) => updatePair(pair.id, "from", e.target.value)}
                        className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50"
                        placeholder="Source term"
                      />
                      <span className="text-muted text-xs">↔</span>
                      <input
                        value={pair.to}
                        onChange={(e) => updatePair(pair.id, "to", e.target.value)}
                        className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50"
                        placeholder="Target term"
                      />
                      <button onClick={() => removePair(pair.id)} className="text-muted hover:text-danger transition-colors p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <SliderField label="LoRA Rank (r)" min={4} max={64} value={loraRank} onChange={setLoraRank} tooltip="Higher rank = more parameters, better fit, slower training" />
              <div>
                <label className="text-xs text-muted-fg block mb-2">Alpha Multiplier</label>
                <input
                  value={alpha}
                  onChange={(e) => setAlpha(e.target.value)}
                  className="w-32 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-accent/50"
                  placeholder="32"
                />
              </div>
            </div>
          </Accordion>

          {/* Layer 2 */}
          <Accordion title="Layer 2 — RLDF" badge="Alignment">
            <LayerToggleRow label="Enable Layer 2" enabled={l2Enabled} onChange={setL2Enabled} />
            <div className={cn("space-y-5", !l2Enabled && "opacity-40 pointer-events-none")}>
              <div>
                <label className="text-xs text-muted-fg block mb-2">Reward Model (AI Judge)</label>
                <div className="relative w-56">
                  <select
                    value={rewardModel}
                    onChange={(e) => setRewardModel(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white appearance-none pr-8 focus:outline-none focus:border-accent/50"
                  >
                    <option>GPT-4o</option>
                    <option>Custom endpoint</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-muted-fg">Fairness Coefficient (λ)</label>
                    <Info size={11} className="text-muted" />
                  </div>
                  <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">{lambda.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={10} value={lambda * 10} onChange={(e) => setLambda(Number(e.target.value) / 10)} className="w-full" />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>0.0 (fluency)</span><span>1.0 (fairness)</span>
                </div>
              </div>
              <SliderField label="Debate Rounds" min={1} max={5} value={debateRounds} onChange={setDebateRounds} tooltip="More rounds = slower but more thorough" />

              {/* Expert PPO */}
              <div>
                <button onClick={() => setExpertOpen(!expertOpen)} className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors">
                  {expertOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Expert Settings
                </button>
                {expertOpen && (
                  <div className="mt-3 pl-4 border-l border-border space-y-3">
                    <div>
                      <label className="text-xs text-muted-fg block mb-2">PPO Clip Range</label>
                      <input
                        value={ppoClip}
                        onChange={(e) => setPpoClip(e.target.value)}
                        className="w-32 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-accent/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Accordion>

          {/* Layer 3 */}
          <Accordion title="Layer 3 — RL Post-processing" badge="Inference-time">
            <LayerToggleRow label="Enable Layer 3" enabled={l3Enabled} onChange={setL3Enabled} />
            <div className={cn("space-y-5", !l3Enabled && "opacity-40 pointer-events-none")}>
              {/* Action radio */}
              <div>
                <label className="text-xs text-muted-fg block mb-3">Action on Detection</label>
                <div className="flex gap-3">
                  {(["Rewrite", "Flag & Pass", "Block"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAction(opt)}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-medium rounded-lg border transition-all",
                        action === opt
                          ? "bg-accent/10 border-accent/30 text-accent"
                          : "border-border text-muted hover:text-white"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <SliderField label="Projection Strength" min={0} max={100} value={projStrength} onChange={setProjStrength} />
              {/* Sensitivity */}
              <div>
                <label className="text-xs text-muted-fg block mb-2">Bias Sensitivity Threshold</label>
                <div className="flex gap-2">
                  {(["Low", "Medium", "High"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSensitivity(s)}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-lg border transition-all",
                        sensitivity === s
                          ? s === "Low" ? "bg-success-dim border-success/30 text-success"
                            : s === "Medium" ? "bg-warning-dim border-warning/30 text-warning"
                            : "bg-danger-dim border-danger/30 text-danger"
                          : "border-border text-muted hover:text-white"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Blocklist */}
              <div>
                <label className="text-xs text-muted-fg block mb-2">Custom Blocklist</label>
                <textarea
                  value={blocklist}
                  onChange={(e) => setBlocklist(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-accent/50 placeholder:text-muted font-mono"
                  placeholder="One phrase per line…"
                />
              </div>
            </div>
          </Accordion>

          {/* Save */}
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-accent hover:bg-accent-dim text-white text-sm font-medium rounded-lg transition-all shadow-glow-sm">
              Save Configuration
            </button>
            <button className="px-5 py-2.5 bg-surface border border-border text-sm text-muted hover:text-white rounded-lg transition-all">
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
