import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import google.generativeai as genai_v1
from PIL import Image
import io
import json
from dataset_searcher import DatasetSearcher
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Setup Gemini with both clients
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
genai_v1.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize helper
helper = DatasetSearcher(
    rest_csv=os.path.join(BASE_DIR, "datasets/coimbatore_zomato_restaurants.csv"),
    tour_csv=os.path.join(BASE_DIR, "datasets/tourism_coimbatore.csv"),
    bus_csv=os.path.join(BASE_DIR, "datasets/bus_stands.csv")
)

class QueryRequest(BaseModel):
    text: str
    budget: float = 500
    location: str = "Gandhipuram"
    time: str = "12:00"

@app.post("/api/voice-query")
async def voice_query(request: QueryRequest):
    # Simple intent extraction
    text_lower = request.text.lower()
    
    if any(word in text_lower for word in ['visit', 'place', 'tourism', 'see', 'tourist']):
        intent = 'tourism'
        location = 'TNAU'  # Default tourist spot
    elif any(word in text_lower for word in ['food', 'eat', 'restaurant', 'hungry']):
        intent = 'food'
        # Extract location
        words = request.text.split()
        location = request.location
        for i, word in enumerate(words):
            if word.lower() in ['in', 'at', 'near'] and i + 1 < len(words):
                location = words[i + 1].strip('.,!?')
                break
    else:
        intent = 'general'
        location = request.location
    
    budget = request.budget
    
    if intent == "food":
        import pandas as pd
        csv_path = os.path.join(BASE_DIR, "datasets/coimbatore_zomato_restaurants.csv")
        if not os.path.exists(csv_path):
            csv_path = os.path.join(BASE_DIR, "datasets/zomato_coimbatore.csv")
            
        try:
            df = pd.read_csv(csv_path) 
            df = df.drop_duplicates(subset=['name', 'locality'])
            df['Locality_clean'] = df['locality'].astype(str).str.lower()
            area_clean = location.lower().strip()
            
            # Convert cost
            df['cost'] = pd.to_numeric(df['average_cost_for_two'].astype(str).str.replace(',', ''), errors='coerce')
            df['votes'] = pd.to_numeric(df['votes'], errors='coerce')
            
            # 🌶️ LOCAL LEGACY BOOST: Give an algorithmic edge to iconic Coimbatore places
            df['algo_score'] = df['aggregate_rating']
            df.loc[df['votes'] > 200, 'algo_score'] += 0.1 # Bonus for high footfall/reliability
            iconic_places = 'annapoorna|anandhaa|haribhavanam|valarmathi|kuppanna|thalappakatti'
            df.loc[df['name'].astype(str).str.lower().str.contains(iconic_places, na=False), 'algo_score'] += 0.4
            
            # FIX: If area is blank or just "coimbatore", search the whole city
            if not area_clean or "coimbatore" in area_clean.lower():
                matches = df[df['cost'] <= budget].copy()
            else:
                matches = df[(df['Locality_clean'].str.contains(area_clean, na=False)) & (df['cost'] <= budget)].copy()
            
            # Sort by our new custom local score and get top 3
            top_picks = matches.sort_values(by=['algo_score', 'votes'], ascending=[False, False]).head(3)
            
            if top_picks.empty:
                prompt = "You are Kovai Buddy. The user asked for food, but our database has no matches for that area and budget. Just say exactly this: 'Sorry nanba, I couldn't find any data for that exact area, but I can check nearby places!'"
                card_data = None
            else:
                restaurant_context = "REAL RESTAURANT DATA:\n"
                for index, row in top_picks.iterrows():
                    restaurant_context += f"- Name: {row['name']}, Area: {row['locality']}, Cuisine: {row['cuisines']}, Cost for two: ₹{row['cost']}, Rating: {row['aggregate_rating']}\n"
                
                # Dynamic hint mapping
                is_city_wide = not area_clean or "coimbatore" in area_clean
                context_hint = "overall in Coimbatore" if is_city_wide else f"in {location}"
                
                prompt = f"You are Kovai Buddy, a friendly Coimbatore local. The user is looking for food {context_hint}. CRITICAL INSTRUCTION: You must ONLY recommend restaurants provided in the Context Data below. Do NOT make up names. Pick the best one from the context, mention its exact real name, its exact area, the cuisine, and the cost. Speak in a friendly Tanglish tone (e.g., 'Nanba, {context_hint}, the top rated spots are [Real Name] in [Area]...'). Keep it under 3 sentences.\n\nContext Data:\n{restaurant_context}"
                
                best = top_picks.iloc[0]
                card_data = {
                    "type": "food",
                    "title": str(best['name']),
                    "desc": str(best['locality']),
                    "Location": str(best['locality']),
                    "Cost": f"₹{int(best['cost'])} for two",
                    "Rating_Cuisine": f"{best['aggregate_rating']}⭐ | {best['cuisines']}",
                }
                
        except Exception as e:
            print(f"Data Error: {e}")
            return {"response": "Nanba, server busy aachu pola, tirumbi try pannunga!", "card": None}
            
        try:
            response = client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents=prompt
            )
            return {"response": response.text.strip(), "card": card_data}
        except Exception as e:
            print("Error in Gemini generation:", e)
            return {"response": "Nanba, api request failed! Rate limit hit maybe. Thirumbi try pannunga!", "card": None}

    # Original logic for tourism and general cases
    # Get recommendation using DatasetSearcher
    rec = {"data": None, "type": intent}
    
    if intent == "tourism":
        spots = helper.search_tourism_with_transport(place=location, origin=request.location)
        if spots:
            rec["data"] = spots[0]
            rec["bus_details"] = {"routes": spots[0]['routes']}
    elif intent == "food":
        rests = helper.search_restaurants(locality=location, budget=budget)
        if rests:
            rec["data"] = rests[0]
            
    # Generate Tanglish response using Gemini Hybrid Prompt
    prompt = f"""
You are 'Kovai Buddy', a local guide in Coimbatore.
The user asked: "{request.text}" with a budget of ₹{budget}.
I have retrieved the following deep details from our database:
{json.dumps(rec, indent=2)}

Please return a JSON object with EXACTLY two parts:
1. "spoken_response": A short, friendly, Tanglish summary (under 3 sentences) like "Semma choice nanba! Marudhamalai is open till 5 PM. You can take bus 1D. I've put all the details and nearby food spots on your screen. Poitu vaanga!".
2. "detailed_data": A structured dictionary containing all the exact extracted details based on the data provided. Use the following exact keys explicitly (if available in the data, else use "NA"):
- "title": Name of place or restaurant
- "desc": Very short friendly description
- "Location": Exact locality or bus stop
- "Timings": Operating timings (if tourism)
- "Cost": Price or ticket fee
- "Bus_Route": Route Num and Fare from bus_details
- "Rating_Cuisine": Rating and Cuisines (if food)
- "type": "food" or "place" based on intent

Strictly output ONLY valid JSON. Note that `detailed_data` should map cleanly to the UI.
"""
    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-flash',
            contents=prompt
        )
        response_text = response.text.strip()
        
        # Robustly strip markdown formatting
        if response_text.startswith("```"):
            lines = response_text.split('\n')
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = '\n'.join(lines).strip()
            
        try:
            output = json.loads(response_text)
        except json.JSONDecodeError as decode_error:
            print("--- CRITICAL JSON PARSE ERROR ---")
            print(f"Failed to parse text: {response_text}")
            print(f"Error Details: {decode_error}")
            return {"response": "Nanba, the AI returned invalid JSON. Try again.", "card": None}
        
        card_data = output.get("detailed_data", {})
        if rec.get("data"):
           if "image" in rec["data"]:
               card_data["image"] = rec["data"]["image"]
           elif "ImageURL" in rec["data"]:
               card_data["image"] = rec["data"]["ImageURL"]
            
        return {"response": output.get("spoken_response"), "card": card_data}
    except Exception as e:
        print("Error in Voice API:", e)
        return {"response": "Nanba, unga details fetch panna mudila, tirumbi try pannunga!", "card": None}

