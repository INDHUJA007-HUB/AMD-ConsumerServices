import os
import json
import requests
from typing import Dict, Any
import re

GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NLP_PROVIDER = (os.getenv("NLP_PROVIDER") or "groq").lower()

LOCAL_CONTEXT = {
    "biryani": {"type": "restaurant", "cuisine": "non-veg"},
    "mess": {"type": "restaurant", "cuisine": "south_indian"},
    "peaceful": {"vibe": "quiet", "types": ["park", "temple", "library"]},
    "work": {"types": ["cafe"], "amenities": ["wifi"]},
    "chill": {"types": ["mall", "park"]},
    "tidel": {"location": "Saravanampatti"},
    "gandhipuram": {"location": "Gandhipuram"},
    "rs puram": {"location": "RS Puram"},
    "race course": {"location": "Race Course"},
}

def _tool_schema():
    return {
        "type": "object",
        "properties": {
            "type": {"type": "string"},
            "location": {"type": "string"},
            "amenities": {"type": "array", "items": {"type": "string"}},
            "vibe": {"type": "string"},
            "cuisine": {"type": "string"},
            "budget": {"type": "string"},
            "open_now": {"type": "boolean"},
        },
        "required": [],
        "additionalProperties": False,
    }

def _system_prompt():
    system_prompt = """You are a Coimbatore City Guide AI. Extract entities from user queries about amenities.
Return ONLY a JSON object with these keys (use null if not mentioned):
- "type"
- "location"
- "amenities"
- "vibe"
- "cuisine"
- "budget"
- "open_now"

Type examples: cafe, restaurant, hospital, school, fuel, shop, park, temple
Location examples: Gandhipuram, RS Puram, Saravanampatti, Race Course, Ganapathy
Amenities examples: wifi, parking, ac, outdoor_seating
Vibe examples: quiet, busy, peaceful, lively
Cuisine examples: south_indian, north_indian, chinese, veg, non_veg
Budget examples: cheap, moderate, expensive
Open_now is a boolean indicating if places should be open right now.

Coimbatore context:
- "mess" or "bhojanalaya" = south indian restaurant
- "near Tidel" = Saravanampatti area
- "biryani" = non-veg restaurant
- "peaceful walk" = park or temple"""
    return system_prompt

def _augment_with_local_context(parsed: Dict[str, Any], user_query: str) -> Dict[str, Any]:
    ql = user_query.lower()
    for k, v in LOCAL_CONTEXT.items():
        if k in ql:
            for ck, cv in v.items():
                if ck == "types":
                    if not parsed.get("type") and isinstance(cv, list) and len(cv) > 0:
                        parsed["type"] = cv[0]
                elif ck == "amenities":
                    existing = parsed.get("amenities") or []
                    if isinstance(existing, list):
                        for item in cv:
                            if item not in existing:
                                existing.append(item)
                        parsed["amenities"] = existing
                else:
                    if not parsed.get(ck):
                        parsed[ck] = cv
    return parsed

def _call_groq(user_query: str) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        return {"error": "GROQ_API_KEY not configured"}
    body = {
        "model": "llama-3.3-70b-versatile",
        "temperature": 0.1,
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": f'Query: "{user_query}"'},
        ],
        "tools": [{
            "type": "function",
            "function": {
                "name": "extract_query",
                "description": "Extract structured amenity search criteria",
                "parameters": _tool_schema(),
            }
        }],
        "tool_choice": {"type": "function", "function": {"name": "extract_query"}},
    }
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json=body,
            timeout=15,
        )
        if resp.status_code != 200:
            return {"error": f"API error: {resp.status_code}"}
        data = resp.json()
        msg = data.get("choices", [{}])[0].get("message", {})
        tc = (msg.get("tool_calls") or [])
        if tc:
            args = tc[0].get("function", {}).get("arguments", "{}")
            return json.loads(args)
        content = msg.get("content", "{}")
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}

