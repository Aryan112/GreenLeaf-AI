from pydantic import BaseModel

class RecommendationRequest(BaseModel):
    query: str


class RecommendationResponse(BaseModel):
    category: str
    care: str
    size: str
    minPrice: str
    maxPrice: str
    search: str