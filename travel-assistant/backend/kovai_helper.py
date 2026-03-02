import pandas as pd
from typing import Optional, Dict, List

class KovaiBuddyHelper:
    def __init__(self, zomato_csv: str, tourism_csv: str, bus_csv: str):
        self.df_rest = pd.read_csv(zomato_csv)
        self.df_tour = pd.read_csv(tourism_csv)
        self.df_bus = pd.read_csv(bus_csv)
        
    def find_tourist_area(self, place_name: str) -> Optional[str]:
        """Extract area from tourist place name"""
        match = self.df_tour[self.df_tour['Tourist Place'].str.contains(place_name, case=False, na=False)]
        if not match.empty:
            return match.iloc[0]['Closest Bus Stop']
        return None
    
    def find_restaurants_in_area(self, area: str, budget: float) -> List[Dict]:
        """Find restaurants in area within budget"""
        rests = self.df_rest[self.df_rest['locality'].str.contains(area, case=False, na=False)].copy()
        rests['cost'] = pd.to_numeric(rests['average_cost_for_two'].astype(str).str.replace(',', ''), errors='coerce') / 2
        rests['aggregate_rating'] = pd.to_numeric(rests['aggregate_rating'], errors='coerce').fillna(0)
        
        affordable = rests[(rests['cost'] > 0) & (rests['cost'] <= budget)]
        affordable = affordable.drop_duplicates(subset=['name', 'locality']).sort_values('aggregate_rating', ascending=False)
        
        return affordable.head(5).to_dict('records')
    
    def find_bus_route(self, destination: str, origin: str = "Gandhipuram") -> str:
        """Find bus route between two locations"""
        dest = destination.lower().strip()
        orig = origin.lower().strip()
        
        self.df_bus['search'] = (self.df_bus['Source'].astype(str) + ' ' + self.df_bus['Destination'].astype(str)).str.lower()
        
        matches = self.df_bus[
            (self.df_bus['search'].str.contains(dest, na=False)) &
            (self.df_bus['search'].str.contains(orig, na=False))
        ]
        
        if matches.empty:
            matches = self.df_bus[self.df_bus['search'].str.contains(dest, na=False)]
        
        return matches.iloc[0]['Bus Number'] if not matches.empty else "NO_ROUTE"
    
    def get_recommendation(self, intent: str, location: str, budget: float, origin: str = "Gandhipuram") -> Dict:
        """Main recommendation engine"""
        result = {"type": None, "data": None, "bus": None, "tip": None}
        
        if intent == "tourism":
            area = self.find_tourist_area(location)
            if area:
                spot = self.df_tour[self.df_tour['Tourist Place'].str.contains(location, case=False, na=False)].iloc[0]
                result["type"] = "tourism"
                result["data"] = {
                    "Place_Name": str(spot.get('Tourist Place', '')),
                    "Category": str(spot.get('Category', 'Tourism')),
                    "Entry_Fee": str(spot.get('Fee', '')),
                    "Timings": str(spot.get('Timings', '')),
                    "Closest_Bus_Stop": str(spot.get('Closest Bus Stop', '')),
                    "ImageURL": str(spot.get('ImageURL', ''))
                }
                bus_matches = self.df_bus[self.df_bus['Destination'].str.contains(area, case=False, na=False) | self.df_bus['Source'].str.contains(area, case=False, na=False)]
                if not bus_matches.empty:
                    bus_info = bus_matches.iloc[0]
                    result["bus_details"] = {
                        "Route_No": str(bus_info.get('Bus Number', '')),
                        "Source": str(bus_info.get('Source', '')),
                        "Destination": str(bus_info.get('Destination', '')),
                        "Fare": "Standard Fare" # as fare is missing in current dataset
                    }
                else:
                    result["bus_details"] = "No direct bus found, try connecting routes."
        
        elif intent == "food":
            rests = self.find_restaurants_in_area(location, budget)
            if rests:
                best = rests[0]
                result["type"] = "food"
                result["data"] = {
                    "Restaurant_Name": str(best.get('name', '')),
                    "Locality": str(best.get('locality', '')),
                    "Cuisines": str(best.get('cuisines', '')),
                    "Average_Cost_for_two": str(best.get('average_cost_for_two', '')),
                    "Aggregate_rating": str(best.get('aggregate_rating', ''))
                }
                area = str(best.get('locality', ''))
                bus_matches = self.df_bus[self.df_bus['Destination'].str.contains(area, case=False, na=False) | self.df_bus['Source'].str.contains(area, case=False, na=False)]
                if not bus_matches.empty:
                    bus_info = bus_matches.iloc[0]
                    result["bus_details"] = {
                        "Route_No": str(bus_info.get('Bus Number', '')),
                        "Source": str(bus_info.get('Source', '')),
                        "Destination": str(bus_info.get('Destination', '')),
                        "Fare": "Standard Fare"
                    }
                else:
                    result["bus_details"] = "No direct bus found."
            else:
                # Fallback: find next closest budget
                all_rests = self.df_rest.copy()
                all_rests['cost'] = pd.to_numeric(all_rests['average_cost_for_two'].astype(str).str.replace(',', ''), errors='coerce') / 2
                next_best = all_rests[(all_rests['cost'] > budget) & (all_rests['cost'] <= budget * 1.5)]
                if not next_best.empty:
                    next_best = next_best.sort_values('aggregate_rating', ascending=False).iloc[0]
                    result["type"] = "food_fallback"
                    result["data"] = {
                        "Restaurant_Name": str(next_best.get('name', '')),
                        "Locality": str(next_best.get('locality', '')),
                        "Cuisines": str(next_best.get('cuisines', '')),
                        "Average_Cost_for_two": str(next_best.get('average_cost_for_two', '')),
                        "Aggregate_rating": str(next_best.get('aggregate_rating', ''))
                    }
                result["bus_details"] = "Could not locate immediate bus info."
        
        return result
