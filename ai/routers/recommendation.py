from fastapi import APIRouter, HTTPException
import traceback

from models.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)

from services.recommendation_engine import get_ai_recommendation

router = APIRouter()


@router.post("/recommend", response_model=RecommendationResponse)
def recommend(request: RecommendationRequest):
    try:
        return get_ai_recommendation(
            request.query,
            request.plants
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))