from services.match_score import MatchScore

class RecommendationExplainer:
    def __init__(self):
      self.scorer = MatchScore()
    """
    Generates human-friendly reasons
    for every recommended plant.
    """

    def explain(self, plant):

        if isinstance(plant, dict):

            category = plant.get("category", "")
            care = plant.get("care", "")
            name = plant.get("name", "")

        else:

            category = plant.category
            care = plant.care
            name = plant.name

        reasons = []

        # Category
        if category == "indoor":
            reasons.append("Excellent for indoor spaces.")

        elif category == "outdoor":
            reasons.append("Ideal for outdoor gardens and balconies.")

        elif category == "flowering":
            reasons.append("Produces beautiful flowers.")

        elif category == "succulent":
            reasons.append("Stores water and needs less maintenance.")

        # Care
        if care == "easy":
            reasons.append("Beginner friendly.")

        elif care == "moderate":
            reasons.append("Requires moderate care.")

        elif care == "expert":
            reasons.append("Best suited for experienced plant lovers.")

        return {

    "plant": name,

    "match_score": self.scorer.calculate(
        "",
        plant
    ),

    "reasons": reasons
}