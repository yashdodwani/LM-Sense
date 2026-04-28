// Purpose: Shared TypeScript interfaces mirroring all backend Pydantic schemas.
// Used across all hooks, API calls, and components for end-to-end type safety.

export interface BiasScore {
  overall: number;
  gender: number;
  racial: number;
  age: number;
  geographic: number;
  socioeconomic: number;
}

export interface LayerTrace {
  layer: string;
  triggered: boolean;
  changes_made: number;
  score_before: number;
  score_after: number;
  duration_ms: number;
  notes?: string;
}

export interface FlaggedSpan {
  original: string;
  replacement?: string;
  bias_type: string;
  severity: string;
  start_char: number;
  end_char: number;
}

export interface DebiasResponse {
  request_id: string;
  model: string;
  raw_response: string;
  debiased_response: string;
  action_taken: string;
  bias_score_before: BiasScore;
  bias_score_after: BiasScore;
  flagged_spans: FlaggedSpan[];
  layer_trace: LayerTrace[];
  processing_time_ms: number;
  layers_applied: string[];
}

export interface DebiasRequest {
  model: string;
  prompt: string;
  raw_response: string;
  layers?: string[];
}

export interface AuditEntry {
  id: string;
  request_id: string;
  model: string;
  debiased_response: string;
  bias_score_before: BiasScore;
  bias_score_after: BiasScore;
  bias_types_detected: string[];
  severity: string;
  layers_applied: string[];
  action_taken: string;
  created_at: string;
}

export interface AuditFilters {
  bias_type?: string;
  severity?: string;
  model?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface AuditLogResponse {
  entries: AuditEntry[];
  total: number;
  pages: number;
  page: number;
}

export interface Layer1Config {
  enabled: boolean;
  model_adapter: string;
  cda_ratio: number;
  gender_swap: boolean;
  racial_swap: boolean;
}

export interface Layer2Config {
  enabled: boolean;
  reward_model: string;
  fairness_lambda: number;
  ppo_epochs: number;
  debate_rounds: number;
}

export interface Layer3Config {
  enabled: boolean;
  projection_method: string;
  bias_threshold: number;
  action_on_bias: "flag" | "rewrite" | "block";
  aggressiveness: number;
}

export interface PipelineConfig {
  id?: string;
  tenant_id?: string;
  layer1: Layer1Config;
  layer2: Layer2Config;
  layer3: Layer3Config;
  global_bias_threshold: number;
  max_requests_per_minute: number;
  updated_at?: string;
}

export interface TrendDataPoint {
  date: string;
  score_before: number;
  score_after: number;
  request_count: number;
}

export interface DashboardStats {
  avg_score_before: number;
  avg_score_after: number;
  total_requests: number;
  flagged_count: number;
  improvement_rate: number;
  trend: TrendDataPoint[];
}

export type ScoreLevel = "green" | "amber" | "red";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  return "red";
}
