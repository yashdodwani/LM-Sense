"""
services/api_gateway/schemas/pipeline.py — LM-Sense pipeline config schemas

Pydantic models for GET/PUT /v1/pipeline.
PipelineConfig is the full configuration for all three debiasing layers
per tenant. Engineers edit this; decision-makers interact with the
simplified AggressivenessPreset instead.
"""

from enum import StrEnum

from pydantic import BaseModel, Field

from services.api_gateway.schemas.common import ActionOnDetection


class AggressivenessPreset(StrEnum):
    """Simplified view for non-technical users. Maps to LayerConfig presets."""
    LOW      = "low"       # Minimal intervention — flag only
    BALANCED = "balanced"  # Default — rewrite clear bias, flag ambiguous
    STRICT   = "strict"    # Maximum intervention — rewrite everything above threshold


class CDAConfig(BaseModel):
    """Configuration for Counterfactual Data Augmentation (Layer 1)."""
    enabled: bool = True
    custom_swap_pairs: list[dict[str, str]] = Field(
        default_factory=list,
        description="Additional term swap pairs e.g. [{'he': 'she', 'she': 'he'}]",
    )


class QLoRAConfig(BaseModel):
    """Configuration for the QLoRA adapter (Layer 1)."""
    enabled: bool = True
    lora_rank: int = Field(default=16, ge=4, le=64, description="LoRA rank r")
    lora_alpha: int = Field(default=32, description="LoRA scaling alpha")
    adapter_id: str | None = Field(
        default=None,
        description="HuggingFace adapter ID or local path. Uses LM-Sense default if None.",
    )


class RLDFConfig(BaseModel):
    """Configuration for the RLDF alignment layer (Layer 2)."""
    enabled: bool = True
    reward_model: str = Field(default="gpt-4o", description="AI judge model for scoring")
    fairness_lambda: float = Field(default=0.7, ge=0.0, le=1.0)
    debate_rounds: int = Field(default=2, ge=1, le=5)
    ppo_clip_range: float = Field(default=0.2, ge=0.05, le=0.5)


class PostprocessConfig(BaseModel):
    """Configuration for the RL post-processing layer (Layer 3)."""
    enabled: bool = True
    action_on_detection: ActionOnDetection = ActionOnDetection.REWRITE
    projection_strength: int = Field(default=70, ge=0, le=100)
    bias_sensitivity: str = Field(
        default="medium", pattern="^(low|medium|high)$"
    )
    custom_blocklist: list[str] = Field(
        default_factory=list,
        description="Domain-specific biased phrases to always flag",
    )


class PipelineConfig(BaseModel):
    """
    Full debiasing pipeline configuration for a tenant.
    Returned by GET /v1/pipeline, accepted by PUT /v1/pipeline.
    """
    tenant_id: str
    preset: AggressivenessPreset = AggressivenessPreset.BALANCED
    layer1_qlora: QLoRAConfig = QLoRAConfig()
    layer1_cda: CDAConfig = CDAConfig()
    layer2_rldf: RLDFConfig = RLDFConfig()
    layer3_postprocess: PostprocessConfig = PostprocessConfig()
    updated_at: str | None = None