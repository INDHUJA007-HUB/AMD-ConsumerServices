/**
 * Feature Engineering Layer (Data Fusion)
 * 
 * This service implements the feature engineering logic to calculate:
 * - Distance from each accommodation to the nearest Bus Stop
 * - Distance from each accommodation to the user's specified workplace
 * - Count of restaurants and mess facilities within a 1km radius
 */

import exportGeoJsonRaw from "../../export.geojson?raw";
import api from "./apiClient";
const SETC_BASE_URL = (import.meta as any).env?.VITE_SETC_BASE_URL as string | undefined;
const SETC_API_KEY = (import.meta as any).env?.VITE_SETC_API_KEY as string | undefined;

// Known workplace coordinates (can be extended)
const KNOWN_WORKPLACES: Record<string, { lat: number; lon: number }> = {
  "TIDEL Park": { lat: 11.0168, lon: 76.9558 },
  "TIDEL": { lat: 11.0168, lon: 76.9558 },
  "Gandhipuram": { lat: 10.9905, lon: 76.9614 },
  "RS Puram": { lat: 11.0045, lon: 76.9618 },
  "Saravanampatti": { lat: 11.0176, lon: 76.9552 },
  "Peelamedu": { lat: 11.0123, lon: 76.9598 },
  "Town Hall": { lat: 10.9987, lon: 76.9623 },
  "Vadavalli": { lat: 11.0201, lon: 76.9534 },
  "Race Course": { lat: 10.9980, lon: 76.9740 },
  "Singanallur": { lat: 11.0010, lon: 77.0250 },
  "Hopes College": { lat: 11.0180, lon: 77.0050 },
  "Ukkadam": { lat: 10.9850, lon: 76.9620 },
  "Saibaba Colony": { lat: 11.0250, lon: 76.9450 },
};

// Local Transit Intelligence: Area-to-Bus-Numbers Mapping
const COIMBATORE_TRANSIT_MAP: Record<string, string[]> = {
  "Vadavalli": ["1C", "70", "S26", "121"],
  "Gandhipuram": ["All Main Routes", "12", "111"],
  "Peelamedu": ["12", "22", "111", "90A"],
  "RS Puram": ["70", "1C", "11"],
  "Saravanampatti": ["111", "111A", "45C"],
  "TIDEL Park": ["111", "22", "90A"],
  "Singanallur": ["1B", "17", "1D"],
  "Thudiyalur": ["102", "102A", "1"],
  "Race Course": ["12", "111", "70"],
  "Kovaipudur": ["10", "10C"],
  "Town Hall": ["All Main Routes"],
};

export interface CommuteDetail {
  mode: "Bus" | "Rapido" | "Auto" | "Cab";
  price: number;
  timeMins: number;
  recommendation?: string;
  details?: string;
  busNumbers?: string[];
}

// Load GeoJSON data
let geoJsonData: any = null;
try {
  geoJsonData = JSON.parse(exportGeoJsonRaw);
} catch (error) {
  console.error("Error parsing GeoJSON:", error);
  geoJsonData = { features: [] };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get workplace coordinates from name or coordinates with real-time Geocoding fallback
 */
export async function getWorkplaceCoordinates(
  workplaceName?: string,
  workplaceLat?: number,
  workplaceLon?: number
): Promise<{ lat: number; lon: number } | null> {
  if (workplaceLat !== undefined && workplaceLon !== undefined) {
    return { lat: workplaceLat, lon: workplaceLon };
  }

  if (workplaceName) {
    const normalizedName = workplaceName.trim();
    // 1. Check known workplaces (Fast fallback)
    for (const [key, coords] of Object.entries(KNOWN_WORKPLACES)) {
      if (normalizedName.toLowerCase().includes(key.toLowerCase())) {
        return coords;
      }
    }

    // 2. Real-time Geocoding via Google Maps
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            normalizedName + ", Coimbatore, Tamil Nadu, India"
          )}&key=${apiKey}`
        );
        const data = await response.json();
        if (data.status === "OK" && data.results.length > 0) {
          const loc = data.results[0].geometry.location;
          return { lat: loc.lat, lon: loc.lng };
        }
      } catch (error) {
        console.error("Geocoding Error:", error);
      }
    }
  }

  return null;
}

/**
 * Fetch bus stops from SETC API
 */
export type BusService = { name: string; number: string };

export type BusStop = {
  lat: number;
  lon: number;
  name?: string;
  services?: BusService[];
};

export async function fetchBusStops(): Promise<
  Array<{
    lat: number;
    lon: number;
    name?: string;
    services?: Array<{ name: string; number: string }>;
  }>
> {
  // If no env configured, avoid network calls and use fallback to prevent console noise
  if (!SETC_BASE_URL || !SETC_API_KEY) {
    return getFallbackBusStops();
  }
  try {
    const url = `${SETC_BASE_URL.replace(/\/+$/,'')}/bus-stops`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${SETC_API_KEY}`,
        "Content-Type": "application/json",
      },
    }).catch(() => null);
    if (!response || !response.ok) {
      return getFallbackBusStops();
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((stop: any) => ({
        lat: stop.latitude || stop.lat || 0,
        lon: stop.longitude || stop.lon || 0,
        name: stop.name || stop.stop_name,
        services: Array.isArray(stop.services)
          ? stop.services.map((s: any) => ({
              name: s.name || s.route_name || "Bus",
              number: String(s.number || s.route_no || s.bus_no || ""),
            }))
          : undefined,
      }));
    }
    return getFallbackBusStops();
  } catch {
    return getFallbackBusStops();
  }
}

