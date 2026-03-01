from typing import List, Dict, Any, Tuple
import math
import json
import os
import glob

# Lightweight heuristic embedding for MVP (8 dims)
# d0: social_pace (0..1)
# d1: career_stage (0..1)
# d2: industry_techiness (0..1)
# d3: outdoors affinity
# d4: cafes/coffee culture
# d5: nightlife
# d6: family vibe
# d7: transit friendliness

def _career_to_scalar(stage: str) -> float:
    mapping = {"student": 0.15, "early": 0.35, "mid": 0.65, "senior": 0.9}
    return mapping.get(stage, 0.5)

def _industry_to_scalar(industry: str) -> float:
    return 0.9 if industry == "tech" else 0.6 if industry in {"finance", "manufacturing"} else 0.4

def _weekend_to_vector(weekend: str) -> Tuple[float, float, float, float]:
    # outdoors, cafes, nightlife, family
    if weekend == "outdoors":
        return (0.9, 0.4, 0.2, 0.5)
    if weekend == "cafes":
        return (0.4, 0.9, 0.3, 0.5)
    if weekend == "nightlife":
        return (0.2, 0.5, 0.9, 0.3)
    # family
    return (0.5, 0.4, 0.2, 0.9)

def _commute_to_scalar(mode: str) -> float:
    # proxy for transit friendliness preference
    mapping = {"bus": 0.9, "bike": 0.6, "walk": 0.7, "car": 0.3}
    return mapping.get(mode, 0.5)

def _hobbies_to_modifiers(hobbies: List[str]) -> Dict[str, float]:
    mods: Dict[str, float] = {"outdoors": 0.0, "cafes": 0.0, "nightlife": 0.0, "family": 0.0}
    for h in hobbies:
        h_low = h.lower()
        if h_low in {"cycling", "running", "hiking", "yoga"}:
            mods["outdoors"] += 0.1
        if h_low in {"coffee", "cafes", "art"}:
            mods["cafes"] += 0.1
        if h_low in {"nightlife", "music"}:
            mods["nightlife"] += 0.1
        if h_low in {"gaming"}:
            # neutral
            pass
    return mods

def embed_user(fp: Dict[str, Any]) -> List[float]:
    social = float(fp.get("social_pace", 0.5))
    career = _career_to_scalar(str(fp.get("career_stage", "mid")))
    industry = _industry_to_scalar(str(fp.get("industry", "other")))
    hobbies = fp.get("hobbies", []) or []
    weekend = str(fp.get("weekend_focus", "family"))
    commute = _commute_to_scalar(str(fp.get("commute_mode", "bus")))

    w_out, w_cafe, w_night, w_family = _weekend_to_vector(weekend)
    mods = _hobbies_to_modifiers(hobbies)

    outdoors = min(1.0, w_out + mods["outdoors"])
    cafes = min(1.0, w_cafe + mods["cafes"])
    nightlife = min(1.0, w_night + mods["nightlife"])
    family = min(1.0, w_family + mods["family"])

    vec = [social, career, industry, outdoors, cafes, nightlife, family, commute]
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]

# Neighborhood signatures (centroids) for MVP
NEIGHBORHOODS: Dict[str, Dict[str, Any]] = {}

def _try_load_from_datasets() -> Dict[str, Dict[str, Any]]:
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    ds_dir = os.path.join(base, "datasets")
    out: Dict[str, Dict[str, Any]] = {}
    if not os.path.isdir(ds_dir):
        return out
    for path in glob.glob(os.path.join(ds_dir, "*.geojson")):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            feats = data.get("features", [])
            for feat in feats:
                props = feat.get("properties", {}) or {}
                name = props.get("name")
                sig = props.get("vibe_signature")
                geom = feat.get("geometry", {})
                coords = None
                if geom and isinstance(geom, dict):
                    if geom.get("type") == "Point":
                        coords = tuple(geom.get("coordinates", [None, None])[::-1])  # lat, lon
                    elif geom.get("type") == "Polygon":
                        # take first coordinate as rough representative, for MVP
                        poly = geom.get("coordinates")
                        if isinstance(poly, list) and poly and isinstance(poly[0], list) and poly[0]:
                            lon, lat = poly[0][0]
                            coords = (lat, lon)
                if name and isinstance(sig, list) and coords:
                    out[name] = {"coords": coords, "vibe_signature": sig}
        except Exception:
            continue
    return out

