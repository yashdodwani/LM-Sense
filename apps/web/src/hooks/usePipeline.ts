// Purpose: Custom hook for GET + PUT /v1/pipeline — fetches pipeline config on mount
// and provides a save mutation with unsaved-changes tracking.

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
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load pipeline config";
          setError(message);
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
