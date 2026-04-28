import asyncio
from core.llm_client import get_llm_client
from core.config import settings

async def main():
    llm = get_llm_client()
    try:
        res = await llm.complete(model="gpt-4o", prompt="Text to rewrite:\nHe should be a businessman.", system="You are a bias correction assistant.")
        print('RESPONSE:', res.text)
    except Exception as e:
        print('ERROR:', e)

asyncio.run(main())
