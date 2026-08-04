from typing import List


class Retriever:
    """
    Hybrid RAG Retriever (Version 1)

    Retrieves the most relevant plants before sending them
    to Gemini.
    """

    def retrieve(self, query: str, plants: List):
        query = query.lower()

        scored = []

        for plant in plants:

            score = 0

            name = plant.name.lower()
            category = plant.category.lower()
            care = plant.care.lower()
            description = plant.description.lower()

            # Exact name match
            if name in query:
                score += 15

            # Category match
            if category in query:
                score += 10

            # Care match
            if care in query:
                score += 8

            # Keyword match
            for word in query.split():
                if word in description:
                    score += 2

            scored.append((score, plant))

        scored.sort(key=lambda x: x[0], reverse=True)

        # Return Top 10
        return [plant for score, plant in scored[:10]]