# Fallback hardcoded set if datasets don't carry vibe_signature yet
_fallback = {
    "RS Puram": {
        "coords": (11.0045, 76.9618),
        "vibe_signature": [0.55, 0.6, 0.6, 0.6, 0.85, 0.35, 0.8, 0.6],
    },
    "Gandhipuram": {
        "coords": (10.9905, 76.9614),
        "vibe_signature": [0.8, 0.5, 0.6, 0.5, 0.7, 0.6, 0.5, 0.95],
    },
    "Ganapathy": {
        "coords": (11.0400, 76.9900),
        "vibe_signature": [0.6, 0.45, 0.5, 0.55, 0.5, 0.4, 0.6, 0.7],
    },
    "Race Course": {
        "coords": (10.9980, 76.9740),
        "vibe_signature": [0.45, 0.6, 0.5, 0.85, 0.55, 0.25, 0.8, 0.6],
    },
    "Saravanampatti": {
        "coords": (11.0176, 76.9552),
        "vibe_signature": [0.75, 0.4, 0.9, 0.6, 0.8, 0.5, 0.5, 0.8],
    },
}

# Initialize NEIGHBORHOODS with datasets if available, else fallback
NEIGHBORHOODS = _try_load_from_datasets() or _fallback

# Normalize neighborhood vectors
for k, v in NEIGHBORHOODS.items():
    vec = v["vibe_signature"]
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    v["vibe_signature"] = [x / norm for x in vec]

DIM_TAGS = ["social pace", "career stage", "tech scene", "outdoors", "cafés", "nightlife", "family vibe", "transit access"]

def cosine_distance(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    # both assumed normalized
    return 1.0 - max(min(dot, 1.0), -1.0)

def compatibility_score(u: List[float], v: List[float], beta: float = 3.0) -> float:
    dist = cosine_distance(u, v)
    sim = 1.0 - dist
    # squashed to 0..100
    from math import exp
    return 100.0 * (1.0 / (1.0 + exp(-beta * (sim - 0.5))))

def top_why(u: List[float], v: List[float], top_k: int = 3) -> List[str]:
    contributions = [(i, u[i] * v[i]) for i in range(len(u))]
    contributions.sort(key=lambda x: x[1], reverse=True)
    tags = []
    for i, _ in contributions[:top_k]:
        tags.append(_dim_to_phrase(i))
    return tags

def _dim_to_phrase(i: int) -> str:
    mapping = {
        0: "active social pace",
        1: "matching career stage peers",
        2: "strong tech scene",
        3: "outdoor-friendly",
        4: "vibrant cafés",
        5: "nightlife options",
        6: "family-friendly vibe",
        7: "excellent transit access",
    }
    return mapping.get(i, DIM_TAGS[i] if i < len(DIM_TAGS) else f"factor {i}")

def rank_neighborhoods(fp: Dict[str, Any]) -> List[Dict[str, Any]]:
    u = embed_user(fp)
    ranked = []
    for name, meta in NEIGHBORHOODS.items():
        v = meta["vibe_signature"]
        score = compatibility_score(u, v)
        why = top_why(u, v, top_k=3)
        lat, lon = meta["coords"]
        ranked.append({
            "neighborhood": name,
            "score": round(score, 1),
            "why": why,
            "coordinates": [lon, lat],
        })
    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked

def list_neighborhoods() -> List[Dict[str, Any]]:
    out = []
    for name, meta in NEIGHBORHOODS.items():
        lat, lon = meta["coords"]
        out.append({"name": name, "coordinates": [lon, lat], "signature_dim": len(meta["vibe_signature"])})
    return out
