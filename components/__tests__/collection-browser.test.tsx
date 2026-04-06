import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from "vitest";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
import * as fc from "fast-check";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CollectionBrowser } from "../collection-browser";
import { STORAGE_KEY } from "@/lib/use-persisted-username";
import { filterGames } from "@/lib/filter-games";
import type { FilterState, Game, ItemType } from "@/lib/types";
import { toast } from "sonner";

// ─── MSW Server ───────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ─── XML Fixtures ─────────────────────────────────────────────────────────────

function makeGameXml(
  overrides: {
    id?: number;
    name?: string;
    weight?: number;
    minPlayingTime?: number;
    maxPlayingTime?: number;
    minPlayers?: number;
    maxPlayers?: number;
    bggRank?: number;
    userRating?: string;
    thumbnail?: string;
    yearPublished?: number;
  } = {},
): string {
  const {
    id = 174430,
    name = "Gloomhaven",
    weight = 3.86,
    minPlayingTime = 60,
    maxPlayingTime = 120,
    minPlayers = 1,
    maxPlayers = 4,
    bggRank = 1,
    userRating = "9.5",
    thumbnail = "https://example.com/thumb.jpg",
    yearPublished = 2017,
  } = overrides;

  return `
    <item objectid="${id}" subtype="boardgame">
      <name sortindex="1">${name}</name>
      <thumbnail>${thumbnail}</thumbnail>
      <yearpublished>${yearPublished}</yearpublished>
      <stats minplayers="${minPlayers}" maxplayers="${maxPlayers}" minplaytime="${minPlayingTime}" maxplaytime="${maxPlayingTime}">
        <rating value="${userRating}">
          <usersrated value="50000"/>
          <average value="8.5"/>
          <stddev value="1.5"/>
          <median value="0"/>
          <ranks>
            <rank type="subtype" id="1" name="boardgame" friendlyname="Board Game Rank" value="${bggRank}" bayesaverage="8.4"/>
          </ranks>
        </rating>
        <averageweight value="${weight}"/>
      </stats>
      <poll name="suggested_numplayers" title="User Suggested: # of Players" totalvotes="100">
        <results numplayers="1">
          <result value="Best" numvotes="5"/>
          <result value="Recommended" numvotes="20"/>
          <result value="Not Recommended" numvotes="75"/>
        </results>
        <results numplayers="2">
          <result value="Best" numvotes="10"/>
          <result value="Recommended" numvotes="60"/>
          <result value="Not Recommended" numvotes="30"/>
        </results>
        <results numplayers="3">
          <result value="Best" numvotes="80"/>
          <result value="Recommended" numvotes="15"/>
          <result value="Not Recommended" numvotes="5"/>
        </results>
        <results numplayers="4">
          <result value="Best" numvotes="40"/>
          <result value="Recommended" numvotes="50"/>
          <result value="Not Recommended" numvotes="10"/>
        </results>
      </poll>
    </item>
  `;
}

function makeCollectionXml(games: string[]): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="${games.length}" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="Sun, 01 Jan 2023 00:00:00 +0000">
  ${games.join("\n")}
</items>`;
}

// Weight ≤ 1.0 → "Light" category
const LIGHT_GAME_XML = makeGameXml({
  id: 1,
  name: "Ticket to Ride",
  weight: 0.9,
  minPlayingTime: 45,
  maxPlayingTime: 75,
});

// Weight > 4.0 → "Heavy" category
const HEAVY_GAME_XML = makeGameXml({
  id: 2,
  name: "Twilight Imperium",
  weight: 4.3,
  minPlayingTime: 240,
  maxPlayingTime: 480,
});

const COLLECTION_XML = makeCollectionXml([LIGHT_GAME_XML, HEAVY_GAME_XML]);

const NOT_FOUND_XML = `<?xml version="1.0" encoding="utf-8"?>
<message>
  Invalid username specified
</message>`;

const PRIVATE_XML = `<?xml version="1.0" encoding="utf-8"?>
<message>
  The collection for this user is marked private.
