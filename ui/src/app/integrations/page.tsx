"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Trash2, Plus, ExternalLink, Zap } from "lucide-react";
import { apiKeys } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const LLM_PROVIDERS = [
  { name: "OpenAI", model: "GPT-4o, GPT-4 Turbo", status: "connected" as const, score: 77 },
  { name: "Anthropic", model: "Claude Sonnet 3.5, Claude 3 Opus", status: "connected" as const, score: 88 },
  { name: "Google Gemini", model: "Gemini 1.5 Pro, Gemini Flash", status: "error" as const, score: 76 },
  { name: "Mistral", model: "Mixtral 8x7B, Mistral Large", status: "disconnected" as const, score: null },
  { name: "Azure OpenAI", model: "GPT-4 via Azure", status: "disconnected" as const, score: null },
  { name: "Custom Endpoint", model: "Any OpenAI-compatible API", status: "disconnected" as const, score: null },
];

const CODE_SAMPLES: Record<string, string> = {
  Python: `import requests

response = requests.post(
    "https://api.lmsense.ai/v1/debias",
    headers={"Authorization": "Bearer lms_prod_••••3f9a"},
    json={
        "model": "gpt-4o",
        "raw_response": "He should have 5 years...",
        "layers": ["qlora", "rldf", "postprocess"]
    }
)

data = response.json()
print(data["debiased_response"])
print(data["bias_score"])`,

  "Node.js": `const res = await fetch(
  "https://api.lmsense.ai/v1/debias",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer lms_prod_••••3f9a",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      raw_response: "He should have 5 years...",
      layers: ["qlora", "rldf", "postprocess"],
    }),
  }
);
const data = await res.json();
console.log(data.debiased_response);`,

  curl: `curl -X POST https://api.lmsense.ai/v1/debias \\
  -H "Authorization: Bearer lms_prod_••••3f9a" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "raw_response": "He should have 5 years...",
    "layers": ["qlora","rldf","postprocess"]
  }'`,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-white/10 text-muted hover:text-white transition-colors">
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
    </button>
  );
}

function ProvidersTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {LLM_PROVIDERS.map((p) => (
        <div key={p.name} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white">{p.name}</p>
              <p className="text-[11px] text-muted mt-0.5">{p.model}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                p.status === "connected" ? "bg-success shadow-[0_0_4px_#22C55E]"
                  : p.status === "error" ? "bg-warning shadow-[0_0_4px_#F59E0B]"
                  : "bg-muted"
              )} />
              <span className={cn(
                "text-[10px] capitalize",
                p.status === "connected" ? "text-success"
                  : p.status === "error" ? "text-warning"
                  : "text-muted"
              )}>
                {p.status === "error" ? "Auth Error" : p.status}
              </span>
            </div>
          </div>

          {p.score !== null && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-2 rounded-lg">
              <span className="text-[10px] text-muted">Fairness score</span>
              <span className="text-xs font-mono font-medium text-success ml-auto">{p.score}</span>
            </div>
          )}

          <div className="flex gap-2 mt-auto">
            <button className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg border transition-all",
              p.status === "connected"
                ? "border-danger/30 text-danger hover:bg-danger-dim"
                : "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20"
            )}>
              {p.status === "connected" ? "Disconnect" : "Connect"}
            </button>
            {p.status !== "disconnected" && (
              <button className="px-3 py-2 text-xs border border-border text-muted hover:text-white rounded-lg transition-all">
                Test
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function WidgetTab() {
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState("bottom-right");
  const [theme, setTheme] = useState("auto");
  const [style, setStyle] = useState("full");
  const [domain, setDomain] = useState("");
  const [domains, setDomains] = useState(["app.company.ai", "internal.company.com"]);

  const embedCode = `<script src="https://cdn.lmsense.ai/widget.js"\n  data-api-key="lms_wdg_••••1b7d"\n  data-theme="${theme}"\n  data-position="${position}"\n  data-style="${style}">\n</script>`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest mb-3">Widget Preview</p>
        <div className="bg-surface-2 border border-border rounded-xl p-6 h-64 relative flex items-end justify-end overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-3/4 space-y-2">
              <div className="h-2 bg-white/20 rounded w-full" />
              <div className="h-2 bg-white/20 rounded w-5/6" />
              <div className="h-2 bg-white/20 rounded w-4/6" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-surface border border-border rounded-xl p-3 w-56 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap size={10} className="text-accent" />
                  <span className="text-[10px] font-medium text-accent">LMSense</span>
                </div>
                <span className="text-[10px] font-mono text-success">Score: 88</span>
              </div>
              <p className="text-[10px] text-muted-fg leading-relaxed">Bias detected and corrected in this response. Tap to see changes.</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-glow-sm cursor-pointer">
              <Zap size={14} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Config */}
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Configuration</p>
          <div className="space-y-3">
            {[
              { label: "Position", val: position, set: setPosition, opts: ["bottom-right", "bottom-left", "custom"] },
              { label: "Theme", val: theme, set: setTheme, opts: ["auto", "light", "dark"] },
              { label: "Badge Style", val: style, set: setStyle, opts: ["minimal", "full"] },
            ].map(({ label, val, set, opts }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-muted-fg">{label}</span>
                <div className="flex gap-1">
                  {opts.map((o) => (
                    <button
                      key={o}
                      onClick={() => set(o)}
                      className={cn(
                        "px-2 py-1 text-[10px] rounded border transition-all",
                        val === o ? "bg-accent/10 border-accent/30 text-accent" : "border-border text-muted hover:text-white"
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Domain whitelist */}
        <div>
          <p className="text-xs text-muted-fg mb-2">Allowed Domains</p>
          <div className="flex gap-2 mb-2">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && domain) { setDomains((d) => [...d, domain]); setDomain(""); } }}
              className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50 placeholder:text-muted"
              placeholder="domain.com"
            />
            <button onClick={() => { if (domain) { setDomains((d) => [...d, domain]); setDomain(""); } }}
              className="px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-muted hover:text-white transition-all">
              <Plus size={12} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {domains.map((d) => (
              <span key={d} className="flex items-center gap-1 px-2 py-0.5 bg-surface-2 border border-border rounded text-[10px] text-muted-fg">
                {d}
                <button onClick={() => setDomains((prev) => prev.filter((x) => x !== d))} className="text-muted hover:text-danger ml-0.5">
                  <Trash2 size={9} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Embed code */}
        <div>
          <p className="text-xs text-muted-fg mb-2">Embed Code</p>
          <div className="relative bg-background border border-border rounded-lg overflow-hidden">
            <pre className="p-3 text-[10px] font-mono text-success/80 overflow-x-auto">{embedCode}</pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={embedCode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function APITab() {
  const [codeTab, setCodeTab] = useState<"Python" | "Node.js" | "curl">("Python");
  const [keys, setKeys] = useState(apiKeys);

  return (
    <div className="space-y-6">
      {/* API keys table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted uppercase tracking-widest">API Keys</p>
          <button className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dim transition-colors">
            <Plus size={12} /> Generate New Key
          </button>
        </div>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["Label", "Key", "Scopes", "Created", "Last Used", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] text-muted uppercase tracking-widest font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{k.label}</td>
                  <td className="px-4 py-3 font-mono text-muted-fg">{k.key}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded text-[10px]">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-fg font-mono">{k.created}</td>
                  <td className="px-4 py-3 text-muted-fg font-mono">{k.lastUsed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-muted hover:text-accent transition-colors"><RefreshCw size={11} /></button>
                      <button onClick={() => setKeys((prev) => prev.filter((x) => x.id !== k.id))}
                        className="text-muted hover:text-danger transition-colors"><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs text-muted uppercase tracking-widest">Usage This Month</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Requests", value: "24,851", max: "100K" },
            { label: "Tokens Processed", value: "3.2M", max: "10M" },
            { label: "Quota Used", value: "24.8%", max: null },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="flex justify-between text-[10px] text-muted mb-1.5">
                <span>{stat.label}</span>
                {stat.max && <span>{stat.max}</span>}
              </div>
              <p className="text-lg font-display font-bold text-white">{stat.value}</p>
              {stat.label !== "Quota Used" && (
                <div className="mt-1.5 h-1 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: stat.label === "Requests" ? "24.8%" : "32%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quickstart */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest mb-3">Quickstart</p>
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex border-b border-border bg-surface-2">
            {(["Python", "Node.js", "curl"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCodeTab(t)}
                className={cn(
                  "px-4 py-2.5 text-xs font-mono transition-all border-r border-border last:border-0",
                  codeTab === t ? "bg-surface text-accent" : "text-muted hover:text-white"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative bg-background">
            <pre className="p-4 text-xs font-mono text-muted-fg overflow-x-auto leading-relaxed">
              {CODE_SAMPLES[codeTab]}
            </pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={CODE_SAMPLES[codeTab]} />
            </div>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dim mt-3 transition-colors">
          <ExternalLink size={11} /> View Full API Documentation
        </button>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [tab, setTab] = useState<"providers" | "widget" | "api">("providers");

  const tabs = [
    { key: "providers" as const, label: "LLM Providers" },
    { key: "widget" as const, label: "Embeddable Widget" },
    { key: "api" as const, label: "API Access" },
  ];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-display font-bold text-white">Integrations</h1>
        <p className="text-xs text-muted mt-1">Connect LLM providers, embed the widget, and manage API keys.</p>
      </div>

      <div className="flex gap-0 border-b border-border">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-all",
              tab === key ? "border-accent text-accent" : "border-transparent text-muted hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "providers" && <ProvidersTab />}
      {tab === "widget" && <WidgetTab />}
      {tab === "api" && <APITab />}
    </div>
  );
}