def _call_openai(user_query: str) -> Dict[str, Any]:
    if not OPENAI_API_KEY:
        return {"error": "OPENAI_API_KEY not configured"}
    body = {
        "model": "gpt-4o-mini",
        "temperature": 0.1,
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": f'Query: "{user_query}"'},
        ],
        "tools": [{
            "type": "function",
            "function": {
                "name": "extract_query",
                "description": "Extract structured amenity search criteria",
                "parameters": _tool_schema(),
            }
        }],
        "tool_choice": {"type": "function", "function": {"name": "extract_query"}},
    }
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json=body,
            timeout=15,
        )
        if resp.status_code != 200:
            return {"error": f"API error: {resp.status_code}"}
        data = resp.json()
        msg = data.get("choices", [{}])[0].get("message", {})
        tc = (msg.get("tool_calls") or [])
        if tc:
            args = tc[0].get("function", {}).get("arguments", "{}")
            return json.loads(args)
        content = msg.get("content", "{}")
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}

def _call_gemini(user_query: str) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not configured"}
    body = {
        "contents": [{
            "role": "user",
            "parts": [{"text": f"{_system_prompt()}\n\nQuery: \"{user_query}\""}]
        }],
        "generationConfig": {"response_mime_type": "application/json"},
    }
    try:
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=body,
            timeout=15,
        )
        if resp.status_code != 200:
            return {"error": f"API error: {resp.status_code}"}
        data = resp.json()
        candidates = data.get("candidates") or []
        if candidates:
            txt = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
            return json.loads(txt)
        return {"error": "No candidates from Gemini"}
    except Exception as e:
        return {"error": str(e)}

def _fallback_parse(user_query: str) -> Dict[str, Any]:
    q = user_query.lower()
    types = ["cafe","restaurant","hospital","school","fuel","shop","park","temple","mall","bakery","library","place_of_worship","gym","cinema","coworking"]
    amenities = ["wifi","parking","ac","outdoor_seating","outdoor"]
    vibes = {"quiet":"quiet","peaceful":"quiet","busy":"busy","lively":"lively"}
    cuisines = {"south indian":"south_indian","north indian":"north_indian","chinese":"chinese","veg":"veg","vegetarian":"veg","non veg":"non_veg","non-veg":"non_veg","biryani":"non_veg","mess":"south_indian"}
    locations = ["gandhipuram","rs puram","saravanampatti","race course","ganapathy"]
    out: Dict[str, Any] = {}
    for t in types:
        if re.search(rf"\b{t}\b", q) and not out.get("type"):
            out["type"] = t
            break
    for k, v in vibes.items():
        if re.search(rf"\b{k}\b", q) and not out.get("vibe"):
            out["vibe"] = v
            break
    for k, v in cuisines.items():
        if re.search(rf"\b{k}\b", q) and not out.get("cuisine"):
            out["cuisine"] = v
            break
    ams = []
    for a in amenities:
        if re.search(rf"\b{a}\b", q):
            ams.append("outdoor_seating" if a == "outdoor" else a)
    if ams:
        out["amenities"] = ams
    for loc in locations:
        if re.search(rf"\b{loc}\b", q):
            out["location"] = loc.title() if loc != "rs puram" else "RS Puram"
            break
    m = re.search(r"under\s*(₹|rs\.?\s*)?\s*(\d+)", q)
    if m:
        try:
            val = int(m.group(2))
            if val <= 200:
                out["budget"] = "cheap"
            elif val <= 600:
                out["budget"] = "moderate"
            else:
                out["budget"] = "expensive"
        except:
            pass
    if "open now" in q or "currently open" in q:
        out["open_now"] = True
    return out

def parse_natural_query(user_query: str) -> Dict[str, Any]:
    if NLP_PROVIDER == "openai":
        parsed = _call_openai(user_query)
    elif NLP_PROVIDER == "gemini":
        parsed = _call_gemini(user_query)
    else:
        parsed = _call_groq(user_query)
    if parsed.get("error"):
        parsed = _fallback_parse(user_query)
    parsed = _augment_with_local_context(parsed, user_query)
    return parsed

