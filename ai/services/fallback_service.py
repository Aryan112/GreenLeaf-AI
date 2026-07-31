# ai/services/fallback_service.py

import re


def fallback_filters(query: str) -> dict:

    q = query.lower()

    filters = {
        "category": "",
        "care": "",
        "size": "",
        "minPrice": "",
        "maxPrice": "",
        "search": ""
    }

    above = re.search(r"(above|over|greater than|more than)\s+(\d+)", q)
    if above:
        filters["minPrice"] = above.group(2)

    below = re.search(r"(below|under|less than)\s+(\d+)", q)
    if below:
        filters["maxPrice"] = below.group(2)

    if "indoor" in q:
        filters["category"] = "indoor"
    elif "outdoor" in q:
        filters["category"] = "outdoor"
    elif "flower" in q:
        filters["category"] = "flowering"
    elif "succulent" in q:
        filters["category"] = "succulent"

    if any(word in q for word in [
        "travel",
        "less water",
        "low maintenance",
        "easy"
    ]):
        filters["care"] = "easy"

    if "small" in q:
        filters["size"] = "small"
    elif "medium" in q:
        filters["size"] = "medium"
    elif "large" in q:
        filters["size"] = "large"

    return filters