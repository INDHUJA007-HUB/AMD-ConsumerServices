import pandas as pd
from sqlalchemy import create_engine
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
import os

# Assuming CSVs are in a directory accessible to this script
PG_CSV_PATH = '../datasets/coimbatore_pg_dataset.csv'
HOUSE_CSV_PATH = '../datasets/coimbatore_houseonrent_dataset.csv'
# Add other CSV paths as needed

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/nammaway")
engine = create_engine(DATABASE_URL)

def ingest_data():
    # Ingest PG data
    pg_df = pd.read_csv(PG_CSV_PATH)
    pg_df['location'] = pg_df.apply(lambda row: from_shape(Point(row['longitude'], row['latitude']), srid=4326), axis=1)
    pg_df.rename(columns={'price_per_month': 'rent_price', 'name': 'name'}, inplace=True)
    pg_df['safety_score'] = pg_df['rating'].fillna(3.0) # Placeholder
    pg_df['amenities_score'] = pg_df['wifi'].apply(lambda x: 1 if x == 'yes' else 0) + pg_df['ac'].apply(lambda x: 1 if x == 'yes' else 0) # Placeholder
    pg_df[['name', 'rent_price', 'location', 'safety_score', 'amenities_score']].to_sql('pg_accommodations', engine, if_exists='replace', index=False)

    # Ingest House data
    house_df = pd.read_csv(HOUSE_CSV_PATH)
    house_df['location'] = house_df.apply(lambda row: from_shape(Point(row['longitude'], row['latitude']), srid=4326), axis=1)
    house_df.rename(columns={'price_per_month': 'rent_price', 'name': 'name'}, inplace=True)
    house_df['safety_score'] = house_df['rating'].fillna(3.0) # Placeholder
    house_df['amenities_score'] = house_df['wifi'].apply(lambda x: 1 if x == 'yes' else 0) + house_df['ac'].apply(lambda x: 1 if x == 'yes' else 0) # Placeholder
    house_df[['name', 'rent_price', 'location', 'safety_score', 'amenities_score']].to_sql('house_accommodations', engine, if_exists='replace', index=False)

    print("Data ingestion complete.")

if __name__ == "__main__":
    ingest_data()
