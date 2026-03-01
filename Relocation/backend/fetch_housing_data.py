"""
Script to fetch and cache Coimbatore housing data
Run this to populate the database with real Housing.com data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from housing_scraper import fetch_coimbatore_houses
import json

def main():
    print("🏠 Fetching Coimbatore house rental data from Housing.com...")
    print("=" * 60)
    
    houses = fetch_coimbatore_houses()
    
    print(f"\n✅ Successfully fetched {len(houses)} houses!")
    print("\nSample listings:")
    print("-" * 60)
    
    for i, house in enumerate(houses[:5], 1):
        print(f"\n{i}. {house['name']}")
        print(f"   📍 Area: {house['area']}")
        print(f"   💰 Price: {house['pricePerMonth']}")
        print(f"   🖼️  Images: {len(house.get('images', []))} photos")
        print(f"   📝 Description: {house.get('description', 'N/A')[:80]}...")
    
    # Save to JSON file for caching
    cache_file = "coimbatore_houses_cache.json"
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(houses, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Data cached to {cache_file}")
    print(f"\n🎉 Done! You can now view these {len(houses)} houses in the app.")
    print("\nNext steps:")
    print("1. Restart the backend: python run.py")
    print("2. Open the app and go to 'Houses on Rent' page")
    print("3. You should see real Coimbatore rental listings with photos!")

if __name__ == "__main__":
    main()
