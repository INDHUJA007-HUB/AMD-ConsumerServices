import pgCsvRaw from "../../datasets/coimbatore_pg_dataset.csv?raw";
import houseCsvRaw from "../../datasets/coimbatore_houseonrent_dataset.csv?raw";
import zomatoCsvRaw from "../../datasets/coimbatore_zomato_restaurants.csv?raw";
import busTrajectoryRaw from "../../datasets/coimbatore_2k_final.csv?raw";
import livingCostsRaw from "../../datasets/coimbatore_living_costs.csv?raw";

export type PGItem = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  listingUrl?: string;
  images: string[];
  pricePerMonth?: string;
  roomType?: string;
  foodIncluded?: string;
  wifi?: string;
  ac?: string;
  rating?: number;
  reviewCount?: string;
  contactNumber?: string;
  distanceToCityCenterKm?: number;
  description?: string;
  fullAddress?: string;
};

export type HouseItem = PGItem;

export type ZomatoRestaurant = {
  res_id: string;
  name: string;
  url?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  cuisines?: string;
  timings?: string;
  average_cost_for_two?: number;
  price_range?: number;
  currency?: string;
  aggregate_rating?: number;
  rating_text?: string;
  photo_count?: number;
  votes?: number;
};

export type BusRoutePoint = {
  latitude: number;
  longitude: number;
};

export type LivingCostItem = {
  item: string;
  priceInr?: number;
  sourceLabel?: string;
};

function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, "");
}

function parseCSV(raw: string): string[][] {
  const input = stripBom(raw).trimEnd();
  const rows: string[][] = [];
  let i = 0;
  const n = input.length;
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  while (i < n) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < n && input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (ch === "\r") {
        i++;
        if (i < n && input[i] === "\n") i++;
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        continue;
      }
      if (ch === "\n") {
        i++;
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        continue;
      }
      field += ch;
      i++;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

function toNumberOrUndefined(v: string): number | undefined {
  const trimmed = v?.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed.replace(/,/g, ""));
  return isNaN(num) ? undefined : num;
}

function toBooleanString(v: string | undefined): string | undefined {
  const t = v?.trim().toLowerCase();
  if (!t) return undefined;
  if (t === "yes" || t === "true") return "Yes";
  if (t === "no" || t === "false") return "No";
  return v;
}

export function loadPGs(): PGItem[] {
  const rows = parseCSV(pgCsvRaw);
  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);
  const items: PGItem[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < header.length) continue;
    const name = row[idx("pg_name")];
    const area = row[idx("area")];
    const latitude = Number(row[idx("latitude")]);
    const longitude = Number(row[idx("longitude")]);
    if (!name || isNaN(latitude) || isNaN(longitude)) continue;
    const imagesRaw = row[idx("images")] || "";
    const images = imagesRaw.split("|").map((s) => s.trim()).filter(Boolean);
    items.push({
      id: `${name}-${latitude}-${longitude}`,
      name,
      area,
      latitude,
      longitude,
      listingUrl: row[idx("listing_url")],
      images,
      pricePerMonth: row[idx("price_per_month")],
      roomType: row[idx("room_type")],
      foodIncluded: toBooleanString(row[idx("food_included")]),
      wifi: toBooleanString(row[idx("wifi")]),
      ac: toBooleanString(row[idx("ac")]),
      rating: toNumberOrUndefined(row[idx("rating")]),
      reviewCount: row[idx("review_count")],
      contactNumber: row[idx("contact_number")],
      distanceToCityCenterKm: toNumberOrUndefined(row[idx("distance_to_city_center_km")]),
      description: row[idx("description")],
      fullAddress: row[idx("description")],
    });
  }
  return items;
}

export function loadHouses(): HouseItem[] {
  const rows = parseCSV(houseCsvRaw);
  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);
  const items: HouseItem[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < header.length) continue;
    const name = row[idx("pg_name")];
    const area = row[idx("area")];
    const latitude = Number(row[idx("latitude")]);
    const longitude = Number(row[idx("longitude")]);
    if (!name || isNaN(latitude) || isNaN(longitude)) continue;
    const imagesRaw = row[idx("images")] || "";
    const images = imagesRaw.split("|").map((s) => s.trim()).filter(Boolean);
    items.push({
      id: `${name}-${latitude}-${longitude}`,
      name,
      area,
      latitude,
      longitude,
      listingUrl: row[idx("listing_url")],
      images,
      pricePerMonth: row[idx("price_per_month")],
      roomType: row[idx("room_type")],
      foodIncluded: toBooleanString(row[idx("food_included")]),
      wifi: toBooleanString(row[idx("wifi")]),
      ac: toBooleanString(row[idx("ac")]),
      rating: toNumberOrUndefined(row[idx("rating")]),
      reviewCount: row[idx("review_count")],
      contactNumber: row[idx("contact_number")],
      distanceToCityCenterKm: toNumberOrUndefined(row[idx("distance_to_city_center_km")]),
      description: row[idx("description")],
      fullAddress: row[idx("description")],
    });
  }
  return items;
}

export function loadZomatoRestaurantsCoimbatore(): ZomatoRestaurant[] {
  const rows = parseCSV(zomatoCsvRaw);
  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);
  const items: ZomatoRestaurant[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < header.length) continue;
    const city = row[idx("city")];
    if (!city || city.toLowerCase() !== "coimbatore") continue;
    const res_id = row[idx("res_id")] || `${row[idx("name")]}-${r}`;
    const latitude = toNumberOrUndefined(row[idx("latitude")]);
    const longitude = toNumberOrUndefined(row[idx("longitude")]);
    items.push({
      res_id,
      name: row[idx("name")],
      url: row[idx("url")],
      address: row[idx("address")],
      city,
      latitude,
      longitude,
      cuisines: row[idx("cuisines")],
      timings: row[idx("timings")],
      average_cost_for_two: toNumberOrUndefined(row[idx("average_cost_for_two")]),
      price_range: toNumberOrUndefined(row[idx("price_range")]),
      currency: row[idx("currency")],
      aggregate_rating: toNumberOrUndefined(row[idx("aggregate_rating")]),
      rating_text: row[idx("rating_text")],
      photo_count: toNumberOrUndefined(row[idx("photo_count")]),
      votes: toNumberOrUndefined(row[idx("votes")]),
    });
  }
  return items;
}

export function loadBusTrajectoryPoints(): BusRoutePoint[] {
  const rows = parseCSV(busTrajectoryRaw);
  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);
  const points: BusRoutePoint[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < header.length) continue;
    const longitude = toNumberOrUndefined(row[idx("longitude")]);
    const latitude = toNumberOrUndefined(row[idx("latitude")]);
    if (latitude === undefined || longitude === undefined) continue;
    points.push({ latitude, longitude });
  }
  return points;
}

export function loadLivingCosts(): LivingCostItem[] {
  const rows = parseCSV(livingCostsRaw);
  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);
  const items: LivingCostItem[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < header.length) continue;
    const item = row[idx("Item Description")];
    const priceInr = toNumberOrUndefined(row[idx("Price (INR)")]);
    const sourceLabel = row[idx("Original Web Label")];
    if (!item) continue;
    items.push({ item, priceInr, sourceLabel });
  }
  return items;
}
