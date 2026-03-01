import sqlite3
import os

db_path = 'backend/nammaway.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    rows = cursor.fetchall()
    print("Schema for table 'users':")
    for row in rows:
        print(row)
    conn.close()
