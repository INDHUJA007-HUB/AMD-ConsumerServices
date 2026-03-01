import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np
from PIL import Image
import requests
from io import BytesIO
import base64
import json
import re

# Hugging Face Transformers – CLIP zero-shot image classification
from transformers import CLIPProcessor, CLIPModel

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("VITE_GROQ_API_KEY", "")
MAPILLARY_TOKEN = os.environ.get("VITE_MAPILLARY_TOKEN", "YOUR_MAPILLARY_TOKEN_HERE")

print("Loading CLIP model from Hugging Face...")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(DEVICE)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print(f"CLIP model loaded on {DEVICE}")

# ─────────────────────────────────────────────────────────────
# Place type labels for zero-shot classification
# ─────────────────────────────────────────────────────────────
PLACE_LABELS = [
    "park with trees and greenery",
    "waterfall or river in nature",
    "cafe or coffee shop",
    "restaurant or dining place",
    "shopping mall or large retail store",
    "pub or bar nightlife",
    "club or nightclub with music",
    "historic building or heritage site",
    "temple or place of worship",
    "market or street bazaar",
    "beach or lakeside",
    "school or college campus",
    "hospital or medical facility",
    "residential neighborhood with houses",
    "urban street with shops",
    "sports complex or stadium"
]

LABEL_KEYS = [
    "park", "waterfall", "cafe", "restaurant", "mall",
    "pub", "club", "heritage", "temple", "market",
    "lake", "education", "hospital", "residential", "street", "sports"
]

# Emoji for each type
LABEL_EMOJI = {
    "park": "🌳", "waterfall": "💧", "cafe": "☕", "restaurant": "🍽️",
    "mall": "🛍️", "pub": "🍺", "club": "🎵", "heritage": "🏛️",
    "temple": "🛕", "market": "🏪", "lake": "🌊", "education": "🎓",
    "hospital": "🏥", "residential": "🏘️", "street": "🏙️", "sports": "🏟️"
}

