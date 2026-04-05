export type WeightCategory =
  | "Light"
  | "Medium Light"
  | "Medium"
  | "Medium Heavy"
  | "Heavy";

export interface Game {
  id: number;
  name: string;
  thumbnail: string | null;
  yearPublished: number | null;
  minPlayers: number;
  maxPlayers: number;
  minPlayingTime: number;
  maxPlayingTime: number;
  weight: number; // 0 = unrated
  bggRank: number | null;
  userRating: number | null;
  recommendedPlayerCounts: number[];
  bestPlayerCounts: number[];
}

export interface FilterState {
  weightCategories: WeightCategory[]; // empty = all
  timeRange: [number, number]; // [min, max] in minutes
  recommendedPlayerCount: number | "any";
  bestPlayerCount: number | "any";
}

export type CollectionResult =
  | { status: "success"; games: Game[] }
  | { status: "error"; message: string }
  | { status: "private" }
  | { status: "not-found" };

export function getWeightCategory(weight: number): WeightCategory | null {
  if (weight <= 0) return null;
  if (weight <= 1.0) return "Light";
  if (weight <= 2.0) return "Medium Light";
  if (weight <= 3.0) return "Medium";
  if (weight <= 4.0) return "Medium Heavy";
  return "Heavy";
}
