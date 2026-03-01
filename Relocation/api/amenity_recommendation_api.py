"""
amenity_recommendation_api.py
Flask API for serving context-aware amenity recommendations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
from pathlib import Path
import math

app = Flask(__name__)
CORS(app)

# Weekend favorites for boost
WEEKEND_FAVORITES = ["mall", "cinema", "park", "restaurant", "temple", "tourist_attraction", "bakery"]

def get_time_context():
    """Determine current time context."""
    hour = datetime.now().hour
    if 6 <= hour < 10:
        return 'morning'
    elif 10 <= hour < 14:
        return 'afternoon'
    elif 14 <= hour < 22:
        return 'evening'
    return 'night'

def is_weekend():
    """Check if today is weekend."""
    return datetime.now().weekday() >= 5

def apply_weekend_boost(score, category):
    """Apply 30% boost for weekend-appropriate spots."""
    if is_weekend() and category in WEEKEND_FAVORITES:
        return min(score * 1.3, 1.0)
    return score

def load_amenities(location):
    """Load amenities from enriched GeoJSON file."""
    datasets_dir = Path("../public/datasets/enriched")
    geojson_file = datasets_dir / f"{location}.geojson"
    
    if not geojson_file.exists():
        return []
    
    with open(geojson_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data.get('features', [])

def score_amenity(amenity, time_context, user_location=None, user_preferences=None):
    """Calculate relevance score for an amenity with user preferences."""
    props = amenity.get('properties', {})
    
    # A. Base vibe score
    vibe_key = f'vibe_{time_context}'
    base_weight = props.get(vibe_key, 0.5)
    
    # B. Apply weekend boost
    category = props.get('vibe_category', 'default')
    base_score = apply_weekend_boost(base_weight, category)
    
    # C. Distance factor (if user location provided)
    dist_factor = 1.0
    distance_km = None
    if user_location and amenity.get('geometry', {}).get('coordinates'):
        coords = amenity['geometry']['coordinates']
        distance_km = haversine_distance(
            user_location[0], user_location[1],
            coords[1], coords[0]  # GeoJSON is [lon, lat]
        )
        # Distance penalty: max 5km range
        dist_factor = max(0, 1 - (distance_km / 5.0))
    
    # D. User preference matching
    pref_match = 1.0
    if user_preferences:
        # Check if amenity tags/properties match user preferences
        tags = props.get('tags', [])
        amenity_type = props.get('amenity', '')
        name = props.get('name', '').lower()
        
        # Check for matches
        matches = sum(1 for pref in user_preferences 
                     if pref.lower() in str(tags).lower() 
                     or pref.lower() in amenity_type.lower()
                     or pref.lower() in name)
        
        if matches > 0:
            pref_match = 1.2  # 20% boost for preference match
    
    # E. FINAL SCORE CALCULATION
    final_score = base_score * dist_factor * pref_match
    
    return min(final_score, 1.0), distance_km  # Cap at 1.0

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two coordinates using Haversine formula."""
    R = 6371  # Earth radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat/2)**2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon/2)**2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_context_icon(time_context):
    """Get emoji icon for time context."""
    icons = {
        'morning': '☕',  # Coffee
        'afternoon': '🍽️',  # Fork and knife
        'evening': '🌆',  # Cityscape at dusk
        'night': '🌙'  # Crescent moon
    }
    return icons.get(time_context, '📍')

def get_category_emoji(category):
    """Get emoji for amenity category."""
    emoji_map = {
        'cafe': '☕', 'restaurant': '🍽️', 'bakery': '🥐',
        'street_food': '🍔', 'pub_bar': '🍺', 'fast_food': '🍔',
        'gym': '💪', 'park': '🌳', 'yoga_center': '🧘',
        'hospital': '🏥', 'clinic': '⚕️', 'pharmacy': '💊',
        'mall': '🏬', 'supermarket': '🛒', 'boutique': '👗',
        'local_market': '🏪', 'it_park': '💻', 'coworking_space': '🖥️',
        'college_university': '🎓', 'library': '📚', 'school': '🏫',
        'temple': '🛕', 'cinema': '🎥', 'tourist_attraction': '🏛️',
        'bank': '🏦', 'atm': '💳', 'fuel': '⛽', 'parking': '🅿️',
        'default': '📍'
    }
    return emoji_map.get(category, emoji_map['default'])

def generate_why_message(props, time_context, score):
    """Generate contextual 'why' message for recommendation."""
    category = props.get('vibe_category', 'place')
    name = props.get('name', 'This spot')
    
    messages = {
        'morning': {
            'cafe': f"Perfect for a morning coffee and breakfast",
            'gym': f"Great time for a morning workout",
            'park': f"Ideal for a refreshing morning walk",
            'temple': f"Best time for peaceful morning prayers",
            'bakery': f"Fresh baked goods for your morning",
            'default': f"Good choice for your morning routine"
        },
        'afternoon': {
            'restaurant': f"Perfect lunch spot with great ambiance",
            'mall': f"Great for afternoon shopping and dining",
            'library': f"Quiet afternoon study session",
            'coworking_space': f"Productive afternoon work environment",
            'default': f"Ideal for your afternoon plans"
        },
        'evening': {
            'restaurant': f"Excellent dinner destination",
            'cinema': f"Perfect for an evening movie",
            'park': f"Beautiful evening stroll location",
            'mall': f"Evening shopping and entertainment hub",
            'pub_bar': f"Great evening hangout spot",
            'default': f"Top pick for your evening"
        },
        'night': {
            'pharmacy': f"24/7 availability for emergencies",
            'hospital': f"Round-the-clock medical care",
            'pub_bar': f"Lively nightlife destination",
            'street_food': f"Late night snack paradise",
            'default': f"Available for late night needs"
        }
    }
    
    context_messages = messages.get(time_context, messages['morning'])
    return context_messages.get(category, context_messages['default'])

