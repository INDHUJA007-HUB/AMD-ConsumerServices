# 🏠 Housing API Integration - Complete Guide

## Overview
Integrated Housing.com API via RapidAPI to fetch real Coimbatore house rental listings with photos and detailed descriptions.

## What Was Added

### 1. Backend Components

#### `backend/housing_scraper.py`
- Fetches house listings from Housing.com via RapidAPI
- Scrapes multiple Coimbatore rental pages
- Fetches detailed property information including:
  - Multiple photos (up to 10 per property)
  - Full descriptions
  - Amenities
  - Contact information
  - Pricing
  - Location details
- Implements caching to avoid repeated API calls
- Provides fallback data when API is unavailable

#### `backend/main.py` - New Endpoint
```python
GET /housing/coimbatore
```
Returns 30+ house rental listings for Coimbatore with full details.

#### `backend/.env` - Added API Key
```
RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY_HERE
```

### 2. Frontend Updates

#### `src/services/datasetsApi.ts`
- Updated `loadHouses()` to fetch from new Housing API endpoint
- Implements fallback to existing accommodations data
- Handles errors gracefully

### 3. Helper Scripts

#### `backend/fetch_housing_data.py`
Script to manually fetch and cache housing data.

## How to Use

### Step 1: Fetch Housing Data

**Option A: Automatic (when backend starts)**
The data will be fetched automatically when you access the Houses on Rent page.

**Option B: Manual Pre-fetch**
```bash
cd backend
python fetch_housing_data.py
```

This will:
- Fetch 30+ houses from Housing.com
- Display sample listings
- Cache data to `coimbatore_houses_cache.json`
- Show statistics

### Step 2: Restart Backend
```bash
cd backend
python run.py
```

### Step 3: View Houses
1. Open your app
2. Navigate to Dashboard → Houses on Rent
3. See 30+ real Coimbatore rental listings with:
   - Multiple photos per property
   - Detailed descriptions
   - Pricing information
   - Location details
   - Contact information
   - Ratings and reviews

## API Details

### RapidAPI Housing API

**Endpoints Used:**

1. **List Properties**
   ```
   POST https://housing-api.p.rapidapi.com/scrapers/api/housing/property/listing-by-url
   ```
   - Fetches property listings from a Housing.com URL
   - Returns basic info: title, price, location, images

2. **Get Property Details**
   ```
   POST https://housing-api.p.rapidapi.com/scrapers/api/housing/property/get-by-url
   ```
   - Fetches detailed info for a specific property
   - Returns: full description, all images, amenities, address

**Headers Required:**
```json
{
  "Content-Type": "application/json",
  "x-rapidapi-host": "housing-api.p.rapidapi.com",
  "x-rapidapi-key": "YOUR_API_KEY"
}
```

### Data Structure

Each house object contains:
```typescript
{
  id: string;
  name: string;                    // Property title
  area: string;                    // Coimbatore area (Gandhipuram, RS Puram, etc.)
  latitude: number;
  longitude: number;
  listingUrl: string;              // Link to Housing.com listing
  images: string[];                // Array of image URLs (up to 10)
  pricePerMonth: string;           // Formatted price (₹15,000/month)
  roomType: string;                // 1BHK, 2BHK, 3BHK, etc.
  rating: number;                  // 0-5 rating
  reviewCount: string;             // Number of reviews
  contactNumber: string;           // Contact phone
  distanceToCityCenterKm: number;
  description: string;             // Full property description
  amenities?: string[];            // List of amenities
  fullAddress?: string;            // Complete address
}
```

## Features

### ✅ Real Data from Housing.com
- Actual Coimbatore rental properties
- Current market prices
- Real photos from listings
- Genuine contact information

### ✅ Rich Property Information
- **Multiple Photos**: Up to 10 high-quality images per property
- **Detailed Descriptions**: Full property descriptions with amenities
- **Pricing**: Clear monthly rent in INR
- **Location**: Specific Coimbatore areas with coordinates
- **Contact**: Phone numbers for inquiries
- **Ratings**: User ratings and review counts

### ✅ Smart Caching
- First fetch caches data to `coimbatore_houses_cache.json`
- Subsequent requests use cached data (faster, no API calls)
- Cache persists across backend restarts
- Manual refresh available via `fetch_housing_data.py`