# ─────────────────────────────────────────────────────────────
# Curated Coimbatore places database, keyed by place type
# Each place has: name, area, description, coordinates (lng, lat),
# mapillary_bbox for fetching a nearby street-level image
# ─────────────────────────────────────────────────────────────
COIMBATORE_PLACES = {
    "park": [
        {
            "name": "VOC Park & Zoo",
            "area": "Town Hall",
            "description": "A serene public park in the heart of Coimbatore, home to a zoo, boating lake, and lush greenery. Perfect for morning walks and family outings.",
            "coordinates": [76.9617, 11.0025],
            "image_query_bbox": "76.960,11.001,76.963,11.004"
        },
        {
            "name": "Singanallur Lake & Bird Sanctuary",
            "area": "Singanallur",
            "description": "A stunning urban lake teeming with migratory birds. The morning mist and tranquil water make it a photographer's paradise and nature lover's retreat.",
            "coordinates": [77.015, 10.995],
            "image_query_bbox": "77.012,10.992,77.018,10.998"
        },
        {
            "name": "GD Naidu Halls & Garden",
            "area": "Race Course",
            "description": "Beautifully maintained park and garden near Race Course, a favourite spot for evening walks among Coimbatore's upscale residents.",
            "coordinates": [76.978, 11.001],
            "image_query_bbox": "76.976,10.999,76.980,11.003"
        }
    ],
    "waterfall": [
        {
            "name": "Siruvani Waterfalls",
            "area": "Anaimalai Hills (40 km)",
            "description": "One of India's sweetest tasting natural springs, surrounded by dense forests and tribal villages. A stunning day trip from Coimbatore.",
            "coordinates": [76.733, 10.858],
            "image_query_bbox": "76.730,10.855,76.736,10.861"
        },
        {
            "name": "Monkey Falls",
            "area": "Valparai (70 km)",
            "description": "A picturesque waterfall cascading through lush tea estate greenery, popular for refreshing swims and scenic drives through the Nilgiris.",
            "coordinates": [76.905, 10.580],
            "image_query_bbox": "76.902,10.577,76.908,10.583"
        },
        {
            "name": "Kovai Kutralam Falls",
            "area": "Marudhamalai",
            "description": "A smaller seasonal waterfall within Coimbatore city, popular during monsoon months for its cool mist and forest surroundings.",
            "coordinates": [76.970, 11.075],
            "image_query_bbox": "76.967,11.072,76.973,11.078"
        }
    ],
    "cafe": [
        {
            "name": "Brewberrys Café",
            "area": "RS Puram",
            "description": "A cozy specialty coffee café with artisan brews, wooden interiors, and a relaxed atmosphere loved by Coimbatore's young professional crowd.",
            "coordinates": [76.961, 10.990],
            "image_query_bbox": "76.959,10.988,76.963,10.992"
        },
        {
            "name": "Café Coffee Day – RS Puram",
            "area": "RS Puram",
            "description": "The iconic Indian café chain with free WiFi, iced coffees, and snacks. A meeting point for students and professionals in Coimbatore's upscale belt.",
            "coordinates": [76.958, 10.989],
            "image_query_bbox": "76.956,10.987,76.960,10.991"
        },
        {
            "name": "Random Café",
            "area": "Peelamedu",
            "description": "A hip café near PSG Tech with creative menu items, board games, and an artistic vibe. Popular with college students and tech workers alike.",
            "coordinates": [77.003, 11.026],
            "image_query_bbox": "77.001,11.024,77.005,11.028"
        }
    ],
    "restaurant": [
        {
            "name": "Hotel Annapoorna",
            "area": "Gandhipuram",
            "description": "An iconic Coimbatore institution serving authentic Tamil Nadu meals since 1955. The ghee-laden idlis and filter coffee are legendary among locals.",
            "coordinates": [76.968, 11.017],
            "image_query_bbox": "76.966,11.015,76.970,11.019"
        },
        {
            "name": "Sree Annapoorna Gowrishankar",
            "area": "Gandhipuram",
            "description": "A beloved vegetarian restaurant famous for its Coimbatore-style sadhya meals, unique spice blends, and affordable prices that draw queues daily.",
            "coordinates": [76.969, 11.018],
            "image_query_bbox": "76.967,11.016,76.971,11.020"
        },
        {
            "name": "Kovai Kitchen",
            "area": "Race Course",
            "description": "A contemporary Tamil restaurant blending traditional recipes with modern presentation. Their Chettinad biryani and coastal fish curries are must-tries.",
            "coordinates": [76.977, 11.001],
            "image_query_bbox": "76.975,10.999,76.979,11.003"
        }
    ],
    "mall": [
        {
            "name": "Brookefields Mall",
            "area": "Hopes / IT Corridor",
            "description": "Coimbatore's premier shopping destination with international brands, a multiplex cinema, food court, and a buzzing weekend crowd.",
            "coordinates": [77.017, 11.020],
            "image_query_bbox": "77.015,11.018,77.019,11.022"
        },
        {
            "name": "Fun City Mall",
            "area": "Peelamedu",
            "description": "A mid-range shopping mall popular with families, featuring gaming zones, restaurants, and fashion outlets near the airport road.",
            "coordinates": [77.005, 11.025],
            "image_query_bbox": "77.003,11.023,77.007,11.027"
        },
        {
            "name": "DB Mall & Commercial Complex",
            "area": "Race Course",
            "description": "An elegant shopping complex in Coimbatore's upscale Race Course area, known for boutique outlets and gourmet dining options.",
            "coordinates": [76.979, 11.000],
            "image_query_bbox": "76.977,10.998,76.981,11.002"
        }
    ],
    "pub": [
        {
            "name": "Social – Coimbatore",
            "area": "Saravanampatti",
            "description": "A trendy gastropub with craft beers, live music nights, and an industrial-chic interior. A favourite among Coimbatore's IT crowd for after-work drinks.",
            "coordinates": [77.078, 11.080],
            "image_query_bbox": "77.076,11.078,77.080,11.082"
        },
        {
            "name": "The Irish Rover",
            "area": "RS Puram",
            "description": "A cozy British-style pub with imported beers, a darts board, and an upscale crowd. Known for its comfort food menu and weekend live bands.",
            "coordinates": [76.960, 10.991],
            "image_query_bbox": "76.958,10.989,76.962,10.993"
        }
    ],
    "club": [
        {
            "name": "Club Pyramid",
            "area": "Saravanampatti",
            "description": "Coimbatore's top nightclub with a rooftop dance floor, DJ nights, and stunning city skyline views. The go-to spot for late-night dancing.",
            "coordinates": [77.079, 11.079],
            "image_query_bbox": "77.077,11.077,77.081,11.081"
        },
        {
            "name": "Illusions Bar & Lounge",
            "area": "Race Course",
            "description": "An upscale lounge bar blending live jazz performances with crafted cocktails in an elegant setting. A sophisticated choice for Coimbatore nightlife.",
            "coordinates": [76.980, 11.002],
            "image_query_bbox": "76.978,11.000,76.982,11.004"
        }
    ],
    "heritage": [
        {
            "name": "Marudhamalai Murugan Temple",
            "area": "Marudhamalai",
            "description": "A stunning Dravidian-style hilltop temple dedicated to Lord Murugan, offering panoramic views of Coimbatore city and the Western Ghats.",
            "coordinates": [76.970, 11.075],
            "image_query_bbox": "76.968,11.073,76.972,11.077"
        },
        {
            "name": "GD Naidu Museum",
            "area": "Race Course",
            "description": "A fascinating heritage museum showcasing inventions and life of Coimbatore's legendary industrialist GD Naidu, housed in a beautifully preserved colonial building.",
            "coordinates": [76.978, 11.001],
            "image_query_bbox": "76.976,10.999,76.980,11.003"
        }
    ],
    "temple": [
        {
            "name": "Perur Pateeswarar Temple",
            "area": "Perur (8 km west)",
            "description": "One of Coimbatore's most ancient and magnificent temples, dedicated to Lord Shiva. The exquisite stone carvings date back to the Chola dynasty.",
            "coordinates": [76.912, 11.002],
            "image_query_bbox": "76.910,11.000,76.914,11.004"
        },
        {
            "name": "Arulmigu Eachanari Vinayakar Temple",
            "area": "Eachanari",
            "description": "A revered Ganesha temple known for its giant idol and vibrant festival celebrations. A peaceful spiritual retreat on the outskirts of Coimbatore.",
            "coordinates": [77.023, 10.993],
            "image_query_bbox": "77.021,10.991,77.025,10.995"
        }
    ],
    "market": [
        {
            "name": "Gandhipuram Textile Market",
            "area": "Gandhipuram",
            "description": "Coimbatore's bustling textile hub with hundreds of fabric shops, tailoring units, and wholesale dealers. A paradise for saree and apparel shopping.",
            "coordinates": [76.969, 11.017],
            "image_query_bbox": "76.967,11.015,76.971,11.019"
        },
        {
            "name": "RS Puram Weekly Market",
            "area": "RS Puram",
            "description": "A lively neighbourhood market selling fresh vegetables, flowers, snacks, and household items. An authentic Coimbatore local experience.",
            "coordinates": [76.959, 10.991],
            "image_query_bbox": "76.957,10.989,76.961,10.993"
        }
    ],
    "lake": [
        {
            "name": "Ukkadam (Periyakulam) Lake",
            "area": "Ukkadam",
            "description": "A large picturesque urban lake in central Coimbatore with a walking track, boat rides, and seasonal migratory birds. A beloved recreational spot.",
            "coordinates": [76.958, 10.998],
            "image_query_bbox": "76.955,10.995,76.961,11.001"
        },
        {
            "name": "Krishnampathy Lake",
            "area": "Saravanampatti",
            "description": "A quiet lake surrounded by residential areas in Coimbatore's tech corridor, popular among joggers and evening walkers seeking calm and fresh air.",
            "coordinates": [77.076, 11.076],
            "image_query_bbox": "77.073,11.073,77.079,11.079"
        }
    ],
    "education": [
        {
            "name": "PSG College of Technology",
            "area": "Peelamedu",
            "description": "One of South India's most prestigious engineering colleges, with a sprawling tree-lined campus, cutting-edge labs, and a vibrant student community.",
            "coordinates": [77.004, 11.026],
            "image_query_bbox": "77.002,11.024,77.006,11.028"
        },
        {
            "name": "Amrita Institute of Medical Sciences",
            "area": "Peelamedu",
            "description": "A world-class medical campus with a teaching hospital, beautiful landscaped grounds, and a serene academic atmosphere.",
            "coordinates": [77.006, 11.025],
            "image_query_bbox": "77.004,11.023,77.008,11.027"
        }
    ],
    "hospital": [
        {
            "name": "PSG Hospitals",
            "area": "Peelamedu",
            "description": "A multi-specialty hospital connected to PSG Medical College, offering modern facilities across 30+ departments. Coimbatore's leading healthcare institution.",
            "coordinates": [77.007, 11.027],
            "image_query_bbox": "77.005,11.025,77.009,11.029"
        },
        {
            "name": "Kovai Medical Center & Hospital (KMCH)",
            "area": "Avinashi Road",
            "description": "One of South India's premium private hospitals, offering world-class care with over 1000 beds and advanced surgical facilities.",
            "coordinates": [77.025, 11.018],
            "image_query_bbox": "77.023,11.016,77.027,11.020"
        }
    ],
    "residential": [
        {
            "name": "Race Course Residential Boulevard",
            "area": "Race Course",
            "description": "A premium tree-lined residential area with wide roads, colonial-era bungalows, and high-rise apartments. Coimbatore's most sought-after address.",
            "coordinates": [76.978, 11.001],
            "image_query_bbox": "76.975,10.998,76.981,11.004"
        },
        {
            "name": "Vadavalli Hillside Villas",
            "area": "Vadavalli",
            "description": "Peaceful residential neighbourhood at the foothills of the Western Ghats, offering clean air, natural scenery, and a serene lifestyle.",
            "coordinates": [76.898, 11.030],
            "image_query_bbox": "76.895,11.027,76.901,11.033"
        }
    ],
    "street": [
        {
            "name": "Brookebond Road Commercial Strip",
            "area": "RS Puram",
            "description": "A vibrant commercial street lined with boutiques, banks, and cafes. The heart of RS Puram's upscale shopping and dining scene.",
            "coordinates": [76.961, 10.990],
            "image_query_bbox": "76.959,10.988,76.963,10.992"
        },
        {
            "name": "Big Bazaar Street, Gandhipuram",
            "area": "Gandhipuram",
            "description": "A bustling urban shopping street filled with textile shops, electronics stores, and street food vendors — the pulse of Coimbatore's commercial life.",
            "coordinates": [76.969, 11.018],
            "image_query_bbox": "76.967,11.016,76.971,11.020"
        }
    ],
    "sports": [
        {
            "name": "CODISSIA Sports Ground",
            "area": "Saravanampatty",
            "description": "A large sports and recreational complex managed by Coimbatore District Small Industries Association, hosting cricket tournaments and trade exhibitions.",
            "coordinates": [77.073, 11.073],
            "image_query_bbox": "77.071,11.071,77.075,11.075"
        },
        {
            "name": "JSS Indoor Stadium",
            "area": "Peelamedu",
            "description": "A modern multi-purpose indoor stadium hosting badminton, basketball, and boxing events. A hub for Coimbatore's sporting talent.",
            "coordinates": [77.003, 11.027],
            "image_query_bbox": "77.001,11.025,77.005,11.029"
        }
    ]
}


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
def fetch_mapillary_image(bbox_str: str) -> str | None:
    """Fetch one Mapillary street-level image URL for a bounding box."""
    try:
        parts = [float(x) for x in bbox_str.split(",")]
        url = "https://graph.mapillary.com/images"
        params = {
            "access_token": MAPILLARY_TOKEN,
            "fields": "id,thumb_1024_url",
            "bbox": f"{parts[0]},{parts[1]},{parts[2]},{parts[3]}",
            "limit": 1
        }
        resp = requests.get(url, params=params, timeout=5)
        data = resp.json().get("data", [])
        if data and data[0].get("thumb_1024_url"):
            return data[0]["thumb_1024_url"]
    except Exception as e:
        print(f"Mapillary error: {e}")
    return None