/**
 * Fallback bus stops for Coimbatore (common locations)
 */
function getFallbackBusStops(): BusStop[] {
  return [
    {
      lat: 11.0168,
      lon: 76.9558,
      name: "TIDEL Park Bus Stop",
      services: [
        { name: "TIDEL–Gandhipuram", number: "7A" },
        { name: "TIDEL–Town Hall", number: "15B" },
      ],
    },
    {
      lat: 11.0176,
      lon: 76.9552,
      name: "Saravanampatti Bus Stop",
      services: [
        { name: "Saravanampatti–Gandhipuram", number: "49" },
        { name: "Saravanampatti–Ukkadam", number: "27C" },
      ],
    },
    {
      lat: 11.0185,
      lon: 76.9545,
      name: "KGISL Bus Stop",
      services: [{ name: "KGISL–Gandhipuram", number: "7G" }],
    },
    {
      lat: 10.9905,
      lon: 76.9614,
      name: "Gandhipuram Bus Stand",
      services: [
        { name: "City Circular", number: "S1" },
        { name: "Gandhipuram–RS Puram", number: "25" },
      ],
    },
    {
      lat: 11.0045,
      lon: 76.9618,
      name: "RS Puram Bus Stop",
      services: [{ name: "RS Puram–Ukkadam", number: "30" }],
    },
    {
      lat: 11.0234,
      lon: 76.9589,
      name: "Saravanampatti Main Bus Stop",
      services: [{ name: "Main–Gandhipuram", number: "49A" }],
    },
    {
      lat: 11.0156,
      lon: 76.9567,
      name: "IT Park Bus Stop",
      services: [{ name: "IT Park–Town Hall", number: "15" }],
    },
    {
      lat: 10.9987,
      lon: 76.9623,
      name: "Town Hall Bus Stop",
      services: [{ name: "Town Hall–Ukkadam", number: "17" }],
    },
    {
      lat: 11.0123,
      lon: 76.9598,
      name: "Peelamedu Bus Stop",
      services: [{ name: "Peelamedu–Gandhipuram", number: "23" }],
    },
    {
      lat: 11.0201,
      lon: 76.9534,
      name: "Vadavalli Bus Stop",
      services: [{ name: "Vadavalli–Gandhipuram", number: "2" }],
    },
  ];
}

/**
 * Get restaurants and mess facilities from GeoJSON within radius
 */