### ✅ Fallback System
- If API fails, uses fallback data
- Ensures app always shows houses
- Graceful degradation

### ✅ UI Features
- Search by name, area, or description
- Click any house to see full details
- Photo carousel with auto-play
- View on Google Maps
- Direct link to Housing.com listing
- Responsive design

## Coimbatore Areas Covered

The scraper targets these popular Coimbatore areas:
- Gandhipuram (City Center)
- RS Puram (Premium residential)
- Saravanampatti (IT Hub area)
- Peelamedu (Near Airport)
- Vadavalli (Residential)
- Race Course (Central)
- Singanallur (Industrial area)
- Town Hall (Commercial)

## API Limits & Costs

**RapidAPI Free Tier:**
- Limited requests per month
- Check your RapidAPI dashboard for usage
- Consider upgrading if you need more requests

**Caching Strategy:**
- Reduces API calls significantly
- Cache refreshes only when needed
- Manual refresh option available

## Troubleshooting

### Issue: No houses showing
**Solution:**
1. Check backend logs for errors
2. Verify RAPIDAPI_KEY in `backend/.env`
3. Run `python fetch_housing_data.py` manually
4. Check if cache file exists: `coimbatore_houses_cache.json`

### Issue: API rate limit exceeded
**Solution:**
1. Use cached data (automatic)
2. Wait for rate limit reset
3. Consider upgrading RapidAPI plan

### Issue: Images not loading
**Solution:**
1. Check internet connection
2. Verify image URLs in data
3. Check browser console for CORS errors

### Issue: Old data showing
**Solution:**
1. Delete `coimbatore_houses_cache.json`
2. Run `python fetch_housing_data.py`
3. Restart backend

## Testing

### Test the Scraper
```bash
cd backend
python housing_scraper.py
```

### Test the Endpoint
```bash
curl http://localhost:8000/housing/coimbatore
```

### Test the Frontend
1. Open app
2. Go to Houses on Rent page
3. Should see 30+ houses
4. Click any house to see details
5. Verify photos load
6. Check descriptions are complete

## Performance

- **First Load**: 10-30 seconds (fetching from API)
- **Cached Load**: < 1 second
- **Images**: Lazy loaded for performance
- **Search**: Instant client-side filtering

## Future Enhancements

Potential improvements:
1. Auto-refresh cache daily
2. Add more Coimbatore areas
3. Filter by price range
4. Filter by BHK type
5. Sort by price/rating
6. Save favorites
7. Compare properties
8. Virtual tours
9. Booking integration
10. Price trends

## Files Modified/Created

### Created:
- ✅ `backend/housing_scraper.py` - Main scraper logic
- ✅ `backend/fetch_housing_data.py` - Manual fetch script
- ✅ `HOUSING_API_INTEGRATION.md` - This documentation

### Modified:
- ✅ `backend/.env` - Added RAPIDAPI_KEY
- ✅ `backend/main.py` - Added /housing/coimbatore endpoint
- ✅ `src/services/datasetsApi.ts` - Updated loadHouses()

### Generated (at runtime):
- `backend/coimbatore_houses_cache.json` - Cached housing data

## Quick Start Checklist

- [ ] RAPIDAPI_KEY added to `backend/.env`
- [ ] Backend restarted
- [ ] Run `python fetch_housing_data.py` (optional)
- [ ] Open Houses on Rent page
- [ ] Verify 30+ houses showing
- [ ] Click a house to see details
- [ ] Verify photos load
- [ ] Check descriptions are complete
- [ ] Test search functionality

## Support

If you encounter issues:
1. Check backend logs for errors
2. Verify API key is correct
3. Check RapidAPI dashboard for usage/limits
4. Try manual fetch: `python fetch_housing_data.py`
5. Check cache file exists and is valid JSON
6. Restart backend after any .env changes

## Success Criteria

✅ 30+ houses loaded
✅ Each house has multiple photos
✅ Descriptions are detailed and complete
✅ Prices are in INR format
✅ Areas are Coimbatore-specific
✅ Contact information available
✅ Search works correctly
✅ Detail view shows all information
✅ Photo carousel works
✅ Links to Housing.com work

## 🎉 Ready!

Your Houses on Rent page now shows real Coimbatore rental properties with complete information and photos!
