// Purpose: Full pipeline configuration form with Simple and Advanced views.
// Simple view: single aggressiveness slider. Advanced: per-layer accordion sections.

"use client";

import { useState } from "react";
import { ChevronDown, Save, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { usePipeline } from "@/hooks/usePipeline";
import { LayerToggle } from "@/components/pipeline/LayerToggle";
import { SimpleSlider } from "@/components/pipeline/SimpleSlider";

type ViewMode = "simple" | "advanced";

function SectionAccordion({
  title,
  badge,
  enabled,
  children,
}: {
  title: string;
  badge?: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className={clsx(
        "rounded-xl border transition-opacity",
        enabled ? "border-gray-200 opacity-100" : "border-gray-100 opacity-50",
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {title}
          {badge && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            "text-gray-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="space-y-5 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <div className="w-40 shrink-0">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function PipelineForm() {
  const { config, loading, error, saving, saveError, hasUnsavedChanges, update, save } =
    usePipeline();
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
        <AlertTriangle size={18} />
        {error ?? "Failed to load pipeline config. Using defaults."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
          {(["simple", "advanced"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={clsx(
                "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                viewMode === m
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-100",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-200">
              Unsaved changes
            </span>
          )}
          <button
            id="save-pipeline-button"
            onClick={save}
            disabled={saving || !hasUnsavedChanges}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all",
              saving || !hasUnsavedChanges
                ? "cursor-not-allowed bg-indigo-300"
                : "bg-indigo-600 hover:bg-indigo-700",
            )}
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Config"}
          </button>
        </div>
      </div>

      {saveError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {saveError}
        </p>
      )}

      {/* Simple view */}
      {viewMode === "simple" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <SimpleSlider
            value={config.layer3.aggressiveness}
            onChange={(v) =>
              update({ layer3: { ...config.layer3, aggressiveness: v } })
            }
          />
        </div>
      )}

      {/* Advanced view */}
      {viewMode === "advanced" && (
        <div className="space-y-4">
          {/* Layer 1 — QLoRA + CDA */}
          <SectionAccordion
            title="Layer 1 · QLoRA + CDA"
            badge="Training-time"
            enabled={config.layer1.enabled}
          >
            <LayerToggle
              label="Enable Layer 1"
              description="QLoRA fine-tuning with counterfactual data augmentation"
              enabled={config.layer1.enabled}
              onChange={(v) => update({ layer1: { ...config.layer1, enabled: v } })}
            />
            <FieldRow label="Model Adapter" hint="HuggingFace adapter identifier">
              <input
                className={inputClass}
                value={config.layer1.model_adapter}
                onChange={(e) =>
                  update({ layer1: { ...config.layer1, model_adapter: e.target.value } })
                }
              />
            </FieldRow>
            <FieldRow label="CDA Ratio" hint="0.0–1.0 counterfactual augmentation ratio">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className={inputClass}
                value={config.layer1.cda_ratio}
                onChange={(e) =>
                  update({ layer1: { ...config.layer1, cda_ratio: parseFloat(e.target.value) } })
                }
              />
            </FieldRow>
            <LayerToggle
              label="Gender Term Swapping"
              enabled={config.layer1.gender_swap}
              onChange={(v) => update({ layer1: { ...config.layer1, gender_swap: v } })}
            />
            <LayerToggle
              label="Racial Term Swapping"
              enabled={config.layer1.racial_swap}
              onChange={(v) => update({ layer1: { ...config.layer1, racial_swap: v } })}
            />
          </SectionAccordion>

          {/* Layer 2 — RLDF */}
          <SectionAccordion
            title="Layer 2 · RLDF"
            badge="Alignment"
            enabled={config.layer2.enabled}
          >
            <LayerToggle
              label="Enable Layer 2"
              description="Reinforcement learning from AI judge debate"
              enabled={config.layer2.enabled}
              onChange={(v) => update({ layer2: { ...config.layer2, enabled: v } })}
            />
            <FieldRow label="Reward Model" hint="AI judge model for debate scoring">
              <input
                className={inputClass}
                value={config.layer2.reward_model}
                onChange={(e) =>
                  update({ layer2: { ...config.layer2, reward_model: e.target.value } })
                }
              />
            </FieldRow>
            <FieldRow label="Fairness λ" hint="0.0 = fluency only, 1.0 = fairness only">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className={inputClass}
                value={config.layer2.fairness_lambda}
                onChange={(e) =>
                  update({ layer2: { ...config.layer2, fairness_lambda: parseFloat(e.target.value) } })
                }
              />
            </FieldRow>
            <FieldRow label="PPO Epochs">
              <input
                type="number"
                min={1}
                max={10}
                className={inputClass}
                value={config.layer2.ppo_epochs}
                onChange={(e) =>
                  update({ layer2: { ...config.layer2, ppo_epochs: parseInt(e.target.value) } })
                }
              />
            </FieldRow>
            <FieldRow label="Debate Rounds">
              <input
                type="number"
                min={1}
                max={5}
                className={inputClass}
                value={config.layer2.debate_rounds}
                onChange={(e) =>
                  update({ layer2: { ...config.layer2, debate_rounds: parseInt(e.target.value) } })
                }
              />
            </FieldRow>
          </SectionAccordion>

          {/* Layer 3 — RL Post-processing */}
          <SectionAccordion
            title="Layer 3 · RL Post-processing"
            badge="Inference-time"
            enabled={config.layer3.enabled}
          >
            <LayerToggle
              label="Enable Layer 3"
              description="Runtime guard — rewrites, flags, or blocks biased content"
              enabled={config.layer3.enabled}
              onChange={(v) => update({ layer3: { ...config.layer3, enabled: v } })}
            />
            <FieldRow label="Bias Threshold" hint="Flag outputs scoring below this value">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className={inputClass}
                value={config.layer3.bias_threshold}
                onChange={(e) =>
                  update({ layer3: { ...config.layer3, bias_threshold: parseFloat(e.target.value) } })
                }
              />
            </FieldRow>
            <FieldRow label="Action on Bias">
              <select
                className={inputClass}
                value={config.layer3.action_on_bias}
                onChange={(e) =>
                  update({
                    layer3: {
                      ...config.layer3,
                      action_on_bias: e.target.value as "flag" | "rewrite" | "block",
                    },
                  })
                }
              >
                <option value="flag">Flag</option>
                <option value="rewrite">Rewrite</option>
                <option value="block">Block</option>
              </select>
            </FieldRow>
            <FieldRow label="Aggressiveness">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className={inputClass}
                value={config.layer3.aggressiveness}
                onChange={(e) =>
                  update({ layer3: { ...config.layer3, aggressiveness: parseFloat(e.target.value) } })
                }
              />
            </FieldRow>
          </SectionAccordion>

          {/* Global settings */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-sm font-semibold text-gray-700">Global Settings</h4>
            <div className="space-y-4">
              <FieldRow label="Global Bias Threshold">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  className={inputClass}
                  value={config.global_bias_threshold}
                  onChange={(e) =>
                    update({ global_bias_threshold: parseFloat(e.target.value) })
                  }
                />
              </FieldRow>
              <FieldRow label="Max Requests / Minute" hint="Per tenant rate limit">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className={inputClass}
                  value={config.max_requests_per_minute}
                  onChange={(e) =>
                    update({ max_requests_per_minute: parseInt(e.target.value) })
                  }
                />
              </FieldRow>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
