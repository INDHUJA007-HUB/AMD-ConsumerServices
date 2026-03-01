"""
Test script for the enhanced housing scraper
Verifies the two-step API pipeline is working correctly
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from housing_scraper import fetch_coimbatore_houses
import json

def test_scraper():
    print("🧪 Testing Enhanced Housing Scraper")
    print("=" * 70)
    print("\n✅ Features being tested:")
    print("  1. Two-step API pipeline (listing-by-url + property/get-by-url)")
    print("  2. Smart phone extraction (6 paths + regex fallback)")
    print("  3. Recursive image extraction")
    print("  4. Comprehensive property parsing")
    print("\n" + "=" * 70)
    
    # Fetch just 3 properties for quick test
    print("\n📡 Fetching 3 sample properties...")
    houses = fetch_coimbatore_houses(count=3)
    
    if not houses:
        print("\n❌ No properties fetched. Check API credentials.")
        return False
    
    print(f"\n✅ Successfully fetched {len(houses)} properties!")
    print("\n" + "=" * 70)
    print("📊 DETAILED PROPERTY ANALYSIS")
    print("=" * 70)
    
    for i, house in enumerate(houses, 1):
        print(f"\n🏠 Property #{i}: {house['name']}")
        print(f"   📍 Location: {house['area']}")
        print(f"   💰 Price: {house['pricePerMonth']} (Raw: ₹{house.get('priceRaw', 0):,})")
        print(f"   🛏️  Specs: {house['bedrooms']}BHK | {house['bathrooms']} Bath | {house['areaSqft']} sqft")
        print(f"   🪑 Furnishing: {house['furnishing']}")
        print(f"   🏢 Type: {house['propertyType']}")
        print(f"   📞 Contact: {house['phone']} ({house['ownerName']})")
        print(f"   🖼️  Images: {len(house.get('images', []))} photos")
        
        if house.get('images'):
            print(f"      Sample: {house['images'][0][:60]}...")
        
        print(f"   ✨ Amenities: {', '.join(house.get('amenities', [])[:5])}")
        print(f"   📝 Description: {house.get('description', '')[:100]}...")
        print(f"   🔗 URL: {house.get('url', 'N/A')[:60]}...")
    
    # Verify data quality
    print("\n" + "=" * 70)
    print("🔍 DATA QUALITY CHECK")
    print("=" * 70)
    
    checks = {
        "Has valid names": all(h['name'] != "Not available" for h in houses),
        "Has prices": all(h['pricePerMonth'] != "Not available" for h in houses),
        "Has locations": all(h['area'] != "Not available" for h in houses),
        "Has phone numbers": all(h['phone'] != "Not available" for h in houses),
        "Has images": all(len(h.get('images', [])) > 0 for h in houses),
        "Has descriptions": all(len(h.get('description', '')) > 50 for h in houses),
    }
    
    for check, passed in checks.items():
        status = "✅" if passed else "⚠️"
        print(f"  {status} {check}: {passed}")
    
    # Save test results
    test_file = "test_housing_results.json"
    with open(test_file, "w", encoding="utf-8") as f:
        json.dump(houses, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Test results saved to: {test_file}")
    print("\n" + "=" * 70)
    print("🎉 TEST COMPLETE!")
    print("=" * 70)
    
    all_passed = all(checks.values())
    if all_passed:
        print("\n✅ All checks passed! The enhanced scraper is working perfectly.")
    else:
        print("\n⚠️  Some checks failed. Review the output above.")
    
    return all_passed

if __name__ == "__main__":
    success = test_scraper()
    sys.exit(0 if success else 1)
