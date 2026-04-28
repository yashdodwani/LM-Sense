// Purpose: Custom hook for GET /v1/audit — fetches paginated audit log entries.
// Re-fetches automatically when filters change.

"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLog } from "@/lib/api";
import type { AuditEntry, AuditFilters } from "@/lib/types";

interface UseAuditLogReturn {
  entries: AuditEntry[];
  total: number;
  pages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAuditLog(filters: AuditFilters): UseAuditLogReturn {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAuditLog(filters)
      .then((data) => {
        if (!cancelled) {
          setEntries(data.entries);
          setTotal(data.total);
          setPages(data.pages);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load audit log";
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), tick]);

  return { entries, total, pages, loading, error, refetch };
}
