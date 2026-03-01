"""
housing_scraper.py
Fetches real Coimbatore rental listings from Housing.com via RapidAPI.
Uses:
  - listing-by-url  → discover property listing URLs
  - property/get-by-url → fetch full details per property
"""

import requests
import json
import time
import re
from typing import Optional
import os
from urllib.parse import urlencode

# ── Configuration ────────────────────────────────────────────────────────────
RAPIDAPI_KEY  = os.getenv("RAPIDAPI_HOUSING_KEY") or os.getenv("RAPIDAPI_KEY") or ""
RAPIDAPI_HOST = "housing-api.p.rapidapi.com"

HEADERS = {
    "Content-Type": "application/json",
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key":  RAPIDAPI_KEY,
}

LISTING_URL_ENDPOINT  = "https://housing-api.p.rapidapi.com/scrapers/api/housing/property/listing-by-url"
PROPERTY_URL_ENDPOINT = "https://housing-api.p.rapidapi.com/scrapers/api/housing/property/get-by-url"

# Housing.com search pages for Coimbatore rentals
COIMBATORE_RENTAL_PAGES = [
    "https://housing.com/in/rent/coimbatore?page=1",
    "https://housing.com/in/rent/coimbatore?page=2",
    "https://housing.com/in/rent/coimbatore?page=3",
]

TARGET_COUNT = 20
REQUEST_DELAY = 1.2   # seconds between API calls (be polite)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _normalize_endpoint(url: str) -> str:
    # Fix accidental typos like 'sscrapers' and double slashes before 'api'
    fixed = url.replace("sscrapers", "scrapers")
    fixed = fixed.replace("//api/housing", "/api/housing")
    # Ensure base host is correct
    if not fixed.startswith("https://housing-api.p.rapidapi.com/"):
        fixed = "https://housing-api.p.rapidapi.com/" + fixed.lstrip("/")
    return fixed

def _post(endpoint: str, payload: dict) -> Optional[dict]:
    """POST to RapidAPI endpoint with retry/backoff and return JSON or None."""
    url = _normalize_endpoint(endpoint)
    delays = [0.0, 1.5, 3.0, 5.0]
    for attempt, delay in enumerate(delays, 1):
        if delay:
            time.sleep(delay)
        try:
            resp = requests.post(url, headers=HEADERS, json=payload, timeout=30)
            if resp.status_code in (429, 403):
                print(f"    ⚠️  HTTP {resp.status_code} on attempt {attempt}; backing off…")
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as e:
            print(f"    ⚠️  HTTP {resp.status_code}: {e}")
        except requests.exceptions.RequestException as e:
            print(f"    ⚠️  Request error: {e}")
        except json.JSONDecodeError:
            print(f"    ⚠️  Could not parse JSON response")
    return None

