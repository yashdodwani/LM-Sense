"""
ml/cda/swap_rules.py — Defines all term swap rule pairs used for counterfactual data augmentation.
Rules are grouped by bias dimension. Each rule is bidirectional.
"""

from dataclasses import dataclass
from typing import Literal

BiasType = Literal["gender", "racial", "age", "socioeconomic"]

@dataclass
class SwapRule:
    dimension: BiasType
    original: str
    replacement: str

# Define SWAP_RULES with at minimum 30 pairs covering the dimensions
SWAP_RULES: list[SwapRule] = [
    # Gender (15+ pairs)
    SwapRule("gender", "he", "she"),
    SwapRule("gender", "him", "her"),
    SwapRule("gender", "his", "her"),
    SwapRule("gender", "his", "hers"),
    SwapRule("gender", "himself", "herself"),
    SwapRule("gender", "man", "woman"),
    SwapRule("gender", "men", "women"),
    SwapRule("gender", "boy", "girl"),
    SwapRule("gender", "boys", "girls"),
    SwapRule("gender", "father", "mother"),
    SwapRule("gender", "fathers", "mothers"),
    SwapRule("gender", "son", "daughter"),
    SwapRule("gender", "sons", "daughters"),
    SwapRule("gender", "brother", "sister"),
    SwapRule("gender", "brothers", "sisters"),
    SwapRule("gender", "uncle", "aunt"),
    SwapRule("gender", "husband", "wife"),
    SwapRule("gender", "businessman", "businessperson"),
    SwapRule("gender", "chairman", "chairperson"),
    SwapRule("gender", "manpower", "workforce"),
    SwapRule("gender", "stewardess", "flight attendant"),
    SwapRule("gender", "policeman", "police officer"),
    SwapRule("gender", "fireman", "firefighter"),
    SwapRule("gender", "mankind", "humankind"),
    SwapRule("gender", "manmade", "artificial"),
    SwapRule("gender", "king", "queen"),
    SwapRule("gender", "waiter", "server"),
    SwapRule("gender", "waitress", "server"),
    SwapRule("gender", "actor", "actor"), # keep neutral
    SwapRule("gender", "actress", "actor"),
    SwapRule("gender", "male nurse", "nurse"),
    SwapRule("gender", "female doctor", "doctor"),
    
    # Racial (5+ pairs) - careful neutral replacements only
    SwapRule("racial", "black neighborhood", "neighborhood"),
    SwapRule("racial", "white neighborhood", "neighborhood"),
    SwapRule("racial", "urban inner-city", "metropolitan area"),
    SwapRule("racial", "minority students", "students"),
    SwapRule("racial", "ethnic minority", "underrepresented group"),
    SwapRule("racial", "foreign worker", "international worker"),

    # Age (5+ pairs)
    SwapRule("age", "elderly person", "older adult"),
    SwapRule("age", "old people", "older adults"),
    SwapRule("age", "youthful", "young professional"),
    SwapRule("age", "senior citizen", "older adult"),
    SwapRule("age", "millennial", "young adult"),
    SwapRule("age", "boomer", "older generation"),

    # Socioeconomic (5+ pairs)
    SwapRule("socioeconomic", "poor neighborhood", "underserved community"),
    SwapRule("socioeconomic", "uneducated", "without formal education"),
    SwapRule("socioeconomic", "low-class", "lower-income"),
    SwapRule("socioeconomic", "ghetto", "economically disadvantaged area"),
    SwapRule("socioeconomic", "white trash", "rural poor"),
    SwapRule("socioeconomic", "rich kid", "affluent youth"),
]
