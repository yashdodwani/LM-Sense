// Purpose: Typed fetch wrapper for all LM-Sense backend endpoints.
// Centralises base URL, auth headers, and error handling in one place.

import type {
  AuditFilters,
  AuditLogResponse,
  DebiasRequest,
  DebiasResponse,
  PipelineConfig,
  DashboardStats,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8003";

// Retrieve token from localStorage (client-only, falls back to env var for SSR mocks)
function getToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lmsense_token") ?? "";
  }
  return process.env.NEXT_PUBLIC_API_TOKEN ?? "";
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(
      res.status,
      `API error ${res.status}: ${res.statusText}`,
      body,
    );
  }

  return res.json() as Promise<T>;
}

// ── Debias ────────────────────────────────────────────────────────────────────

export async function debias(req: DebiasRequest): Promise<DebiasResponse> {
  return apiFetch<DebiasResponse>("/v1/debias", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function sandboxTest(req: DebiasRequest): Promise<DebiasResponse> {
  return apiFetch<DebiasResponse>("/v1/debias", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export async function getAuditLog(
  filters: AuditFilters = {},
): Promise<AuditLogResponse> {
  const params = new URLSearchParams();
  if (filters.bias_type) params.set("bias_type", filters.bias_type);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.model) params.set("model", filters.model);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.page_size !== undefined)
    params.set("page_size", String(filters.page_size));

  const query = params.toString();
  return apiFetch<AuditLogResponse>(`/v1/audit${query ? `?${query}` : ""}`);
}

// ── Pipeline Config ───────────────────────────────────────────────────────────

export async function getPipeline(): Promise<PipelineConfig> {
  return apiFetch<PipelineConfig>("/v1/pipeline");
}

export async function updatePipeline(
  config: PipelineConfig,
): Promise<PipelineConfig> {
  return apiFetch<PipelineConfig>("/v1/pipeline", {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(
  days: number = 7,
): Promise<DashboardStats> {
  return apiFetch<DashboardStats>(`/v1/stats?days=${days}`);
}

export { ApiError };
