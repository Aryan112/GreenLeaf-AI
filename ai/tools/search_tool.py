class SearchTool:
    """
    Searches plants using AI filters.
    """

    CATEGORY_MAP = {
        "indoor plants": "indoor",
        "outdoor plants": "outdoor",
        "flowering plants": "flowering",
        "succulents": "succulent",
        "succulent plants": "succulent"
    }

    def execute(self, plants, filters):

        results = plants

        category = filters.get("category", "").lower().strip()
        care = filters.get("care", "").lower().strip()
        size = filters.get("size", "").lower().strip()

        min_price = filters.get("minPrice")
        max_price = filters.get("maxPrice")

        # Normalize AI category names
        category = self.CATEGORY_MAP.get(category, category)

        if category:
            results = [
                p for p in results
                if (
                    p["category"].lower() == category
                    if isinstance(p, dict)
                    else p.category.lower() == category
                )
            ]

        if care:
            results = [
                p for p in results
                if (
                    p["care"].lower() == care
                    if isinstance(p, dict)
                    else p.care.lower() == care
                )
            ]

        if size:
            results = [
                p for p in results
                if (
                    p["size"].lower() == size
                    if isinstance(p, dict)
                    else p.size.lower() == size
                )
            ]

        if min_price:
            results = [
                p for p in results
                if (
                    float(p["price"]) >= float(min_price)
                    if isinstance(p, dict)
                    else float(p.price) >= float(min_price)
                )
            ]

        if max_price:
            results = [
                p for p in results
                if (
                    float(p["price"]) <= float(max_price)
                    if isinstance(p, dict)
                    else float(p.price) <= float(max_price)
                )
            ]

        print(f"🔍 Search Tool Found {len(results)} plants")

        return results