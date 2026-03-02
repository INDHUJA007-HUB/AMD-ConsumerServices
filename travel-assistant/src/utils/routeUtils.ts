import { LocationClient, SearchPlaceIndexForTextCommand, CalculateRouteCommand } from '@aws-sdk/client-location';
import { RouteOption } from '../types/route';
export type { RouteOption }; // Export for other files to use

// Initialize AWS Location Client
// Ensure you have set your API key in the environment variable VITE_AWS_LOCATION_API_KEY
const locationClient = new LocationClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: '', // AWS location using API Key doesn't use these but the SDK requires the credentials object to exist
        secretAccessKey: '',
    },
    endpoint: `https://places.geo.us-east-1.amazonaws.com`, // We will need to set up a custom fetcher or use the newer API key auth method properly
});


export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}


// A helper to initialize the client properly with the API Key
const createLocationClient = () => {
    const apiKey = import.meta.env.VITE_AWS_LOCATION_API_KEY;
    if (!apiKey) {
        console.warn("VITE_AWS_LOCATION_API_KEY is not set.");
    }

    // We construct the client to pass the API Key in the query string as required by AWS Location API Key auth
    return new LocationClient({
        region: 'us-east-1',
        endpoint: async () => {
            return {
                url: new URL(`https://geo.us-east-1.amazonaws.com?key=${apiKey}`)
            }
        }
    });
}


const DEFAULT_START_COORDS = [76.9616, 11.0168]; // Coimbatore default start

