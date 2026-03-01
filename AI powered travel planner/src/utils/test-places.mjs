import fs from 'fs';

const apiKey = process.env.VITE_AWS_LOCATION_API_KEY;

async function testSearchText(query) {
    try {
        const url = `https://places.geo.us-east-1.amazonaws.com/v2/search-text?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                QueryText: query,
                MaxResults: 5,
                FilterBoundingBox: [76.8500, 10.9000, 77.1000, 11.1500] // Coimbatore
            })
        });
        const data = await res.json();
        console.log(`\n--- Results for: ${query} ---`);
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await testSearchText("Restaurant");
}

run();
