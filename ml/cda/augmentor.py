"""
ml/cda/augmentor.py — Core augmentation logic using swap rules to generate counterfactuals.
"""

import re
from typing import Any

from ml.cda.swap_rules import SWAP_RULES, SwapRule

class CDAugmentor:
    """Counterfactual Data Augmentor"""
    
    def __init__(self) -> None:
        self.rules = SWAP_RULES
        
    def _apply_rule(self, text: str, rule: SwapRule) -> str | None:
        """Applies a single swap rule to text. Returns augmented text or None if no match."""
        # Use regex to match word boundaries and preserve case
        
        def replace_func(match: re.Match) -> str:
            original_word = match.group(0)
            replacement = rule.replacement
            # Preserve case
            if original_word.isupper():
                return replacement.upper()
            elif original_word.istitle():
                return replacement.title()
            else:
                return replacement.lower()
                
        # Try original -> replacement
        pattern1 = re.compile(rf"\b{re.escape(rule.original)}\b", re.IGNORECASE)
        if pattern1.search(text):
            return pattern1.sub(replace_func, text)
            
        # Try replacement -> original (bidirectional)
        def replace_func_rev(match: re.Match) -> str:
            original_word = match.group(0)
            replacement = rule.original
            if original_word.isupper():
                return replacement.upper()
            elif original_word.istitle():
                return replacement.title()
            else:
                return replacement.lower()
                
        pattern2 = re.compile(rf"\b{re.escape(rule.replacement)}\b", re.IGNORECASE)
        if pattern2.search(text):
            return pattern2.sub(replace_func_rev, text)
            
        return None

    def augment_example(self, text: str) -> list[str]:
        """
        For a given text, generates all counterfactual variants by applying swap rules.
        Returns list of augmented texts (one per matching rule, applied individually).
        Preserves original capitalisation using regex with case-insensitive matching.
        """
        variants = []
        for rule in self.rules:
            augmented = self._apply_rule(text, rule)
            if augmented and augmented != text:
                # Add if unique
                if augmented not in variants:
                    variants.append(augmented)
        return variants

    def augment_dataset(self, examples: list[dict[str, Any]], text_field: str = "text") -> list[dict[str, Any]]:
        """
        Augments a full dataset. For each example, generates original + all variants.
        Returns flattened list with added field 'is_augmented': bool and 'swap_rule': str.
        """
        augmented_dataset = []
        
        for ex in examples:
            text = ex.get(text_field, "")
            # Add original
            orig_ex = ex.copy()
            orig_ex["is_augmented"] = False
            orig_ex["swap_rule"] = "none"
            augmented_dataset.append(orig_ex)
            
            if not text:
                continue
                
            # Add variants
            for rule in self.rules:
                augmented_text = self._apply_rule(text, rule)
                if augmented_text and augmented_text != text:
                    new_ex = ex.copy()
                    new_ex[text_field] = augmented_text
                    new_ex["is_augmented"] = True
                    new_ex["swap_rule"] = rule.dimension
                    # Only add if we haven't added this exact text for this example
                    if not any(a.get(text_field) == augmented_text for a in augmented_dataset[-len(self.rules)-1:]):
                        augmented_dataset.append(new_ex)
                        
        return augmented_dataset
