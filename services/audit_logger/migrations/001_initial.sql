-- db/migrations/001_initial.sql
-- Initial migration to create audit_logs and hash_blocks tables
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL,
    request_id VARCHAR NOT NULL UNIQUE,
    model VARCHAR NOT NULL,
    prompt_hash VARCHAR NOT NULL,
    raw_response_hash VARCHAR NOT NULL,
    debiased_response TEXT NOT NULL,
    bias_score_before JSON NOT NULL,
    bias_score_after JSON NOT NULL,
    bias_types_detected VARCHAR[] NOT NULL,
    severity VARCHAR NOT NULL,
    layers_applied VARCHAR[] NOT NULL,
    action_taken VARCHAR NOT NULL,
    block_hash VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

CREATE TABLE hash_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL UNIQUE,
    last_hash VARCHAR NOT NULL,
    entry_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_hash_blocks_tenant_id ON hash_blocks(tenant_id);
