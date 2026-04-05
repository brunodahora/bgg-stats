import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parseCollection } from "../parse-collection";
import type { Game } from "../types";

// Full XML fixture with all fields populated
const FULL_XML = `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="Mon, 01 Jan 2024 00:00:00 +0000">
  <item objectid="174430" subtype="boardgame" collid="12345">
    <name sortindex="1">Gloomhaven</name>
    <yearpublished>2017</yearpublished>
    <thumbnail>https://example.com/thumb.jpg</thumbnail>
    <stats minplayers="1" maxplayers="4" minplaytime="60" maxplaytime="120" numowned="100000">
      <rating value="8.5">
        <usersrated value="50000"/>
        <average value="8.5"/>
        <bayesaverage value="8.4"/>
        <stddev value="1.5"/>
        <median value="0"/>
        <ranks>
          <rank type="subtype" id="1" name="boardgame" friendlyname="Board Game Rank" value="1" bayesaverage="8.4"/>
        </ranks>
        <averageweight value="3.86"/>
      </rating>
    </stats>
    <poll name="suggested_numplayers" title="User Suggested: Number of Players" totalvotes="1000">
      <results numplayers="1">
        <result value="Best" numvotes="50"/>
        <result value="Recommended" numvotes="200"/>
        <result value="Not Recommended" numvotes="100"/>
      </results>
      <results numplayers="2">
        <result value="Best" numvotes="300"/>
        <result value="Recommended" numvotes="200"/>
        <result value="Not Recommended" numvotes="50"/>
      </results>
      <results numplayers="3">
        <result value="Best" numvotes="400"/>
        <result value="Recommended" numvotes="300"/>
        <result value="Not Recommended" numvotes="30"/>
      </results>
      <results numplayers="4">
        <result value="Best" numvotes="100"/>
        <result value="Recommended" numvotes="350"/>
        <result value="Not Recommended" numvotes="80"/>
      </results>
    </poll>
  </item>
</items>`;

const NOT_FOUND_XML = `<?xml version="1.0" encoding="utf-8"?>
<message>
  Invalid username specified
</message>`;

const PRIVATE_XML = `<?xml version="1.0" encoding="utf-8"?>
<message>
  The collection for this user is marked as private.
</message>`;

const MISSING_OPTIONAL_XML = `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="Mon, 01 Jan 2024 00:00:00 +0000">
  <item objectid="999" subtype="boardgame" collid="111">
    <name sortindex="1">Some Game</name>
    <stats minplayers="2" maxplayers="4" minplaytime="30" maxplaytime="60" numowned="500">
      <rating value="N/A">
        <ranks>
          <rank type="subtype" id="1" name="boardgame" friendlyname="Board Game Rank" value="N/A" bayesaverage="0"/>
        </ranks>
        <averageweight value="2.0"/>
      </rating>
    </stats>
  </item>
</items>`;

describe("parseCollection", () => {
  describe("full XML fixture", () => {
    it("Given a full BGG XML response, When parsed, Then returns status success with games array", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.games).toHaveLength(1);
      }
    });

    it("Given a full BGG XML response, When parsed, Then game has correct id and name", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        const game = result.games[0];
        expect(game.id).toBe(174430);
        expect(game.name).toBe("Gloomhaven");
      }
    });

    it("Given a full BGG XML response, When parsed, Then game has correct thumbnail and yearPublished", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        const game = result.games[0];
        expect(game.thumbnail).toBe("https://example.com/thumb.jpg");
        expect(game.yearPublished).toBe(2017);
      }
    });

    it("Given a full BGG XML response, When parsed, Then game has correct player counts and playing times", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        const game = result.games[0];
        expect(game.minPlayers).toBe(1);
        expect(game.maxPlayers).toBe(4);
        expect(game.minPlayingTime).toBe(60);
        expect(game.maxPlayingTime).toBe(120);
      }
    });

    it("Given a full BGG XML response, When parsed, Then game has correct weight and bggRank", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        const game = result.games[0];
        expect(game.weight).toBeCloseTo(3.86);
        expect(game.bggRank).toBe(1);
      }
    });

    it("Given a full BGG XML response, When parsed, Then game has correct userRating", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        const game = result.games[0];
        expect(game.userRating).toBeCloseTo(8.5);
      }
    });

    it("Given a full BGG XML response, When parsed, Then game has correct recommendedPlayerCounts", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        const game = result.games[0];
        // Recommended: player counts where Recommended has most votes
        // 1: Best=50, Rec=200, NotRec=100 → Recommended wins → included
        // 2: Best=300, Rec=200, NotRec=50 → Best wins → not included
        // 3: Best=400, Rec=300, NotRec=30 → Best wins → not included
        // 4: Best=100, Rec=350, NotRec=80 → Recommended wins → included
        expect(game.recommendedPlayerCounts).toContain(1);
        expect(game.recommendedPlayerCounts).toContain(4);
        expect(game.recommendedPlayerCounts).not.toContain(2);
        expect(game.recommendedPlayerCounts).not.toContain(3);
      }
    });

    it("Given a full BGG XML response, When parsed, Then game has correct bestPlayerCounts", () => {
      const result = parseCollection(FULL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        const game = result.games[0];
        // Best: player counts where Best has most votes
        // 2: Best=300 wins → included
        // 3: Best=400 wins → included
        expect(game.bestPlayerCounts).toContain(2);
        expect(game.bestPlayerCounts).toContain(3);
        expect(game.bestPlayerCounts).not.toContain(1);
        expect(game.bestPlayerCounts).not.toContain(4);
      }
    });
  });

  describe("message root element", () => {
    it("Given XML with a <message> root element for invalid username, When parsed, Then returns not-found status", () => {
      const result = parseCollection(NOT_FOUND_XML);
      expect(result.status).toBe("not-found");
    });

    it("Given XML with a <message> root element indicating private collection, When parsed, Then returns private status", () => {
      const result = parseCollection(PRIVATE_XML);
      expect(result.status).toBe("private");
    });
  });

  describe("missing optional fields", () => {
    it("Given XML with no thumbnail element, When parsed, Then thumbnail is null", () => {
      const result = parseCollection(MISSING_OPTIONAL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.games[0].thumbnail).toBeNull();
      }
    });

    it("Given XML with no yearpublished element, When parsed, Then yearPublished is null", () => {
      const result = parseCollection(MISSING_OPTIONAL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.games[0].yearPublished).toBeNull();
      }
    });

    it("Given XML with bggRank value of N/A, When parsed, Then bggRank is null", () => {
      const result = parseCollection(MISSING_OPTIONAL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.games[0].bggRank).toBeNull();
      }
    });

    it("Given XML with userRating value of N/A, When parsed, Then userRating is null", () => {
      const result = parseCollection(MISSING_OPTIONAL_XML);
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.games[0].userRating).toBeNull();
      }
    });
  });
});

