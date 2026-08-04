from services.knowledge_base import KNOWLEDGE


class RankingEngine:
    """
    Scores every plant based on:
    - User query
    - Knowledge Base
    - Plant metadata
    """

    def score(self, query: str, plant):

        query = query.lower()

        score = 0

        # Support both dicts and objects
        if isinstance(plant, dict):
            name = plant.get("name", "").lower()
            category = plant.get("category", "").lower()
            care = plant.get("care", "").lower()
            description = plant.get("description", "").lower()
        else:
            name = plant.name.lower()
            category = plant.category.lower()
            care = plant.care.lower()
            description = plant.description.lower()

        # -------------------------
        # Direct Matches
        # -------------------------

        if name in query:
            score += 50

        if category in query:
            score += 30

        if care in query:
            score += 20

        # -------------------------
        # Description Match
        # -------------------------

        for word in query.split():
            if word in description:
                score += 3

        # -------------------------
        # Knowledge Base Match
        # -------------------------

        for rule in KNOWLEDGE.values():

            matched = any(
                keyword in query
                for keyword in rule["keywords"]
            )

            if not matched:
                continue

            if rule.get("category") == category:
                score += 25

            if rule.get("care") == care:
                score += 15

        return score