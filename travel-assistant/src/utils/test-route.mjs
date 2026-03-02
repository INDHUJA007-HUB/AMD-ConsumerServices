import fs from 'fs';

const apiKey = process.env.VITE_AWS_LOCATION_API_KEY;

async function testRoutes() {
    try {
        const routeUrl = `https://routes.geo.us-east-1.amazonaws.com/v2/routes?key=${apiKey}`;
        const carRouteRes = await fetch(routeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Origin: [76.9616, 11.0168],
                Destination: [76.9558, 11.0168],
                TravelMode: 'Car',
                LegGeometryFormat: 'Simple'
            })
        });

        const carRouteData = await carRouteRes.json();
        fs.writeFileSync('route_out.json', JSON.stringify(carRouteData, null, 2));
        console.log("Wrote to route_out.json");
    } catch (e) {
        console.error(e);
    }
}

testRoutes();