def classify_place_clip(pil_image: Image.Image) -> list[dict]:
    """
    Run Hugging Face CLIP zero-shot classification against PLACE_LABELS.
    Returns list of {label, key, score} sorted by descending score.
    """
    inputs = clip_processor(
        text=PLACE_LABELS,
        images=pil_image,
        return_tensors="pt",
        padding=True
    )
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = clip_model(**inputs)
        logits = outputs.logits_per_image[0]   # shape: (num_labels,)
        probs = logits.softmax(dim=0).cpu().numpy()

    results = []
    for i, (label, key, prob) in enumerate(zip(PLACE_LABELS, LABEL_KEYS, probs)):
        results.append({
            "label": label,
            "key": key,
            "score": float(prob)
        })
    return sorted(results, key=lambda x: x["score"], reverse=True)


def call_groq_explain(place_type: str, place_name: str, place_area: str,
                      place_desc: str, match_pct: int, user_description: str) -> str:
    """Call Groq to generate a short explanation of why place matches the image."""
    try:
        payload = {
            "model": "llama-3.1-8b-instant",
            "temperature": 0.6,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a Coimbatore travel guide. Write a short, warm, "
                        "enthusiastic explanation (2-3 sentences max) of why a specific "
                        "Coimbatore location matches what someone saw in their photo. "
                        "Be specific, human, and make them excited to visit. No markdown."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"The user uploaded a photo that looks like: {user_description}\n"
                        f"Place type detected: {place_type}\n"
                        f"Matched Coimbatore place: {place_name} in {place_area}\n"
                        f"About the place: {place_desc}\n"
                        f"Match score: {match_pct}%\n\n"
                        "Write a 2-3 sentence explanation of why this place is a great match!"
                    )
                }
            ]
        }
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=8
        )
        if resp.status_code == 200:
            text = resp.json()["choices"][0]["message"]["content"].strip()
            return re.sub(r'\*+', '', text)  # strip any markdown bold
    except Exception as e:
        print(f"Groq error: {e}")
    return f"{place_name} in {place_area} is a wonderful match for your photo's vibe!"


