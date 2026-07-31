from pydantic import BaseModel


class RecommendationRequest(BaseModel):
    query: str


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


class RecommendationResponse(BaseModel):
    intent: str
    filters: Filters
    reasoning: Reasoning
    confidence: int
    follow_up: list[str]
    recommended_plants: list[str]