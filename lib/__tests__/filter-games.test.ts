import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  filterGames,
  collectionTimeRange,
  formatTimeRange,
  countActiveFilters,
} from "../filter-games";
import { getWeightCategory } from "../types";
import type { Game, FilterState, WeightCategory } from "../types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    name: "Test Game",
    thumbnail: null,
    yearPublished: 2020,
    minPlayers: 2,
    maxPlayers: 4,
    minPlayingTime: 30,
    maxPlayingTime: 60,
    weight: 2.5, // Medium
    bggRank: 100,
    userRating: 7.5,
    recommendedPlayerCounts: [3, 4],
    bestPlayerCounts: [4],
    ...overrides,
  };
}

const lightGame = makeGame({ id: 1, name: "Light Game", weight: 0.8 });
const mediumLightGame = makeGame({
  id: 2,
  name: "Medium Light Game",
  weight: 1.5,
});
const mediumGame = makeGame({ id: 3, name: "Medium Game", weight: 2.5 });
const mediumHeavyGame = makeGame({
  id: 4,
  name: "Medium Heavy Game",
  weight: 3.5,
});
const heavyGame = makeGame({ id: 5, name: "Heavy Game", weight: 4.5 });
const unratedGame = makeGame({ id: 6, name: "Unrated Game", weight: 0 });

