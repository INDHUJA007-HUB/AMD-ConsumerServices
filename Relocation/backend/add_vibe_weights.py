"""
add_vibe_weights.py
Automatically adds context-aware time-vibe weights to GeoJSON amenity data.
Run this once to enrich your amenity datasets with AI recommendation weights.
"""

import json
import os
from pathlib import Path

# Master Vibe Template - Coimbatore-specific contextual importance (0.0 to 1.0)
VIBE_TEMPLATE = {
    # --- SOCIAL & FOOD ---
    "cafe": {"morning": 0.9, "afternoon": 0.5, "evening": 0.8, "night": 0.3},
    "restaurant": {"morning": 0.3, "afternoon": 0.9, "evening": 1.0, "night": 0.4},
    "bakery": {"morning": 0.6, "afternoon": 0.7, "evening": 0.9, "night": 0.2},
    "street_food": {"morning": 0.1, "afternoon": 0.4, "evening": 1.0, "night": 0.6},
    "pub_bar": {"morning": 0.0, "afternoon": 0.2, "evening": 0.8, "night": 1.0},
    "fast_food": {"morning": 0.4, "afternoon": 0.8, "evening": 0.8, "night": 0.7},
    "food_court": {"morning": 0.3, "afternoon": 0.9, "evening": 0.8, "night": 0.4},
    
    # --- WELLNESS & NATURE ---
    "gym": {"morning": 1.0, "afternoon": 0.2, "evening": 0.8, "night": 0.3},
    "park": {"morning": 0.9, "afternoon": 0.4, "evening": 0.8, "night": 0.1},
    "yoga_center": {"morning": 1.0, "afternoon": 0.1, "evening": 0.6, "night": 0.0},
    "hospital": {"morning": 0.8, "afternoon": 0.6, "evening": 0.5, "night": 0.4},
    "clinic": {"morning": 0.8, "afternoon": 0.9, "evening": 0.6, "night": 0.3},
    "pharmacy": {"morning": 0.7, "afternoon": 0.8, "evening": 0.8, "night": 0.7},
    
    # --- SHOPPING & COMMERCE ---
    "mall": {"morning": 0.2, "afternoon": 0.8, "evening": 1.0, "night": 0.5},
    "supermarket": {"morning": 0.6, "afternoon": 0.5, "evening": 0.9, "night": 0.4},
    "boutique": {"morning": 0.3, "afternoon": 0.7, "evening": 0.8, "night": 0.1},
    "local_market": {"morning": 0.9, "afternoon": 0.6, "evening": 0.8, "night": 0.2},
    "convenience": {"morning": 0.7, "afternoon": 0.7, "evening": 0.8, "night": 0.6},
    
    # --- PROFESSIONAL & EDUCATION ---
    "it_park": {"morning": 0.8, "afternoon": 0.9, "evening": 0.7, "night": 0.6},
    "coworking_space": {"morning": 0.9, "afternoon": 1.0, "evening": 0.6, "night": 0.2},
    "college_university": {"morning": 1.0, "afternoon": 0.8, "evening": 0.3, "night": 0.1},
    "library": {"morning": 0.7, "afternoon": 0.9, "evening": 0.5, "night": 0.1},
    "school": {"morning": 0.9, "afternoon": 0.7, "evening": 0.3, "night": 0.0},
    
    # --- SPIRITUAL & LEISURE ---
    "temple": {"morning": 1.0, "afternoon": 0.2, "evening": 0.9, "night": 0.0},
    "cinema": {"morning": 0.2, "afternoon": 0.7, "evening": 1.0, "night": 0.8},
    "tourist_attraction": {"morning": 0.5, "afternoon": 0.9, "evening": 0.7, "night": 0.2},
    "church": {"morning": 0.9, "afternoon": 0.5, "evening": 0.6, "night": 0.2},
    "mosque": {"morning": 0.9, "afternoon": 0.6, "evening": 0.8, "night": 0.4},
    
    # --- SERVICES ---
    "bank": {"morning": 0.8, "afternoon": 0.9, "evening": 0.6, "night": 0.1},
    "atm": {"morning": 0.6, "afternoon": 0.7, "evening": 0.8, "night": 0.7},
    "post_office": {"morning": 0.8, "afternoon": 0.9, "evening": 0.5, "night": 0.0},
    "police": {"morning": 0.6, "afternoon": 0.7, "evening": 0.7, "night": 0.9},
    
    # --- TRANSPORT ---
    "fuel": {"morning": 0.8, "afternoon": 0.7, "evening": 0.8, "night": 0.6},
    "parking": {"morning": 0.7, "afternoon": 0.8, "evening": 0.9, "night": 0.5},
    "bus_station": {"morning": 0.9, "afternoon": 0.8, "evening": 0.9, "night": 0.6},
    
    # --- FALLBACK ---
    "default": {"morning": 0.5, "afternoon": 0.5, "evening": 0.5, "night": 0.5}
}

