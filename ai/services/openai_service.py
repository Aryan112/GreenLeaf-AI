from google import genai
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def extract_preferences(query: str):

    prompt = f"""
You are GreenLeaf AI.

Extract plant filters from the user's message.

Return ONLY valid JSON.

Possible category:
- indoor
- outdoor
- flowering
- succulent

Possible care:
- low
- medium
- high

Possible size:
- small
- medium
- large

Examples:

User:
I need plants above 100.

Response:
{{
  "category":"",
  "care":"",
  "size":"",
  "minPrice":"100",
  "maxPrice":"",
  "search":""
}}

User:
Show plants under 500.

Response:
{{
  "category":"",
  "care":"",
  "size":"",
  "minPrice":"",
  "maxPrice":"500",
  "search":""
}}

User:
I travel a lot.

Response:
{{
  "category":"",
  "care":"low",
  "size":"",
  "minPrice":"",
  "maxPrice":"",
  "search":""
}}

Return ONLY the JSON object.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview",
            contents=prompt
        )

        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()

        match = re.search(r"\{.*\}", text, re.DOTALL)

        if match:
            return json.loads(match.group())

    except Exception as e:
        print("Gemini Error:", e)

    # -------------------------
    # Fallback
    # -------------------------

    q = query.lower()

    filters = {
        "category": "",
        "care": "",
        "size": "",
        "minPrice": "",
        "maxPrice": "",
        "search": ""
    }

    # Price filters
    above = re.search(r"(above|over|greater than|more than)\s+(\d+)", q)
    if above:
        filters["minPrice"] = above.group(2)

    below = re.search(r"(below|under|less than)\s+(\d+)", q)
    if below:
        filters["maxPrice"] = below.group(2)

    # Category
    if "indoor" in q:
        filters["category"] = "indoor"

    elif "outdoor" in q:
        filters["category"] = "outdoor"

    elif "flower" in q:
        filters["category"] = "flowering"

    elif "succulent" in q:
        filters["category"] = "succulent"

    # Care
    if any(word in q for word in [
        "travel",
        "less water",
        "low water",
        "don't water",
        "does not need water",
        "no water",
        "easy",
        "low maintenance"
    ]):
        filters["care"] = "low"

    # Size
    if "small" in q:
        filters["size"] = "small"

    elif "medium" in q:
        filters["size"] = "medium"

    elif "large" in q:
        filters["size"] = "large"

    return filters