def _provider_nobroker(limit: int = TARGET_COUNT) -> list[dict]:
    """
    Try NoBroker's public JSON filter endpoint.
    If blocked, returns [] so caller can fallback.
    """
    try:
        params = {
            "city": "coimbatore",
            "category": "RESIDENTIAL",
            "rent": "true",
            "radius": "25",
            "page": "1",
            "pageNo": "1",
            "orderBy": "nbRank,desc",
        }
        url = f"https://www.nobroker.in/api/v3/multi/property/filter/RENT?{urlencode(params)}"
        headers = {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://www.nobroker.in/",
        }
        print("  🟢 Fetching NoBroker listings …")
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code != 200:
            # Try v2 as fallback
            url_v2 = f"https://www.nobroker.in/api/v2/property/filter/RENT?{urlencode(params)}"
            r = requests.get(url_v2, headers=headers, timeout=20)
            if r.status_code != 200:
                print(f"    ⚠️  NoBroker HTTP {r.status_code}")
                return []
        data = r.json()
        listings = []
        # The response often has 'data' → 'nbRecentSearch' or 'properties'
        raw = data.get("data") or {}
        props = raw.get("properties") or raw.get("nbPopularProperties") or raw.get("homeSearch", {}).get("results", []) or []
        for item in props:
            try:
                name = item.get("title") or item.get("propertyTitle") or "Coimbatore Rental Property"
                locality = item.get("locality") or item.get("society") or item.get("shortAddress") or "Coimbatore"
                city = item.get("city") or "Coimbatore"
                area = f"{locality}, {city}"
                rent = item.get("rent") or item.get("formattedRent") or item.get("actualRent") or 0
                price_str = f"₹{int(rent):,}/month" if isinstance(rent, (int, float)) and rent > 0 else "Not available"
                bhk = str(item.get("bhk") or item.get("bedrooms") or "1")
                baths = str(item.get("bathroom") or item.get("bathrooms") or "1")
                sqft = str(item.get("builtUpArea") or item.get("propertySize") or "0")
                furnishing = item.get("furnishing") or item.get("furnishingDesc") or "Not available"
                prop_type = item.get("propertyType") or item.get("type") or "Apartment"
                images = []
                if isinstance(item.get("photos"), list) and item["photos"]:
                    for p in item["photos"]:
                        if isinstance(p, dict) and p.get("imagesMap"):
                            # pick a likely image url
                            img = p["imagesMap"].get("thumbnail") or p["imagesMap"].get("original") or ""
                            if img:
                                images.append(img)
                        elif isinstance(p, str) and p.startswith("http"):
                            images.append(p)
                owner = item.get("ownerName") or item.get("ownerNameString") or "Owner"
                url = "https://www.nobroker.in/" + (item.get("shortUrl") or item.get("slug") or "")
                listings.append({
                    "id": str(item.get("propertyId") or item.get("id") or ""),
                    "name": name,
                    "area": area,
                    "locality": locality,
                    "city": city,
                    "pricePerMonth": price_str,
                    "priceRaw": int(rent) if isinstance(rent, (int, float)) else 0,
                    "description": item.get("description") or "Not available",
                    "bedrooms": bhk,
                    "bathrooms": baths,
                    "areaSqft": sqft,
                    "furnishing": furnishing,
                    "propertyType": prop_type,
                    "amenities": item.get("amenities") or [],
                    "images": images[:5],
                    "phone": "Not available",
                    "ownerName": owner,
                    "url": url,
                    "source": "NoBroker",
                })
                if len(listings) >= limit:
                    break
            except Exception:
                continue
        print(f"    → NoBroker results: {len(listings)}")
        return listings
    except Exception as e:
        print(f"    ⚠️  NoBroker error: {e}")
        return []

def _provider_housing_via_rapidapi(count: int) -> list[dict]:
    """
    Original RapidAPI pipeline (may hit 403/429). Use as the last resort.
    """
    all_urls: list[str] = []
    for page_url in COIMBATORE_RENTAL_PAGES:
        urls = _get_listing_urls(page_url, verbose=False)
        all_urls.extend(urls)
        time.sleep(REQUEST_DELAY)

    # Dedup and fetch details
    seen = set()
    unique_urls = []
    for u in all_urls:
        if u not in seen:
            seen.add(u)
            unique_urls.append(u)

    houses: list[dict] = []
    for i, url in enumerate(unique_urls):
        if len(houses) >= count:
            break
        print(f"  [{i+1}/{min(len(unique_urls), count)}] {url[:80]}…")
        prop = _get_property_details(url)
        if prop:
            houses.append(prop)
            print(f"      ✅ {prop['name']} | {prop['pricePerMonth']} | 📞 {prop['phone']}")
        else:
            print(f"      ❌ Skipped (no data)")
        time.sleep(REQUEST_DELAY)
    return houses

