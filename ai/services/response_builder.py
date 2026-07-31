def build_response(ai_result: dict) -> dict:
    return {
        "intent": ai_result.get("intent", "recommend_plants"),

        "recommended_plants": ai_result.get(
            "recommended_plants",
            []
        ),

        "filters": ai_result.get("filters", {}),

        "reasoning": ai_result.get(
            "reasoning",
            {
                "title": "",
                "message": ""
            }
        ),

        "confidence": ai_result.get(
            "confidence",
            80
        ),

        "follow_up": ai_result.get(
            "follow_up",
            []
        )
    }