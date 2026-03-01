import requests
from bs4 import BeautifulSoup
import pandas as pd

def scrape_numbeo_coimbatore():
    # URL for Coimbatore cost of living
    url = "https://www.numbeo.com/cost-of-living/in/Coimbatore"
    
    # Headers are essential to prevent the website from blocking the script
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }

    print(f"Connecting to {url}...")
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Numbeo stores data in a table with class 'data_wide_table'
    table = soup.find('table', {'class': 'data_wide_table'})
    if not table:
        print("Could not find the data table on the page.")
        return

    # Map your requested items to the exact labels used on Numbeo
    target_items = {
        "Meal at an Inexpensive Restaurant": "Meal, Inexpensive Restaurant",
        "Bottled Water (0.33 Liter)": "Water (0.33 liter bottle)",
        "Milk (Regular, 1 Liter)": "Milk (regular), (1 liter)",
        "White Rice (1 kg)": "Rice (white), (1kg)",
        "Eggs (12, Large Size)": "Eggs (regular) (12)",
        "Local Cheese (1 kg)": "Local Cheese (1kg)",
        "Chicken Fillets (1 kg)": "Chicken Fillets (1kg)",
        "Monthly Public Transport Pass (Regular Price)": "Monthly Pass (Regular Price)",
        "Taxi Start (Standard Tariff)": "Taxi Start (Normal Tariff)",
        "Taxi 1 km (Standard Tariff)": "Taxi 1km (Normal Tariff)",
        "Taxi 1 Hour Waiting (Standard Tariff)": "Taxi 1hour Waiting (Normal Tariff)",
        "Mobile Phone Plan (Monthly, with Calls and 10GB+ Data)": "Mobile Phone Monthly Plan with Calls and 10GB+ Data",
        "Broadband Internet (Unlimited Data, 60 Mbps or Higher)": "Internet (60 Mbps or More, Unlimited Data, Cable/ADSL)",
        "Cinema Ticket (International Release)": "Cinema, International Release, 1 Seat"
    }

    scraped_data = []

    # Iterate through each row of the table
    rows = table.find_all('tr')
    for row in rows:
        cells = row.find_all('td')
        if len(cells) >= 2:
            item_name_web = cells[0].text.strip()
            # Clean the price string (removing currency symbols and commas)
            price_text = cells[1].text.strip().replace('₹', '').replace(',', '').split('\xa0')[0]
            
            # Check if this item is in our target list
            if item_name_web in target_items:
                scraped_data.append({
                    "Item Description": target_items[item_name_web],
                    "Price (INR)": price_text,
                    "Original Web Label": item_name_web
                })

    # Convert to DataFrame
    df = pd.DataFrame(scraped_data)

    # Save to CSV
    filename = "coimbatore_living_costs.csv"
    df.to_csv(filename, index=False)
    
    print("-" * 30)
    if df.empty:
        print("No items were extracted. Please check the website structure or labels.")
        # Ensure the expected columns are present even if empty for the print statement below (though it won't be reached)
        df = pd.DataFrame(columns=['Item Description', 'Price (INR)', 'Original Web Label'])
    else:
        print(f"Success! Extracted {len(scraped_data)} items.")
        print(f"Data saved to: {filename}")
        print("-" * 30)
        print(df[['Item Description', 'Price (INR)']])

if __name__ == "__main__":
    scrape_numbeo_coimbatore()