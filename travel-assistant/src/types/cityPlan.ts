export interface UserInput {
  city: string;
  budget: number;
  budgetType: "daily" | "monthly";
  purpose: "tourism" | "relocation";
  days: number;
  foodPreference: "veg" | "nonveg" | "both";
  travelStyle: "budget" | "medium" | "luxury" | "comfort";
  workplace?: string;
  preferredPlaces?: string;
  boardingPoint?: string;
  modeOfTransport?: string;
}

export interface StayRecommendation {
  area: string;
  type: string;
  costPerMonth: number;
  costPerDay: number;
  rating: number;
  reasons: string[];
  distanceToHub: string;
  status?: "Open" | "Fully Booked" | "Closing Soon";
  timing?: string;
}

export interface FoodPlan {
  dailyCostRange: [number, number];
  suggestions: { name: string; type: string; avgCost: number; status?: string }[];
}

export interface TravelPlan {
  mode: string;
  dailyCost: number;
  timeSaved: string;
  suggestion: string;
  availability?: string;
  ticketStatus?: "Available" | "Limited" | "Sold Out";
}

export interface PlaceToVisit {
  name: string;
  bestTime: string;
  entryCost: number;
  duration: string;
  tip: string;
  status?: string;
  availability?: string;
  imageUrl?: string;
}

export interface BudgetBreakdown {
  stay: number;
  food: number;
  travel: number;
  activities: number;
  total: number;
  withinBudget: boolean;
  overBy?: number;
  savingsOptions?: {
    category: string;
    suggestion: string;
    amountSaved: number;
  }[];
}

export interface DailyPlan {
  day: number;
  activities: {
    time: string;
    activity: string;
    cost: number;
    location: string;
    coordinates?: [number, number];
    emoji?: string;
    availability?: string;
    status?: "Open" | "Closed" | "Crowded";
    safetyScore?: number;
    closingTime?: string;
    imageUrl?: string;
  }[];
  totalCost: number;
  cumulativeCost: number;
}

export interface HotelOption {
  name: string;
  area: string;
  address?: string;
  stars?: number;
  pricePerNight: number;
  amenities: string[];
  phone?: string;
  website?: string;
  status: "Available" | "Limited" | "Fully Booked";
}

export interface CityPlan {
  city: string;
  days: number;
  stay: StayRecommendation;
  food: FoodPlan;
  travel: TravelPlan;
  places: PlaceToVisit[];
  budget: BudgetBreakdown;
  dailyPlans: DailyPlan[];
  totalCost: number;
  isStrict?: boolean;
  boardingPoint?: string;
  hotelOptions?: HotelOption[];
}
