import pandas as pd
import os
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import SessionLocal, engine, Base
from .models import Accommodation, Amenity, User
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

def ingest_accommodations(db: Session, datasets_dir: str):
    print("Ingesting Accommodations...")
    pg_path = os.path.join(datasets_dir, "coimbatore_pg_dataset.csv")
    house_path = os.path.join(datasets_dir, "coimbatore_houseonrent_dataset.csv")
    
    files = [(pg_path, "PG"), (house_path, "House")]
    
    for path, acc_type in files:
        if os.path.exists(path):
            df = pd.read_csv(path)
            for _, row in df.iterrows():
                try:
                    # Clean price
                    rent_str = str(row['price_per_month']).replace('₹', '').replace(',', '').split('/')[0]
                    rent = float(rent_str)
                except:
                    rent = 7000.0
                
                lat, lon = row['latitude'], row['longitude']
                
                acc = Accommodation(
                    name=row['pg_name'],
                    type=acc_type,
                    rent_price=rent,
                    latitude=lat,
                    longitude=lon,
                    safety_score=row.get('safety_score', 0.0),
                    amenities=row.get('description', '')
                )
                db.add(acc)
    db.commit()
    print("Accommodations Ingested.")

def ingest_bus_stops(db: Session, datasets_dir: str):
    print("Ingesting Bus Stops...")
    bus_path = os.path.join(datasets_dir, "Coimbatore_bus_routes.json")
    if os.path.exists(bus_path):
        with open(bus_path, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                for route in data:
                    stops = route.get('stops', [])
                    for stop in stops:
                        name = stop.get('name')
                        lat = stop.get('lat')
                        lon = stop.get('lon')
                        if name and lat and lon:
                            amenity = Amenity(
                                name=name,
                                type="Bus Stop",
                                latitude=lat,
                                longitude=lon
                            )
                            db.add(amenity)
        db.commit()
    print("Bus Stops Ingested.")

def main():
    # Create tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    datasets_dir = r"c:\SideQuest\ConsumerExperience\datasets"
    
    try:
        # Clear existing data to avoid duplicates during dev
        db.query(Accommodation).delete()
        db.query(Amenity).delete()
        db.commit()
        
        ingest_accommodations(db, datasets_dir)
        ingest_bus_stops(db, datasets_dir)
    finally:
        db.close()

if __name__ == "__main__":
    main()