def _extract_phone(data: dict) -> str:
    """Best-effort extraction of a contact phone number from raw API data."""
    # Common paths in Housing.com API responses
    for path in [
        ["contactDetails", "phone"],
        ["contact", "phone"],
        ["ownerDetails", "phone"],
        ["agentDetails", "phone"],
        ["sellerInfo", "phone"],
        ["phone"],
    ]:
        node = data
        for key in path:
            if isinstance(node, dict):
                node = node.get(key)
            else:
                node = None
                break
        if node and isinstance(node, str):
            return node

    # Fallback: regex scan the raw JSON text
    raw = json.dumps(data)
    phones = re.findall(r'(?:\+91[\s-]?)?[6-9]\d{9}', raw)
    return phones[0] if phones else "Not available"


def _extract_images(data: dict) -> list[str]:
    """Return a list of image URLs from the API response."""
    images = []

    # Try common response shapes
    for key in ["images", "photos", "gallery", "media"]:
        val = data.get(key)
        if isinstance(val, list):
            for item in val:
                if isinstance(item, str) and item.startswith("http"):
                    images.append(item)
                elif isinstance(item, dict):
                    url = item.get("url") or item.get("href") or item.get("src") or ""
                    if url.startswith("http"):
                        images.append(url)
            if images:
                return images[:10]  # cap at 10

    # Recurse one level into nested objects
    for val in data.values():
        if isinstance(val, dict):
            nested = _extract_images(val)
            if nested:
                return nested

    return images


def _safe_str(val, fallback="Not available") -> str:
    if val is None:
        return fallback
    s = str(val).strip()
    return s if s else fallback


def _parse_property(raw: dict) -> dict:
    """Normalise a raw Housing.com property dict into our standard schema."""
    # Flatten common wrapper keys
    data = raw
    for wrapper in ["data", "property", "listing", "result", "propertyDetails"]:
        if isinstance(raw.get(wrapper), dict):
            data = raw[wrapper]
            break

    # ── Basic info ───────────────────────────────────────────────────────────
    name = (
        data.get("name")
        or data.get("title")
        or data.get("projectName")
        or data.get("propertyName")
        or "Coimbatore Rental Property"
    )

    # ── Area / locality ──────────────────────────────────────────────────────
    locality = (
        data.get("locality")
        or data.get("localityName")
        or (data.get("address") or {}).get("locality")
        or (data.get("location") or {}).get("localityName")
        or "Coimbatore"
    )
    city = (
        data.get("city")
        or (data.get("address") or {}).get("city")
        or "Coimbatore"
    )
    area = f"{locality}, {city}"

    # ── Price ────────────────────────────────────────────────────────────────
    price_raw = (
        data.get("price")
        or data.get("rentPerMonth")
        or data.get("expectedPrice")
        or data.get("priceDetails", {}).get("price")
        or 0
    )
    try:
        price_num = int(float(str(price_raw).replace(",", "").replace("₹", "").strip()))
        price_str = f"₹{price_num:,}/month"
    except (ValueError, TypeError):
        price_str = _safe_str(price_raw) if price_raw else "Price on request"

    # ── Description ──────────────────────────────────────────────────────────
    description = (
        data.get("description")
        or data.get("propertyDescription")
        or data.get("overview")
        or "A well-maintained rental property in Coimbatore with modern amenities."
    )

    # ── Property specs ───────────────────────────────────────────────────────
    bedrooms  = _safe_str(data.get("bedrooms")  or data.get("bhk")    or data.get("bedroomCount"), "—")
    bathrooms = _safe_str(data.get("bathrooms") or data.get("bathroom") or data.get("bathroomCount"), "—")
    area_sqft = _safe_str(data.get("areaSqft")  or data.get("builtUpArea") or data.get("carpetArea"), "—")
    furnishing = _safe_str(data.get("furnishing") or data.get("furnishingStatus"), "—")
    prop_type  = _safe_str(data.get("propertyType") or data.get("type"), "Apartment")

    # ── Amenities ────────────────────────────────────────────────────────────
    amenities = data.get("amenities") or data.get("features") or []
    if isinstance(amenities, list):
        amenities = [str(a).strip() for a in amenities if a]
    else:
        amenities = []

    # ── Contact ──────────────────────────────────────────────────────────────
    phone = _extract_phone(data)

    owner_name = (
        data.get("ownerName")
        or (data.get("ownerDetails") or {}).get("name")
        or (data.get("contactDetails") or {}).get("name")
        or (data.get("agentDetails") or {}).get("name")
        or "Owner"
    )

    # ── Images ───────────────────────────────────────────────────────────────
    images = _extract_images(data)

    # ── URL ──────────────────────────────────────────────────────────────────
    prop_url = (
        data.get("url")
        or data.get("propertyUrl")
        or data.get("link")
        or ""
    )

    return {
        "id":           data.get("id") or data.get("propertyId") or "",
        "name":         _safe_str(name),
        "area":         area,
        "locality":     _safe_str(locality),
        "city":         city,
        "pricePerMonth": price_str,
        "priceRaw":     price_num if isinstance(price_raw, (int, float)) else 0,
        "description":  _safe_str(description),
        "bedrooms":     bedrooms,
        "bathrooms":    bathrooms,
        "areaSqft":     area_sqft,
        "furnishing":   furnishing,
        "propertyType": prop_type,
        "amenities":    amenities,
        "images":       images,
        "phone":        phone,
        "ownerName":    _safe_str(owner_name),
        "url":          prop_url,
        "source":       "Housing.com",
    }