// ─── Property-Based Tests ────────────────────────────────────────────────────

const gameArbitrary: fc.Arbitrary<Game> = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  thumbnail: fc.option(
    fc.webUrl().filter((u) => u.length < 200),
    { nil: null },
  ),
  yearPublished: fc.option(fc.integer({ min: 1900, max: 2100 }), {
    nil: null,
  }),
  minPlayers: fc.integer({ min: 1, max: 10 }),
  maxPlayers: fc.integer({ min: 1, max: 10 }),
  minPlayingTime: fc.integer({ min: 0, max: 300 }),
  maxPlayingTime: fc.integer({ min: 0, max: 600 }),
  weight: fc.float({ min: 0, max: 5, noNaN: true }),
  bggRank: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: null }),
  userRating: fc.option(fc.float({ min: 1, max: 10, noNaN: true }), {
    nil: null,
  }),
  recommendedPlayerCounts: fc.array(fc.integer({ min: 1, max: 10 }), {
    maxLength: 10,
  }),
  bestPlayerCounts: fc.array(fc.integer({ min: 1, max: 10 }), {
    maxLength: 10,
  }),
});

describe("properties", () => {
  // Property 1: XML Parsing Round-Trip
  it("Given any Game[], When JSON.stringify then JSON.parse, Then produces a deeply equal array", () => {
    fc.assert(
      fc.property(fc.array(gameArbitrary, { maxLength: 10 }), (games) => {
        const roundTripped = JSON.parse(JSON.stringify(games)) as Game[];
        expect(roundTripped).toEqual(games);
      }),
    );
  });

  // Property 2: Missing Optional Fields Produce Null, Not Errors
  it("Given XML with absent optional fields, When parsed, Then optional fields are null and no error is thrown", () => {
    // Arbitrary that generates minimal game XML with optional fields absent
    const minimalGameXmlArbitrary = fc
      .record({
        id: fc.integer({ min: 1, max: 999999 }),
        name: fc
          .string({ minLength: 1, maxLength: 50 })
          .filter(
            (s) => !s.includes("<") && !s.includes("&") && !s.includes(">"),
          ),
        minPlayers: fc.integer({ min: 1, max: 8 }),
        maxPlayers: fc.integer({ min: 1, max: 8 }),
        minPlaytime: fc.integer({ min: 0, max: 300 }),
        maxPlaytime: fc.integer({ min: 0, max: 600 }),
        weight: fc.float({ min: 0, max: 5, noNaN: true }),
      })
      .map(
        ({
          id,
          name,
          minPlayers,
          maxPlayers,
          minPlaytime,
          maxPlaytime,
          weight,
        }) =>
          `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="1" termsofuse="" pubdate="">
  <item objectid="${id}" subtype="boardgame" collid="1">
    <name sortindex="1">${name}</name>
    <stats minplayers="${minPlayers}" maxplayers="${maxPlayers}" minplaytime="${minPlaytime}" maxplaytime="${maxPlaytime}" numowned="1">
      <rating value="N/A">
        <ranks>
          <rank type="subtype" id="1" name="boardgame" friendlyname="Board Game Rank" value="N/A" bayesaverage="0"/>
        </ranks>
        <averageweight value="${weight}"/>
      </rating>
    </stats>
  </item>
</items>`,
      );

    fc.assert(
      fc.property(minimalGameXmlArbitrary, (xml) => {
        const result = parseCollection(xml);
        expect(result.status).toBe("success");
        if (result.status === "success") {
          const game = result.games[0];
          expect(game.thumbnail).toBeNull();
          expect(game.yearPublished).toBeNull();
          expect(game.bggRank).toBeNull();
          expect(game.userRating).toBeNull();
        }
      }),
    );
  });
});