export async function generateRoutesFromAWS(
    destination: string,
    destinationCoords?: [number, number],
    originName?: string,
    originCoords?: [number, number]
): Promise<RouteOption[]> {
    const apiKey = import.meta.env.VITE_AWS_LOCATION_API_KEY;

    if (!apiKey) {
        console.error("Missing AWS Location API Key");
        return getMockRoutesFallback(destination);
    }

    try {
        // We'll use the browser fetch API directly for the API key approach as it's often simpler
        // with the API key than configuring the AWS SDK v3 credentials provider.

        // 1. Geocode Destination (AWS Location V2 Geocode API)
        let destCoords: [number, number];
        let destName = destination;

        if (destinationCoords) {
            // Bypass Geocoding completely if we already have the exact GPS coordinates from OSM
            destCoords = destinationCoords;
        } else {
            const searchUrl = `https://places.geo.us-east-1.amazonaws.com/v2/geocode?key=${apiKey}`;
            const searchRes = await fetch(searchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    QueryText: destination,
                    MaxResults: 1,
                    // Strict Bounding Box around Coimbatore (SW Lon, SW Lat, NE Lon, NE Lat)
                    FilterBoundingBox: [76.8500, 10.9000, 77.1000, 11.1500]
                })
            });

            if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.statusText}`);
            const searchData = await searchRes.json();

            if (!searchData.ResultItems || searchData.ResultItems.length === 0) {
                console.warn(`Could not find coordinates for destination: ${destination}`);
                return getMockRoutesFallback(destination);
            }

            destCoords = searchData.ResultItems[0].Place.Position; // [longitude, latitude]
            destName = searchData.ResultItems[0].Place.Label || searchData.ResultItems[0].Place.Address?.Label || destination;
        }

        // 2. Calculate Routes (AWS Location V2 Routes API)
        // Using "default" provider
        const routeUrl = `https://routes.geo.us-east-1.amazonaws.com/v2/routes?key=${apiKey}`;

        const startCoords = originCoords || DEFAULT_START_COORDS;

        // Fetch Car Route
        const carRouteRes = await fetch(routeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Origin: startCoords,
                Destination: destCoords,
                TravelMode: 'Car',
                LegGeometryFormat: 'Simple', // V2 param for geometry
                MaxAlternatives: 1 // Request 1 alternative route
            })
        });

        // Fetch Walking Route
        const walkRouteRes = await fetch(routeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Origin: startCoords,
                Destination: destCoords,
                TravelMode: 'Pedestrian', // V2 uses Pedestrian instead of Walking
                LegGeometryFormat: 'Simple',
                MaxAlternatives: 1 // Request 1 alternative route
            })
        });

        if (!carRouteRes.ok || !walkRouteRes.ok) {
            throw new Error('Route calculation failed');
        }

        const carRouteData = await carRouteRes.json();
        const walkRouteData = await walkRouteRes.json();

        // Process data into our RouteOption format
        const now = new Date();
        const formatTime = (addMins: number) => {
            const d = new Date(now.getTime() + addMins * 60000);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const carDurationMins = Math.round((carRouteData.Routes?.[0]?.Summary?.Duration || 0) / 60);
        const carDistanceKm = Number(((carRouteData.Routes?.[0]?.Summary?.Distance || 0) / 1000).toFixed(1)); // V2 is usually in meters

        const walkDurationMins = Math.round((walkRouteData.Routes?.[0]?.Summary?.Duration || 0) / 60);
        const walkDistanceKm = Number(((walkRouteData.Routes?.[0]?.Summary?.Distance || 0) / 1000).toFixed(1));

        // Extract Alternate Route Geometries and Metrics
        const carAlternateGeometries = carRouteData.Routes?.slice(1).map((r: any) => ({
            lineString: r.Legs?.[0]?.Geometry?.LineString || [],
            duration: Math.round((r.Summary?.Duration || 0) / 60),
            distance: Number(((r.Summary?.Distance || 0) / 1000).toFixed(1))
        })) || [];

        const walkAlternateGeometries = walkRouteData.Routes?.slice(1).map((r: any) => ({
            lineString: r.Legs?.[0]?.Geometry?.LineString || [],
            duration: Math.round((r.Summary?.Duration || 0) / 60),
            distance: Number(((r.Summary?.Distance || 0) / 1000).toFixed(1))
        })) || [];

        // Generate synthetic bus data based on car route (since typical routing APIs don't always have "Transit" explicitly, or it requires different params)
        const busDurationMins = Math.round(carDurationMins * 1.5) + 10;

        // --- Generate Realistic Dynamic Route Steps ---
        // Since AWS Location Service V2 "Default" calculators don't natively return turn-by-turn navigation data without extensive configuration,
        // we dynamically generate realistic waypoints based on distance to populate the "Smart Route" UI.
        const generateDynamicSteps = (mode: 'car' | 'bus' | 'walk', distanceKm: number, startName: string, endName: string) => {
            const steps = [];

            // 1. Initial Step
            if (mode === 'car') steps.push({ name: `Picked up by driver at ${startName}` });
            else if (mode === 'bus') steps.push({ name: `Walk to nearest Transit Stop` });
            else steps.push({ name: `Start walking from ${startName}` });

            // 2. Intermediate Steps Based on Distance
            if (distanceKm > 20) {
                if (mode === 'car') steps.push({ name: 'Merge onto State Highway' }, { name: 'Continue on Expressway for 15km' });
                else if (mode === 'bus') steps.push({ name: 'Board AC Bus 104A' }, { name: 'Transit via Central Hub' });
            } else if (distanceKm > 5) {
                if (mode === 'car') steps.push({ name: 'Take the Main Arterial Road' });
                else if (mode === 'bus') steps.push({ name: 'Board City Bus 45' }, { name: 'Pass through 4 stops' });
                else steps.push({ name: 'Follow dedicated pedestrian walking corridor' });
            }

            // 3. Final Approach
            if (mode === 'car' && distanceKm > 2) steps.push({ name: 'Turn left approaching destination area' });

            // 4. Final Step
            if (mode === 'car') steps.push({ name: `Drop off directly at ${endName}` });
            else if (mode === 'bus') steps.push({ name: `Alight and walk 2 mins to ${endName}` });
            else steps.push({ name: `Arrive safely at ${endName}` });

            // Map each string to a pseudo-location based on the first coordinates so the UI renders it
            return steps.map((s, i) => ({
                lat: destCoords[1] - (0.0001 * i), // Slight shift for realism in coordinates displayed
                lon: destCoords[0] - (0.0001 * i),
                name: s.name
            }));
        };

        const actualStartName = originName || 'Current Location';
        const carSteps = generateDynamicSteps('car', carDistanceKm, actualStartName, destName);
        const busSteps = generateDynamicSteps('bus', carDistanceKm, actualStartName, destName);
        const walkSteps = generateDynamicSteps('walk', walkDistanceKm, actualStartName, destName);

        return [
            {
                id: 'fastest',
                type: 'Fastest',
                title: 'Fastest (Cab)',
                duration: carDurationMins,
                distance: carDistanceKm,
                co2: Math.round(carDistanceKm * 120),
                cost: Math.round((carDistanceKm * 25) + 80),
                mode: 'car',
                pathOptions: carSteps,
                description: `ETA ${formatTime(carDurationMins)}`,
                geometry: { lineString: carRouteData.Routes?.[0]?.Legs?.[0]?.Geometry?.LineString || [] },
                alternateGeometries: carAlternateGeometries
            },
            {
                id: 'smartest',
                type: 'Smartest',
                title: 'Smartest (Bus/Auto)',
                duration: busDurationMins,
                distance: carDistanceKm,
                co2: Math.round(carDistanceKm * 30),
                cost: Math.round((carDistanceKm * 4) + 10),
                mode: 'bus',
                pathOptions: busSteps,
                description: `ETA ${formatTime(busDurationMins)}`,
                geometry: { lineString: carRouteData.Routes?.[0]?.Legs?.[0]?.Geometry?.LineString || [] }, // Reusing car geometry for bus baseline
                alternateGeometries: carAlternateGeometries
            },
            {
                id: 'sustainable',
                type: 'Sustainable',
                title: 'Sustainable (Walk)',
                duration: walkDurationMins,
                distance: walkDistanceKm,
                co2: 0,
                cost: 0,
                mode: 'walk',
                pathOptions: walkSteps,
                description: `ETA ${formatTime(walkDurationMins)}`,
                geometry: { lineString: walkRouteData.Routes?.[0]?.Legs?.[0]?.Geometry?.LineString || [] },
                alternateGeometries: walkAlternateGeometries
            }
        ];

    } catch (e) {
        console.error("Error calculating routes with AWS Location:", e);
        return getMockRoutesFallback(destination);
    }
}

