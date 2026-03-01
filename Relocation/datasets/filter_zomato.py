import csv
import os

input_file = r"c:\SideQuest\ConsumerExperience\datasets\zomato_restaurants_in_India.csv"
output_file = r"c:\SideQuest\ConsumerExperience\datasets\coimbatore_zomato_restaurants.csv"

if not os.path.exists(input_file):
    print(f"Error: {input_file} not found")
    exit(1)

print(f"Filtering {input_file}...")

with open(input_file, mode='r', encoding='utf-8', errors='replace') as infile:
    reader = csv.DictReader(infile)
    fieldnames = reader.fieldnames
    
    with open(output_file, mode='w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        
        count = 0
        for row in reader:
            if row['city'].strip().lower() == 'coimbatore':
                writer.writerow(row)
                count += 1

print(f"Done! Filtered {count} restaurants into {output_file}")
