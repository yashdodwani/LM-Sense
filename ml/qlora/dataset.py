"""
ml/qlora/dataset.py — Dataset loading and formatting for QLoRA fine-tuning.
"""

from datasets import load_dataset, Dataset
from typing import Any

class QLoRADataset:
    """Loads and formats a JSONL dataset for QLoRA fine-tuning."""
    
    def __init__(self, dataset_path: str, tokenizer: Any, max_seq_length: int = 512) -> None:
        self.dataset_path = dataset_path
        self.tokenizer = tokenizer
        self.max_seq_length = max_seq_length

    def _formatting_prompts_func(self, example: dict[str, Any]) -> dict[str, Any]:
        """Formats the prompt and completion into a single string."""
        prompt = example.get("prompt", "")
        completion = example.get("completion", "")
        # Format as specified
        formatted_text = f"### Biased:\\n{prompt}\\n\\n### Neutral:\\n{completion}"
        return {"text": formatted_text}

    def _tokenize(self, example: dict[str, Any]) -> dict[str, Any]:
        """Tokenizes the formatted text."""
        return self.tokenizer(
            example["text"],
            truncation=True,
            max_length=self.max_seq_length,
            padding="max_length"
        )

    def load(self) -> Dataset:
        """Loads, formats, and tokenizes the dataset."""
        dataset = load_dataset("json", data_files=self.dataset_path, split="train")
        
        # Format text
        dataset = dataset.map(self._formatting_prompts_func, desc="Formatting prompts")
        
        # Tokenize
        dataset = dataset.map(
            self._tokenize,
            batched=True,
            desc="Tokenizing dataset",
            remove_columns=dataset.column_names
        )
        
        return dataset
