from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
import requests
import json
from dotenv import load_dotenv
import threading
import pandas as pd
from fastapi import Query
try:
    from . import models, database, auth
    from .database import engine, get_db
    from .auth import verify_password, get_password_hash, create_access_token
    from . import housing_scraper
    from . import amenity_search
except ImportError:
    import models, database, auth
    from database import engine, get_db
    from auth import verify_password, get_password_hash, create_access_token
    import housing_scraper
    import amenity_search
from sqlalchemy import func
from pydantic import BaseModel
from datetime import timedelta
import math
from typing import Optional, Literal

try:
    from . import vibe_match as vm
except Exception:
    import vibe_match as vm

load_dotenv()

app = FastAPI(title="NammaWay AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    starting_location: str = None
    workplace: str = None
    purpose: str = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PredictionRequest(BaseModel):
    rent: float
    food_index: float
    utility_index: float
    lifestyle_multiplier: float
    dist_to_center: float
    ac_hours: float
    selected_stay: dict = None
    nearby_premium: List[str] = []

class OptimizationRequest(BaseModel):
    params: PredictionRequest

class DigitalFootprint(BaseModel):
    social_pace: float
    career_stage: Literal["student", "early", "mid", "senior"]
    industry: Literal["tech", "finance", "manufacturing", "healthcare", "edu", "other"]
    hobbies: list[str] = []
    weekend_focus: Literal["outdoors", "cafes", "nightlife", "family"]
    commute_mode: Literal["bus", "bike", "car", "walk"]
    summary: Optional[str] = None

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

@app.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered. Please use a different email or login.")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        full_name=user.full_name,
        starting_location=user.starting_location,
        workplace=user.workplace,
        purpose=user.purpose
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered. Please use a different email or login.")
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/")
def read_root():
    return {"message": "NammaWay AI Backend (Postage-lite) is running!"}

def calculate_distance(lat1, lon1, lat2, lon2):
    # Basic Pythagorean approximation for short distances
    # x = (lon2 - lon1) * cos(lat1)
    # y = (lat2 - lat1)
    # d = sqrt(x^2 + y^2) * R
    R = 6371000 # Meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    lambda1 = math.radians(lon1)
    lambda2 = math.radians(lon2)
    
    x = (lambda2 - lambda1) * math.cos((phi1 + phi2) / 2)
    y = (phi2 - phi1)
    return math.sqrt(x*x + y*y) * R

@app.get("/accommodations/", response_model=List[dict])
def get_accommodations(
    lat: float = None, 
    lon: float = None, 
    radius_meters: int = 5000, 
    db: Session = Depends(get_db)
):
    results = db.query(models.Accommodation).all()
    
    if lat is not None and lon is not None:
        # Client-side style filtering in Python for now (since no PostGIS)
        filtered = []
        for a in results:
            dist = calculate_distance(lat, lon, a.latitude, a.longitude)
            if dist <= radius_meters:
                acc_dict = {
                    "id": a.id,
                    "name": a.name,
                    "type": a.type,
                    "rent_price": float(a.rent_price),
                    "latitude": a.latitude,
                    "longitude": a.longitude,
                    "safety_score": a.safety_score,
                    "distance_meters": round(dist, 2)
                }
                filtered.append(acc_dict)
        return filtered
    
    return [
        {
            "id": a.id,
            "name": a.name,
            "type": a.type,
            "rent_price": float(a.rent_price),
            "latitude": a.latitude,
            "longitude": a.longitude,
            "safety_score": a.safety_score
        } for a in results
    ]

@app.get("/nearest-bus-stop/")
def get_nearest_bus_stop(lat: float, lon: float, db: Session = Depends(get_db)):
    stops = db.query(models.Amenity).filter(models.Amenity.type == "Bus Stop").all()
    if not stops:
        raise HTTPException(status_code=404, detail="No bus stops found")
    
    nearest = min(stops, key=lambda s: calculate_distance(lat, lon, s.latitude, s.longitude))
    dist = calculate_distance(lat, lon, nearest.latitude, nearest.longitude)
    
    return {
        "stop_name": nearest.name,
        "distance_meters": round(dist, 2)
    }

@app.get("/proximity-optimizer/")
def proximity_optimizer(lat: float, lon: float, db: Session = Depends(get_db)):
    tidel_park_lat, tidel_park_lon = 11.0247, 77.0257
    dist_to_tidel = calculate_distance(lat, lon, tidel_park_lat, tidel_park_lon)
    
    stops = db.query(models.Amenity).filter(models.Amenity.type == "Bus Stop").all()
    if stops:
        nearest_bus = min(stops, key=lambda s: calculate_distance(lat, lon, s.latitude, s.longitude))
        bus_dist = calculate_distance(lat, lon, nearest_bus.latitude, nearest_bus.longitude)
    else:
        nearest_bus = None
        bus_dist = None
    
    return {
        "tidel_park_distance_meters": round(dist_to_tidel, 2),
        "nearest_bus_stop": nearest_bus.name if nearest_bus else "N/A",
        "bus_stop_distance_meters": round(bus_dist, 2) if bus_dist else None,
        "accessibility_score": max(0, 100 - (bus_dist/20 if bus_dist else 50))
    }

@app.post("/predict")
def predict_cost(req: PredictionRequest):
    # ML Prediction Logic (Simplified XGBoost simulation)
    # TNEB Slab Logic: < 100 units (free/cheap), > 500 units (premium)
    base_rent = req.rent
    
    # Calculate energy units based on AC hours
    units_consumed = 150 + (req.ac_hours * 2.5 * 30) # base + ac consumption
    
    # TNEB Slabs (approximated)
    if units_consumed <= 100:
        elec_bill = units_consumed * 0 # Free
    elif units_consumed <= 500:
        elec_bill = units_consumed * 4.5
    else:
        elec_bill = units_consumed * 6.6 + 500 # Penalty slab
        
    est_food = req.food_index * 30 * req.lifestyle_multiplier
    
    predicted_cost = base_rent + elec_bill + est_food + (req.utility_index * req.lifestyle_multiplier)
    
    # Add distance penalty
    dist_impact = req.dist_to_center * 350
    predicted_cost += dist_impact
    
    # SHAP Explanations (Impact of each feature)
    explanations = {
        "base_rent": base_rent,
        "electricity": elec_bill,
        "food_preference": est_food - req.food_index * 30,
        "commute_distance": dist_impact,
        "lifestyle": (req.lifestyle_multiplier - 1.0) * 5000
    }
    
    return {
        "predicted_cost": round(predicted_cost, 2),
        "breakdown": {
            "base_rent": base_rent,
            "electricity_bill": round(elec_bill, 2),
            "estimated_food": round(est_food, 2)
        },
        "explanations": explanations,
        "ai_summary": f"Your stay at {req.selected_stay.get('name', 'this location') if req.selected_stay else 'this location'} will cost approx ₹{round(predicted_cost):,} per month. AC usage places you in a { 'high' if units_consumed > 500 else 'moderate' } energy slab.",
        "units_consumed": round(units_consumed, 1)
    }

@app.post("/optimize")
def optimize_scenario(req: OptimizationRequest):
    # "The Budget Saver" Optimization
    params = req.params
    optimizations = []
    
    if params.ac_hours > 4:
        savings = (params.ac_hours - 4) * 30 * 2.5 * 6.6
        optimizations.append({
            "type": "Energy Saver",
            "suggestion": "Reduce AC usage by 2 hours daily to drop to a lower TNEB tax slab.",
            "savings": round(savings, 2)
        })
        
    if params.dist_to_center > 5:
        optimizations.append({
            "type": "Commute Optimization",
            "suggestion": "Consider a location within 3km of Tidul Park to save on daily fuel/transit costs.",
            "savings": 2500.0
        })
        
    if not optimizations:
        optimizations.append({
            "type": "General Tip",
            "suggestion": "Your current configuration is already quite optimized for Coimbatore.",
            "savings": 0
        })
        
    return {"optimizations": optimizations}

# ---------------------------
# Vibe-Match Neighbor Engine
# ---------------------------

@app.post("/vibe-match")
def vibe_match(fp: DigitalFootprint):
    try:
        rankings = vm.rank_neighborhoods(fp.dict())
        return {"results": rankings, "explanations_version": "v1"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"vibe-match error: {e}")

@app.get("/vibe-neighborhoods")
def vibe_neighborhoods():
    try:
        return {"neighborhoods": vm.list_neighborhoods()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"vibe-neighborhoods error: {e}")

class VibeFeedback(BaseModel):
    neighborhood: str
    liked: bool

_feedback_buffer: list[dict] = []

@app.post("/vibe-feedback")
def vibe_feedback(body: VibeFeedback):
    rec = {"neighborhood": body.neighborhood, "liked": body.liked}
    _feedback_buffer.append(rec)
    # Best-effort append to a local file for offline review
    try:
        with open("vibe_feedback.log", "a", encoding="utf-8") as f:
            f.write(f"{rec}\n")
    except Exception:
        pass
    return {"ok": True}

# ---------------------------
# Housing API Integration
# ---------------------------

@app.get("/housing/coimbatore")
def get_coimbatore_houses():
    """Fetch house rental listings for Coimbatore from Housing.com"""
    try:
        houses = housing_scraper.fetch_coimbatore_houses()
        # Save asynchronously to cache file for re-use
        def _save(h):
            try:
                with open("coimbatore_houses_cache.json", "w", encoding="utf-8") as f:
                    json.dump(h, f, indent=2, ensure_ascii=False)
            except Exception:
                pass
        threading.Thread(target=_save, args=(houses,), daemon=True).start()
        return {"success": True, "count": len(houses), "data": houses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching houses: {str(e)}")

# ---------------------------
# Engagement Reviews API
# ---------------------------

def _load_engagement_df() -> pd.DataFrame:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "..", "datasets", "coimbatore_engagement_data.csv")
    try:
        df = pd.read_csv(csv_path)
        # Normalize column names
        cols = {c: c.strip() for c in df.columns}
        df.rename(columns=cols, inplace=True)
        return df
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load engagement data: {e}")

def _time_bucket(hhmm: str) -> str:
    try:
        s = str(hhmm).strip()
        lower = s.lower()
        h = None
        if "am" in lower or "pm" in lower:
            # Handle formats like "7:00 PM" or "7 PM"
            # Extract hour
            parts = lower.replace("am", "").replace("pm", "").strip().split(":")
            h_raw = parts[0].strip().split()[0]
            h = int(h_raw)
            if "pm" in lower and h != 12:
                h += 12
            if "am" in lower and h == 12:
                h = 0
        else:
            # 24-hour formats like "19:00"
            parts = s.split(":")
            h = int(parts[0])
    except Exception:
        return "unknown"
    if 6 <= h < 12:
        return "morning"
    if 12 <= h < 16:
        return "afternoon"
    if 16 <= h < 22:
        return "evening"
    return "night"

@app.get("/engagement")
def get_engagement(
    location: str | None = Query(default=None),
    sentiment: str | None = Query(default=None),
    amenity_type: str | None = Query(default=None),
    min_rating: int = Query(default=0),
    time_bucket: str | None = Query(default=None),
    lifestyle: str | None = Query(default=None),
    limit: int = Query(default=100)
):
    df = _load_engagement_df()
    # Build derived columns
    if "visit_time" in df.columns:
        df["time_bucket"] = df["visit_time"].apply(_time_bucket)
    else:
        df["time_bucket"] = "unknown"

    # Filters
    if location:
        df = df[df["location_name"].astype(str).str.contains(location, case=False, na=False)]
    if sentiment and sentiment.lower() != "all":
        df = df[df["sentiment"].astype(str).str.lower() == sentiment.lower()]
    if amenity_type and amenity_type.lower() != "all":
        df = df[df["amenity_type"].astype(str).str.lower() == amenity_type.lower()]
    if lifestyle and lifestyle.lower() != "all":
        df = df[df["lifestyle"].astype(str).str.lower() == lifestyle.lower()]
    if time_bucket and time_bucket.lower() != "all":
        df = df[df["time_bucket"].astype(str).str.lower() == time_bucket.lower()]
    if "rating" in df.columns:
        try:
            df = df[pd.to_numeric(df["rating"], errors="coerce").fillna(0) >= int(min_rating)]
        except Exception:
            pass

    # Sort by rating desc then dwell_time
    if "rating" in df.columns:
        df["rating_num"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0)
        df = df.sort_values(["rating_num", "dwell_time_mins"], ascending=[False, False])

    # Limit and format
    out = df.head(limit).to_dict(orient="records")
    return {"success": True, "count": len(out), "data": out}

# ---------------------------
# Travel Advice via Groq LLM
# ---------------------------

class TravelAdviceRequest(BaseModel):
    origin: str
    destination: str
    city: str | None = "Coimbatore"

@app.post("/travel-advice")
def travel_advice(body: TravelAdviceRequest):
    groq_key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(
            status_code=500, 
            detail="GROQ_API_KEY not configured on server. Please add it to backend/.env file and restart the server."
        )

    system_prompt = (
        "You are a local Coimbatore commute assistant. Use a South Indian (Coimbatore) tone with light Kongu slang "
        "(e.g., 'machan', 'da') where natural and respectful. Keep it friendly and concise.\n"
        "Generate step-by-step directions for four modes: City Bus, Rapido (bike taxi), Auto-rickshaw, and Uber/Ola cab. "
        "For City Bus, suggest likely route numbers or corridors if known for the area (best-effort), and add a short caveat if uncertain. "
        "Estimate cost (INR) and time (mins) for each mode with brief rationale. "
        "Keep each mode to 3–5 bullet steps, no fluff. Avoid offensive or excessive slang."
    )
    user_prompt = (
        f"Plan travel from '{body.origin}' to '{body.destination}' in {body.city or 'the city'}.\n"
        "Return JSON with keys: bus, rapido, auto, cab; each having fields: steps (array of strings), est_cost_inr, est_time_mins, notes.\n"
        "If bus route numbers are uncertain, provide best-guess corridors and a short note."
    )

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "temperature": 0.3,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {"type": "json_object"},
            },
            timeout=25,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Groq error: {resp.text}")
        data = resp.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        try:
            plan = json.loads(content)
        except Exception:
            plan = {}

        # Derive simple recommendations
        def pick_by_cost(p):
            return min(
                [k for k in ["bus", "rapido", "auto", "cab"] if isinstance(p.get(k), dict)],
                key=lambda k: p[k].get("est_cost_inr", float("inf")),
                default=None,
            )
        def pick_by_time(p):
            return min(
                [k for k in ["bus", "rapido", "auto", "cab"] if isinstance(p.get(k), dict)],
                key=lambda k: p[k].get("est_time_mins", float("inf")),
                default=None,
            )
        return {
            "plan": plan,
            "recommended_by_budget": pick_by_cost(plan),
            "recommended_by_time": pick_by_time(plan),
        }
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Groq request timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"travel-advice error: {e}")

# ---------------------------
# Natural Language Amenity Search
# ---------------------------

class NaturalSearchRequest(BaseModel):
    query: str
    amenities: list = []

@app.post("/amenity/natural-search")
def natural_amenity_search(body: NaturalSearchRequest):
    """Parse natural language query and filter amenities"""
    try:
        criteria = amenity_search.parse_natural_query(body.query)
        if criteria.get("error"):
            raise HTTPException(status_code=500, detail=criteria["error"])
        
        filtered = amenity_search.filter_amenities(criteria, body.amenities, body.query)
        
        return {
            "criteria": criteria,
            "results": filtered,
            "count": len(filtered)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
