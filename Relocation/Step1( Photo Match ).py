import requests
import json
from typing import List, Dict
import time

MAPILLARY_ACCESS_TOKEN = "YOUR_MAPILLARY_API_KEY"

NEIGHBORHOODS = {
    "RS Puram":        {"west": 76.953, "south": 10.985, "east": 76.965, "north": 10.997},
    "Saravanampatti":  {"west": 77.069, "south": 11.070, "east": 77.090, "north": 11.090},
    "Gandhipuram":     {"west": 76.960, "south": 11.010, "east": 76.975, "north": 11.022},
    "Race Course":     {"west": 76.971, "south": 10.995, "east": 76.985, "north": 11.006},
    "Ganapathy":       {"west": 76.945, "south": 11.020, "east": 76.960, "north": 11.035},
}

def fetch_images_in_bbox(bbox: Dict, max_images: int = 200) -> List[Dict]:
    """
    Fetch image metadata within a bounding box using Mapillary Graph API v4.
    Returns a list of image records with id, coordinates, and thumbnail URL.
    """
    url = "https://graph.mapillary.com/images"
    params = {
        "access_token": MAPILLARY_ACCESS_TOKEN,
        "fields": "id,thumb_1024_url,geometry,captured_at,compass_angle",
        "bbox": f"{bbox['west']},{bbox['south']},{bbox['east']},{bbox['north']}",
        "limit": 2000,  # API max per page
    }

    images = []
    while url and len(images) < max_images:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        for feature in data.get("data", []):
            if feature.get("thumb_1024_url"):
                images.append({
                    "id":           feature["id"],
                    "url":          feature["thumb_1024_url"],
                    "lat":          feature["geometry"]["coordinates"][1],
                    "lng":          feature["geometry"]["coordinates"][0],
                    "captured_at":  feature.get("captured_at"),
                    "compass_angle": feature.get("compass_angle"),
                })
        
        # Handle pagination
        pagination = data.get("paging", {})
        url = pagination.get("next")
        params = {}  # next URL is fully-formed; clear params to avoid duplication
        time.sleep(0.2)  # Respect rate limits

    return images[:max_images]


# Fetch for all neighborhoods
all_neighborhood_images = {}
for name, bbox in NEIGHBORHOODS.items():
    print(f"Fetching images for {name}...")
    imgs = fetch_images_in_bbox(bbox, max_images=150)
    all_neighborhood_images[name] = imgs
    print(f"  → Found {len(imgs)} images")