def get_context_message(time_context, location, count):
    """Get contextual greeting message."""
    messages = {
        'morning': f"Good morning! Here are the top {count} spots for your morning in {location}",
        'afternoon': f"Afternoon recommendations for {location}",
        'evening': f"Evening hotspots in {location}",
        'night': f"Late night essentials in {location}"
    }
    return messages.get(time_context, f"Top {count} recommendations for {location}")

@app.route('/api/amenities/recommend', methods=['POST'])
def recommend_amenities():
    """
    Get context-aware amenity recommendations with user preferences.
    
    Request body:
    {
        "location": "Saravanampatti",
        "timeContext": "morning",
        "userLocation": [11.080, 77.079],
        "preferences": ["wifi", "parking", "ac"],
        "limit": 10,
        "minScore": 0.5
    }
    """
    try:
        data = request.json
        location = data.get('location', 'Saravanampatti')
        time_context = data.get('timeContext', get_time_context())
        user_location = data.get('userLocation')
        user_preferences = data.get('preferences', [])
        limit = data.get('limit', 10)
        min_score = data.get('minScore', 0.5)
        
        # Load amenities
        amenities = load_amenities(location)
        
        if not amenities:
            return jsonify({
                "error": f"No amenities found for location: {location}",
                "suggestions": ["Saravanampatti", "Gandhipuram", "RS Puram", "Race Course", "Ganapathy"]
            }), 404
        
        # Score and filter
        scored_amenities = []
        for amenity in amenities:
            score, distance = score_amenity(amenity, time_context, user_location, user_preferences)
            if score >= min_score:
                props = amenity.get('properties', {})
                
                # Generate contextual "why" message
                why_message = generate_why_message(props, time_context, score)
                
                result = {
                    "type": "Feature",
                    "geometry": amenity.get('geometry'),
                    "properties": {
                        **props,
                        "relevance_score": round(score, 3),
                        "match_percentage": round(score * 100),
                        "distance_km": round(distance, 2) if distance else None,
                        "why_message": why_message,
                        "context_icon": get_context_icon(time_context),
                        "category_emoji": get_category_emoji(props.get('vibe_category', 'default'))
                    }
                }
                scored_amenities.append(result)
        
        # Sort by score
        scored_amenities.sort(key=lambda x: x['properties']['relevance_score'], reverse=True)
        
        # Limit results
        top_amenities = scored_amenities[:limit]
        
        # Context message
        context_message = get_context_message(time_context, location, len(top_amenities))
        weekend_note = " 🎉 Weekend boost applied!" if is_weekend() else ""
        
        return jsonify({
            "success": True,
            "location": location,
            "timeContext": time_context,
            "isWeekend": is_weekend(),
            "message": context_message + weekend_note,
            "totalAmenities": len(amenities),
            "filteredCount": len(scored_amenities),
            "returnedCount": len(top_amenities),
            "amenities": top_amenities,
            "userPreferences": user_preferences
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/amenities/locations', methods=['GET'])
def get_locations():
    """Get list of available locations."""
    datasets_dir = Path("../public/datasets/enriched")
    
    if not datasets_dir.exists():
        return jsonify({
            "locations": [],
            "message": "No enriched data found. Run add_vibe_weights.py first."
        })
    
    locations = [f.stem for f in datasets_dir.glob("*.geojson")]
    
    return jsonify({
        "locations": locations,
        "count": len(locations)
    })

@app.route('/api/amenities/stats', methods=['GET'])
def get_stats():
    """Get statistics about amenity data."""
    location = request.args.get('location', 'Saravanampatti')
    amenities = load_amenities(location)
    
    if not amenities:
        return jsonify({"error": "Location not found"}), 404
    
    # Count by category
    categories = {}
    for amenity in amenities:
        cat = amenity.get('properties', {}).get('vibe_category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1
    
    return jsonify({
        "location": location,
        "totalAmenities": len(amenities),
        "categories": categories,
        "topCategories": sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "Amenity Recommendation API",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "Context-aware filtering",
            "Weekend boost",
            "Distance-based scoring",
            "Category normalization"
        ]
    })

if __name__ == '__main__':
    print("🚀 Amenity Recommendation API")
    print("=" * 60)
    print("📍 Endpoints:")
    print("  POST /api/amenities/recommend - Get recommendations")
    print("  GET  /api/amenities/locations - List available locations")
    print("  GET  /api/amenities/stats     - Get location statistics")
    print("  GET  /health                   - Health check")
    print("=" * 60)
    print(f"⏰ Current time context: {get_time_context()}")
    print(f"📅 Weekend mode: {'ON' if is_weekend() else 'OFF'}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5001, debug=True)
