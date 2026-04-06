import { http, HttpResponse } from "msw";

// Realistic BGG XML fixture with one game (Gloomhaven)
export const BGG_COLLECTION_XML = `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="Sun, 01 Jan 2023 00:00:00 +0000">
  <item objectid="174430" subtype="boardgame">
    <name sortindex="1">Gloomhaven</name>
    <thumbnail>https://example.com/thumb.jpg</thumbnail>
    <yearpublished>2017</yearpublished>
    <stats minplayers="1" maxplayers="4" minplaytime="60" maxplaytime="120">
      <rating value="9.5">
        <usersrated value="50000"/>
        <average value="8.5"/>
        <stddev value="1.5"/>
        <median value="0"/>
        <ranks>
          <rank type="subtype" id="1" name="boardgame" friendlyname="Board Game Rank" value="1" bayesaverage="8.4"/>
        </ranks>
      </rating>
      <averageweight value="3.86"/>
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
</items>`;

export const handlers = [
  http.get("/api/bgg/collection", () => {
    return new HttpResponse(BGG_COLLECTION_XML, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }),
];
