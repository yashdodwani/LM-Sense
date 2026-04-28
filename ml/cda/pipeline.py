"""
ml/cda/pipeline.py — CLI script for Counterfactual Data Augmentation (CDA).
Loads a JSONL dataset, applies CDA, creates training pairs, and saves to JSONL.
"""

import argparse
import json
import sys
from pathlib import Path

from datasets import load_dataset
from tqdm import tqdm

from ml.cda.augmentor import CDAugmentor

def main() -> None:
    parser = argparse.ArgumentParser(description="Counterfactual Data Augmentation Pipeline")
    parser.add_argument("--input", type=str, default="data/raw.jsonl", help="Input JSONL file")
    parser.add_argument("--output", type=str, default="data/cda_augmented.jsonl", help="Output JSONL file")
    parser.add_argument("--text_field", type=str, default="response", help="Field containing text to augment")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Error: Input file {input_path} does not exist.")
        sys.exit(1)

    print(f"Loading dataset from {input_path}...")
    dataset = load_dataset("json", data_files=str(input_path), split="train")
    
    examples = [ex for ex in dataset]
    augmentor = CDAugmentor()
    
    print("Augmenting dataset...")
    # Add a progress bar for row-level augmentation
    augmented_examples = []
    
    # We will generate training pairs: (biased_text, neutral_text)
    # The biased is original, neutral is augmented.
    training_pairs = []
    stats_rules = {}
    
    for ex in tqdm(examples, desc="Applying swap rules"):
        text = ex.get(args.text_field, "")
        if not text:
            continue
            
        variants = augmentor.augment_example(text)
        
        # Track stats
        if variants:
            # We don't have exactly which rule triggered easily from augment_example, 
            # but we can count total variants. We can approximate rule stats.
            pass
            
        for variant in variants:
            # Create training pair
            prompt = f"Rewrite to remove bias:\\n{text}"
            completion = variant
            training_pairs.append({
                "prompt": prompt,
                "completion": completion
            })

    # Save to output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        for pair in training_pairs:
            f.write(json.dumps(pair) + "\n")
            
    print(f"\nStats:")
    print(f"Original examples: {len(examples)}")
    print(f"Training pairs generated: {len(training_pairs)}")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    main()
