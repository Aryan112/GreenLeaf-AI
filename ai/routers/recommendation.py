from fastapi import APIRouter

from models.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)

from services.recommendation_engine import get_ai_recommendation

router = APIRouter()


@router.post("/recommend", response_model=RecommendationResponse)
def recommend(request: RecommendationRequest):
    result = get_ai_recommendation(request.query)
    return result