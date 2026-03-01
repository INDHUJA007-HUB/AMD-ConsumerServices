# Photo-to-Vibe Matching API Setup

## Installation

1. Install Python dependencies:
```bash
cd api
pip install -r requirements.txt
```

Note: This will install the latest compatible versions including DeepLabV3 for semantic segmentation.

2. Start the API server:
```bash
python vibe_match_api.py
```

The API will run on `http://localhost:5000`

## How It Works - Phase B Implementation

### Step 1: Semantic Segmentation (The "Constituents")
Uses DeepLabV3 ResNet50 to calculate pixel percentages:
- **Greenery**: High % = "Nature Vibe" (Race Course)
- **Road/Concrete**: High % = "Urban/IT Vibe" (Saravanampatti)
- **Buildings**: Detects architectural density

### Step 2: Global Feature Extraction (The "Atmosphere")
CLIP model extracts abstract concepts:
- Lighting (warm/sunset vs harsh/fluorescent)
- Density (crowded vs empty)
- Architectural style

### Step 3: The Matching Logic (The "Fusion")
Merges multiple images into one "Intent Vector":
```
V_User = (V_img1 + V_img2 + V_img3) / 3
```

Cosine Similarity Formula:
```
Similarity = (A · B) / (||A|| ||B||)
```

### Step 4: Explainable AI
Generates human-readable explanations:
- "We matched this because your photos had high greenery (70%) and warm lighting, similar to the walk-paths in Race Course."

## API Endpoint

**POST** `/api/vibe-match`

Request body:
```json
{
  "images": ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."]
}
```

Response:
```json
[
  {
    "name": "Race Course",
    "score": 0.92,
    "vibe": "Upscale residential with wide streets",
    "center": [76.978, 11.0005]
  }
]
```

## Frontend Integration

The frontend at `/vibe-match` automatically connects to this API.

Make sure both servers are running:
- Frontend: `npm run dev` (port 8080)
- Backend: `python vibe_match_api.py` (port 5000)