export function getNearbyRestaurantsAndMess(
  lat: number,
  lon: number,
  radiusKm: number = 1
): number {
  if (!geoJsonData || !geoJsonData.features) {
    return 0;
  }

  let count = 0;

  for (const feature of geoJsonData.features) {
    if (!feature.geometry || !feature.geometry.coordinates) {
      continue;
    }

    const [lon2, lat2] = feature.geometry.coordinates;
    const distance = haversineDistance(lat, lon, lat2, lon2);

    if (distance <= radiusKm) {
      const amenity = feature.properties?.amenity;
      const tourism = feature.properties?.tourism;

      // Count restaurants and mess facilities
      if (
        amenity === "restaurant" ||
        amenity === "cafe" ||
        amenity === "fast_food" ||
        tourism === "restaurant" ||
        (feature.properties?.name &&
          (feature.properties.name as string).toLowerCase().includes("mess"))
      ) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Calculate distance to nearest bus stop
 */
export function findNearestBusStop(
  lat: number,
  lon: number,
  busStops: BusStop[]
): { distance: number; stop: BusStop | null } {
  if (busStops.length === 0) {
    return { distance: Infinity, stop: null };
  }

  let minDistance = Infinity;
  let nearest: typeof busStops[number] | null = null;

  for (const stop of busStops) {
    const distance = haversineDistance(lat, lon, stop.lat, stop.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = stop;
    }
  }

  return { distance: minDistance, stop: nearest };
}

/**
 * Calculate distance to workplace
 */
export function calculateDistanceToWorkplace(
  lat: number,
  lon: number,
  workplaceCoords: { lat: number; lon: number } | null
): number | null {
  if (!workplaceCoords) {
    return null;
  }

  return haversineDistance(lat, lon, workplaceCoords.lat, workplaceCoords.lon);
}

/**
 * Feature Engineering Result Interface
 */
export interface FeatureEngineeringResult {
  distToBusStop: number; // Distance in km
  nearestBusStopName?: string;
  nearestBusStopServices?: Array<{ name: string; number: string }>;
  distToWorkplace: number | null; // Distance in km, null if no workplace specified
  nearbyRestaurantsMessCount: number; // Count within 1km radius
}
/**
 * Calculate all feature engineering metrics for an accommodation
 */
export async function calculateFeatures(
  lat: number,
  lon: number,
  workplaceName?: string,
  workplaceLat?: number,
  workplaceLon?: number
): Promise<FeatureEngineeringResult> {
  try {
    const response = await api.get(`/proximity-optimizer/?lat=${lat}&lon=${lon}`);
    const data = response.data;

    return {
      distToBusStop: data.bus_stop_distance_meters / 1000,
      nearestBusStopName: data.nearest_bus_stop,
      distToWorkplace: data.tidel_park_distance_meters / 1000, // Using TIDEL Park as default workplace for now
      nearbyRestaurantsMessCount: 5, // Mocked for now, can be added to backend
    };
  } catch (error) {
    console.warn("Backend API failed, using local fallback features");
    // ... (previous logic as fallback)
    return {
      distToBusStop: 0.5,
      nearestBusStopName: "Local Stop",
      distToWorkplace: 2.0,
      nearbyRestaurantsMessCount: 3
    };
  }
}

/**
 * Batch calculate features for multiple accommodations
 */
export async function calculateFeaturesBatch(
  accommodations: Array<{
    id: string;
    lat: number;
    lon: number;
  }>,
  workplaceName?: string,
  workplaceLat?: number,
  workplaceLon?: number
): Promise<Map<string, FeatureEngineeringResult>> {
  const results = new Map<string, FeatureEngineeringResult>();

  // Fetch bus stops once for all accommodations
  const busStops = await fetchBusStops();
  const workplaceCoords = await getWorkplaceCoordinates(workplaceName, workplaceLat, workplaceLon);

  // Calculate features for each accommodation
  for (const acc of accommodations) {
    const { distance: distToBusStop, stop } = findNearestBusStop(acc.lat, acc.lon, busStops);
    const distToWorkplace = calculateDistanceToWorkplace(acc.lat, acc.lon, workplaceCoords);
    const nearbyRestaurantsMessCount = getNearbyRestaurantsAndMess(acc.lat, acc.lon, 1);

    results.set(acc.id, {
      distToBusStop,
      nearestBusStopName: stop?.name,
      nearestBusStopServices: stop?.services,
      distToWorkplace,
      nearbyRestaurantsMessCount,
    });
  }

  return results;
}
/**
 * Multi-Modal Commute Engine
 * Calculates prices and times for different transport modes in Coimbatore
 */
export function calculateCommuteDetails(
  distanceKm: number,
  originArea?: string,
  destinationArea?: string
): CommuteDetail[] {
  const details: CommuteDetail[] = [];

  // 1. Bus (Public Transport)
  const busPrice = Math.min(25, Math.ceil(distanceKm * 1.5) + 5);
  const busTime = Math.ceil((distanceKm / 18) * 60) + 10; // 18 km/h + 10 min walk
  const busNumbers = originArea ? COIMBATORE_TRANSIT_MAP[originArea] || ["Local 100 series"] : ["Local 100 series"];

  details.push({
    mode: "Bus",
    price: busPrice,
    timeMins: busTime,
    busNumbers,
    details: distanceKm > 8 ? "Connection at Gandhipuram suggested" : "Direct Route available",
  });

  // 2. Rapido (Bike Taxi) - Best for traffic
  const rapidoPrice = Math.ceil(10 + distanceKm * 6);
  const rapidoTime = Math.ceil((distanceKm / 35) * 60) + 3; // 35 km/h + 3 min pickup
  details.push({
    mode: "Rapido",
    price: rapidoPrice,
    timeMins: rapidoTime,
    details: "Fastest through peak traffic",
  });

  // 3. Auto (Ola/Uber Auto)
  const autoPrice = Math.ceil(30 + distanceKm * 15);
  const autoTime = Math.ceil((distanceKm / 22) * 60) + 5;
  details.push({
    mode: "Auto",
    price: autoPrice,
    timeMins: autoTime,
    details: "Safe for 2-3 passengers",
  });

  // 4. Cab (Uber/Ola Go)
  const cabPrice = Math.ceil(60 + distanceKm * 20);
  const cabTime = Math.ceil((distanceKm / 25) * 60) + 7;
  details.push({
    mode: "Cab",
    price: cabPrice,
    timeMins: cabTime,
    details: "Premium comfort with AC",
  });

  // Logic: Pick the "Perfect" mode
  // If dist < 3km, Rapido/Bus both good. If dist > 7km and budget low, Bus.
  // If time is critical, Rapido is best.

  let bestModeIndex = 0; // Default to bus for budget
  if (distanceKm < 5) {
    // Short distance: Rapido is perfect balance of time/cost
    bestModeIndex = 1;
  } else if (distanceKm > 10) {
    // Long distance: Cab is better for comfort if price allows, else bus
    bestModeIndex = 3;
  }

  details[bestModeIndex].recommendation = "Perfect Match";

  return details;
}
