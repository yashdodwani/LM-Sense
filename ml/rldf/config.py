"""
ml/rldf/config.py — Configuration parameters for RLDF training pipeline.
"""

from dataclasses import dataclass

@dataclass
class RLDFConfig:
    base_model_id: str = "facebook/opt-1.3b"
    reward_model_output_dir: str = "models/reward-model-v1"
    policy_output_dir: str = "models/rldf-policy-v1"
    debate_dataset_path: str = "data/debate_pairs.jsonl"
    fairness_lambda: float = 0.7
    ppo_learning_rate: float = 1.41e-5
    ppo_batch_size: int = 16
    ppo_epochs: int = 4
    ppo_clip_range: float = 0.2
    max_new_tokens: int = 256
    reward_model_id: str = "gpt-4o"      # AI judge — used only for data generation
    wandb_project: str = "lm-sense-rldf"
