import json
from services.openai_service import generate_text


def detect_intent(user_query: str):
    prompt = f"""
You are an AI intent classifier.

Return ONLY valid JSON.

Supported intents:

1. browse_all
2. browse_category
3. browse_filtered
4. recommend_plants

Return exactly:

{{
    "intent":"",
    "filters": {{
        "category":"",
        "care":"",
        "size":"",
        "minPrice":"",
        "maxPrice":"",
        "search":""
    }}
}}

User Query:
{user_query}
"""

    response = generate_text(prompt)

    return json.loads(response)