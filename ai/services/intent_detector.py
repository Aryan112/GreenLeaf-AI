import json
from services.openai_service import generate_text


def detect_intent(user_query: str):
    prompt = f"""
You are the intent detection engine for a plant nursery.

Return ONLY valid JSON.

Never explain anything.

Supported intents:

1. browse_all
2. browse_category
3. browse_filtered
4. recommend_plants

IMPORTANT:

The category field MUST ONLY be one of these values:

- indoor
- outdoor
- flowering
- succulent

Never return:

Indoor Plants
Outdoor Plants
Flowering Plants
Succulents

Use only the values above.

The care field MUST ONLY be:

- low
- medium
- high

The size field MUST ONLY be:

- small
- medium
- large

Prices:

If the user says:

under 300
below 300
less than 300

Return

"maxPrice":"300"

If the user says

above 500

Return

"minPrice":"500"

Return EXACTLY this schema:

{{
    "intent":"",
    "filters":{{
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
    print("✅ Intent detection finished")

    return json.loads(response)