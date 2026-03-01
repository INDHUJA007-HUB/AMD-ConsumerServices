import pandas as pd
import os

datasets_dir = r"c:\SideQuest\ConsumerExperience\datasets"
files = ["coimbatore_pg_dataset.csv", "coimbatore_houseonrent_dataset.csv", "coimbatore_zomato_restaurants.csv"]

for f in files:
    path = os.path.join(datasets_dir, f)
    if os.path.exists(path):
        df = pd.read_csv(path, nrows=0)
        print(f"Columns for {f}:")
        print(df.columns.tolist())
        print("-" * 20)