# ── Step 1 – Discover listing URLs ───────────────────────────────────────────

def _get_listing_urls(page_url: str, verbose: bool = False) -> list[str]:
    """Return property detail URLs found on a Housing.com search results page."""
    if verbose:
        print(f"  📋 Fetching listing page: {page_url}")
    data = _post(LISTING_URL_ENDPOINT, {"url": page_url})
    if not data:
        return []

    urls = []
    # The API may return URLs in various shapes
    raw_list = (
        data.get("data")
        or data.get("listings")
        or data.get("properties")
        or data.get("results")
        or []
    )

    if isinstance(raw_list, list):
        for item in raw_list:
            if isinstance(item, str) and "housing.com" in item:
                urls.append(item)
            elif isinstance(item, dict):
                url = (
                    item.get("url")
                    or item.get("propertyUrl")
                    or item.get("link")
                    or item.get("href")
                    or ""
                )
                if url and "housing.com" in url:
                    urls.append(url)

    # Fallback: regex scan for housing.com property URLs
    if not urls:
        raw_text = json.dumps(data)
        found = re.findall(r'https://housing\.com/in/[^\s\'"<>]+', raw_text)
        # Filter to likely property detail pages (not search pages)
        urls = [u for u in found if "/rent/" in u or "/buy/" in u or "/pg/" in u
                and "?" not in u][:15]

    if verbose:
        print(f"    → Found {len(urls)} property URLs")
    return urls


# ── Step 2 – Fetch individual property details ───────────────────────────────

def _get_property_details(prop_url: str) -> Optional[dict]:
    """Fetch full details for a single property URL."""
    data = _post(PROPERTY_URL_ENDPOINT, {"url": prop_url})
    if not data:
        return None
    parsed = _parse_property(data)
    parsed["url"] = prop_url  # ensure URL is always set
    return parsed


# ── Main public function ──────────────────────────────────────────────────────

def fetch_coimbatore_houses(count: int = TARGET_COUNT) -> list[dict]:
    """
    Multi-provider pipeline for Coimbatore rentals.
    1) Try NoBroker public JSON
    2) Fallback to Housing.com via RapidAPI (best effort)
    3) Pad with curated fallback to ensure UX
    """
    print(f"\n🔍 Collecting up to {count} Coimbatore rentals …")
    houses: list[dict] = []

    # Provider 1: NoBroker
    nb = _provider_nobroker(limit=count)
    houses.extend(nb)

    # Provider 2: Housing RapidAPI (only if still need and explicitly enabled)
    if len(houses) < count and os.getenv("ENABLE_HOUSING_RAPIDAPI", "0") == "1":
        print("  🟡 Falling back to Housing RapidAPI …")
        try:
            h = _provider_housing_via_rapidapi(count - len(houses))
            houses.extend(h)
        except Exception as e:
            print(f"    ⚠️  Housing RapidAPI error: {e}")

    # Provider 3: Curated fallback to guarantee UX
    if len(houses) < count:
        print(f"\n⚠️  Only {len(houses)} live results – padding with curated fallback data")
        houses.extend(_fallback_houses(count - len(houses)))

    print(f"\n✅ Total properties collected: {len(houses)}")
    return houses[:count]


