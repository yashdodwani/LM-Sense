import asyncio
from services.debias_engine.engine import get_debias_engine
from services.api_gateway.schemas.pipeline import PipelineConfig
from services.api_gateway.schemas.common import LayerName

async def main():
    try:
        engine = get_debias_engine()
        config = PipelineConfig(tenant_id="test-tenant")
        result = await engine.run(
            prompt="test",
            raw_response="He should lead the team.",
            config=config,
            tenant_id="test-tenant",
            request_id="req-123",
            model="gpt-4o",
            requested_layers=[LayerName.QLORA_CDA, LayerName.RLDF, LayerName.POSTPROCESS]
        )
        print("Success:", result)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