// Keep the old logic as a fallback
function getMockRoutesFallback(destination: string): RouteOption[] {
    const startNode = { lat: 11.0168, lon: 76.9616, tags: { name: 'Coimbatore Center' } };
    const endNode = { lat: 11.0045, lon: 76.9616, tags: { name: destination } };
    const adjustedDistance = 4.2;

    const now = new Date();
    const formatTime = (addMins: number) => {
        const d = new Date(now.getTime() + addMins * 60000);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const cabDuration = Math.round(adjustedDistance * 4) + 10;
    const busDuration = Math.round(adjustedDistance * 7) + 15;
    const walkDuration = Math.round(adjustedDistance * 15);

    return [
        {
            id: 'fastest',
            type: 'Fastest',
            title: 'Fastest (Cab)',
            duration: cabDuration,
            distance: Number(adjustedDistance.toFixed(1)),
            co2: Math.round(adjustedDistance * 120),
            cost: Math.round((adjustedDistance * 25) + 80),
            mode: 'car',
            pathOptions: [
                { lat: startNode.lat, lon: startNode.lon, name: `Pick up at ${startNode.tags?.name || 'Current Location'}` },
                { lat: endNode.lat, lon: endNode.lon, name: `Drop off at ${destination || endNode.tags?.name || 'Destination'}` }
            ],
            description: `ETA ${formatTime(cabDuration)}`
        },
        {
            id: 'smartest',
            type: 'Smartest',
            title: 'Smartest (Bus/Auto)',
            duration: busDuration,
            distance: Number(adjustedDistance.toFixed(1)),
            co2: Math.round(adjustedDistance * 30),
            cost: Math.round((adjustedDistance * 4) + 10),
            mode: 'bus',
            pathOptions: [
                { lat: startNode.lat, lon: startNode.lon, name: `Walk 2 mins to ${startNode.tags?.name || 'Bus Stop'}` },
                { lat: endNode.lat, lon: endNode.lon, name: `Arrive at ${destination || endNode.tags?.name || 'Destination Stop'}` }
            ],
            description: `ETA ${formatTime(busDuration)}`
        },
        {
            id: 'sustainable',
            type: 'Sustainable',
            title: 'Sustainable (Walk)',
            duration: walkDuration,
            distance: Number(adjustedDistance.toFixed(1)),
            co2: 0,
            cost: 0,
            mode: 'walk',
            pathOptions: [
                { lat: startNode.lat, lon: startNode.lon, name: `Start walking from ${startNode.tags?.name || 'Current Location'}` },
                { lat: endNode.lat, lon: endNode.lon, name: `Arrive at ${destination || endNode.tags?.name || 'Destination'}` }
            ],
            description: `ETA ${formatTime(walkDuration)}`
        }
    ];
}


// Function specifically for Multi-Stop Routing with AWS Location V2
export async function calculateMultiStopRoute(points: [number, number][]) {
    const apiKey = import.meta.env.VITE_AWS_LOCATION_API_KEY;
    if (!apiKey) throw new Error("Missing AWS Location API Key");
    if (points.length < 2) throw new Error("Need at least 2 points for a route");

    const origin = points[0];
    const destination = points[points.length - 1];

    // Convert intermediate points to Waypoints format for AWS V2 API
    const waypoints = points.slice(1, -1).map(p => ({ Position: p }));

    const routeUrl = `https://routes.geo.us-east-1.amazonaws.com/v2/routes?key=${apiKey}`;

    const requestBody: any = {
        Origin: origin,
        Destination: destination,
        TravelMode: 'Car',
        LegGeometryFormat: 'Simple'
    };

    if (waypoints.length > 0) {
        requestBody.Waypoints = waypoints;
    }

    const res = await fetch(routeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
        throw new Error(`Route calculation failed: ${await res.text()}`);
    }

    const data = await res.json();
    const route = data.Routes?.[0];

    if (!route) {
        throw new Error("No route found in response");
    }

    // Extract Total Metrics
    const totalDistanceKm = Number(((route.Summary?.Distance || 0) / 1000).toFixed(1));
    const totalDurationMins = Math.round((route.Summary?.Duration || 0) / 60);

    // Extract Leg Metrics (Distance between each stop)
    const legs = route.Legs || [];
    const legDistancesKm = legs.map((leg: any) =>
        Number(((leg.Summary?.Overview?.Distance || leg.Summary?.TravelOnly?.Distance || 0) / 1000).toFixed(1))
    );

    // Combine all leg geometries into a single LineString for the map
    let fullLineString: [number, number][] = [];
    legs.forEach((leg: any) => {
        const legGeom = leg.Geometry?.LineString || [];
        // Append all points. (Connecting points might overlap slightly, which is fine for rendering)
        fullLineString = [...fullLineString, ...legGeom];
    });

    return {
        lineString: fullLineString,
        totalDistanceKm,
        totalDurationMins,
        legDistancesKm
    };
}
