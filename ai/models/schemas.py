from pydantic import BaseModel, field_validator
from typing import List, Optional


class Plant(BaseModel):
    name: str
    category: str
    care: str
    description: str
    price: float
    size: str


class RecommendationRequest(BaseModel):
    query: str
    plants: List[Plant]


class Filters(BaseModel):
    category: str = ""
    care: str = ""
    size: str = ""
    minPrice: str = ""
    maxPrice: str = ""
    search: str = ""


class Reasoning(BaseModel):
    title: str = ""
    message: str = ""


class ComparePlant(BaseModel):
    name: str = ""
    category: str = ""
    care: str = ""
    description: str = ""


class Comparison(BaseModel):
    plant1: ComparePlant
    plant2: ComparePlant


class RecommendationResponse(BaseModel):
    intent: str
    filters: Filters
    reasoning: Reasoning
    confidence: int
    follow_up: list[str]
    recommended_plants: list[str]
    comparison: Optional[Comparison] = None

    @field_validator("confidence", mode="before")
    @classmethod
    def coerce_confidence(cls, value):
        """
        Safety net: even if something upstream forgets to normalize
        confidence, coerce a 0-1 float (e.g. 0.95) or any float into
        a valid 0-100 integer instead of crashing response validation.
        """
        try:
            value = float(value)
        except (TypeError, ValueError):
            return 80

        if 0 <= value <= 1:
            value = value * 100

        return int(round(value))