# Category normalization mapping
CATEGORY_MAPPING = {
    "coffee_shop": "cafe",
    "tea_stall": "cafe",
    "coffee_house": "cafe",
    "fitness_center": "gym",
    "fitness_centre": "gym",
    "sports_centre": "gym",
    "shopping_center": "mall",
    "shopping_centre": "mall",
    "shopping_mall": "mall",
    "place_of_worship": "temple",
    "clothing_store": "boutique",
    "clothes": "boutique",
    "marketplace": "local_market",
    "market": "local_market",
    "doctors": "clinic",
    "dentist": "clinic",
    "bar": "pub_bar",
    "pub": "pub_bar",
    "nightclub": "pub_bar",
    "university": "college_university",
    "college": "college_university",
    "theatre": "cinema",
    "theater": "cinema",
}

# Weekend favorites for boost
WEEKEND_FAVORITES = ["mall", "cinema", "park", "restaurant", "temple", "tourist_attraction", "bakery"]

def normalize_category(raw_category):
    """Normalize category names to standard template keys."""
    if not raw_category:
        return 'default'
    
    normalized = str(raw_category).lower().strip()
    return CATEGORY_MAPPING.get(normalized, normalized)

def get_amenity_type(properties):
    """Extract and normalize amenity type from GeoJSON properties."""
    # Try multiple possible keys
    for key in ['amenity', 'category', 'type', 'shop', 'leisure', 'tourism']:
        if key in properties and properties[key]:
            raw_type = str(properties[key]).lower()
            return normalize_category(raw_type)
    return 'default'

def apply_weekend_boost(score, category):
    """Apply 30% boost for weekend-appropriate spots."""
    from datetime import datetime
    is_weekend = datetime.now().weekday() >= 5  # Saturday=5, Sunday=6
    
    if is_weekend and category in WEEKEND_FAVORITES:
        return min(score * 1.3, 1.0)  # Cap at 1.0
    return score

def assign_vibe_weights(feature):
    """Add time-vibe weights to a GeoJSON feature with weekend boost."""
    props = feature.get('properties', {})
    amenity_type = get_amenity_type(props)
    
    # Get weights from template, fallback to default
    weights = VIBE_TEMPLATE.get(amenity_type, VIBE_TEMPLATE['default'])
    
    # Add weights to properties with weekend boost
    props['vibe_morning'] = apply_weekend_boost(weights['morning'], amenity_type)
    props['vibe_afternoon'] = apply_weekend_boost(weights['afternoon'], amenity_type)
    props['vibe_evening'] = apply_weekend_boost(weights['evening'], amenity_type)
    props['vibe_night'] = apply_weekend_boost(weights['night'], amenity_type)
    props['vibe_category'] = amenity_type
    props['vibe_raw_category'] = props.get('amenity') or props.get('category') or 'unknown'
    
    return feature

def process_geojson_file(input_path, output_path):
    """Process a single GeoJSON file and add vibe weights."""
    print(f"📂 Processing: {input_path}")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'features' not in data:
        print(f"   ⚠️  No features found, skipping")
        return 0
    
    # Process each feature
    for feature in data['features']:
        assign_vibe_weights(feature)
    
    # Save enriched data
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    count = len(data['features'])
    print(f"   ✅ Added vibe weights to {count} amenities")
    return count

def main():
    print("🤖 Context-Aware Amenity Vibe Weight Generator")
    print("=" * 70)
    
    # Define paths
    datasets_dir = Path("../public/datasets")
    output_dir = Path("../public/datasets/enriched")
    output_dir.mkdir(exist_ok=True)
    
    # Find all GeoJSON files
    geojson_files = list(datasets_dir.glob("*.geojson"))
    
    if not geojson_files:
        print("\n❌ No GeoJSON files found in public/datasets/")
        print("   Make sure your amenity data files are in the correct location.")
        return
    
    print(f"\n📊 Found {len(geojson_files)} GeoJSON files to process")
    print(f"📁 Output directory: {output_dir}")
    print("\n" + "=" * 70)
    
    total_amenities = 0
    
    for geojson_file in geojson_files:
        output_file = output_dir / geojson_file.name
        count = process_geojson_file(geojson_file, output_file)
        total_amenities += count
    
    print("\n" + "=" * 70)
    print(f"✅ SUCCESS! Processed {total_amenities} total amenities")
    print(f"📂 Enriched files saved to: {output_dir}")
    print("\n💡 Next Steps:")
    print("   1. Update your frontend to load from 'datasets/enriched/' folder")
    print("   2. Implement time-based filtering using vibe_morning/afternoon/evening/night")
    print("   3. Sort amenities by vibe score for current time of day")
    print("\n🎯 Example Frontend Usage:")
    print("""
    const currentHour = new Date().getHours();
    const timeContext = currentHour < 10 ? 'morning' :
                       currentHour < 14 ? 'afternoon' :
                       currentHour < 22 ? 'evening' : 'night';
    
    const sortedAmenities = amenities.sort((a, b) => 
        b.properties[`vibe_${timeContext}`] - a.properties[`vibe_${timeContext}`]
    );
    """)
    print("=" * 70)

if __name__ == "__main__":
    main()
