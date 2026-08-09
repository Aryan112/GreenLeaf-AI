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


def get_ai_recommendation(user_query: str, plants: list) -> dict:
    """
    GreenLeaf AI Pipeline

    User
      ↓
    Intent Detection
      ↓
    Hybrid RAG Retriever / Compare Tool
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
    # STEP 2 : Retrieve Relevant Plants
    # ---------------------------------

    print("STEP 2")

    if tool == "search":

        filtered = search_tool.execute(
            plants,
            intent_data["filters"]
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

        ai_json = {
            "intent": "recommend_plants",
            "recommended_plants": [],
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