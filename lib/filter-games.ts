import { getWeightCategory } from "./types";
import type { Game, FilterState } from "./types";

export function collectionTimeRange(games: Game[]): [number, number] {
  if (games.length === 0) return [0, 0];
  return [
    Math.min(...games.map((g) => g.minPlayingTime)),
    Math.max(...games.map((g) => g.maxPlayingTime)),
  ];
}

export function formatTimeRange(min: number, max: number): string {
  return `${min}–${max} min`;
}

export function countActiveFilters(
  filters: FilterState,
  games: Game[],
): number {
  let count = 0;
  if (filters.weightCategories.length > 0) count++;
  const [collMin, collMax] = collectionTimeRange(games);
  if (filters.timeRange[0] !== collMin || filters.timeRange[1] !== collMax)
    count++;
  if (filters.recommendedPlayerCount !== "any") count++;
  if (filters.bestPlayerCount !== "any") count++;
  return count;
}

export function filterGames(games: Game[], filters: FilterState): Game[] {
  const [collMin, collMax] = collectionTimeRange(games);

  return games.filter((game) => {
    // Weight filter
    if (filters.weightCategories.length > 0) {
      const cat = getWeightCategory(game.weight);
      if (!cat || !filters.weightCategories.includes(cat)) return false;
    }

    // Time filter (only applied when not at default full range)
    const isDefaultRange =
      filters.timeRange[0] === collMin && filters.timeRange[1] === collMax;
    if (!isDefaultRange) {
      if (game.minPlayingTime === 0 && game.maxPlayingTime === 0) return false;
      if (game.maxPlayingTime < filters.timeRange[0]) return false;
      if (game.minPlayingTime > filters.timeRange[1]) return false;
    }

    // Recommended player count filter
    if (filters.recommendedPlayerCount !== "any") {
      if (
        !game.recommendedPlayerCounts.includes(filters.recommendedPlayerCount)
      )
        return false;
    }

    // Best player count filter
    if (filters.bestPlayerCount !== "any") {
      if (!game.bestPlayerCounts.includes(filters.bestPlayerCount))
        return false;
    }

    return true;
  });
}