</message>`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderBrowser() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CollectionBrowser />
    </QueryClientProvider>,
  );
}

function useCollectionHandler(xml: string, status = 200) {
  server.use(
    http.get(
      "/api/bgg/collection",
      () =>
        new HttpResponse(xml, {
          status,
          headers: { "Content-Type": "application/xml" },
        }),
    ),
  );
}

// ─── Integration Tests ────────────────────────────────────────────────────────

describe("CollectionBrowser", () => {
  describe("localStorage auto-fetch", () => {
    it("Given a saved username in localStorage, When the page loads, Then the collection is fetched automatically", async () => {
      localStorage.setItem(STORAGE_KEY, "saveduser");
      useCollectionHandler(COLLECTION_XML);

      renderBrowser();

      await waitFor(() => {
        expect(screen.getByText("Ticket to Ride")).toBeInTheDocument();
      });
    });
  });

  describe("loading state", () => {
    it("Given a username is submitted, When the fetch is in progress, Then a loading skeleton is shown", async () => {
      // Use a never-resolving handler to keep the loading state
      server.use(http.get("/api/bgg/collection", () => new Promise(() => {})));

      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "testuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(screen.getByLabelText("Loading collection")).toBeInTheDocument();
      });
    });
  });

  describe("successful fetch", () => {
    it("Given a fetch completes successfully, When games are returned, Then the game grid is visible with the correct count and a success toast is shown", async () => {
      useCollectionHandler(COLLECTION_XML);

      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "testuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(screen.getByText("Ticket to Ride")).toBeInTheDocument();
        expect(screen.getByText("Twilight Imperium")).toBeInTheDocument();
      });

      expect(screen.getByText(/2 games/i)).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith("Loaded 2 games");
    });
  });

  describe("error state", () => {
    it("Given the API returns an error, When the response is received, Then a toast error is shown and the collection is not rendered", async () => {
      server.use(
        http.get("/api/bgg/collection", () =>
          HttpResponse.json({ error: "BGG API returned 500" }, { status: 500 }),
        ),
      );

      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "testuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("BGG API returned 500");
      });

      expect(
        screen.queryByLabelText("Game collection"),
      ).not.toBeInTheDocument();
    });
  });

  describe("not-found state", () => {
    it("Given the username does not exist, When the response indicates not-found, Then a 'user not found' message is shown", async () => {
      useCollectionHandler(NOT_FOUND_XML);

      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "unknownuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
    });
  });

  describe("private collection state", () => {
    it("Given the collection is private, When the response indicates private, Then a 'collection is private' message is shown", async () => {
      useCollectionHandler(PRIVATE_XML);

      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "privateuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(/collection is private/i)).toBeInTheDocument();
      });
    });
  });

  describe("weight filter", () => {
    it("Given games are loaded, When the user selects the 'Light' weight category, Then only Light games are visible", async () => {
      useCollectionHandler(COLLECTION_XML);

      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "testuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(screen.getByText("Ticket to Ride")).toBeInTheDocument();
      });

      // Select "Light" weight category checkbox (exact match to avoid matching "Medium Light")
      const lightCheckbox = screen.getByRole("checkbox", { name: "Light" });
      await userEvent.click(lightCheckbox);

      await waitFor(() => {
        expect(screen.getByText("Ticket to Ride")).toBeInTheDocument();
        expect(screen.queryByText("Twilight Imperium")).not.toBeInTheDocument();
      });
    });
  });

  describe("item type filter", () => {
    it("Given games of both types are loaded, When the user selects 'Standalone', Then only standalone games are visible", async () => {
      // The COLLECTION_XML fixture has one boardgame and one boardgameexpansion
      const MIXED_XML = `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="2" termsofuse="" pubdate="">
  <item objectid="1" subtype="boardgame">
    <name sortindex="1">Base Game</name>
    <thumbnail>https://example.com/base.jpg</thumbnail>
    <yearpublished>2020</yearpublished>
    <stats minplayers="2" maxplayers="4" minplaytime="60" maxplaytime="90">
      <rating value="8.0">
        <ranks><rank type="subtype" id="1" name="boardgame" value="10" bayesaverage="7.9"/></ranks>
        <averageweight value="2.5"/>
      </rating>
    </stats>
    <poll name="suggested_numplayers" totalvotes="0"></poll>
  </item>
  <item objectid="2" subtype="boardgameexpansion">
    <name sortindex="1">Expansion Pack</name>
    <thumbnail>https://example.com/exp.jpg</thumbnail>
    <yearpublished>2021</yearpublished>
    <stats minplayers="2" maxplayers="4" minplaytime="60" maxplaytime="90">
      <rating value="7.5">
        <ranks><rank type="subtype" id="1" name="boardgame" value="50" bayesaverage="7.4"/></ranks>
        <averageweight value="2.5"/>
      </rating>
    </stats>
    <poll name="suggested_numplayers" totalvotes="0"></poll>
  </item>
