# ai/services/recommendation_engine.py


import json

from services.openai_service import generate_text
from services.prompt_builder import build_recommendation_prompt
from services.response_builder import build_response


def get_ai_recommendation(user_query: str) -> dict:
    """
    Main AI recommendation pipeline.

    User Query
        ↓
    Prompt Builder
        ↓
    Gemini
        ↓
    JSON Parse
        ↓
    Response Builder
    """

    prompt = build_recommendation_prompt(user_query)

    raw_response = generate_text(prompt)

    try:
        ai_json = json.loads(raw_response)
    except Exception:
        ai_json = {
            "intent": "recommend_plants",
            "filters": {},
            "reasoning": {
                "title": "Unable to understand",
                "message": "Please try describing your requirements differently."
            },
            "confidence": 0,
            "follow_up": [
                "Indoor or outdoor?",
                "What's your budget?"
            ]
        }

    return build_response(ai_json)