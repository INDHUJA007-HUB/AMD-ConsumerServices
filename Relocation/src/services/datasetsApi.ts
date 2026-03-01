import api from "./apiClient";

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

export type EngagementReview = {
  user_id?: string;
  reviewer_name?: string;
  age?: number;
  lifestyle?: string;
  location_id?: string;
  location_name?: string;
  area?: string;
  amenity_type?: string;
  visit_time?: string;
  dwell_time_mins?: number;
  rating?: number;
  sentiment?: string;
  review_text?: string;
  time_bucket?: string;
};

export async function loadPGs(): Promise<PGItem[]> {
  try {
    const response = await api.get('/accommodations/');
    return response.data;
  } catch (error) {
    console.error("Error loading PGs:", error);
    return [];
  }
}

export async function loadHouses(): Promise<HouseItem[]> {
  try {
    // First try to fetch from Housing API
    const response = await api.get('/housing/coimbatore');
    if (response.data.success && response.data.data.length > 0) {
      return response.data.data;
    }
  } catch (error) {
    console.warn("Housing API failed, using fallback data:", error);
  }
  
  // Fallback to accommodations endpoint
  try {
    const response = await api.get('/accommodations/');
    return response.data.filter((item: any) => item.type === 'house');
  } catch (error) {
    console.error("Error loading houses:", error);
    return [];
  }
}

export async function loadZomatoRestaurantsCoimbatore(): Promise<ZomatoRestaurant[]> {
  // Placeholder until we add restaurants to DB or keep them local if they are too many
  return [];
}

export async function loadBusTrajectoryPoints(): Promise<BusRoutePoint[]> {
  // Return fallback bus stops for Coimbatore
  return [
    { latitude: 11.0168, longitude: 76.9558 }, // TIDEL Park
    { latitude: 11.0176, longitude: 76.9552 }, // Saravanampatti
    { latitude: 10.9905, longitude: 76.9614 }, // Gandhipuram
    { latitude: 11.0045, longitude: 76.9618 }, // RS Puram
    { latitude: 11.0123, longitude: 76.9598 }, // Peelamedu
    { latitude: 11.0201, longitude: 76.9534 }, // Vadavalli
    { latitude: 10.9987, longitude: 76.9623 }, // Town Hall
    { latitude: 11.0010, longitude: 77.0250 }, // Singanallur
    { latitude: 10.9850, longitude: 76.9620 }, // Ukkadam
    { latitude: 11.0250, longitude: 76.9450 }, // Saibaba Colony
  ];
}

export async function loadLivingCosts(): Promise<LivingCostItem[]> {
  // Placeholder
  return [];
}

export type TravelPlanMode = {
  steps?: string[];
  est_cost_inr?: number;
  est_time_mins?: number;
  notes?: string;
  stations?: string[];
};

export type TravelAdvice = {
  plan: {
    bus?: TravelPlanMode;
    rapido?: TravelPlanMode;
    auto?: TravelPlanMode;
    cab?: TravelPlanMode;
  };
  recommended_by_budget?: "bus" | "rapido" | "auto" | "cab" | null;
  recommended_by_time?: "bus" | "rapido" | "auto" | "cab" | null;
};

export async function getTravelAdvice(origin: string, destination: string, city?: string): Promise<TravelAdvice> {
  try {
    const response = await api.post('/travel-advice', { origin, destination, city: city || 'Coimbatore' });
    return response.data as TravelAdvice;
  } catch (error: any) {
    console.error('Error fetching travel advice:', error);
    if (error.response?.status === 500) {
      throw new Error('Backend server error. Please ensure the backend is running and GROQ_API_KEY is configured.');
    }
    throw error;
  }
}

export async function loadEngagementReviews(params: {
  location?: string;
  sentiment?: string;
  amenity_type?: string;
  min_rating?: number;
  time_bucket?: string;
  lifestyle?: string;
  limit?: number;
}): Promise<EngagementReview[]> {
  const response = await api.get('/engagement', { params });
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
}
