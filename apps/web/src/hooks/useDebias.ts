// Purpose: Custom hook for POST /v1/debias — manages loading, error, and result state
// for sandbox and debias operations. Follows mutation pattern (no auto-fetch on mount).

"use client";

import { useState, useCallback } from "react";
import { debias } from "@/lib/api";
import type { DebiasRequest, DebiasResponse } from "@/lib/types";

interface UseDebiasState {
  loading: boolean;
  error: string | null;
  result: DebiasResponse | null;
}

interface UseDebiasReturn extends UseDebiasState {
  mutate: (req: DebiasRequest) => Promise<void>;
  reset: () => void;
}

export function useDebias(): UseDebiasReturn {
  const [state, setState] = useState<UseDebiasState>({
    loading: false,
    error: null,
    result: null,
  });

  const mutate = useCallback(async (req: DebiasRequest) => {
    setState({ loading: true, error: null, result: null });
    try {
      const result = await debias(req);
      setState({ loading: false, error: null, result });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setState({ loading: false, error: message, result: null });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null });
  }, []);

  return { ...state, mutate, reset };
}