const defaultFilters = (games: Game[]): FilterState => ({
  weightCategories: [],
  timeRange: collectionTimeRange(games),
  recommendedPlayerCount: "any",
  bestPlayerCount: "any",
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe("filterGames", () => {
  describe("weight filter", () => {
    it("Given games of all weight categories, When weightCategories is ['Light'], Then only Light games are returned", () => {
      const games = [lightGame, mediumGame, heavyGame, unratedGame];
      const filters: FilterState = {
        ...defaultFilters(games),
        weightCategories: ["Light"],
      };
      const result = filterGames(games, filters);
      expect(result).toEqual([lightGame]);
    });

    it("Given games of all weight categories, When weightCategories is ['Medium', 'Heavy'], Then only Medium and Heavy games are returned", () => {
      const games = [lightGame, mediumGame, heavyGame, unratedGame];
      const filters: FilterState = {
        ...defaultFilters(games),
        weightCategories: ["Medium", "Heavy"],
      };
      const result = filterGames(games, filters);
      expect(result).toEqual([mediumGame, heavyGame]);
    });

    it("Given a game with weight 0 (unrated), When a weight category filter is active, Then the unrated game is excluded", () => {
      const games = [lightGame, unratedGame];
      const filters: FilterState = {
        ...defaultFilters(games),
        weightCategories: ["Light"],
      };
      const result = filterGames(games, filters);
      expect(result).not.toContain(unratedGame);
    });

    it("Given games of all weight categories, When weightCategories is empty, Then all games are returned", () => {
      const games = [lightGame, mediumGame, heavyGame, unratedGame];
      const result = filterGames(games, defaultFilters(games));
      expect(result).toHaveLength(4);
    });

    it("Given all five weight categories, When each is selected individually, Then only matching games are returned", () => {
      const games = [
        lightGame,
        mediumLightGame,
        mediumGame,
        mediumHeavyGame,
        heavyGame,
      ];
      const categories: WeightCategory[] = [
        "Light",
        "Medium Light",
        "Medium",
        "Medium Heavy",
        "Heavy",
      ];
      const fixtures = [
        lightGame,
        mediumLightGame,
        mediumGame,
        mediumHeavyGame,
        heavyGame,
      ];
      categories.forEach((cat, i) => {
        const filters: FilterState = {
          ...defaultFilters(games),
          weightCategories: [cat],
        };
        const result = filterGames(games, filters);
        expect(result).toEqual([fixtures[i]]);
      });
    });
  });

  describe("time filter", () => {
    it("Given games with various playing times, When timeRange is [45, 90], Then only overlapping games are returned", () => {
      const shortGame = makeGame({
        id: 10,
        name: "Short",
        minPlayingTime: 10,
        maxPlayingTime: 30,
      });
      const overlapGame = makeGame({
        id: 11,
        name: "Overlap",
        minPlayingTime: 60,
        maxPlayingTime: 120,
      });
      const longGame = makeGame({
        id: 12,
        name: "Long",
        minPlayingTime: 100,
        maxPlayingTime: 200,
      });
      const games = [shortGame, overlapGame, longGame];
      // Use a sub-range so the filter is active
      const filters: FilterState = {
        ...defaultFilters(games),
        timeRange: [45, 90],
      };
      const result = filterGames(games, filters);
      expect(result).toContain(overlapGame);
      expect(result).not.toContain(shortGame);
      expect(result).not.toContain(longGame);
    });

    it("Given a game with both minPlayingTime and maxPlayingTime of 0, When time filter is active, Then the game is excluded", () => {
      const zeroTimeGame = makeGame({
        id: 20,
        name: "Zero Time",
        minPlayingTime: 0,
        maxPlayingTime: 0,
      });
      const normalGame = makeGame({
        id: 21,
        name: "Normal",
        minPlayingTime: 30,
        maxPlayingTime: 60,
      });
      const games = [zeroTimeGame, normalGame];
      // Use a sub-range to activate the filter
      const filters: FilterState = {
        ...defaultFilters(games),
        timeRange: [20, 70],
      };
      const result = filterGames(games, filters);
      expect(result).not.toContain(zeroTimeGame);
      expect(result).toContain(normalGame);
    });

    it("Given games with various playing times, When timeRange equals the full collection range, Then all games are returned", () => {
      const game1 = makeGame({
        id: 30,
        minPlayingTime: 10,
        maxPlayingTime: 30,
      });
      const game2 = makeGame({
        id: 31,
        minPlayingTime: 60,
        maxPlayingTime: 120,
      });
      const games = [game1, game2];
      const result = filterGames(games, defaultFilters(games));
      expect(result).toHaveLength(2);
    });
  });

  describe("recommendedPlayerCount filter", () => {
    it("Given games with different recommendedPlayerCounts, When recommendedPlayerCount is 4, Then only games recommending 4 players are returned", () => {
      const game4 = makeGame({
        id: 40,
        name: "4-player",
        recommendedPlayerCounts: [3, 4],
      });
      const game2 = makeGame({
        id: 41,
        name: "2-player",
        recommendedPlayerCounts: [2],
      });
      const games = [game4, game2];
      const filters: FilterState = {
        ...defaultFilters(games),
        recommendedPlayerCount: 4,
      };
      const result = filterGames(games, filters);
      expect(result).toEqual([game4]);
    });

    it("Given games with recommendedPlayerCounts, When recommendedPlayerCount is 'any', Then all games are returned", () => {
      const game4 = makeGame({ id: 50, recommendedPlayerCounts: [4] });
      const game2 = makeGame({ id: 51, recommendedPlayerCounts: [2] });
      const games = [game4, game2];
      const result = filterGames(games, defaultFilters(games));
      expect(result).toHaveLength(2);
    });
  });

  describe("bestPlayerCount filter", () => {
    it("Given games with different bestPlayerCounts, When bestPlayerCount is 2, Then only games best at 2 players are returned", () => {
      const game2 = makeGame({ id: 60, name: "Best 2", bestPlayerCounts: [2] });
      const game4 = makeGame({ id: 61, name: "Best 4", bestPlayerCounts: [4] });
      const games = [game2, game4];
      const filters: FilterState = {
        ...defaultFilters(games),
        bestPlayerCount: 2,
      };
      const result = filterGames(games, filters);
      expect(result).toEqual([game2]);
    });

    it("Given games with bestPlayerCounts, When bestPlayerCount is 'any', Then all games are returned", () => {
      const game2 = makeGame({ id: 70, bestPlayerCounts: [2] });
      const game4 = makeGame({ id: 71, bestPlayerCounts: [4] });
      const games = [game2, game4];
      const result = filterGames(games, defaultFilters(games));
      expect(result).toHaveLength(2);
    });
  });

  describe("combined filters (AND composition)", () => {
    it("Given games with mixed attributes, When weight and recommendedPlayerCount filters are both active, Then only games matching both are returned", () => {
      const match = makeGame({
        id: 80,
        weight: 2.5,
        recommendedPlayerCounts: [4],
      });
      const wrongWeight = makeGame({
        id: 81,
        weight: 4.5,
        recommendedPlayerCounts: [4],
      });
      const wrongPlayers = makeGame({
        id: 82,
        weight: 2.5,
        recommendedPlayerCounts: [2],
      });
      const games = [match, wrongWeight, wrongPlayers];
      const filters: FilterState = {
        ...defaultFilters(games),
        weightCategories: ["Medium"],
        recommendedPlayerCount: 4,
      };
      const result = filterGames(games, filters);
      expect(result).toEqual([match]);
    });

    it("Given games with mixed attributes, When all four filters are active, Then only games matching all criteria are returned", () => {
      const match = makeGame({
        id: 90,
        weight: 2.5,
        minPlayingTime: 30,
        maxPlayingTime: 60,
        recommendedPlayerCounts: [4],
        bestPlayerCounts: [4],
      });
      const noMatch = makeGame({
        id: 91,
        weight: 4.5,
        minPlayingTime: 30,
        maxPlayingTime: 60,
        recommendedPlayerCounts: [4],
        bestPlayerCounts: [4],
      });
      const games = [match, noMatch];
      const filters: FilterState = {
        ...defaultFilters(games),
        weightCategories: ["Medium"],
        timeRange: [20, 70],
        recommendedPlayerCount: 4,
        bestPlayerCount: 4,
      };
      const result = filterGames(games, filters);
      expect(result).toEqual([match]);
    });
  });

  describe("default FilterState", () => {
    it("Given a collection of games, When default FilterState is used, Then all games are returned unchanged", () => {
      const games = [lightGame, mediumGame, heavyGame, unratedGame];
      const result = filterGames(games, defaultFilters(games));
      expect(result).toEqual(games);
    });

    it("Given an empty collection, When default FilterState is used, Then an empty array is returned", () => {
      const result = filterGames([], defaultFilters([]));
      expect(result).toEqual([]);
    });
  });
});

describe("collectionTimeRange", () => {
  it("Given an empty collection, When collectionTimeRange is called, Then it returns [0, 0]", () => {
    expect(collectionTimeRange([])).toEqual([0, 0]);
  });

  it("Given a collection with games, When collectionTimeRange is called, Then it returns [min minPlayingTime, max maxPlayingTime]", () => {
    const games = [
      makeGame({ minPlayingTime: 10, maxPlayingTime: 30 }),
      makeGame({ minPlayingTime: 60, maxPlayingTime: 120 }),
    ];
    expect(collectionTimeRange(games)).toEqual([10, 120]);
  });
});

describe("formatTimeRange", () => {
  it("Given min=30 and max=60, When formatTimeRange is called, Then it returns '30–60 min'", () => {
    expect(formatTimeRange(30, 60)).toBe("30–60 min");
  });
});

describe("countActiveFilters", () => {
  it("Given default FilterState, When countActiveFilters is called, Then it returns 0", () => {
    const games = [makeGame()];
    expect(countActiveFilters(defaultFilters(games), games)).toBe(0);
  });

  it("Given a weight category is selected, When countActiveFilters is called, Then it returns 1", () => {
    const games = [makeGame()];
    const filters: FilterState = {
      ...defaultFilters(games),
      weightCategories: ["Medium"],
    };
    expect(countActiveFilters(filters, games)).toBe(1);
  });

  it("Given all four filter dimensions are active, When countActiveFilters is called, Then it returns 4", () => {
    const games = [makeGame({ minPlayingTime: 0, maxPlayingTime: 300 })];
    const filters: FilterState = {
      weightCategories: ["Medium"],
      timeRange: [10, 200],
      recommendedPlayerCount: 3,
      bestPlayerCount: 4,
    };
    expect(countActiveFilters(filters, games)).toBe(4);
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

const gameArbitrary: fc.Arbitrary<Game> = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  name: fc.string({ minLength: 1 }),
  thumbnail: fc.option(fc.webUrl(), { nil: null }),
  yearPublished: fc.option(fc.integer({ min: 1900, max: 2030 }), { nil: null }),
  minPlayers: fc.integer({ min: 1, max: 10 }),
  maxPlayers: fc.integer({ min: 1, max: 10 }),
  minPlayingTime: fc.integer({ min: 0, max: 300 }),
  maxPlayingTime: fc.integer({ min: 0, max: 300 }),
  weight: fc.float({ min: 0, max: 5, noNaN: true }),
  bggRank: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: null }),
  userRating: fc.option(fc.float({ min: 1, max: 10, noNaN: true }), {
    nil: null,
  }),
  recommendedPlayerCounts: fc.array(fc.integer({ min: 1, max: 10 })),
  bestPlayerCounts: fc.array(fc.integer({ min: 1, max: 10 })),
});

const weightCategoryArbitrary: fc.Arbitrary<WeightCategory> = fc.constantFrom(
  "Light",
  "Medium Light",
  "Medium",
  "Medium Heavy",
  "Heavy",
);

describe("properties", () => {
  // Property 3: Weight Filter Correctness
  it("Given any selection of weight categories, When filterGames is called, Then every returned game's weight maps to one of the selected categories and games with weight <= 0 are excluded", () => {
    // Validates: Requirements 5.2
    fc.assert(
      fc.property(
        fc.array(gameArbitrary, { maxLength: 20 }),
        fc.array(weightCategoryArbitrary, { minLength: 1, maxLength: 5 }),
        (games, categories) => {
          const uniqueCategories = [...new Set(categories)] as WeightCategory[];
          const filters: FilterState = {
            ...defaultFilters(games),
            weightCategories: uniqueCategories,
          };
          const result = filterGames(games, filters);
          return result.every((g) => {
            const cat = getWeightCategory(g.weight);
            return cat !== null && uniqueCategories.includes(cat);
          });
        },
      ),
    );
  });

  // Property 4: Playing Time Filter Overlap Correctness
  it("Given any time range filter that differs from the collection range, When filterGames is called, Then every returned game satisfies maxPlayingTime >= sliderMin AND minPlayingTime <= sliderMax and games with both times 0 are excluded", () => {
    // Validates: Requirements 5.3
    fc.assert(
      fc.property(
        // Generate games with at least one non-zero time game to ensure a meaningful range
        fc.array(gameArbitrary, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 150 }),
        fc.integer({ min: 150, max: 300 }),
        (games, sliderMin, sliderMax) => {
          const [collMin, collMax] = collectionTimeRange(games);
          // Only test when the sub-range differs from the full collection range
          if (sliderMin === collMin && sliderMax === collMax) return true;
          const filters: FilterState = {
            ...defaultFilters(games),
            timeRange: [sliderMin, sliderMax],
          };
          const result = filterGames(games, filters);
          return result.every((g) => {
            // Games with both times 0 must be excluded
            if (g.minPlayingTime === 0 && g.maxPlayingTime === 0) return false;
            return (
              g.maxPlayingTime >= sliderMin && g.minPlayingTime <= sliderMax
            );
          });
        },
      ),
    );
  });

  // Property 5: Recommended Player Count Filter Correctness
  it("Given any player count N, When filterGames is called with recommendedPlayerCount N, Then every returned game has N in recommendedPlayerCounts", () => {
    // Validates: Requirements 7.2
    fc.assert(
      fc.property(
        fc.array(gameArbitrary, { maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (games, n) => {
          const filters: FilterState = {
            ...defaultFilters(games),
            recommendedPlayerCount: n,
          };
          const result = filterGames(games, filters);
          return result.every((g) => g.recommendedPlayerCounts.includes(n));
        },
      ),
    );
  });

  // Property 6: Best Player Count Filter Correctness
  it("Given any player count N, When filterGames is called with bestPlayerCount N, Then every returned game has N in bestPlayerCounts", () => {
    // Validates: Requirements 8.2
    fc.assert(
      fc.property(
        fc.array(gameArbitrary, { maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (games, n) => {
          const filters: FilterState = {
            ...defaultFilters(games),
            bestPlayerCount: n,
          };
          const result = filterGames(games, filters);
          return result.every((g) => g.bestPlayerCounts.includes(n));
        },
      ),
    );
  });

  // Property 7: AND Filter Composition
  it("Given two independent filters applied separately and combined, When filterGames is called, Then the combined result is a subset of each individual filter's result", () => {
    // Validates: Requirements 9.1
    fc.assert(
      fc.property(
        fc.array(gameArbitrary, { maxLength: 20 }),
        fc.array(weightCategoryArbitrary, { minLength: 1, maxLength: 3 }),
        fc.integer({ min: 1, max: 10 }),
        (games, categories, n) => {
          const uniqueCategories = [...new Set(categories)] as WeightCategory[];
          const filtersA: FilterState = {
            ...defaultFilters(games),
            weightCategories: uniqueCategories,
          };
          const filtersB: FilterState = {
            ...defaultFilters(games),
            recommendedPlayerCount: n,
          };
          const filtersBoth: FilterState = {
            ...defaultFilters(games),
            weightCategories: uniqueCategories,
            recommendedPlayerCount: n,
          };
          const resultA = filterGames(games, filtersA);
          const resultB = filterGames(games, filtersB);
          const resultBoth = filterGames(games, filtersBoth);
          const aIds = new Set(resultA.map((g) => g.id));
          const bIds = new Set(resultB.map((g) => g.id));
          return resultBoth.every((g) => aIds.has(g.id) && bIds.has(g.id));
        },
      ),
    );
  });

  // Property 8: Reset Filters Round-Trip
  it("Given any collection of games, When default FilterState is applied, Then all games are returned unchanged", () => {
    // Validates: Requirements 9.1
    fc.assert(
      fc.property(fc.array(gameArbitrary, { maxLength: 20 }), (games) => {
        const result = filterGames(games, defaultFilters(games));
        expect(result).toEqual(games);
      }),
    );
  });

  // Property 9: Active Filter Count Accuracy
  it("Given any FilterState, When countActiveFilters is called, Then the count equals the number of non-default filter dimensions", () => {
    // Validates: Requirements 9.2
    fc.assert(
      fc.property(
        fc.array(gameArbitrary, { minLength: 1, maxLength: 20 }),
        fc.array(weightCategoryArbitrary, { maxLength: 5 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (games, categories, recN, bestN) => {
          const uniqueCategories = [...new Set(categories)] as WeightCategory[];
          const [collMin, collMax] = collectionTimeRange(games);
          // Use a sub-range that differs from the full range to make time filter active
          const timeMin = Math.max(0, collMin + 1);
          const timeMax = Math.max(timeMin, collMax - 1);
          const timeActive = timeMin !== collMin || timeMax !== collMax;

          const filters: FilterState = {
            weightCategories: uniqueCategories,
            timeRange: timeActive ? [timeMin, timeMax] : [collMin, collMax],
            recommendedPlayerCount: recN,
            bestPlayerCount: bestN,
          };

          let expected = 0;
          if (uniqueCategories.length > 0) expected++;
          if (timeActive) expected++;
          expected++; // recommendedPlayerCount is always non-"any" here
          expected++; // bestPlayerCount is always non-"any" here

          return countActiveFilters(filters, games) === expected;
        },
      ),
    );
  });

  // Property 12: Time Range Bounds Derived from Collection
  it("Given any collection of games, When collectionTimeRange is called, Then it returns [min minPlayingTime, max maxPlayingTime]", () => {
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(
        fc.array(gameArbitrary, { minLength: 1, maxLength: 20 }),
        (games) => {
          const [min, max] = collectionTimeRange(games);
          const expectedMin = Math.min(...games.map((g) => g.minPlayingTime));
          const expectedMax = Math.max(...games.map((g) => g.maxPlayingTime));
          return min === expectedMin && max === expectedMax;
        },
      ),
    );
  });

  // Property 13: Time Range Label Format
  it("Given any min and max values, When formatTimeRange is called, Then the label matches '{min}–{max} min' format with an en-dash", () => {
    // Validates: Requirements 6.4
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 300 }),
        fc.integer({ min: 0, max: 300 }),
        (min, max) => {
          const label = formatTimeRange(min, max);
          expect(label).toBe(`${min}\u2013${max} min`);
        },
      ),
    );
  });
});
