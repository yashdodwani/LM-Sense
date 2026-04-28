"""
ml/rldf/train.py — Two-phase RLDF training: Reward Model Fine-tuning and PPO Policy Training.
"""

import argparse
import json
import os
import sys

import torch
from datasets import load_dataset
from trl import AutoModelForCausalLMWithValueHead
from transformers import (
    AutoModelForCausalLM, AutoModelForSequenceClassification, AutoTokenizer,
    TrainingArguments, Trainer, default_data_collator
)
from tqdm import tqdm

from ml.rldf.config import RLDFConfig
from ml.rldf.ppo_trainer import LMSensePPOTrainer

def train_reward_model(config: RLDFConfig, report_to: str) -> None:
    print("\\n--- Phase 1: Training Reward Model ---")
    
    if not os.path.exists(config.debate_dataset_path):
        print(f"Dataset not found at {config.debate_dataset_path}. Please run debate_generator.py first.")
        sys.exit(1)
        
    dataset = load_dataset("json", data_files=config.debate_dataset_path, split="train")
    
    # We train a small classifier
    model_name = "distilbert-base-uncased"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)
    
    # Format data: Create pairs. 1 if debiased, 0 if biased.
    def format_dataset(examples):
        texts = []
        labels = []
        for p, b, d in zip(examples["prompt"], examples["biased"], examples["debiased"]):
            # Positive sample
            texts.append(f"Prompt: {p}\\nResponse: {d}")
            labels.append(1)
            # Negative sample
            texts.append(f"Prompt: {p}\\nResponse: {b}")
            labels.append(0)
            
        tokenized = tokenizer(texts, truncation=True, max_length=512, padding="max_length")
        tokenized["labels"] = labels
        return tokenized
        
    print("Formatting dataset...")
    formatted_ds = dataset.map(format_dataset, batched=True, remove_columns=dataset.column_names)
    
    training_args = TrainingArguments(
        output_dir=config.reward_model_output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=8,
        logging_steps=10,
        save_strategy="epoch",
        report_to=report_to,
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=formatted_ds,
        data_collator=default_data_collator,
    )
    
    print("Training reward model...")
    trainer.train()
    trainer.save_model(config.reward_model_output_dir)
    tokenizer.save_pretrained(config.reward_model_output_dir)
    print(f"✓ Reward model saved to {config.reward_model_output_dir}")

def train_ppo(config: RLDFConfig, report_to: str) -> None:
    print("\\n--- Phase 2: PPO Policy Training ---")
    
    # Load Reward Model
    print("Loading reward model...")
    reward_tokenizer = AutoTokenizer.from_pretrained(config.reward_model_output_dir)
    reward_model = AutoModelForSequenceClassification.from_pretrained(
        config.reward_model_output_dir, 
        device_map="auto"
    )
    reward_model.eval()
    
    # Load Base Model & Ref Model
    print("Loading base model for PPO...")
    tokenizer = AutoTokenizer.from_pretrained(config.base_model_id)
    tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLMWithValueHead.from_pretrained(
        config.base_model_id, 
        device_map="auto"
    )
    ref_model = AutoModelForCausalLMWithValueHead.from_pretrained(
        config.base_model_id, 
        device_map="auto"
    )
    
    trainer = LMSensePPOTrainer(
        config=config,
        model=model,
        ref_model=ref_model,
        tokenizer=tokenizer,
        reward_model=reward_model,
        reward_tokenizer=reward_tokenizer
    )
    
    # For training we need prompts. We'll load the prompts from our dataset.
    dataset = load_dataset("json", data_files=config.debate_dataset_path, split="train")
    
    print("Starting PPO loop...")
    epochs = config.ppo_epochs
    batch_size = config.ppo_batch_size
    
    model_device = trainer.ppo_trainer.accelerator.device
    
    for epoch in range(epochs):
        print(f"Epoch {epoch+1}/{epochs}")
        # Process in batches
        for i in tqdm(range(0, len(dataset), batch_size)):
            batch = dataset[i:i+batch_size]
            prompts = batch["prompt"]
            
            # 1. Encode queries
            query_tensors = [tokenizer(p, return_tensors="pt").input_ids[0].to(model_device) for p in prompts]
            
            # 2. Generate responses
            response_tensors = []
            responses = []
            for query in query_tensors:
                gen_len = config.max_new_tokens
                response = trainer.ppo_trainer.generate(query.unsqueeze(0), max_new_tokens=gen_len)
                resp_tensor = response.squeeze()[len(query):] # just the generated part
                response_tensors.append(resp_tensor)
                responses.append(tokenizer.decode(resp_tensor, skip_special_tokens=True))
                
            # 3. PPO Step
            stats = trainer.train_step(query_tensors, response_tensors, responses)
            
            if report_to == "wandb":
                import wandb
                wandb.log(stats)
                
    print("Saving PPO policy...")
    model.save_pretrained(config.policy_output_dir)
    tokenizer.save_pretrained(config.policy_output_dir)
    print(f"\\n✓ RLDF policy saved to {config.policy_output_dir}. Set RLDF_POLICY_PATH={config.policy_output_dir} in .env to activate Layer 2.")

def main() -> None:
    parser = argparse.ArgumentParser(description="RLDF Training Pipeline")
    parser.add_argument("--config", type=str, default=None, help="Path to JSON config file")
    parser.add_argument("--skip_rm", action="store_true", help="Skip reward model training")
    parser.add_argument("--skip_ppo", action="store_true", help="Skip PPO training")
    args = parser.parse_args()

    config = RLDFConfig()
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

    if not args.skip_rm:
        train_reward_model(config, report_to)
        
    if not args.skip_ppo:
        train_ppo(config, report_to)

if __name__ == "__main__":
    main()
