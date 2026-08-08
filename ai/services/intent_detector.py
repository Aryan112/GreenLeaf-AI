import json
from services.openai_service import generate_text
from services.knowledge_base import KNOWLEDGE

VALID_CATEGORIES = {"indoor", "outdoor", "flowering", "succulent"}
VALID_CARE = {"low", "medium", "high"}


def resolve_category_from_knowledge_base(user_query: str) -> str:
    """
    Falls back to keyword-based matching when the LLM
    doesn't return one of the 4 valid category values.
    e.g. "living room" -> "indoor", "balcony" -> "outdoor"
    """
    query_lower = user_query.lower()

    for rule in KNOWLEDGE.values():
        matched = any(keyword in query_lower for keyword in rule.get("keywords", []))
        if matched and rule.get("category") in VALID_CATEGORIES:
            return rule["category"]

    return ""


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

Map real-world phrases to these categories. Examples:
- "living room", "bedroom", "office", "hostel", "apartment", "home decor" -> indoor
- "balcony", "terrace", "garden", "backyard", "patio" -> outdoor
- "bouquet", "birthday", "anniversary", "colorful blooms" -> flowering
- "cactus", "desert plant", "low water" -> succulent

Never return:

Indoor Plants
Outdoor Plants
Flowering Plants
Succulents

Use only the values above. If nothing matches, return an empty string.

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

    intent_data = json.loads(response)

    # -------------------------------------------------
    # Fallback: fix category if Gemini returned something
    # outside the 4 valid values (e.g. "living room")
    # -------------------------------------------------
    filters = intent_data.get("filters", {})
    category = (filters.get("category") or "").lower().strip()

    if category not in VALID_CATEGORIES:
        resolved = resolve_category_from_knowledge_base(user_query)
        filters["category"] = resolved
        print(f"🔧 Category fallback: '{category}' -> '{resolved}'")

    # -------------------------------------------------
    # Fallback: fix care if Gemini returned "easy/moderate/expert"
    # instead of "low/medium/high" (knowledge_base.py inconsistency)
    # -------------------------------------------------
    care = (filters.get("care") or "").lower().strip()
    care_map = {"easy": "low", "moderate": "medium", "expert": "high"}

    if care in care_map:
        filters["care"] = care_map[care]
    elif care not in VALID_CARE and care != "":
        filters["care"] = ""

    intent_data["filters"] = filters

    return intent_data