// Purpose: Integrations & API Keys page. Shows available LLM connectors,
// current API keys with masked display, and a copy-key action.

"use client";

import { useState } from "react";
import { Copy, Check, Plus, Eye, EyeOff, Zap, Link2 } from "lucide-react";

interface ApiKeyRow {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
}

const DEMO_KEYS: ApiKeyRow[] = [
  {
    id: "1",
    name: "Production Key",
    key: "fl_live_xK9mPqR2wBvL8nZj4cYdE7tFsA3h",
    created: "2026-03-01",
    lastUsed: "2026-04-28",
  },
  {
    id: "2",
    name: "Staging Key",
    key: "fl_test_aB3cD4eF5gH6iJ7kL8mN9oP0qR1s",
    created: "2026-03-15",
    lastUsed: "2026-04-25",
  },
];

interface Connector {
  id: string;
  name: string;
  logo: string;
  status: "connected" | "available" | "coming_soon";
  model?: string;
}

const CONNECTORS: Connector[] = [
  { id: "openai", name: "OpenAI", logo: "🤖", status: "connected", model: "gpt-4o" },
  { id: "anthropic", name: "Anthropic", logo: "🧠", status: "connected", model: "claude-3-5-sonnet" },
  { id: "google", name: "Google Gemini", logo: "✨", status: "available" },
  { id: "mistral", name: "Mistral AI", logo: "🌬️", status: "coming_soon" },
  { id: "azure", name: "Azure OpenAI", logo: "☁️", status: "coming_soon" },
  { id: "cohere", name: "Cohere", logo: "🔷", status: "coming_soon" },
];

const statusColours: Record<string, string> = {
  connected: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  available: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  coming_soon: "bg-gray-50 text-gray-400 ring-1 ring-gray-200",
};

const statusLabels: Record<string, string> = {
  connected: "Connected",
  available: "Available",
  coming_soon: "Coming soon",
};

export default function IntegrationsPage() {
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function maskKey(key: string) {
    return key.slice(0, 12) + "•".repeat(16) + key.slice(-4);
  }

  async function copyKey(row: ApiKeyRow) {
    await navigator.clipboard.writeText(row.key);
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Integrations & API Keys</h2>
        <p className="text-sm text-gray-500">
          Connect LLM providers and manage your API credentials
        </p>
      </div>

      {/* LLM Connectors */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Link2 size={16} className="text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">LLM Connectors</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.map((connector) => (
            <div
              key={connector.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{connector.logo}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{connector.name}</p>
                  {connector.model && (
                    <p className="text-xs text-gray-400 font-mono">{connector.model}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColours[connector.status]}`}
                >
                  {statusLabels[connector.status]}
                </span>
                {connector.status !== "coming_soon" && (
                  <button className="text-xs text-indigo-600 hover:underline">
                    {connector.status === "connected" ? "Manage" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Keys */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">API Keys</h3>
          </div>
          <button
            id="create-api-key-button"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
            New Key
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last Used</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {DEMO_KEYS.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-gray-700">{row.name}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
                      <span>
                        {visibleKey === row.id ? row.key : maskKey(row.key)}
                      </span>
                      <button
                        onClick={() =>
                          setVisibleKey((v) => (v === row.id ? null : row.id))
                        }
                        className="text-gray-400 hover:text-gray-600"
                        title={visibleKey === row.id ? "Hide key" : "Show key"}
                      >
                        {visibleKey === row.id ? (
                          <EyeOff size={13} />
                        ) : (
                          <Eye size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{row.created}</td>
                  <td className="px-5 py-4 text-xs text-gray-400">{row.lastUsed}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => copyKey(row)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      {copiedId === row.id ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copy
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
          <span className="font-semibold">Usage tip:</span> Include your API key as{" "}
          <code className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-xs">
            Authorization: Bearer fl_...
          </code>{" "}
          in every request to the LM-Sense API.
        </div>
      </section>
    </div>
  );
}
