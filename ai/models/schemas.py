from pydantic import BaseModel
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