def filter_amenities(criteria: Dict[str, Any], amenities: list, user_query: str = "") -> list:
    results = amenities.copy()
    if criteria.get("type"):
        amenity_type = str(criteria["type"]).lower()
        results = [a for a in results if str(a.get("properties", {}).get("amenity", "")).lower() == amenity_type
                   or str(a.get("properties", {}).get("shop", "")).lower() == amenity_type
                   or str(a.get("properties", {}).get("leisure", "")).lower() == amenity_type]
    if criteria.get("location"):
        location = str(criteria["location"]).lower()
        results = [a for a in results if location in str(a.get("properties", {})).lower()]
    if criteria.get("amenities"):
        for amenity in criteria["amenities"]:
            k = str(amenity).lower()
            results = [a for a in results if k in str(a.get("properties", {})).lower()]
    cuisine = criteria.get("cuisine")
    if cuisine:
        if isinstance(cuisine, list):
            keys = [str(c).lower() for c in cuisine]
            results = [a for a in results if any(k in str(a.get("properties", {}).get("cuisine", "")).lower() for k in keys)]
        else:
            k = str(cuisine).lower()
            results = [a for a in results if k in str(a.get("properties", {}).get("cuisine", "")).lower()]
    budget = criteria.get("budget")
    if budget:
        b = str(budget).lower()
        def budget_ok(p: dict) -> bool:
            pr = p.get("price") or p.get("avg_price") or p.get("cost")
            if isinstance(pr, (int, float)):
                if b == "cheap":
                    return pr <= 200
                if b == "moderate":
                    return 200 < pr <= 600
                if b == "expensive":
                    return pr > 600
            prr = str(p.get("price_range", "")).lower()
            if prr:
                if b == "cheap":
                    return prr in ("low", "budget", "₹", "₹₹")
                if b == "moderate":
                    return prr in ("medium", "₹₹", "₹₹₹")
                if b == "expensive":
                    return prr in ("high", "premium", "₹₹₹", "₹₹₹₹")
            return True
        results = [a for a in results if budget_ok(a.get("properties", {}))]
    if criteria.get("vibe") == "quiet" and not criteria.get("type"):
        quiet_types = {"park", "temple", "library", "place_of_worship"}
        results = [a for a in results if str(a.get("properties", {}).get("amenity", "")).lower() in quiet_types
                   or str(a.get("properties", {}).get("leisure", "")).lower() == "park"]
    open_now = criteria.get("open_now")
    if isinstance(open_now, bool) and open_now:
        from datetime import datetime
        now = datetime.now()
        def is_open(p: dict) -> bool:
            oh = str(p.get("opening_hours", "")).lower()
            if "24/7" in oh or "24x7" in oh:
                return True
            if "open" in oh and "closed" not in oh:
                return True
            return bool(oh)
        results = [a for a in results if is_open(a.get("properties", {}))]
        
    final_results = results[:10]
    for res in final_results:
        props = res.get("properties", {}).copy()
        
        name = props.get("name") or props.get("amenity") or props.get("shop") or "This spot"
        if isinstance(name, str):
            name = name.title()
            
        why = _generate_llm_explanation(name, criteria, user_query)
            
        props["why_message"] = why
        res["properties"] = props
        
    return final_results

def _generate_llm_explanation(place_name: str, criteria: Dict[str, Any], user_query: str) -> str:
    """Use Groq to generate a humanized, contextual explanation for why a place was recommended."""
    if not GROQ_API_KEY:
        return f"{place_name} is a great match for your search."
        
    system_prompt = (
        "You are a helpful Coimbatore local guide. "
        "Write a single, short, engaging sentence explaining why the given place "
        "matches the user's specific search criteria. "
        "Use a warm, human tone. DO NOT use bullet points. DO NOT say 'Based on your criteria'."
    )
    
    user_prompt = (
        f"User searched for: '{user_query}'\n"
        f"We recommended: '{place_name}'\n"
        f"Matched features: {json.dumps(criteria)}\n\n"
        f"Write one single sentence explaining why {place_name} is the perfect fit for their request."
    )
    
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "temperature": 0.4,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ]
            },
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            explanation = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            # Clean up quotes if the LLM wrapped the response
            explanation = explanation.strip('"\'')
            if explanation:
                return explanation
    except Exception as e:
        print(f"Skipping LLM explanation due to error: {e}")
        pass
        
    # Fallback if API fails
    return f"{place_name} matches your search for {criteria.get('type', 'this spot')}."
