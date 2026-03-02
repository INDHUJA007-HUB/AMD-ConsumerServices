import fs from 'fs';

const apiKey = process.env.VITE_AWS_LOCATION_API_KEY;

async function testApi() {
    try {
        const geoRes = await fetch(`https://places.geo.us-east-1.amazonaws.com/v2/geocode?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                QueryText: "RS Puram", // Notice no "Coimbatore"
                FilterBoundingBox: [76.9000, 10.9500, 77.0500, 11.1000], // southwest_lon, southwest_lat, northeast_lon, northeast_lat (Coimbatore box)
                MaxResults: 2
            })
        });
        const geoData = await geoRes.json();
        console.log("GEO:", JSON.stringify(geoData).substring(0, 500) + "...");
    } catch (e) {
        console.error(e);
    }
}

testApi();
