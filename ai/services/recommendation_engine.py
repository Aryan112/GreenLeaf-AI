# ai/services/recommendation_engine.py


import json
from services.intent_detector import detect_intent

from services.openai_service import generate_text
from services.prompt_builder import build_recommendation_prompt
from services.response_builder import build_response


def get_ai_recommendation(user_query: str, plants: list) -> dict:
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

    intent_data = detect_intent(user_query)

    prompt = build_recommendation_prompt(
    user_query,
    plants,
    intent_data
)

    raw_response = generate_text(prompt)
    print("✅ Recommendation finished")

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