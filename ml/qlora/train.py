"""
ml/qlora/train.py — CLI script to fine-tune a model using QLoRA.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import torch
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments
from trl import SFTTrainer

from ml.qlora.config import QLoRATrainingConfig
from ml.qlora.dataset import QLoRADataset

def main() -> None:
    parser = argparse.ArgumentParser(description="QLoRA Fine-tuning Pipeline")
    parser.add_argument("--config", type=str, default=None, help="Path to JSON config file")
    args = parser.parse_args()

    config = QLoRATrainingConfig()
    if args.config:
        try:
            with open(args.config, "r") as f:
                config_data = json.load(f)
            for k, v in config_data.items():
                if hasattr(config, k):
                    setattr(config, k, v)
        except Exception as e:
            print(f"Error loading config: {e}")
            sys.exit(1)

    if not torch.cuda.is_available():
        print("Warning: CUDA is not available. Training will be extremely slow on CPU.")
    
    # Optional W&B Logging
    wandb_api_key = os.getenv("WANDB_API_KEY")
    report_to = "none"
    if wandb_api_key:
        import wandb
        wandb.login(key=wandb_api_key)
        wandb.init(project=config.wandb_project)
        report_to = "wandb"
        print(f"Logging to Weights & Biases project: {config.wandb_project}")

    print(f"Loading base model: {config.base_model_id} in 4-bit...")
    
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=config.use_4bit,
        bnb_4bit_compute_dtype=getattr(torch, config.bnb_4bit_compute_dtype, torch.float16),
        bnb_4bit_use_double_quant=False,
        bnb_4bit_quant_type="nf4",
    )
    
    tokenizer = AutoTokenizer.from_pretrained(config.base_model_id)
    tokenizer.pad_token = tokenizer.eos_token
    
    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        config.base_model_id,
        quantization_config=bnb_config,
        device_map="auto"
    )
    
    print("Configuring LoRA...")
    lora_config = LoraConfig(
        r=config.lora_rank,
        lora_alpha=config.lora_alpha,
        lora_dropout=config.lora_dropout,
        target_modules=config.target_modules,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    
    print(f"Loading dataset from {config.dataset_path}...")
    dataset_loader = QLoRADataset(config.dataset_path, tokenizer, config.max_seq_length)
    train_dataset = dataset_loader.load()

    print("Initializing Trainer...")
    training_args = TrainingArguments(
        output_dir=config.adapter_output_dir,
        per_device_train_batch_size=config.per_device_train_batch_size,
        gradient_accumulation_steps=config.gradient_accumulation_steps,
        learning_rate=config.learning_rate,
        num_train_epochs=config.num_train_epochs,
        logging_steps=10,
        save_strategy="epoch",
        optim="paged_adamw_32bit",
        report_to=report_to,
        remove_unused_columns=False,
    )
    
    trainer = SFTTrainer(
        model=model,
        train_dataset=train_dataset,
        peft_config=lora_config,
        dataset_text_field="text",
        max_seq_length=config.max_seq_length,
        tokenizer=tokenizer,
        args=training_args,
    )
    
    print("Starting training...")
    train_result = trainer.train()
    
    print("Saving final adapter...")
    trainer.save_model(config.adapter_output_dir)
    
    print(f"Final training loss: {train_result.metrics.get('train_loss', 'N/A')}")
    print(f"\\n✓ Adapter saved to {config.adapter_output_dir}. Set QLORA_ADAPTER_PATH={config.adapter_output_dir} in .env to activate Layer 1.")

if __name__ == "__main__":
    main()
