# 🚀 Quick Start - Travel Optimizer

## ⚡ Start Backend (Required!)
```bash
# Windows - Double click this file:
start-backend.bat

# OR manually:
cd backend
python run.py
```

## ✅ Verify Backend
Open: http://localhost:8000
Should see: `{"message":"NammaWay AI Backend (Postage-lite) is running!"}`

## 🎯 Use Travel Optimizer

### 1️⃣ Find Best Areas
- Enter workplace: "TIDEL Park" or "Gandhipuram"
- Click "Find Best Areas"
- See top 3 areas with commute options

### 2️⃣ Get Directions
- From: "Gandhipuram Bus Stand"
- To: "TIDEL Park Coimbatore"
- Click "Get Directions"
- Choose: Cheapest / Balanced / Fastest

## 🔧 If Something Breaks

### Error: "Unable to fetch travel advice"
→ Backend not running. Run `start-backend.bat`

### Error: 500 Internal Server Error
→ Restart backend: Stop (Ctrl+C) then run `start-backend.bat`

### No areas showing
→ Enter workplace and click "Find Best Areas"

## 📚 Full Documentation
- `TRAVEL_OPTIMIZER_SUMMARY.md` - Complete details
- `TRAVEL_OPTIMIZER_FIX.md` - Troubleshooting guide
- `RESTART_BACKEND.md` - Backend restart instructions

## ✨ What's Fixed
✅ Added GROQ_API_KEY to backend
✅ Added bus route fallback data
✅ Added workplace input UI
✅ Added error handling
✅ Created helper scripts

## 🎉 Ready to Use!
Everything should work now. Just start the backend and enjoy!
