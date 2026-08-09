import json
from services.openai_service import generate_text
from services.knowledge_base import KNOWLEDGE

VALID_CATEGORIES = {"indoor", "outdoor", "flowering", "succulent"}
VALID_CARE = {"easy", "moderate", "expert"}


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
5. compare_plants

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

- easy
- moderate
- expert

Map real-world phrases to these values. Examples:
- "low maintenance", "beginner friendly", "easy to care for", "busy", "travel a lot" -> easy
- "medium care", "some attention needed" -> moderate
- "advanced", "professional", "expert level" -> expert

The size field MUST ONLY be:

- small
- medium
- large

The "search" field is ONLY for when the user names a SPECIFIC plant or exact
product keyword, e.g. "search for money plant", "show me aloe vera",
"do you have jade plant".

NEVER put generic context/location/occasion words into "search" — words like
"desk", "office", "gift", "room", "birthday", "balcony", "living room" are
already captured by category/care/size and must NOT also be placed in "search".

If the user query does not explicitly name a plant, leave "search" as an
empty string "".

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

If the intent is compare_plants, the user is asking to compare exactly
two named plants (e.g. "compare aloe vera and snake plant",
"difference between money plant and jade plant").

Extract the two plant names into "comparePlants": ["name1", "name2"].

If the user does not clearly name two plants, use intent "recommend_plants"
instead.

If the user asks for a specific NUMBER of plants (e.g. "top 5 plants",
"best 3 indoor plants", "show me 5 plants for my office"), the intent
MUST be "recommend_plants" — NOT browse_category or browse_filtered —
so the AI can hand-pick and limit the exact number of plants requested.

Extract the requested number into "count" (as an integer). If no specific
number is mentioned, use 0.

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
    }},
    "comparePlants":["",""],
    "count":0
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
    # Fallback: normalize care to easy/moderate/expert
    # (Gemini or knowledge_base.py may occasionally emit
    # low/medium/high style synonyms)
    # -------------------------------------------------
    care = (filters.get("care") or "").lower().strip()
    care_map = {"low": "easy", "medium": "moderate", "high": "expert"}

    if care in care_map:
        filters["care"] = care_map[care]
    elif care not in VALID_CARE and care != "":
        filters["care"] = ""

    intent_data["filters"] = filters

    return intent_data