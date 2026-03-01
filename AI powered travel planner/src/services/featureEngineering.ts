/**
 * Feature Engineering Layer (Data Fusion)
 * 
 * This service implements the feature engineering logic to calculate:
 * - Distance from each accommodation to the nearest Bus Stop
 * - Distance from each accommodation to the user's specified workplace
 * - Count of restaurants and mess facilities within a 1km radius
 */

import exportGeoJsonRaw from "../../export.geojson?raw";

// SETC API Configuration
const SETC_API_KEY = "579b464db66ec23bdd000001bef5725dd5ea4d8c68af7da91e9991e3";
const SETC_BASE_URL = "https://api.setc.co.in/api/v1";

// Known workplace coordinates (can be extended)
const KNOWN_WORKPLACES: Record<string, { lat: number; lon: number }> = {
  "TIDEL Park": { lat: 11.0168, lon: 76.9558 },
  "TIDEL": { lat: 11.0168, lon: 76.9558 },
  "TIDEL Park Coimbatore": { lat: 11.0168, lon: 76.9558 },
};

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
 * Get workplace coordinates from name or coordinates
 */
export function getWorkplaceCoordinates(
  workplaceName?: string,
  workplaceLat?: number,
  workplaceLon?: number
): { lat: number; lon: number } | null {
  if (workplaceLat !== undefined && workplaceLon !== undefined) {
    return { lat: workplaceLat, lon: workplaceLon };
  }

  if (workplaceName) {
    const normalizedName = workplaceName.trim();
    // Check known workplaces
    for (const [key, coords] of Object.entries(KNOWN_WORKPLACES)) {
      if (normalizedName.toLowerCase().includes(key.toLowerCase())) {
        return coords;
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
  try {
    // Note: SETC API endpoint may vary. This is a placeholder structure.
    // You may need to adjust the endpoint based on actual SETC API documentation
    const response = await fetch(`${SETC_BASE_URL}/bus-stops`, {
      headers: {
        "Authorization": `Bearer ${SETC_API_KEY}`,
        "Content-Type": "application/json",
      },
    }).catch((e) => {
      // Catch ERR_NAME_NOT_RESOLVED / network errors explicitly so it doesn't break the promise chain
      console.warn("Network error fetching SETC API. Proceeding with fallback data: ", e);
      return null;
    });

    if (!response || !response.ok) {
      console.warn("SETC API not available, using fallback bus stops");
      return getFallbackBusStops();
    }

    const data = await response.json();

    // Transform API response to our format
    // Adjust this based on actual SETC API response structure
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
  } catch (error) {
    console.warn("Error fetching bus stops from SETC API:", error);
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
  // Get workplace coordinates
  const workplaceCoords = getWorkplaceCoordinates(workplaceName, workplaceLat, workplaceLon);

  // Fetch bus stops
  const busStops = await fetchBusStops();

  // Calculate distances
  const { distance: distToBusStop, stop } = findNearestBusStop(lat, lon, busStops);
  const distToWorkplace = calculateDistanceToWorkplace(lat, lon, workplaceCoords);

  // Count nearby restaurants and mess
  const nearbyRestaurantsMessCount = getNearbyRestaurantsAndMess(lat, lon, 1);

  return {
    distToBusStop,
    nearestBusStopName: stop?.name,
    nearestBusStopServices: stop?.services,
    distToWorkplace,
    nearbyRestaurantsMessCount,
  };
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
  const workplaceCoords = getWorkplaceCoordinates(workplaceName, workplaceLat, workplaceLon);

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
