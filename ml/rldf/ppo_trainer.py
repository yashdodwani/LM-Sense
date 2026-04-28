"""
ml/rldf/ppo_trainer.py — PPO training loop for RLDF, balancing fairness and fluency.
"""

from typing import Any

import torch
from trl import PPOTrainer

from ml.rldf.config import RLDFConfig

class LMSensePPOTrainer:
    def __init__(
        self, 
        config: RLDFConfig, 
        model: Any, 
        ref_model: Any, 
        tokenizer: Any, 
        reward_model: Any,
        reward_tokenizer: Any
    ) -> None:
        self.config = config
        self.model = model
        self.ref_model = ref_model
        self.tokenizer = tokenizer
        self.reward_model = reward_model
        self.reward_tokenizer = reward_tokenizer
        
        # PPO config
        from trl import PPOConfig
        ppo_config = PPOConfig(
            learning_rate=config.ppo_learning_rate,
            batch_size=config.ppo_batch_size,
            mini_batch_size=4,
            gradient_accumulation_steps=4,
            optimize_cuda_cache=True,
            target_kl=0.1,
            ppo_epochs=config.ppo_epochs,
            seed=42,
        )
        
        self.ppo_trainer = PPOTrainer(
            config=ppo_config,
            model=model,
            ref_model=ref_model,
            tokenizer=tokenizer,
        )
        
        self.device = self.ppo_trainer.accelerator.device

    def compute_reward(self, response_text: str) -> float:
        """
        Combines fairness and fluency into a single scalar reward.
        reward = lambda * fairness_score + (1 - lambda) * fluency_score
        fairness_score: reward_model prediction (0-1)
        fluency_score: 1 / (1 + perplexity) normalised to 0-1
        """
        # 1. Compute fairness score (from reward model)
        inputs = self.reward_tokenizer(response_text, return_tensors="pt", truncation=True, max_length=512)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.reward_model(**inputs)
            # Assuming it's a binary classifier where logits[1] is the debiased score
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            fairness_score = probs[0][1].item() if probs.shape[-1] > 1 else torch.sigmoid(outputs.logits[0]).item()

        # 2. Compute fluency score (approximate perplexity using ref_model)
        encodings = self.tokenizer(response_text, return_tensors="pt")
        input_ids = encodings.input_ids.to(self.device)
        
        with torch.no_grad():
            outputs = self.ref_model(input_ids, labels=input_ids)
            loss = outputs.loss
            perplexity = torch.exp(loss).item()
            
        fluency_score = 1.0 / (1.0 + min(perplexity, 100.0) / 10.0) # normalise somewhat
        
        # 3. Combine
        reward = self.config.fairness_lambda * fairness_score + (1.0 - self.config.fairness_lambda) * fluency_score
        return reward

    def train_step(self, query_tensors: list[torch.Tensor], response_tensors: list[torch.Tensor], responses: list[str]) -> dict[str, float]:
        """One PPO update step. Returns {"mean_reward": float, "kl": float, "loss": float}"""
        
        # Compute rewards for all responses
        rewards = [torch.tensor(self.compute_reward(r), device=self.device) for r in responses]
        
        # Run PPO step
        stats = self.ppo_trainer.step(query_tensors, response_tensors, rewards)
        
        return {
            "mean_reward": float(sum(r.item() for r in rewards) / len(rewards)),
            "kl": stats.get("objective/kl", 0.0),
            "loss": stats.get("ppo/loss/total", 0.0)
        }
