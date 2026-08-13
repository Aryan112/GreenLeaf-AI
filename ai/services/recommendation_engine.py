import json

from services.intent_detector import detect_intent
from services.retriever import Retriever
from services.openai_service import generate_text
from services.prompt_builder import build_recommendation_prompt
from services.response_builder import build_response
from tools.tool_router import ToolRouter
from tools.search_tool import SearchTool
from tools.compare_tool import CompareTool

retriever = Retriever()
router = ToolRouter()
search_tool = SearchTool()
compare_tool = CompareTool()


def normalize_confidence(value):
    """
    Gemini sometimes returns confidence as a 0-1 float (e.g. 0.95)
    instead of a 0-100 integer. FastAPI's strict `confidence: int`
    schema crashes the whole response on a fractional value, so we
    coerce it here before it ever reaches build_response().
    """

    try:
        value = float(value)
    except (TypeError, ValueError):
        return 80

    if 0 <= value <= 1:
        value = value * 100

    return int(round(value))


def get_ai_recommendation(user_query: str, plants: list) -> dict:
    """
    GreenLeaf AI Pipeline

    User
      ↓
    Intent Detection
      ↓
    Filter (always applied, even for recommend_plants) / Compare Tool
      ↓
    Hybrid RAG Retriever
      ↓
    Prompt Builder (skipped for compare)
      ↓
    Gemini (skipped for compare)
      ↓
    Response Builder
    """

    # ---------------------------------
    # STEP 1 : Detect Intent
    # ---------------------------------

    print("STEP 1")

    intent_data = detect_intent(user_query)

    print("✅ Intent detection finished")
    print(intent_data)

    tool = router.route(intent_data["intent"])
    print("🛠 Selected Tool :", tool)

    # ---------------------------------
    # SHORT-CIRCUIT : Compare Plants
    # ---------------------------------
    # Compare doesn't need retrieval or Gemini ranking —
    # it's a direct lookup + attribute diff.

    if tool == "compare":

        compare_names = intent_data.get("comparePlants", ["", ""])

        if len(compare_names) < 2 or not compare_names[0] or not compare_names[1]:

            return build_response({
                "intent": "compare_plants",
                "filters": intent_data.get("filters", {}),
                "comparison": None,
                "reasoning": {
                    "title": "Need Two Plants",
                    "message": "Please tell me the two plants you'd like to compare."
                },
                "confidence": 40,
                "follow_up": [
                    "Which two plants would you like to compare?"
                ]
            })

        comparison = compare_tool.execute(
            plants,
            compare_names[0],
            compare_names[1]
        )

        if not comparison:

            return build_response({
                "intent": "compare_plants",
                "filters": intent_data.get("filters", {}),
                "comparison": None,
                "reasoning": {
                    "title": "Plants Not Found",
                    "message": f"I couldn't find one or both of '{compare_names[0]}' and '{compare_names[1]}' in our nursery."
                },
                "confidence": 40,
                "follow_up": [
                    "Would you like to browse our plant categories instead?"
                ]
            })

        return build_response({
            "intent": "compare_plants",
            "filters": intent_data.get("filters", {}),
            "comparison": comparison,
            "reasoning": {
                "title": "Plant Comparison",
                "message": f"Here's how {comparison['plant1']['name']} compares to {comparison['plant2']['name']}."
            },
            "confidence": 90,
            "follow_up": []
        })

    # ---------------------------------
    # STEP 2 : Filter + Retrieve Relevant Plants
    # ---------------------------------
    # IMPORTANT: filters (category/care/size/price) are now applied
    # for EVERY intent that reaches this point — including
    # recommend_plants — not just "search"-routed intents. Previously,
    # recommend_plants skipped search_tool.execute() entirely, so a
    # query like "top 5 indoor plants under ₹500" had its price/category
    # constraints reduced to a soft hint in the Gemini prompt instead of
    # a hard filter, letting over-budget or wrong-category plants slip
    # into the candidate pool and sometimes into the final answer.

    print("STEP 2")

    filters = intent_data.get("filters", {})
    has_active_filters = any(
        (filters.get(key) or "") not in ("", "all")
        for key in ("category", "care", "size", "minPrice", "maxPrice", "search")
    )

    if tool == "search" or has_active_filters:

        filtered = search_tool.execute(
            plants,
            filters
        )

        retrieved_plants = retriever.retrieve(
            user_query,
            filtered
        )

    else:

        retrieved_plants = retriever.retrieve(
            user_query,
            plants
        )

    print(f"Retrieved {len(retrieved_plants)} plants")

    # ---------------------------------
    # STEP 3 : Build Prompt
    # ---------------------------------

    print("STEP 3")

    prompt = build_recommendation_prompt(
        user_query,
        retrieved_plants,
        intent_data
    )

    print("Prompt Length:", len(prompt))

    # ---------------------------------
    # STEP 4 : Gemini
    # ---------------------------------

    print("STEP 4")

    try:

        raw_response = generate_text(prompt)

    except Exception as e:

        print("❌ Gemini Failed")
        print(e)

        # Preserve the correctly-detected intent/filters instead of
        # discarding them — Gemini failing to rank/explain shouldn't
        # throw away a perfectly good category/price filter match.
        return build_response({
            "intent": intent_data["intent"],
            "filters": intent_data["filters"],
            "recommended_plants": [],
            "reasoning": {
                "title": "AI Recommendation",
                "message": "Showing the best matching plants from our nursery."
            },
            "confidence": 80,
            "follow_up": [
                "Would you like indoor plants?",
                "Would you like low-maintenance plants?"
            ]
        })

    # ---------------------------------
    # STEP 5 : Parse JSON
    # ---------------------------------

    print("STEP 5")

    try:

        ai_json = json.loads(raw_response)

    except Exception:

        print("❌ JSON Parsing Failed")
        print("Raw response was:", raw_response)

        # CRITICAL: preserve the intent/filters we already correctly
        # detected in Step 1, instead of resetting to empty filters.
        # An empty-filters fallback here previously caused the backend
        # to match (and return) the ENTIRE product catalog, since
        # empty category/price filters skip all WHERE clauses.
        ai_json = {
            "intent": intent_data["intent"],
            "recommended_plants": [],
            "filters": intent_data["filters"],
            "reasoning": {
                "title": "Showing Matching Plants",
                "message": "Here are plants that match your filters."
            },
            "confidence": 70,
            "follow_up": [
                "Would you like to narrow it down further?"
            ]
        }

    # Normalize confidence — Gemini sometimes returns 0-1 float instead
    # of 0-100 int, which crashes FastAPI's strict response validation.
    ai_json["confidence"] = normalize_confidence(ai_json.get("confidence", 80))

    return build_response(ai_json)