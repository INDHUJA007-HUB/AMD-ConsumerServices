import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Test connection
try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="nammaway",
        user="postgres",
        password="hi"
    )
    print("✓ PostgreSQL connection successful!")
    
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'users'
        );
    """)
    table_exists = cursor.fetchone()[0]
    
    if table_exists:
        print("✓ Users table exists")
        
        # Get all users
        cursor.execute("SELECT id, email, full_name, starting_location, workplace, purpose FROM users")
        users = cursor.fetchall()
        
        print(f"\n{'='*60}")
        print(f"Total users in database: {len(users)}")
        print(f"{'='*60}\n")
        
        if users:
            for user in users:
                print(f"ID: {user[0]}")
                print(f"Email: {user[1]}")
                print(f"Name: {user[2]}")
                print(f"Starting Location: {user[3]}")
                print(f"Workplace: {user[4]}")
                print(f"Purpose: {user[5]}")
                print("-" * 60)
        else:
            print("No users found. Register a new user to test.")
    else:
        print("✗ Users table does not exist. Run the backend to create tables.")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print("✗ PostgreSQL connection failed!")
    print(f"Error: {e}")
    print("\nMake sure:")
    print("1. Docker Desktop is running")
    print("2. PostgreSQL container is running: docker-compose up -d db")
    print("3. Port 5432 is not blocked")
except Exception as e:
    print(f"✗ Error: {e}")
