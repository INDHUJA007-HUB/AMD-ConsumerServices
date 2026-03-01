import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'nammaway.db')

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    print("Make sure to run the backend first to create the database.")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n" + "="*60)
print("USERS TABLE")
print("="*60)

cursor.execute("SELECT * FROM users")
users = cursor.fetchall()

if users:
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"\nColumns: {', '.join(columns)}\n")
    
    for user in users:
        print("-" * 60)
        for i, col in enumerate(columns):
            if col == 'hashed_password':
                print(f"{col}: [HASHED - {user[i][:20]}...]")
            else:
                print(f"{col}: {user[i]}")
    print("-" * 60)
    print(f"\nTotal users: {len(users)}")
else:
    print("\nNo users found in database.")

conn.close()
