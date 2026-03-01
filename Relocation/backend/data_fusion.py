import pandas as pd
import numpy as np
import os
from math import radians, cos, sin, asin, sqrt

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers.
    return c * r

def fuse_datasets():
    datasets_dir = r"c:\SideQuest\ConsumerExperience\datasets"
    
    # 1. Load Datasets
    pg_df = pd.read_csv(os.path.join(datasets_dir, "coimbatore_pg_dataset.csv"))
    house_df = pd.read_csv(os.path.join(datasets_dir, "coimbatore_houseonrent_dataset.csv"))
    zomato_df = pd.read_csv(os.path.join(datasets_dir, "coimbatore_zomato_restaurants.csv"))
    living_costs_df = pd.read_csv(os.path.join(datasets_dir, "coimbatore_living_costs.csv"))
    
    # Combine accommodations
    acc_df = pd.concat([pg_df, house_df], ignore_index=True)
    
    # 2. Extract Features
    master_data = []
    
    # Constants from Living Costs
    # We'll use "Meal, Inexpensive Restaurant" as a baseline for Food_Index if local zomato density is low
    inexpensive_meal = living_costs_df[living_costs_df['Item Description'].str.contains('Meal, Inexpensive', na=False)]['Price (INR)'].values[0]
    monthly_pass = living_costs_df[living_costs_df['Item Description'].str.contains('Monthly Pass', na=False)]['Price (INR)'].values[0]
    internet = living_costs_df[living_costs_df['Item Description'].str.contains('Internet', na=False)]['Price (INR)'].values[0]
    
    lifestyles = [
        ('Frugal', 0.8),
        ('Balanced', 1.0),
        ('Premium', 1.5)
    ]
    
    print(f"Fusing {len(acc_df)} accommodations with Zomato and Living Costs...")
    
    for _, acc in acc_df.iterrows():
        # Calculate Food Index from Zomato within 2km
        nearby_zomato = zomato_df[zomato_df.apply(lambda row: haversine(acc['longitude'], acc['latitude'], row['longitude'], row['latitude']) <= 2.0, axis=1)]
        
        if len(nearby_zomato) > 0:
            avg_cost_two = nearby_zomato['average_cost_for_two'].mean()
            # If average_cost_for_two is missing or 0, fallback to inexpensive_meal * 2
            food_index = avg_cost_two / 2 if avg_cost_two > 0 else inexpensive_meal
        else:
            food_index = inexpensive_meal
            
        # Base Rent
        try:
            # Clean price string like "₹8,500/month"
            rent_str = str(acc['price_per_month']).replace('₹', '').replace(',', '').split('/')[0]
            rent = float(rent_str)
        except:
            rent = 7000.0 # Fallback
            
        # Dist to City Center (already in dataset or we can calc relative to Gandhipuram 11.0183, 76.9644)
        dist_center = acc.get('distance_to_city_center_km', 5.0)
        
        # Augment with lifestyles
        for lifestyle_name, multiplier in lifestyles:
            # Target variable: Total Monthly Spend
            # Logic: Rent + (Food * 30 * multiplier) + (Utilities * multiplier) + (Transport * multiplier)
            # This is "ground truth" for training the model based on the guidelines
            
            utilities = internet + 1200 # Internet + Base Elec
            food_monthly = food_index * 2 * 30 # 2 meals a day
            transport = monthly_pass
            
            total_spend = rent + (food_monthly * multiplier) + (utilities * multiplier) + (transport * multiplier)
            
            # Add some noise for realism
            noise = np.random.normal(0, 500)
            total_spend += noise
            
            master_data.append({
                'accommodation_name': acc['pg_name'],
                'rent': rent,
                'food_index': food_index,
                'utility_index': utilities,
                'dist_to_center': dist_center,
                'lifestyle_multiplier': multiplier,
                'lifestyle_name': lifestyle_name,
                'total_monthly_spend': round(total_spend, 2)
            })
            
    master_df = pd.DataFrame(master_data)
    output_path = os.path.join(datasets_dir, "nammaway_training_data.csv")
    master_df.to_csv(output_path, index=False)
    print(f"Master feature table created at: {output_path}")
    return output_path

if __name__ == "__main__":
    fuse_datasets()