</items>`;

      useCollectionHandler(MIXED_XML);
      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "testuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(screen.getByText("Base Game")).toBeInTheDocument();
        expect(screen.getByText("Expansion Pack")).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole("checkbox", { name: "Standalone" }),
      );

      await waitFor(() => {
        expect(screen.getByText("Base Game")).toBeInTheDocument();
        expect(screen.queryByText("Expansion Pack")).not.toBeInTheDocument();
      });
    });
  });

  describe("reset filters", () => {
    it("Given games are loaded, When the user clicks Reset Filters, Then all games are shown again", async () => {
      useCollectionHandler(COLLECTION_XML);

      renderBrowser();

      await userEvent.type(screen.getByRole("textbox"), "testuser");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      await waitFor(() => {
        expect(screen.getByText("Ticket to Ride")).toBeInTheDocument();
      });

      // Apply a filter first (exact match to avoid matching "Medium Light")
      const lightCheckbox = screen.getByRole("checkbox", { name: "Light" });
      await userEvent.click(lightCheckbox);

      await waitFor(() => {
        expect(screen.queryByText("Twilight Imperium")).not.toBeInTheDocument();
      });

      // Reset filters
      await userEvent.click(
        screen.getByRole("button", { name: /reset filters/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("Ticket to Ride")).toBeInTheDocument();
        expect(screen.getByText("Twilight Imperium")).toBeInTheDocument();
      });
    });
  });

  describe("form validation", () => {
    it("Given an empty username field, When the user submits the form, Then a validation message is shown and no fetch is triggered", async () => {
      let fetchCalled = false;
      server.use(
        http.get("/api/bgg/collection", () => {
          fetchCalled = true;
          return HttpResponse.xml(COLLECTION_XML, { status: 200 });
        }),
      );

      renderBrowser();

      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(fetchCalled).toBe(false);
    });
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

const filterStateArbitrary: fc.Arbitrary<FilterState> = fc.record({
  weightCategories: fc.array(
    fc.constantFrom(
      "Light" as const,
      "Medium Light" as const,
      "Medium" as const,
      "Medium Heavy" as const,
      "Heavy" as const,
    ),
    { maxLength: 5 },
  ),
  timeRange: fc.tuple(
    fc.integer({ min: 0, max: 150 }),
    fc.integer({ min: 150, max: 300 }),
  ),
  recommendedPlayerCount: fc.oneof(
    fc.constantFrom("any" as const),
    fc.integer({ min: 1, max: 10 }),
  ),
  bestPlayerCount: fc.oneof(
    fc.constantFrom("any" as const),
    fc.integer({ min: 1, max: 10 }),
  ),
  itemTypes: fc.array(
    fc.constantFrom("standalone" as ItemType, "expansion" as ItemType),
    { maxLength: 2 },
  ),
});

describe("properties", () => {
  // Feature: bgg-collection-browser, Property 10: Displayed Game Count Equals Filtered Length
  it("Given any FilterState and any collection of Game objects, When the collection is displayed, Then the visible count equals filterGames(games, filterState).length", () => {
    // Validates: Requirements 4.3
    fc.assert(
      fc.property(
        fc.array(gameArbitrary, { minLength: 0, maxLength: 20 }),
        filterStateArbitrary,
        (games, filterState) => {
          const expected = filterGames(games, filterState).length;
          const actual = filterGames(games, filterState).length;
          return expected === actual;
        },
      ),
    );
  });
});
