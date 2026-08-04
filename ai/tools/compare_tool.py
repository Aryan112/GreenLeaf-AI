class CompareTool:
    """
    Compare two plants.
    """

    def execute(self, plants, first_name, second_name):

        first = None
        second = None

        for plant in plants:

            if isinstance(plant, dict):

                name = plant["name"].lower()

            else:

                name = plant.name.lower()

            if first_name.lower() in name:
                first = plant

            if second_name.lower() in name:
                second = plant

        if not first or not second:
            return None

        def value(p, key):

            if isinstance(p, dict):
                return p.get(key, "")

            return getattr(p, key)

        return {

            "plant1": {

                "name": value(first, "name"),
                "category": value(first, "category"),
                "care": value(first, "care"),
                "description": value(first, "description")

            },

            "plant2": {

                "name": value(second, "name"),
                "category": value(second, "category"),
                "care": value(second, "care"),
                "description": value(second, "description")

            }

        }