from sqlalchemy import create_engine, text, inspect
import os
from dotenv import load_dotenv

# Try to load from root first
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
# Then try backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nammaway.db")
print(f"Connecting to: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

def migrate():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    print(f"Current columns in 'users': {columns}")

    needed_columns = {
        "starting_location": "VARCHAR",
        "workplace": "VARCHAR",
        "purpose": "VARCHAR"
    }

    with engine.connect() as conn:
        for col, type_ in needed_columns.items():
            if col not in columns:
                print(f"Adding column {col}...")
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {type_}"))
                    conn.commit()
                except Exception as e:
                    print(f"Error adding {col}: {e}")
            else:
                print(f"Column {col} already exists.")

if __name__ == "__main__":
    migrate()
    print("Migration finished.")
