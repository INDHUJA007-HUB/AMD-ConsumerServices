async function testOSM() {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=restaurant+in+Coimbatore&format=json&limit=5`;
        const res = await fetch(url, { headers: { 'User-Agent': 'NammaWay/1.0' } });
        const data = await res.json();
        console.log(`\n--- OSM Results for Restaurants ---`);
        console.log(data.map(d => d.display_name).join("\n"));
    } catch (e) {
        console.error(e);
    }
}

testOSM();
