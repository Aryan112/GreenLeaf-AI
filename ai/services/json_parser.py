# ai/services/json_parser.py

import json
import re


def extract_json(text: str) -> dict:
    """
    Extract JSON from Gemini response.
    """

    text = text.replace("```json", "").replace("```", "").strip()

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if not match:
        raise ValueError("No JSON found")

    return json.loads(match.group())