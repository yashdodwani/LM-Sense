/**
 * lib/types.ts — TypeScript types for LM-Sense API
 * Mirrors the backend Pydantic schemas.
 */

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

export interface DebiasRequest {
  model: string;
  prompt: string;
  raw_response: string;
  layers?: string[];
  context?: Record<string, string>;
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
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

export interface PipelineConfig {
  layer1_qlora: {
    lora_rank: number;
    enabled: boolean;
  };
  layer2_rldf: {
    fairness_lambda: number;
    debate_rounds: number;
    enabled: boolean;
  };
  layer3_postprocess: {
    action_on_detection: string;
    bias_sensitivity: number;
    custom_blocklist: string[];
    enabled: boolean;
  };
}

export interface GlobalAPIResponse<T> {
  success: boolean;
  data: T;
  error_code?: string;
  message?: string;
}

