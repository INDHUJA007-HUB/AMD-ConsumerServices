import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

db = SessionLocal()

print("=== Users in Database ===")
users = db.query(models.User).all()
for user in users:
    print(f"ID: {user.id}")
    print(f"Email: {user.email}")
    print(f"Name: {user.full_name}")
    print(f"Starting Location: {user.starting_location}")
    print(f"Workplace: {user.workplace}")
    print(f"Purpose: {user.purpose}")
    print("-" * 40)

if not users:
    print("No users found in database")

db.close()
