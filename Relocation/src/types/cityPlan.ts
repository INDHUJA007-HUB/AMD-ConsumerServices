export interface UserInput {
  city: string;
  budget: number;
  budgetType: "daily" | "monthly";
  purpose: "tourism" | "relocation";
  days: number;
  foodPreference: "veg" | "nonveg" | "both";
  travelStyle: "budget" | "comfort";
  workplace?: string; // Optional workplace field
}

export interface StayRecommendation {
  area: string;
  type: string;
  costPerMonth: number;
  costPerDay: number;
  rating: number;
  reasons: string[];
  distanceToHub: string;
}

export interface FoodPlan {
  dailyCostRange: [number, number];
  suggestions: { name: string; type: string; avgCost: number }[];
}

export interface TravelPlan {
  mode: string;
  dailyCost: number;
  timeSaved: string;
  suggestion: string;
}

export interface PlaceToVisit {
  name: string;
  bestTime: string;
  entryCost: number;
  duration: string;
  tip: string;
}

export interface BudgetBreakdown {
  stay: number;
  food: number;
  travel: number;
  activities: number;
  total: number;
  withinBudget: boolean;
  overBy?: number;
}

export interface DailyPlan {
  day: number;
  activities: { time: string; activity: string; cost: number; location: string }[];
  totalCost: number;
}

export interface CityPlan {
  city: string;
  stay: StayRecommendation;
  food: FoodPlan;
  travel: TravelPlan;
  places: PlaceToVisit[];
  budget: BudgetBreakdown;
  dailyPlans: DailyPlan[];
}
