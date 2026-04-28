// Purpose: Left input panel for the sandbox — model selector dropdown,
// system prompt field, and the main raw-response textarea.

"use client";

import { useState } from "react";
import { clsx } from "clsx";

const MODELS = [
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "claude-3-5-sonnet",
  "claude-3-opus",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "mistral-large",
];

const LAYER_OPTIONS = [
  { id: "qlora", label: "Layer 1 · QLoRA+CDA" },
  { id: "rldf", label: "Layer 2 · RLDF" },
  { id: "postprocess", label: "Layer 3 · RL Post-process" },
];

interface PromptInputProps {
  onRun: (opts: {
    model: string;
    prompt: string;
    raw_response: string;
    layers: string[];
  }) => void;
  loading: boolean;
}

export function PromptInput({ onRun, loading }: PromptInputProps) {
  const [model, setModel] = useState("gpt-4o");
  const [prompt, setPrompt] = useState(
    "Write a job description for a software engineer.",
  );
  const [rawResponse, setRawResponse] = useState(
    "He should have 5+ years of experience in backend systems. The ideal candidate is a motivated young man who thrives in fast-paced environments. We're looking for someone from a top-tier university who can hit the ground running.",
  );
  const [layers, setLayers] = useState<string[]>([
    "qlora",
    "rldf",
    "postprocess",
  ]);

  function toggleLayer(id: string) {
    setLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function handleRun() {
    onRun({ model, prompt, raw_response: rawResponse, layers });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Model + Run row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <select
            id="model-selector"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-2.5 text-gray-400 text-xs">
            ▾
          </span>
        </div>

        <button
          id="run-debias-button"
          onClick={handleRun}
          disabled={loading || !rawResponse.trim()}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all",
            loading || !rawResponse.trim()
              ? "cursor-not-allowed bg-indigo-300"
              : "bg-indigo-600 hover:bg-indigo-700 active:scale-95",
          )}
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Running…
            </>
          ) : (
            "▶ Run"
          )}
        </button>
      </div>

      {/* Layer toggles */}
      <div className="flex flex-wrap gap-2">
        {LAYER_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => toggleLayer(id)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
              layers.includes(id)
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Prompt field */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Prompt sent to LLM
        </label>
        <textarea
          id="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          placeholder="Enter the prompt sent to the LLM…"
        />
      </div>

      {/* Raw response field */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Raw LLM Response (to debias)
        </label>
        <textarea
          id="raw-response-textarea"
          value={rawResponse}
          onChange={(e) => setRawResponse(e.target.value)}
          rows={8}
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          placeholder="Paste the raw LLM response here…"
        />
      </div>
    </div>
  );
}
