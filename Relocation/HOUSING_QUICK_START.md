# 🏠 Quick Start - Housing API Integration

## ⚡ 3 Steps to Get Real Coimbatore Houses

### Step 1: Fetch Housing Data
```bash
cd backend
python fetch_housing_data.py
```
This fetches 30+ real houses from Housing.com with photos and descriptions.

### Step 2: Restart Backend
```bash
python run.py
```

### Step 3: View Houses
Open app → Dashboard → **Houses on Rent**

## ✅ What You'll See

- **30+ Real Houses** from Coimbatore
- **Multiple Photos** per property (up to 10)
- **Full Descriptions** with amenities
- **Pricing** in INR (₹12,000 - ₹25,000/month)
- **Contact Numbers** for inquiries
- **Locations** in Gandhipuram, RS Puram, Saravanampatti, etc.

## 🎯 Features

- **Search** by name, area, or description
- **Click** any house for full details
- **Photo Carousel** with auto-play
- **View on Maps** button
- **Direct Link** to Housing.com listing

## 🔧 If Something Breaks

### No houses showing?
```bash
# Check if cache exists
ls backend/coimbatore_houses_cache.json

# If not, fetch again
cd backend
python fetch_housing_data.py
```

### API rate limit?
Don't worry! Cached data will be used automatically.

### Want fresh data?
```bash
# Delete cache and refetch
rm backend/coimbatore_houses_cache.json
python fetch_housing_data.py
```

## 📚 Full Documentation
See `HOUSING_API_INTEGRATION.md` for complete details.

## ✨ What Was Added

✅ RapidAPI Housing.com integration
✅ 30+ real Coimbatore houses
✅ Multiple photos per property
✅ Detailed descriptions
✅ Smart caching system
✅ Fallback data
✅ Search functionality

## 🎉 Done!
Your Houses on Rent page now shows real properties with complete information!
