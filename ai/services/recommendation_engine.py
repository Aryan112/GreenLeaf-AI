import json
from services.intent_detector import detect_intent
from services.openai_service import generate_text
from services.prompt_builder import build_recommendation_prompt
from services.response_builder import build_response


def get_ai_recommendation(user_query: str, plants: list) -> dict:

    print("STEP 1")

    intent_data = detect_intent(user_query)

    print("STEP 2")
    print(intent_data)

    prompt = build_recommendation_prompt(
        user_query,
        plants,
        intent_data
    )

    print("STEP 3")
    print(len(prompt))

    raw_response = generate_text(prompt)

    print("STEP 4")

    try:
        ai_json = json.loads(raw_response)

    except Exception:
        print(raw_response)

        ai_json = {
            "intent": "recommend_plants",
            "filters": {},
            "reasoning": {
                "title": "Unable to understand",
                "message": "Please try again."
            },
            "confidence": 0,
            "follow_up": []
        }

    print("STEP 5")

    return build_response(ai_json)