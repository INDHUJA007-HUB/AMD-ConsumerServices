import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")
print(f"Connecting to: {url}")

try:
    engine = create_engine(url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT postgis_full_version();"))
        print(f"PostGIS Version: {result.fetchone()[0]}")
except Exception as e:
    print(f"Error: {e}")
