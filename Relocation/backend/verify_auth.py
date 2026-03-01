import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from auth import get_password_hash, verify_password

# Create tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("\n" + "="*60)
print("DATABASE TEST & VERIFICATION")
print("="*60)

# Check existing users
users = db.query(models.User).all()
print(f"\nCurrent users in database: {len(users)}")

if users:
    print("\n" + "-"*60)
    for user in users:
        print(f"ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Name: {user.full_name}")
        print(f"Starting Location: {user.starting_location}")
        print(f"Workplace: {user.workplace}")
        print(f"Purpose: {user.purpose}")
        print(f"Password Hash: {user.hashed_password[:30]}...")
        print("-"*60)

# Test password verification
print("\n" + "="*60)
print("PASSWORD VERIFICATION TEST")
print("="*60)

if users:
    test_user = users[0]
    print(f"\nTesting user: {test_user.email}")
    
    # Try common passwords
    test_passwords = ["password", "123456", "test123", "admin"]
    print("\nTrying common passwords...")
    for pwd in test_passwords:
        if verify_password(pwd, test_user.hashed_password):
            print(f"✓ Password found: '{pwd}'")
            break
    else:
        print("✗ None of the common passwords match")
        print("\nTo test login, register a new user with known credentials")
else:
    print("\nNo users to test. Register a new user first.")

# Create a test user
print("\n" + "="*60)
print("CREATE TEST USER")
print("="*60)

test_email = "test@example.com"
test_password = "test123"

existing = db.query(models.User).filter(models.User.email == test_email).first()
if existing:
    print(f"\nTest user already exists: {test_email}")
    print(f"Password: {test_password}")
    print("\nYou can login with these credentials!")
else:
    new_user = models.User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        starting_location="Test Location",
        workplace="Test Workplace",
        purpose="testing"
    )
    db.add(new_user)
    db.commit()
    print(f"\n✓ Test user created!")
    print(f"Email: {test_email}")
    print(f"Password: {test_password}")
    print("\nYou can now login with these credentials!")

db.close()

print("\n" + "="*60)
print("NEXT STEPS")
print("="*60)
print("1. Start backend: python run.py")
print("2. Open frontend in browser")
print("3. Login with: test@example.com / test123")
print("="*60 + "\n")
