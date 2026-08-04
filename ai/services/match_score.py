class MatchScore:

    def calculate(self, query, plant):

        score = 50

        query = query.lower()

        if isinstance(plant, dict):

            category = plant.get("category", "").lower()
            care = plant.get("care", "").lower()
            description = plant.get("description", "").lower()

        else:

            category = plant.category.lower()
            care = plant.care.lower()
            description = plant.description.lower()

        # Category
        if category in query:
            score += 20

        # Care
        if care in query:
            score += 15

        # Description
        for word in query.split():
            if word in description:
                score += 2

        return min(score, 100)