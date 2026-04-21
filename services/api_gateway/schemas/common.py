"""
Shared Enums and Pydantic types.
"""
from enum import Enum
class BiasType(str, Enum):
    GENDER = "gender"
    RACIAL = "racial"
    AGE = "age"
    GEOGRAPHIC = "geographic"
    SOCIOECONOMIC = "socioeconomic"
