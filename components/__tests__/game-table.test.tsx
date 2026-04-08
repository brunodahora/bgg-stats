import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render, screen, within } from "@testing-library/react";
import { GameTable } from "../game-table";
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

describe("GameTable", () => {
  it("Given a list of games, When the table is rendered, Then a row appears for each game", () => {
    const games = [
      makeGame({ id: 1, name: "Game A" }),
      makeGame({ id: 2, name: "Game B" }),
    ];
    render(<GameTable games={games} />);

    expect(screen.getByRole("link", { name: "Game A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Game B" })).toBeInTheDocument();
  });

  it("Given a game with all fields populated, When the table is rendered, Then all column values are visible", () => {
    render(<GameTable games={[makeGame()]} />);

    expect(screen.getByRole("link", { name: "Gloomhaven" })).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/174430",
    );
    expect(screen.getByText("2017")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // BGG rank
    expect(screen.getByText(/3\.9.*Medium Heavy/)).toBeInTheDocument();
    expect(screen.getByText("60\u2013120 min")).toBeInTheDocument();
    expect(screen.getByText("1\u20134")).toBeInTheDocument();
    expect(screen.getByText("9.5/10")).toBeInTheDocument();
    expect(screen.getByText("standalone")).toBeInTheDocument();
  });

  it("Given a game with itemType 'expansion', When the table is rendered, Then 'expansion' is shown in the Type column", () => {
    render(<GameTable games={[makeGame({ itemType: "expansion" })]} />);

    expect(screen.getByText("expansion")).toBeInTheDocument();
  });

  it("Given a game with itemType 'standalone', When the table is rendered, Then 'standalone' is shown in the Type column", () => {
    render(<GameTable games={[makeGame({ itemType: "standalone" })]} />);

    expect(screen.getByText("standalone")).toBeInTheDocument();
  });

  it("Given a game with bggRank: null, When the table is rendered, Then 'N/A' is shown in the BGG Rank column", () => {
    render(<GameTable games={[makeGame({ bggRank: null })]} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("Given a game with userRating: null, When the table is rendered, Then 'Not rated' is shown in the Your Rating column", () => {
    render(<GameTable games={[makeGame({ userRating: null })]} />);

    expect(screen.getByText("Not rated")).toBeInTheDocument();
  });

  it("Given a game with equal min and max playing time, When the table is rendered, Then time is shown as '{N} min'", () => {
    render(
      <GameTable
        games={[makeGame({ minPlayingTime: 90, maxPlayingTime: 90 })]}
      />,
    );

    expect(screen.getByText("90 min")).toBeInTheDocument();
  });

  it("Given a game with yearPublished: null, When the table is rendered, Then '—' is shown in the Year column", () => {
    render(<GameTable games={[makeGame({ yearPublished: null })]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("Given an empty games list, When the table is rendered, Then the header row is shown and no data rows are present", () => {
    render(<GameTable games={[]} />);

    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("Given the table is rendered, When inspecting the headers, Then all expected columns are present", () => {
    render(<GameTable games={[]} />);

    const expectedHeaders = [
      "Name",
      "Year",
      "BGG Rank",
      "Weight",
      "Time",
      "Players",
      "Type",
      "Your Rating",
    ];
    for (const header of expectedHeaders) {
      expect(
        screen.getByRole("columnheader", { name: header }),
      ).toBeInTheDocument();
    }
  });

  it("Given multiple games, When the table is rendered, Then each game name links to its BGG page", () => {
    const games = [
      makeGame({ id: 1, name: "Alpha" }),
      makeGame({ id: 2, name: "Beta" }),
    ];
    render(<GameTable games={games} />);

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/1",
    );
    expect(screen.getByRole("link", { name: "Beta" })).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/2",
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
  // Feature: bgg-collection-browser, Property: GameTable row count matches input
  it("Given any array of Game objects, When the table is rendered, Then the number of data rows equals the number of games", () => {
    fc.assert(
      fc.property(
        fc.array(
          gameArbitrary.filter((g) => g.name.trim().length > 0),
          { minLength: 0, maxLength: 20 },
        ),
        (games) => {
          const { unmount } = render(<GameTable games={games} />);
          const rows = screen.getAllByRole("row");
          // rows includes the header row, so subtract 1
          expect(rows.length - 1).toBe(games.length);
          unmount();
        },
      ),
    );
  });

  // Feature: bgg-collection-browser, Property: GameTable itemType always shown as capitalized label
  it("Given any Game object, When the table is rendered, Then the Type cell shows 'Standalone' or 'Expansion'", () => {
    fc.assert(
      fc.property(
        gameArbitrary.filter((g) => g.name.trim().length > 0),
        (game) => {
          const { unmount } = render(<GameTable games={[game]} />);
          const rows = screen.getAllByRole("row");
          const dataRow = rows[1];
          const typeCell = within(dataRow).getByText(
            /^(standalone|expansion)$/i,
          );
          expect(typeCell).toBeInTheDocument();
          unmount();
        },
      ),
    );
  });
});
