// Purpose: Custom hook for GET + PUT /v1/pipeline — fetches pipeline config on mount
// and provides a save mutation with unsaved-changes tracking.
// Falls back to sensible defaults when the backend is not reachable.

"use client";

import { useState, useEffect, useCallback } from "react";
import { getPipeline, updatePipeline } from "@/lib/api";
import type { PipelineConfig } from "@/lib/types";

interface UsePipelineReturn {
  config: PipelineConfig | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  update: (patch: Partial<PipelineConfig>) => void;
  save: () => Promise<void>;
  refetch: () => void;
}

const DEFAULT_CONFIG: PipelineConfig = {
  layer1: {
    enabled: true,
    model_adapter: "lmsense-qlora-v1",
    cda_ratio: 0.5,
    gender_swap: true,
    racial_swap: true,
  },
  layer2: {
    enabled: true,
    reward_model: "gpt-4o",
    fairness_lambda: 0.7,
    ppo_epochs: 3,
    debate_rounds: 2,
  },
  layer3: {
    enabled: true,
    projection_method: "linear",
    bias_threshold: 0.6,
    action_on_bias: "rewrite",
    aggressiveness: 0.6,
  },
  global_bias_threshold: 0.6,
  max_requests_per_minute: 60,
};

export function usePipeline(): UsePipelineReturn {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<PipelineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPipeline()
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
          setSavedConfig(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Backend unavailable — load defaults so the form is always usable
          setConfig(DEFAULT_CONFIG);
          setSavedConfig(DEFAULT_CONFIG);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const update = useCallback((patch: Partial<PipelineConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const save = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updatePipeline(config);
      setConfig(updated);
      setSavedConfig(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save pipeline config";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }, [config]);

  const hasUnsavedChanges =
    JSON.stringify(config) !== JSON.stringify(savedConfig);

  return {
    config,
    loading,
    error,
    saving,
    saveError,
    hasUnsavedChanges,
    update,
    save,
    refetch,
  };
}
