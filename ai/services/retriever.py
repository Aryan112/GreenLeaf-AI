from typing import List

from services.ranking import RankingEngine


class Retriever:

    def __init__(self):
        self.ranker = RankingEngine()

    def retrieve(self, query: str, plants: List):
        """
        Hybrid RAG Retriever

        Uses the Ranking Engine to score every plant
        and returns the Top 10.
        """

        scored = []

        for plant in plants:

            score = self.ranker.score(
                query,
                plant
            )

            scored.append(
                (score, plant)
            )

        scored.sort(
            key=lambda x: x[0],
            reverse=True
        )

        print("\n========== RAG Retrieval ==========")

        for score, plant in scored[:10]:

            if isinstance(plant, dict):
                print(
                    f"{plant['name']}  ---> Score: {score}"
                )
            else:
                print(
                    f"{plant.name}  ---> Score: {score}"
                )

        print("===================================\n")

        return [
            plant
            for score, plant in scored[:10]
        ]