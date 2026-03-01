import sys
import os
import csv
import json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("\n" + "="*60)
print("LOADING ALL DATASETS")
print("="*60)

# Clear existing data
db.query(models.Accommodation).delete()
db.query(models.Amenity).delete()
db.commit()
print("\n✓ Cleared existing data")

# Load PG data
pg_file = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'coimbatore_pg_dataset.csv')
pg_count = 0
if os.path.exists(pg_file):
    print(f"\nLoading PG data...")
    with open(pg_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                price = row.get('price_per_month', '5000').replace('Call for Price', '5000').replace(',', '').replace('₹', '').strip()
                price = float(price) if price else 5000
                
                accommodation = models.Accommodation(
                    name=row['pg_name'],
                    type='PG',
                    rent_price=price,
                    latitude=float(row['latitude']),
                    longitude=float(row['longitude']),
                    safety_score=float(row.get('rating', 4.0)),
                    amenities=f"WiFi: {row.get('wifi', 'No')}, AC: {row.get('ac', 'No')}, Food: {row.get('food_included', 'No')}"
                )
                db.add(accommodation)
                pg_count += 1
            except Exception as e:
                pass
    db.commit()
    print(f"✓ Loaded {pg_count} PGs")

# Load House data
house_file = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'coimbatore_houseonrent_dataset.csv')
house_count = 0
if os.path.exists(house_file):
    print(f"Loading House data...")
    with open(house_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                price = row.get('price_per_month', '10000').replace('Call for Price', '10000').replace(',', '').replace('₹', '').strip()
                price = float(price) if price else 10000
                
                accommodation = models.Accommodation(
                    name=row.get('pg_name', 'House'),
                    type='House',
                    rent_price=price,
                    latitude=float(row['latitude']),
                    longitude=float(row['longitude']),
                    safety_score=float(row.get('rating', 4.0)) if row.get('rating') else 4.0,
                    amenities=row.get('room_type', 'N/A')
                )
                db.add(accommodation)
                house_count += 1
            except Exception as e:
                pass
    db.commit()
    print(f"✓ Loaded {house_count} Houses")

# Load Bus Routes
bus_file = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'Coimbatore_bus_routes.json')
bus_count = 0
if os.path.exists(bus_file):
    print(f"Loading Bus stops...")
    try:
        with open(bus_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict):
                data = [data]
            for route in data:
                if isinstance(route, dict):
                    for stop in route.get('stops', []):
                        try:
                            amenity = models.Amenity(
                                name=stop.get('name', 'Bus Stop'),
                                type='Bus Stop',
                                latitude=float(stop['latitude']),
                                longitude=float(stop['longitude'])
                            )
                            db.add(amenity)
                            bus_count += 1
                        except:
                            pass
        db.commit()
        print(f"✓ Loaded {bus_count} Bus stops")
    except Exception as e:
        print(f"✗ Error loading bus routes: {e}")

# Load Restaurants
rest_file = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'coimbatore_zomato_restaurants.csv')
rest_count = 0
if os.path.exists(rest_file):
    print(f"Loading Restaurants...")
    try:
        with open(rest_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    if 'latitude' in row and 'longitude' in row:
                        amenity = models.Amenity(
                            name=row.get('name', row.get('restaurant_name', 'Restaurant')),
                            type='Restaurant',
                            latitude=float(row['latitude']),
                            longitude=float(row['longitude'])
                        )
                        db.add(amenity)
                        rest_count += 1
                except:
                    pass
        db.commit()
        print(f"✓ Loaded {rest_count} Restaurants")
    except Exception as e:
        print(f"✗ Error loading restaurants: {e}")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print(f"PGs: {pg_count}")
print(f"Houses: {house_count}")
print(f"Bus Stops: {bus_count}")
print(f"Restaurants: {rest_count}")
print(f"Total: {pg_count + house_count + bus_count + rest_count}")
print("="*60 + "\n")

db.close()
