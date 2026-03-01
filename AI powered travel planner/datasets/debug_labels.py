import requests
from bs4 import BeautifulSoup

url = "https://www.numbeo.com/cost-of-living/in/Coimbatore"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
}

print(f"Connecting to {url}...")
try:
    response = requests.get(url, headers=headers, timeout=10)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table', {'class': 'data_wide_table'})
        if table:
            rows = table.find_all('tr')
            labels = []
            for row in rows:
                cells = row.find_all('td')
                if cells:
                    labels.append(cells[0].text.strip())
            
            with open("numbeo_labels.txt", "w", encoding="utf-8") as f:
                for l in labels:
                    f.write(f"{l}\n")
            print(f"Saved {len(labels)} labels to numbeo_labels.txt")
        else:
            print("Table 'data_wide_table' not found.")
    else:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
