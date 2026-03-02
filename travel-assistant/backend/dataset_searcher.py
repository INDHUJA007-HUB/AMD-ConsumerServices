"""
CSV Search Utility for Kovai Buddy
Provides filtering and cross-referencing functions for local datasets
"""
import pandas as pd
from typing import List, Dict, Optional

class DatasetSearcher:
    def __init__(self, rest_csv: str, tour_csv: str, bus_csv: str):
        self.df_rest = pd.read_csv(rest_csv)
        self.df_tour = pd.read_csv(tour_csv)
        self.df_bus = pd.read_csv(bus_csv)
        
    def search_restaurants(self, locality: Optional[str] = None, 
                          budget: Optional[float] = None,
                          cuisine: Optional[str] = None) -> List[Dict]:
        """Filter restaurants by locality and budget"""
        df = self.df_rest.copy()
        
        if locality:
            df = df[df['locality'].str.contains(locality, case=False, na=False)]
        
        if budget:
            df['cost_per_person'] = pd.to_numeric(
                df['average_cost_for_two'].astype(str).str.replace(',', ''), 
                errors='coerce'
            ) / 2
            df = df[df['cost_per_person'] <= budget]
        
        if cuisine:
            df = df[df['cuisines'].str.contains(cuisine, case=False, na=False)]
        
        df = df.sort_values('aggregate_rating', ascending=False)
        
        return df.head(5).to_dict('records')
    
    def search_tourism_with_transport(self, place: Optional[str] = None,
                                     origin: str = 'Gandhipuram') -> List[Dict]:
        """Cross-reference tourism spots with bus routes"""
        df = self.df_tour.copy()
        
        if place:
            df = df[df['Tourist Place'].str.contains(place, case=False, na=False)]
        
        results = []
        for _, spot in df.iterrows():
            bus_stop = spot['Closest Bus Stop']
            routes = self.find_bus_routes(bus_stop, origin)
            
            results.append({
                'place': spot['Tourist Place'],
                'fee': spot['Fee'],
                'timings': spot['Timings'],
                'bus_stop': bus_stop,
                'routes': routes,
                'image': spot.get('ImageURL', '')
            })
        
        return results
    
    def find_bus_routes(self, destination: str, origin: str = 'Gandhipuram') -> List[str]:
        """Find bus routes between two locations"""
        dest_clean = destination.lower().strip()
        orig_clean = origin.lower().strip()
        
        df = self.df_bus.copy()
        df['search_text'] = (
            df['From'].astype(str) + ' ' + 
            df['To'].astype(str) + ' ' + 
            df['Stops'].astype(str)
        ).str.lower()
        
        matches = df[
            df['search_text'].str.contains(dest_clean, na=False) &
            df['search_text'].str.contains(orig_clean, na=False)
        ]
        
        if matches.empty:
            matches = df[df['search_text'].str.contains(dest_clean, na=False)]
        
        return matches['Route No.'].tolist()[:3]