# ─────────────────────────────────────────────────────────────
# New endpoint: /api/place-classify
# ─────────────────────────────────────────────────────────────
@app.route('/api/place-classify', methods=['POST'])
def place_classify():
    try:
        payload = request.json or {}
        images_b64 = payload.get('images', [])
        if not images_b64:
            return jsonify({"error": "No images provided"}), 400

        # ── Aggregate CLIP scores across all uploaded images ──
        all_classifications = []
        pil_images = []

        for img_b64 in images_b64:
            try:
                raw = img_b64.split(',')[1] if ',' in img_b64 else img_b64
                pil_img = Image.open(BytesIO(base64.b64decode(raw))).convert("RGB")
                pil_images.append(pil_img)
                classifications = classify_place_clip(pil_img)
                all_classifications.append(classifications)
            except Exception as e:
                print(f"Image decode error: {e}")

        if not all_classifications:
            return jsonify({"error": "Could not process any images"}), 400

        # Average the scores across all images
        avg_scores: dict[str, float] = {}
        for cls_list in all_classifications:
            for item in cls_list:
                avg_scores[item["key"]] = avg_scores.get(item["key"], 0) + item["score"]
        for k in avg_scores:
            avg_scores[k] /= len(all_classifications)

        # Top detected place type
        sorted_types = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
        top_key = sorted_types[0][0]
        top_conf = sorted_types[0][1]

        # Human-readable label for top type
        top_label = PLACE_LABELS[LABEL_KEYS.index(top_key)]
        user_description = top_label  # used for Groq prompt

        # ── Match Coimbatore places ──
        places = COIMBATORE_PLACES.get(top_key, [])

        # If no places for top key, try second best
        if not places and len(sorted_types) > 1:
            second_key = sorted_types[1][0]
            places = COIMBATORE_PLACES.get(second_key, [])
            top_key = second_key
            top_conf = sorted_types[1][1]
            top_label = PLACE_LABELS[LABEL_KEYS.index(top_key)]

        # Build match results with scores and images
        matched = []
        for i, place in enumerate(places[:3]):
            # Compute a pseudo match score: based on CLIP top conf + rank decay
            rank_decay = max(0.80, 1.0 - i * 0.07)
            match_pct = int(min(99, top_conf * 100 * rank_decay * 1.3))
            match_pct = max(match_pct, 55)   # minimum floor so results feel meaningful

            # Fetch Mapillary street image
            image_url = fetch_mapillary_image(place["image_query_bbox"])

            # Generate Groq explanation
            explanation = call_groq_explain(
                place_type=top_label,
                place_name=place["name"],
                place_area=place["area"],
                place_desc=place["description"],
                match_pct=match_pct,
                user_description=user_description
            )

            matched.append({
                "name": place["name"],
                "area": place["area"],
                "description": place["description"],
                "coordinates": place["coordinates"],
                "mapillary_image": image_url,
                "match_pct": match_pct,
                "why_match": explanation
            })

        return jsonify({
            "detected_type": {
                "key": top_key,
                "label": top_label,
                "emoji": LABEL_EMOJI.get(top_key, "📍"),
                "confidence": round(top_conf * 100, 1),
                "all_scores": [
                    {"key": k, "emoji": LABEL_EMOJI.get(k, "📍"), "score": round(v * 100, 1)}
                    for k, v in sorted_types[:5]
                ]
            },
            "matched_places": matched
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────
# Keep the original neighborhood vibe-match endpoint running
# (kept for backward compatibility)
# ─────────────────────────────────────────────────────────────
@app.route('/api/vibe-match', methods=['POST'])
def vibe_match():
    """Backward-compat endpoint that now proxies to place-classify."""
    return place_classify()


if __name__ == '__main__':
    print(f"Vibe Match API starting on {DEVICE}")
    print("Endpoints: /api/place-classify  /api/vibe-match")
    app.run(host='0.0.0.0', port=5000, debug=False)