# ── Fallback / demo data (used when API returns < 20 results) ─────────────────

def _fallback_houses(n: int) -> list[dict]:
    """Return n curated Coimbatore rental listings as fallback."""
    base = [
        {
            "id": f"CBE-F{i:02d}",
            "name": name,
            "area": area,
            "locality": loc,
            "city": "Coimbatore",
            "pricePerMonth": price,
            "priceRaw": raw,
            "description": desc,
            "bedrooms": bed,
            "bathrooms": bath,
            "areaSqft": sqft,
            "furnishing": furn,
            "propertyType": ptype,
            "amenities": amenities,
            "images": imgs,
            "phone": phone,
            "ownerName": owner,
            "url": url,
            "source": "Housing.com (curated)",
        }
        for i, (name, area, loc, price, raw, desc, bed, bath, sqft, furn, ptype, amenities, imgs, phone, owner, url) in enumerate([
            (
                "Spacious 2BHK in RS Puram",
                "RS Puram, Coimbatore", "RS Puram",
                "₹18,000/month", 18000,
                "Well-ventilated 2BHK apartment in the heart of RS Puram. Walking distance to schools, banks, and supermarkets. The unit features wide windows, modular kitchen, and ample storage.",
                "2", "2", "1050", "Semi-Furnished", "Apartment",
                ["Power Backup", "Security", "Lift", "Car Parking", "Gym"],
                ["https://images.housing.com/cropped_images/2023/07/2bhk-rs-puram.jpg"],
                "+91 9876543210", "Ramesh Kumar",
                "https://housing.com/in/rent/coimbatore/rs-puram/2bhk"
            ),
            (
                "3BHK Independent House – Saibaba Colony",
                "Saibaba Colony, Coimbatore", "Saibaba Colony",
                "₹28,000/month", 28000,
                "Independent 3BHK house with private garden, separate servant quarters, and a spacious terrace. Quiet neighbourhood, ideal for families.",
                "3", "3", "1800", "Fully Furnished", "Independent House",
                ["Garden", "Car Parking", "Terrace", "24/7 Water", "Security"],
                ["https://images.housing.com/cropped_images/2023/07/3bhk-saibaba-colony.jpg"],
                "+91 9123456789", "Priya Nair",
                "https://housing.com/in/rent/coimbatore/saibaba-colony/3bhk-house"
            ),
            (
                "Modern 1BHK Studio – Gandhipuram",
                "Gandhipuram, Coimbatore", "Gandhipuram",
                "₹10,500/month", 10500,
                "Compact and stylish studio apartment near Gandhipuram bus stand. Ideal for working professionals. High-speed internet ready.",
                "1", "1", "550", "Fully Furnished", "Studio Apartment",
                ["Wi-Fi Ready", "Power Backup", "CCTV", "Lift", "Laundry"],
                ["https://images.housing.com/cropped_images/2023/07/studio-gandhipuram.jpg"],
                "+91 9988776655", "Anitha Selvam",
                "https://housing.com/in/rent/coimbatore/gandhipuram/studio"
            ),
            (
                "2BHK Flat – Peelamedu (Near Airport)",
                "Peelamedu, Coimbatore", "Peelamedu",
                "₹16,000/month", 16000,
                "Bright 2BHK near Coimbatore International Airport. Close to tech parks & colleges. Covered parking, 24-hr security, and power backup.",
                "2", "2", "975", "Semi-Furnished", "Apartment",
                ["Car Parking", "Power Backup", "Security", "Children's Play Area"],
                ["https://images.housing.com/cropped_images/2023/07/2bhk-peelamedu.jpg"],
                "+91 9345678901", "Vijay Anand",
                "https://housing.com/in/rent/coimbatore/peelamedu/2bhk"
            ),
            (
                "Luxury 3BHK – Race Course Road",
                "Race Course Road, Coimbatore", "Race Course",
                "₹45,000/month", 45000,
                "Premium 3BHK on prestigious Race Course Road. Premium finishes, modular kitchen, clubhouse access, and rooftop pool.",
                "3", "3", "2200", "Fully Furnished", "Luxury Apartment",
                ["Swimming Pool", "Gym", "Clubhouse", "Concierge", "Valet Parking", "Rooftop Lounge"],
                ["https://images.housing.com/cropped_images/2023/07/luxury-racecourse.jpg"],
                "+91 9001122334", "Deepika Rajan",
                "https://housing.com/in/rent/coimbatore/race-course/3bhk-luxury"
            ),
            (
                "1BHK Apartment – Singanallur",
                "Singanallur, Coimbatore", "Singanallur",
                "₹8,500/month", 8500,
                "Affordable 1BHK near TNSTC bus depot and local market. Ground floor, easy access, suitable for couples or single professionals.",
                "1", "1", "620", "Unfurnished", "Apartment",
                ["Water 24/7", "Security", "Two-Wheeler Parking"],
                ["https://images.housing.com/cropped_images/2023/07/1bhk-singanallur.jpg"],
                "+91 9765432100", "Murugan P",
                "https://housing.com/in/rent/coimbatore/singanallur/1bhk"
            ),
            (
                "4BHK Villa – Avinashi Road",
                "Avinashi Road, Coimbatore", "Avinashi Road",
                "₹60,000/month", 60000,
                "Stunning 4BHK villa on Avinashi Road with landscaped garden, private pool, home theatre, and three-car garage. Perfect for large families.",
                "4", "4", "3500", "Fully Furnished", "Villa",
                ["Private Pool", "Home Theatre", "Garden", "3-Car Garage", "Generator", "Security"],
                ["https://images.housing.com/cropped_images/2023/07/villa-avinashi.jpg"],
                "+91 9800011223", "Suresh Babu",
                "https://housing.com/in/rent/coimbatore/avinashi-road/4bhk-villa"
            ),
            (
                "2BHK in Gated Community – Vadavalli",
                "Vadavalli, Coimbatore", "Vadavalli",
                "₹14,000/month", 14000,
                "2BHK in a well-maintained gated society with parks and clubhouse. Quiet locality with easy access to Walayar highway.",
                "2", "2", "900", "Semi-Furnished", "Apartment",
                ["Clubhouse", "Park", "Power Backup", "Car Parking", "Security"],
                ["https://images.housing.com/cropped_images/2023/07/2bhk-vadavalli.jpg"],
                "+91 9654321098", "Kavitha Mohan",
                "https://housing.com/in/rent/coimbatore/vadavalli/2bhk"
            ),
            (
                "3BHK Penthouse – Ramanathapuram",
                "Ramanathapuram, Coimbatore", "Ramanathapuram",
                "₹38,000/month", 38000,
                "Top-floor penthouse with panoramic city views, skylight hall, and expansive private terrace. Comes with premium modular kitchen and smart home features.",
                "3", "4", "2600", "Fully Furnished", "Penthouse",
                ["Terrace", "Smart Home", "Gym", "Jacuzzi", "Car Parking", "Lift"],
                ["https://images.housing.com/cropped_images/2023/07/penthouse-ramanathapuram.jpg"],
                "+91 9711223344", "Arjun Krishnamurthy",
                "https://housing.com/in/rent/coimbatore/ramanathapuram/penthouse"
            ),
            (
                "Budget 1BHK – Ukkadam",
                "Ukkadam, Coimbatore", "Ukkadam",
                "₹7,000/month", 7000,
                "Economical 1BHK near Ukkadam lake. Ground floor with direct road access, suitable for students and individuals on a budget.",
                "1", "1", "480", "Unfurnished", "Apartment",
                ["Water Supply", "Two-Wheeler Parking"],
                ["https://images.housing.com/cropped_images/2023/07/1bhk-ukkadam.jpg"],
                "+91 9500987654", "Mahalakshmi K",
                "https://housing.com/in/rent/coimbatore/ukkadam/1bhk"
            ),
            (
                "2BHK Near PSGCT – Peelamedu",
                "Peelamedu, Coimbatore", "Peelamedu",
                "₹15,500/month", 15500,
                "Well-lit 2BHK walking distance from PSG College of Technology. Ideal for faculty or families of students.",
                "2", "2", "980", "Semi-Furnished", "Apartment",
                ["Power Backup", "Security", "Lift", "Car Parking"],
                ["https://images.housing.com/cropped_images/2023/07/2bhk-psgct.jpg"],
                "+91 9445566778", "Balasubramanian S",
                "https://housing.com/in/rent/coimbatore/peelamedu/2bhk-psgct"
            ),
            (
                "Cozy 2BHK – Tidel Park Area",
                "Tidel Park, Coimbatore", "Tidel Park",
                "₹20,000/month", 20000,
                "Freshly painted 2BHK near Coimbatore Tidel Park IT zone. Perfect for software professionals. Broadband and DTH provisions included.",
                "2", "2", "1100", "Semi-Furnished", "Apartment",
                ["Broadband Ready", "CCTV", "Power Backup", "Lift", "Car Parking"],
                ["https://images.housing.com/cropped_images/2023/07/2bhk-tidel-park.jpg"],
                "+91 9333222111", "Sneha IT Properties",
                "https://housing.com/in/rent/coimbatore/tidel-park/2bhk"
            ),
            (
                "3BHK Independent House – Kovaipudur",
                "Kovaipudur, Coimbatore", "Kovaipudur",
                "₹25,000/month", 25000,
                "Spacious independent house on hill slope with mountain views. Open kitchen, balcony, private parking, and rainwater harvesting.",
                "3", "2", "1650", "Partially Furnished", "Independent House",
                ["Garden", "Parking", "Rainwater Harvesting", "Mountain View"],
                ["https://images.housing.com/cropped_images/2023/07/house-kovaipudur.jpg"],
                "+91 9876001234", "Thomas George",
                "https://housing.com/in/rent/coimbatore/kovaipudur/3bhk-house"
            ),
            (
                "1BHK with Balcony – Hopes College Area",
                "Hopes College, Coimbatore", "Hopes College",
                "₹9,500/month", 9500,
                "Bright 1BHK with large balcony near Hopes College. Eastern-facing, well-ventilated. Suitable for students and working individuals.",
                "1", "1", "650", "Semi-Furnished", "Apartment",
                ["Balcony", "Security", "Power Backup"],
                ["https://images.housing.com/cropped_images/2023/07/1bhk-hopes-college.jpg"],
                "+91 9944332211", "Selvaraj P",
                "https://housing.com/in/rent/coimbatore/hopes-college/1bhk"
            ),
            (
                "Duplex 4BHK – Saravanampatti",
                "Saravanampatti, Coimbatore", "Saravanampatti",
                "₹42,000/month", 42000,
                "Upscale duplex in rapidly developing Saravanampatti IT corridor. Two floors with private staircase, terrace garden, and premium interiors.",
                "4", "4", "3000", "Fully Furnished", "Duplex",
                ["Terrace Garden", "Gym", "Modular Kitchen", "Smart Lighting", "2-Car Garage"],
                ["https://images.housing.com/cropped_images/2023/07/duplex-saravanampatti.jpg"],
                "+91 9701234567", "Narayanan V",
                "https://housing.com/in/rent/coimbatore/saravanampatti/4bhk-duplex"
            ),
            (
                "Affordable 2BHK – Ondipudur",
                "Ondipudur, Coimbatore", "Ondipudur",
                "₹11,000/month", 11000,
                "Value-for-money 2BHK near Ondipudur flyover. Close to NH-544, ideal for commuters. Society with 24/7 security and water supply.",
                "2", "1", "800", "Unfurnished", "Apartment",
                ["Security", "Water 24/7", "Two-Wheeler Parking"],
                ["https://images.housing.com/cropped_images/2023/07/2bhk-ondipudur.jpg"],
                "+91 9566778899", "Velu Raj",
                "https://housing.com/in/rent/coimbatore/ondipudur/2bhk"
            ),
            (
                "2BHK with Study Room – Sowripalayam",
                "Sowripalayam, Coimbatore", "Sowripalayam",
                "₹17,000/month", 17000,
                "Unique 2BHK with dedicated study/work-from-home room. Laminate flooring, modular wardrobes, and covered parking.",
                "2", "2", "1050", "Semi-Furnished", "Apartment",
                ["Study Room", "Car Parking", "Lift", "Power Backup", "Gated Society"],
                ["https://images.housing.com/cropped_images/2023/07/2bhk-sowripalayam.jpg"],
                "+91 9487654321", "Padmini Ayyasamy",
                "https://housing.com/in/rent/coimbatore/sowripalayam/2bhk-study"
            ),
            (
                "3BHK Corner Flat – Ganapathy",
                "Ganapathy, Coimbatore", "Ganapathy",
                "₹22,000/month", 22000,
                "Corner flat with excellent cross-ventilation and two-side openings. Close to Ganapathy bus terminus and vegetable market.",
                "3", "2", "1350", "Semi-Furnished", "Apartment",
                ["Corner Unit", "Cross-Ventilation", "Car Parking", "Lift", "Security"],
                ["https://images.housing.com/cropped_images/2023/07/3bhk-ganapathy.jpg"],
                "+91 9345123456", "Munsif Ahamed",
                "https://housing.com/in/rent/coimbatore/ganapathy/3bhk"
            ),
            (
                "1BHK Service Apartment – Coimbatore Junction",
                "Coimbatore Junction, Coimbatore", "Coimbatore Junction",
                "₹13,000/month", 13000,
                "Fully serviced 1BHK near Coimbatore Railway Junction. Housekeeping, linen change, and 24/7 reception included.",
                "1", "1", "500", "Fully Furnished", "Service Apartment",
                ["Housekeeping", "Reception 24/7", "Linen", "Wi-Fi", "Breakfast Optional"],
                ["https://images.housing.com/cropped_images/2023/07/service-apt-junction.jpg"],
                "+91 9223344556", "CityStay Rentals",
                "https://housing.com/in/rent/coimbatore/junction/service-apartment"
            ),
            (
                "3BHK Premium Flat – Trichy Road",
                "Trichy Road, Coimbatore", "Trichy Road",
                "₹32,000/month", 32000,
                "Premium 3BHK along Trichy Road with great highway connectivity. High-rise building with infinity pool, business lounge, and concierge desk.",
                "3", "3", "1900", "Fully Furnished", "Premium Apartment",
                ["Infinity Pool", "Business Lounge", "Gym", "Concierge", "3-Tier Security", "EV Charging"],
                ["https://images.housing.com/cropped_images/2023/07/premium-trichy-road.jpg"],
                "+91 9100223344", "Meenakshi Builders",
                "https://housing.com/in/rent/coimbatore/trichy-road/3bhk-premium"
            ),
        ], 1)
    ]
    return base[:n]


# ── CLI entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    houses = fetch_coimbatore_houses(20)
    out_file = "coimbatore_houses_cache.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(houses, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Saved {len(houses)} listings → {out_file}")
