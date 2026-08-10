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

IMPORTANT — choosing between browse_category/browse_filtered vs recommend_plants:

Use "recommend_plants" (curated, AI hand-picks a small set) whenever the
user's language implies curation or a recommendation, NOT just plain
browsing. This includes:

- Any explicit number ("top 5", "best 3", "show me 5 plants")
- Qualitative words like "best", "top", "recommend", "suggest",
  "which plants should I get", "what's good for..."
- Personal/contextual requests ("for my office", "for gifting",
  "for a beginner") where the user wants a tailored pick, not a
  full category listing

Use "browse_category" or "browse_filtered" ONLY when the user is plainly
asking to see/browse a category or filtered set, with no implication of
curation — e.g. "show me indoor plants", "show me succulents under 500",
"list all flowering plants".

When in doubt between the two, prefer "recommend_plants" — showing a
curated top pick is more helpful than dumping the entire category.

IMPORTANT:

The category field MUST ONLY be one of these values:

- indoor
- outdoor
- flowering
- succulent

Map real-world phrases to these categories. Examples:
- "living room", "bedroom", "office", "hostel", "apartment", "home decor" -> indoor
- "balcony", "terrace", "garden", "backyard", "patio" -> outdoor
- "bouquet", "birthday", "anniversary", "colorful blooms", "gifting", "gift" -> flowering
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

If the intent is compare_plants, the user is asking to compare exactly
two named plants (e.g. "compare aloe vera and snake plant",
"difference between money plant and jade plant").

Extract the two plant names into "comparePlants": ["name1", "name2"].

If the user does not clearly name two plants, use intent "recommend_plants"
instead.

If the user asks for a specific NUMBER of plants (e.g. "top 5 plants",
"best 3 indoor plants", "show me 5 plants for my office"), extract that
number into "count" (as an integer). If no specific number is mentioned,
use 0 — this does NOT change which intent to pick; it's just how many
to recommend when intent is recommend_plants.

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
    # Fallback: fix care if Gemini returned "low/medium/high"
    # instead of "easy/moderate/expert"
    # -------------------------------------------------
    care = (filters.get("care") or "").lower().strip()
    care_map = {"low": "easy", "medium": "moderate", "high": "expert"}

    if care in care_map:
        filters["care"] = care_map[care]
    elif care not in VALID_CARE and care != "":
        filters["care"] = ""

    intent_data["filters"] = filters

    return intent_data