@app.get("/")
async def root():
    return {"status": "Kovai Buddy API Running"}

@app.post("/api/visual-linguist")
async def analyze_image(image: UploadFile = File(...)):
    try:
        # 1. Catch the image file and convert it to a PIL Image format for Gemini
        image_bytes = await image.read()
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify() # Verify it's not corrupt
            img = Image.open(io.BytesIO(image_bytes)) # Re-open after verify
        except Exception as e:
            return {"response": f"Nanba, the image file seems corrupted or invalid! Error: {str(e)}"}
        
        # Explicitly use the exact string supported by v1beta for images
        model = genai_v1.GenerativeModel('models/gemini-2.5-flash')
        
        # 3. The Master OCR & Context Prompt
        prompt = """
        You are 'Kovai Buddy', a local guide in Coimbatore. Look at this image. 
        1. If there is Tamil text (like a bus board or menu), extract and translate it to English. 
        2. Explain what it means culturally in Coimbatore. 
        3. Give a rough estimate of the cost or context (e.g., bus fare, food cost). 
        4. Keep it under 4 sentences and use a friendly Tanglish tone (start with 'Nanba' or 'Vanakkam').
        """
        
        # 4. Send the prompt AND the image to Gemini
        print("Sending image to Gemini Vision...")
        response = model.generate_content([prompt, img])
        print("Success! Gemini responded.")
        
        return {"response": response.text}
        
    except Exception as e:
        # THIS IS THE CRITICAL DEBUG STEP
        # If it fails, it will print the EXACT reason in your terminal
        print(f"CRITICAL VISION ERROR: {str(e)}")
        return {"response": f"Nanba, server error! Tell the dev: {str(e)}"}
