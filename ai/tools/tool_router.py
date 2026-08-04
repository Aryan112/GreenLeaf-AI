class ToolRouter:
    """
    Routes the request to the correct tool.
    """

    def route(self, intent: str):

        routes = {

            "browse_all": "search",

            "browse_category": "search",

            "browse_filtered": "search",

            "recommend_plants": "recommend",

            "compare_plants": "compare",

            "plant_care": "care",

            "faq": "faq"

        }

        tool = routes.get(intent, "recommend")

        print(f"🛠 Selected Tool : {tool}")

        return tool