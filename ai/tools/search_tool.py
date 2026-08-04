class SearchTool:
    """
    Searches plants using AI filters.
    """

    def execute(self, plants, filters):

        results = plants

        category = filters.get("category", "")
        care = filters.get("care", "")

        if category:
            results = [
                p for p in results
                if (
                    p["category"].lower() == category.lower()
                    if isinstance(p, dict)
                    else p.category.lower() == category.lower()
                )
            ]

        if care:
            results = [
                p for p in results
                if (
                    p["care"].lower() == care.lower()
                    if isinstance(p, dict)
                    else p.care.lower() == care.lower()
                )
            ]

        print(f"🔍 Search Tool Found {len(results)} plants")

        return results