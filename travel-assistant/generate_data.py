import xml.etree.ElementTree as ET
import json
import random

# Mapping of health centers based on the PDF
# We extracted 33 centers. Let's count by zone:
# Central: 8, East: 5, North: 5, South: 7, West: 8 (Total exactly 33)
health_centers_by_zone = {
    "Central Zone": 8,
    "East Zone": 5,
    "North Zone": 5,
    "South Zone": 7,
    "West Zone": 8
}

def parse_kml_to_geojson(kml_path):
    tree = ET.parse(kml_path)
    root = tree.getroot()
    # KML namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    features = []
    
    # Simple data mapping
    for placemark in root.findall('.//kml:Placemark', ns):
        properties = {}
        for simple_data in placemark.findall('.//kml:SimpleData', ns):
            name = simple_data.attrib.get('name')
            properties[name] = simple_data.text
        
        # Poly coordinates
        coords_text = placemark.find('.//kml:coordinates', ns)
        if coords_text is not None:
            coords_str = coords_text.text.strip().split()
            polygon = []
            for c in coords_str:
                parts = c.split(',')
                if len(parts) >= 2:
                    polygon.append([float(parts[0]), float(parts[1])])
            
            # GeoJSON geometry
            geometry = {
                "type": "Polygon",
                "coordinates": [polygon]
            }
            
            features.append({
                "type": "Feature",
                "properties": properties,
                "geometry": geometry
            })
            
    return features


def process():
    features = parse_kml_to_geojson("coimbatore_wards.kml")
    
    # We will randomly distribute health centers to wards in matching zones
    # Group features by zone
    zone_wards = {}
    for i, f in enumerate(features):
        z = f['properties'].get('zone', 'Unknown')
        if z not in zone_wards:
            zone_wards[z] = []
        zone_wards[z].append(i)
        
    random.seed(42) # For reproducible results
    
    # Distribute health centers to wards
    for z, count in health_centers_by_zone.items():
        if z in zone_wards:
            wards_in_zone = zone_wards[z]
            selected_wards = random.sample(wards_in_zone, min(count, len(wards_in_zone)))
            for w_idx in selected_wards:
                features[w_idx]['properties']['has_health_center'] = True
    
    final_features = []
    
    for f in features:
        props = f['properties']
        base_score = 7
        
        ward_no = int(props.get('ward_lgd_name', 0))
        
        # Simulate high crime using ward number (roughly 1 in 3 wards)
        high_crime = (ward_no % 3 == 0)
        has_hc = props.get('has_health_center', False)
        
        if high_crime:
            base_score -= 4 # Drops a base 7 to 3 (which triggers Unsafe if late)
            props['high_crime_rate'] = True
        else:
            props['high_crime_rate'] = False
            
        if has_hc:
            base_score += 2
            
        props['vibe_score'] = base_score
        
        final_features.append(f)
        
    geojson = {
        "type": "FeatureCollection",
        "features": final_features
    }
    
    with open("src/data/master_safety_data.json", "w", encoding='utf-8') as out:
        json.dump(geojson, out)
        
    print(f"Generated src/data/master_safety_data.json with {len(features)} wards.")

if __name__ == '__main__':
    process()
