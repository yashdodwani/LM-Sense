"""
services/debias_engine/orchestrator.py — LM-Sense Pipeline Orchestrator

Decides which layers to run for a given request based on:
  1. The tenant's PipelineConfig (which layers are enabled)
  2. The caller's explicit `layers` parameter (override)
  3. Global settings (LAYER1_ENABLED etc.)

Returns an ordered list of layer instances ready to run.
Layers always execute in fixed order: Layer 1 → Layer 2 → Layer 3.
"""

from core.config import settings
from core.logging import get_logger
from services.api_gateway.schemas.common import LayerName
from services.api_gateway.schemas.pipeline import PipelineConfig
from services.debias_engine.layer1_qlora import Layer1QLoRA
from services.debias_engine.layer2_rldf import Layer2RLDF
from services.debias_engine.layer3_postprocess import Layer3Postprocess

logger = get_logger(__name__)

# Fixed execution order — never reorder
LAYER_ORDER = [LayerName.QLORA_CDA, LayerName.RLDF, LayerName.POSTPROCESS]


class PipelineOrchestrator:
    """
    Determines the active set of layers for a pipeline run.

    Instantiate once and reuse — layer instances are cached internally.
    """

    def __init__(self) -> None:
        # Layer singletons — instantiated once, reused across requests
        self._layer1 = Layer1QLoRA()
        self._layer2 = Layer2RLDF()
        self._layer3 = Layer3Postprocess()

    def get_active_layers(
        self,
        config: PipelineConfig,
        requested_layers: list[LayerName] | None = None,
    ) -> list[LayerName]:
        """
        Returns the ordered subset of layers to run for this request.

        Priority:
          1. If `requested_layers` is set (API caller override), use that.
          2. Otherwise, use what's enabled in PipelineConfig + global settings.

        Always returns layers in fixed order: L1 → L2 → L3.
        """
        if requested_layers:
            active = [l for l in LAYER_ORDER if l in requested_layers]
            logger.debug("orchestrator.layers.from_request", active=active)
            return active

        active = []
        if config.layer1_qlora.enabled and settings.LAYER1_ENABLED:
            active.append(LayerName.QLORA_CDA)
        if config.layer2_rldf.enabled and settings.LAYER2_ENABLED:
            active.append(LayerName.RLDF)
        if config.layer3_postprocess.enabled and settings.LAYER3_ENABLED:
            active.append(LayerName.POSTPROCESS)

        logger.debug("orchestrator.layers.from_config", active=active)
        return active

    def get_layer1(self) -> Layer1QLoRA:
        return self._layer1

    def get_layer2(self) -> Layer2RLDF:
        return self._layer2

    def get_layer3(self) -> Layer3Postprocess:
        return self._layer3