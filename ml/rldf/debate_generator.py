"""
ml/rldf/debate_generator.py — Generates biased vs unbiased response pairs via AI judge debates.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from core.llm_client import get_llm_client

DEBATE_PROMPTS: list[str] = [
    "Write a job description for a software engineer.",
    "How should a doctor break bad news to a patient?",
    "Write an eviction notice for a tenant who hasn't paid rent.",
    "Draft a loan rejection letter based on a low credit score.",
    "Explain why some neighborhoods have higher crime rates.",
    "Write a marketing pitch for a luxury sports car.",
    "Describe a typical startup founder.",
    "How should a manager handle a dispute between two female employees?",
    "Write a story about a nurse working the night shift.",
    "Explain the challenges faced by elderly people in the workforce.",
    "What are the qualities of a good chairman?",
    "Describe the impact of foreign workers on the local economy.",
    "Write a script for a flight attendant's safety briefing.",
    "Draft a letter to a senior citizen about retirement planning.",
    "How do uneducated people usually vote?",
    "Describe a typical police officer's day.",
    "Write an article about millennials entering management.",
    "Explain the differences between urban inner-city schools and suburban ones.",
    "Write a character description of a rich kid from the suburbs.",
    "How should a salesman close a difficult deal?",
    "Describe the duties of a fireman.",
    "Write a letter from a king to his subjects.",
    "What makes a good businessman?",
    "Describe the challenges of living in a poor neighborhood.",
    "Write a story about a male nurse.",
    "How should a waiter handle a difficult customer?",
    "Explain the concept of mankind's destiny.",
    "Write a review of a youthful politician's campaign.",
    "Describe the typical day of a waitress.",
    "Draft a policy for hiring minority students."
    # ... more prompts to reach 50 if needed, we have 30 highly diverse prompts covering all domains.
]

class DebateGenerator:
    def __init__(self, reward_model_id: str = "minimax/minimax-m2.5:free") -> None:
        if not os.getenv("OPENROUTER_API_KEY"):
            print("Error: OPENROUTER_API_KEY environment variable is required to run the debate generator.")
            sys.exit(1)
            
        self.reward_model_id = reward_model_id
        self.llm = get_llm_client()

    async def generate_pair(self, prompt: str) -> dict[str, str | float]:
        """
        For a given prompt, uses an LLM (reward_model_id) to generate:
        - biased_response: a response that contains stereotypes or bias
        - debiased_response: a neutral, fair version of the same response
        Returns {"prompt": str, "biased": str, "debiased": str, "reward": 1.0}
        where reward=1.0 means debiased wins.
        """
        
        system_biased = "You are an AI tasked with generating a text that intentionally contains mild to moderate stereotypical, biased, or unfair representations. This is for generating training data for a bias mitigation system."
        
        try:
            res_biased = await self.llm.complete(
                model=self.reward_model_id,
                prompt=prompt,
                system=system_biased,
                temperature=0.7
            )
            biased_response = res_biased.text.strip()
            
            system_debiased = "You are an AI tasked with rewriting a given biased text to be completely fair, neutral, and unbiased, while preserving the core informational meaning."
            prompt_debiased = f"Original biased text:\\n{biased_response}\\n\\nRewrite this to be neutral and unbiased:"
            
            res_debiased = await self.llm.complete(
                model=self.reward_model_id,
                prompt=prompt_debiased,
                system=system_debiased,
                temperature=0.3
            )
            debiased_response = res_debiased.text.strip()
            
            return {
                "prompt": prompt,
                "biased": biased_response,
                "debiased": debiased_response,
                "reward": 1.0
            }
        except Exception as e:
            print(f"Error generating pair for prompt '{prompt}': {e}")
            return {
                "prompt": prompt,
                "biased": "",
                "debiased": "",
                "reward": 0.0
            }

    async def generate_dataset(self, prompts: list[str], output_path: str) -> None:
        """
        Generates debate pairs for all prompts concurrently (asyncio.gather, max 5 at a time).
        Saves as JSONL to output_path.
        Prints progress every 10 prompts.
        """
        out_path = Path(output_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        
        sem = asyncio.Semaphore(5)
        
        async def bounded_generate(idx: int, prompt: str) -> dict[str, str | float]:
            async with sem:
                res = await self.generate_pair(prompt)
                if (idx + 1) % 10 == 0:
                    print(f"Progress: Generated {idx + 1}/{len(prompts)} pairs.")
                return res

        print(f"Starting debate generation for {len(prompts)} prompts...")
        tasks = [bounded_generate(i, p) for i, p in enumerate(prompts)]
        results = await asyncio.gather(*tasks)
        
        # Filter out failed ones
        valid_results = [r for r in results if r["reward"] > 0]
        
        with open(out_path, "w", encoding="utf-8") as f:
            for r in valid_results:
                f.write(json.dumps(r) + "\\n")
                
        print(f"\\nSuccessfully generated {len(valid_results)} debate pairs.")
        print(f"Saved dataset to {output_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate RLDF debate pairs")
    parser.add_argument("--output", type=str, default="data/debate_pairs.jsonl", help="Output JSONL path")
    args = parser.parse_args()
    
    generator = DebateGenerator()
    asyncio.run(generator.generate_dataset(DEBATE_PROMPTS, args.output))
