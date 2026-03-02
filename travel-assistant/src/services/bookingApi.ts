import hotelsGeoRaw from "../../export.geojson?raw";
import pgsGeoRaw from "../../export(PGs and Hostels).geojson?raw";

const RAPIDAPI_HOST = "booking-com15.p.rapidapi.com";
const RAPIDAPI_KEY = "0045d3b135msh9e5718195cf3506p139a1bjsnf6ec708460e7";
const BASE_URL = "https://booking-com15.p.rapidapi.com/api/v1/hotels";

type HttpMethod = "GET";

async function rapidRequest<T>(
  path: string,
  method: HttpMethod = "GET",
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  // Key is now hardcoded, so we don't need to check env
  
  const url = new URL(`${BASE_URL}/${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Booking API error (${res.status}): ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

type FeatureGeometry = {
  type: string;
  coordinates: [number, number];
};

type FeatureProperties = {
  [key: string]: unknown;
  name?: string;
  "addr:housename"?: string;
  "addr:street"?: string;
  "addr:city"?: string;
  "addr:postcode"?: string;
  tourism?: string;
  amenity?: string;
};

type Feature = {
  type: "Feature";
  id?: string | number;
  properties: FeatureProperties;
  geometry: FeatureGeometry;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

export type HotelSummary = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  currency?: string;
  price?: number;
  reviewScore?: number;
  reviewCount?: number;
  photoUrl?: string;
};

const hotelsCollection = JSON.parse(hotelsGeoRaw) as FeatureCollection;
const pgsCollection = JSON.parse(pgsGeoRaw) as FeatureCollection;

function featureToSummary(feature: Feature, category: "hotel" | "pg"): HotelSummary {
  const { properties, geometry, id } = feature;
  const coords = geometry?.coordinates;
  const latitude = coords ? coords[1] : undefined;
  const longitude = coords ? coords[0] : undefined;

  const name =
    (properties.name as string | undefined) ??
    (properties["addr:housename"] as string | undefined) ??
    "Unnamed stay";

  const street = properties["addr:street"] as string | undefined;
  const postcode = properties["addr:postcode"] as string | undefined;

  const addressParts = [street, postcode].filter(Boolean);

  const address = addressParts.length > 0 ? addressParts.join(", ") : undefined;

  const basePrice =
    category === "hotel"
      ? 2500
      : 6000;

  const variance = (Math.abs((id ?? name).toString().split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % 1500);

  const monthlyPrice = category === "hotel" ? basePrice + variance : basePrice + variance;

  return {
    id: (id ?? name) as string,
    name,
    address,
    city: "Coimbatore",
    latitude,
    longitude,
    currency: "INR",
    price: monthlyPrice,
    reviewScore: undefined,
    reviewCount: undefined,
    photoUrl: undefined,
  };
}

export async function searchHotelsInCoimbatore(): Promise<HotelSummary[]> {
  const hotelFeatures =
    hotelsCollection.features.filter(
      (f) =>
        f.properties.tourism === "hotel" ||
        f.properties.amenity === "hotel"
    ) ?? [];

  const pgFeatures =
    pgsCollection.features.filter(
      (f) =>
        f.properties.tourism === "hostel" ||
        f.properties.amenity === "hostel"
    ) ?? [];

  const hotels = hotelFeatures.map((f) => featureToSummary(f, "hotel"));
  const hostels = pgFeatures.map((f) => featureToSummary(f, "pg"));

  return [...hotels, ...hostels];
}

export async function getHotelDetails(hotelId: string): Promise<any> {
  const effectiveId = (!hotelId || isNaN(Number(hotelId))) ? "5955189" : hotelId;
  return rapidRequest("getHotelDetails", {
    hotel_id: effectiveId,
    adults: 1,
    children_age: "1,17",
    room_qty: 1,
    units: "metric",
    temperature_unit: "c",
    languagecode: "en-us",
    currency_code: "INR",
  });
}

export async function getDescriptionAndInfo(hotelId: string): Promise<any> {
  const effectiveId = (!hotelId || isNaN(Number(hotelId))) ? "5955189" : hotelId;
  return rapidRequest("getDescriptionAndInfo", {
    hotel_id: effectiveId,
    languagecode: "en-us",
  });
}

export async function getHotelPaymentFeatures(hotelId: string): Promise<any> {
  const effectiveId = (!hotelId || isNaN(Number(hotelId))) ? "5955189" : hotelId;
  return rapidRequest("getPaymentFeatures", {
    hotel_id: effectiveId,
    languagecode: "en-us",
  });
}

export async function getHotelPhotos(hotelId: string): Promise<any> {
  const effectiveId = (!hotelId || isNaN(Number(hotelId))) ? "5955189" : hotelId;
  return rapidRequest("getHotelPhotos", {
    hotel_id: effectiveId,
  });
}

export async function getHotelFacilities(hotelId: string): Promise<any> {
  const effectiveId = (!hotelId || isNaN(Number(hotelId))) ? "5955189" : hotelId;
  return rapidRequest("getHotelFacilities", {
    hotel_id: effectiveId,
    languagecode: "en-us",
  });
}

