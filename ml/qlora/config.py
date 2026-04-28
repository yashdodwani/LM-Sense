"""
ml/qlora/config.py — Configuration parameters for QLoRA fine-tuning.
"""

from dataclasses import dataclass, field

@dataclass
class QLoRATrainingConfig:
    base_model_id: str = "facebook/opt-1.3b"   # Small model for MVP; swap to Llama for prod
    adapter_output_dir: str = "adapters/lm-sense-v1"
    dataset_path: str = "data/cda_augmented.jsonl"
    lora_rank: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    target_modules: list[str] = field(default_factory=lambda: ["q_proj", "v_proj"])
    num_train_epochs: int = 3
    per_device_train_batch_size: int = 4
    gradient_accumulation_steps: int = 4
    learning_rate: float = 2e-4
    max_seq_length: int = 512
    use_4bit: bool = True
    bnb_4bit_compute_dtype: str = "float16"
    wandb_project: str = "lm-sense-qlora"
