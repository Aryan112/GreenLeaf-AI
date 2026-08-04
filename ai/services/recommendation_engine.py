import json

from services.intent_detector import detect_intent
from services.retriever import Retriever
from services.openai_service import generate_text
from services.prompt_builder import build_recommendation_prompt
from services.response_builder import build_response
from tools.tool_router import ToolRouter
from tools.search_tool import SearchTool

retriever = Retriever()
router = ToolRouter()
search_tool = SearchTool()


def get_ai_recommendation(user_query: str, plants: list) -> dict:
    """
    GreenLeaf AI Pipeline

    User
      ↓
    Intent Detection
      ↓
    Hybrid RAG Retriever
      ↓
    Prompt Builder
      ↓
    Gemini
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

    raw_response = generate_text(prompt)

    # ---------------------------------
    # STEP 5 : Parse JSON
    # ---------------------------------

    print("STEP 5")

    try:
        ai_json = json.loads(raw_response)

    except Exception:

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