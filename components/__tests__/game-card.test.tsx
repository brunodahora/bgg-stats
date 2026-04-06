import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import { GameCard } from "../game-card";
import type { Game, ItemType } from "@/lib/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 174430,
    name: "Gloomhaven",
    thumbnail: "https://cf.geekdo-images.com/thumb.jpg",
    yearPublished: 2017,
    minPlayers: 1,
    maxPlayers: 4,
    minPlayingTime: 60,
    maxPlayingTime: 120,
    weight: 3.86,
    bggRank: 1,
    userRating: 9.5,
    recommendedPlayerCounts: [2, 3, 4],
    bestPlayerCounts: [3],
    itemType: "standalone",
    ...overrides,
  };
}

// ─── Integration Tests ────────────────────────────────────────────────────────

describe("GameCard", () => {
  it("Given a game with all fields populated, When the card is rendered, Then all fields are visible with correct formatting", () => {
    render(<GameCard game={makeGame()} />);

    expect(screen.getByRole("link", { name: "Gloomhaven" })).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/174430",
    );
    expect(screen.getByText("2017")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // BGG rank
    expect(screen.getByText("3.9 \u2013 Medium Heavy")).toBeInTheDocument();
    expect(screen.getByText("60\u2013120 min")).toBeInTheDocument();
    expect(screen.getByText("1\u20134")).toBeInTheDocument(); // players
    expect(screen.getByText("9.5/10")).toBeInTheDocument();
  });

  it("Given a game with thumbnail: null, When the card is rendered, Then a placeholder image is shown", () => {
    render(<GameCard game={makeGame({ thumbnail: null })} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByLabelText("No thumbnail available")).toBeInTheDocument();
  });

  it("Given a game with bggRank: null, When the card is rendered, Then 'N/A' is displayed", () => {
    render(<GameCard game={makeGame({ bggRank: null })} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("Given a game with userRating: null, When the card is rendered, Then 'Not rated' is displayed", () => {
    render(<GameCard game={makeGame({ userRating: null })} />);

    expect(screen.getByText("Not rated")).toBeInTheDocument();
  });

  it("Given a game with equal min and max playing time, When the card is rendered, Then time is shown as '{N} min'", () => {
    render(
      <GameCard game={makeGame({ minPlayingTime: 90, maxPlayingTime: 90 })} />,
    );

    expect(screen.getByText("90 min")).toBeInTheDocument();
  });

  it("Given a game with a thumbnail, When the card is rendered, Then an image element is shown", () => {
    render(<GameCard game={makeGame()} />);

    expect(screen.getByRole("img", { name: "Gloomhaven" })).toBeInTheDocument();
  });

  it("Given a game name, When the card is rendered, Then the name links to the BGG game page", () => {
    render(<GameCard game={makeGame({ id: 999, name: "My Game" })} />);

    const link = screen.getByRole("link", { name: "My Game" });
    expect(link).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/999",
    );
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
  weight: fc.float({
    min: Math.fround(0.01),
    max: Math.fround(5),
    noNaN: true,
  }),
  bggRank: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: null }),
  userRating: fc.option(
    fc.float({ min: Math.fround(1), max: Math.fround(10), noNaN: true }),
    { nil: null },
  ),
  recommendedPlayerCounts: fc.array(fc.integer({ min: 1, max: 10 })),
  bestPlayerCounts: fc.array(fc.integer({ min: 1, max: 10 })),
  itemType: fc.constantFrom("standalone" as ItemType, "expansion" as ItemType),
});

describe("properties", () => {
  // Feature: bgg-collection-browser, Property 11: GameCard Renders All Required Display Fields
  it("Given any Game object, When the card is rendered, Then all required display fields are present in the output", () => {
    // Validates: Requirements 4.1, 4.2, 4.6
    fc.assert(
      fc.property(
        gameArbitrary.filter((g) => g.name.trim().length > 0),
        (game) => {
          const { unmount } = render(<GameCard game={game} />);

          // Game name link to BGG page
          const link = screen.getByRole("link");
          expect(link).toHaveAttribute(
            "href",
            `https://boardgamegeek.com/boardgame/${game.id}`,
          );

          // BGG rank or N/A
          if (game.bggRank !== null) {
            expect(screen.getByText(String(game.bggRank))).toBeInTheDocument();
          } else {
            expect(screen.getByText("N/A")).toBeInTheDocument();
          }

          // User rating or "Not rated"
          if (game.userRating !== null) {
            expect(
              screen.getByText(`${game.userRating.toFixed(1)}/10`),
            ).toBeInTheDocument();
          } else {
            expect(screen.getByText("Not rated")).toBeInTheDocument();
          }

          // Playing time
          const timeText =
            game.minPlayingTime === game.maxPlayingTime
              ? `${game.minPlayingTime} min`
              : `${game.minPlayingTime}\u2013${game.maxPlayingTime} min`;
          expect(screen.getByText(timeText)).toBeInTheDocument();

          unmount();
        },
      ),
    );
  });
});
