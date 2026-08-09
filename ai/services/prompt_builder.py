import json


def build_recommendation_prompt(user_query: str, plants: list, intent_data: dict):

    schema = {
        "intent": "",
        "recommended_plants": [],
        "filters": {
            "category": "",
            "care": "",
            "size": "",
            "minPrice": "",
            "maxPrice": "",
            "search": ""
        },
        "reasoning": {
            "title": "",
            "message": ""
        },
        "confidence": 0,
        "follow_up": []
    }

    available_plants = ""

    for plant in plants:

        if isinstance(plant, dict):

            available_plants += f"""
Name: {plant.get("name")}
Category: {plant.get("category")}
Care: {plant.get("care")}
Description: {plant.get("description")}
Price: {plant.get("price", "")}

"""

        else:

            available_plants += f"""
Name: {plant.name}
Category: {plant.category}
Care: {plant.care}
Description: {plant.description}
Price: {getattr(plant, "price", "")}

"""

    requested_count = intent_data.get("count", 0)

    if requested_count and requested_count > 0:
        count_rule = f"Recommend EXACTLY {requested_count} plants. Do not recommend more or fewer."
    else:
        count_rule = "Recommend between 2 and 5 plants."

    return f"""
You are GreenLeaf AI.

The intent has ALREADY been detected.

Do NOT classify the intent again.

Detected Intent:
{intent_data["intent"]}

Detected Filters:
{json.dumps(intent_data["filters"], indent=4)}

Available Plants:

{available_plants}

Rules:

1. Never invent plants.
2. Recommend ONLY from Available Plants.
3. If intent is browse_all:
   - recommended_plants = []

4. If intent is browse_category:
   - recommended_plants = []
   - Keep filters unchanged.

5. If intent is browse_filtered:
   - recommended_plants = []
   - Keep filters unchanged.

6. If intent is recommend_plants:
   - {count_rule}

Return ONLY valid JSON.

Schema:

{json.dumps(schema, indent=4)}

User Query:

{user_query}
"""