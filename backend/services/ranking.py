from math import asin, cos, radians, sin, sqrt
from typing import Any


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0088
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return 2 * radius_km * asin(sqrt(a))


def _lower_is_better(value: float, minimum: float, maximum: float) -> float:
    return 1.0 if maximum == minimum else 1.0 - ((value - minimum) / (maximum - minimum))


def rank_spaces(spaces: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not spaces:
        return []
    distances = [float(space["distance_km"]) for space in spaces]
    prices = [float(space["price_per_day"]) for space in spaces]
    for space in spaces:
        convenience = sum(bool(space.get(feature)) for feature in ("lighting", "cctv", "covered"))
        convenience += bool((space.get("owner") or {}).get("verified_owner"))
        score = (
            0.35 * _lower_is_better(float(space["distance_km"]), min(distances), max(distances))
            + 0.30 * _lower_is_better(float(space["price_per_day"]), min(prices), max(prices))
            + 0.20 * (float(space.get("average_rating", 0)) / 5)
            + 0.15 * (convenience / 4)
        )
        space["recommendation_score"] = round(score * 100, 2)

    spaces.sort(key=lambda item: (-item["recommendation_score"], item["distance_km"], float(item["price_per_day"])))
    for space in spaces:
        space["label"] = "Best Value"
    spaces[0]["label"] = "Best Overall"

    label_rules = (
        ("Cheapest", lambda item: (float(item["price_per_day"]), item["distance_km"])),
        ("Closest", lambda item: (item["distance_km"], float(item["price_per_day"]))),
        ("Highest Rated", lambda item: (-float(item.get("average_rating", 0)), -int(item.get("review_count", 0)))),
    )
    labelled_ids = {spaces[0]["id"]}
    for label, key in label_rules:
        candidate = min(spaces, key=key)
        if candidate["id"] not in labelled_ids and (label != "Highest Rated" or candidate.get("review_count", 0) > 0):
            candidate["label"] = label
            labelled_ids.add(candidate["id"])
    return spaces
