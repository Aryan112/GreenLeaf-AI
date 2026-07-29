from fastapi import APIRouter

from models.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)

from services.openai_service import extract_preferences

router = APIRouter()


@router.post("/recommend")
def recommend(request: RecommendationRequest):

    result = extract_preferences(request.query)

    return result