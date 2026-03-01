import api from "./apiClient";

export type CareerStage = "student" | "early" | "mid" | "senior";
export type Industry =
  | "tech"
  | "finance"
  | "manufacturing"
  | "healthcare"
  | "edu"
  | "other";
export type WeekendFocus = "outdoors" | "cafes" | "nightlife" | "family";
export type CommuteMode = "bus" | "bike" | "car" | "walk";

export interface DigitalFootprint {
  social_pace: number;
  career_stage: CareerStage;
  industry: Industry;
  hobbies: string[];
  weekend_focus: WeekendFocus;
  commute_mode: CommuteMode;
  summary?: string;
}

export interface VibeNeighborhood {
  name: string;
  coordinates: [number, number]; // [lon, lat]
  signature_dim: number;
}

export interface VibeMatchResult {
  neighborhood: string;
  score: number;
  why: string[];
  coordinates: [number, number];
}

export async function postVibeMatch(
  fp: DigitalFootprint
): Promise<{ results: VibeMatchResult[]; explanations_version: string }> {
  const { data } = await api.post("/vibe-match", fp);
  return data;
}

export async function getVibeNeighborhoods(): Promise<VibeNeighborhood[]> {
  const { data } = await api.get("/vibe-neighborhoods");
  return data.neighborhoods ?? [];
}

export async function postVibeFeedback(neighborhood: string, liked: boolean) {
  await api.post("/vibe-feedback", { neighborhood, liked });
}
