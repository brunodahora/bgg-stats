import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import * as fc from "fast-check";
import { NextRequest } from "next/server";
import { GET } from "../route";

const BGG_COLLECTION_URL = "https://boardgamegeek.com/xmlapi2/collection";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeRequest(username?: string): NextRequest {
  const url = username
    ? `http://localhost/api/bgg/collection?username=${encodeURIComponent(username)}`
    : "http://localhost/api/bgg/collection";
  return new NextRequest(url);
}

describe("GET /api/bgg/collection", () => {
  describe("username validation", () => {
    it("Given no username parameter, When the handler is called, Then it returns HTTP 400", async () => {
      const req = makeRequest();
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });

    it("Given a whitespace-only username, When the handler is called, Then it returns HTTP 400", async () => {
      const req = makeRequest("   ");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });
  });

  describe("successful response", () => {
    it("Given BGG returns XML with status 200, When the handler is called, Then it returns that XML with Content-Type application/xml", async () => {
      const xml = `<?xml version="1.0"?><items totalitems="1"></items>`;
      server.use(
        http.get(
          BGG_COLLECTION_URL,
          () =>
            new HttpResponse(xml, {
              status: 200,
              headers: { "Content-Type": "text/xml" },
            }),
        ),
      );

      const res = await GET(makeRequest("testuser"));
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/xml");
      expect(await res.text()).toBe(xml);
    });
  });

  describe("202 retry behavior", () => {
    it("Given BGG returns 202 once then 200, When the handler is called, Then it retries and returns the XML", async () => {
      const xml = `<items></items>`;
      let callCount = 0;
      server.use(
        http.get(BGG_COLLECTION_URL, () => {
          callCount++;
          if (callCount === 1) return new HttpResponse(null, { status: 202 });
          return new HttpResponse(xml, {
            status: 200,
            headers: { "Content-Type": "text/xml" },
          });
        }),
      );

      const res = await GET(makeRequest("testuser"));
      expect(res.status).toBe(200);
      expect(callCount).toBe(2);
    });

    it("Given BGG returns 202 on all retries, When retries are exhausted, Then it returns HTTP 503", async () => {
      server.use(
        http.get(
          BGG_COLLECTION_URL,
          () => new HttpResponse(null, { status: 202 }),
        ),
      );

      vi.useFakeTimers();
      const responsePromise = GET(makeRequest("testuser"));
      await vi.runAllTimersAsync();
      const res = await responsePromise;
      vi.useRealTimers();

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });
  });

  describe("error status passthrough", () => {
    it("Given BGG returns 404, When the handler is called, Then it returns HTTP 404", async () => {
      server.use(
        http.get(
          BGG_COLLECTION_URL,
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      const res = await GET(makeRequest("unknownuser"));
      expect(res.status).toBe(404);
    });

    it("Given BGG returns 500, When the handler is called, Then it returns HTTP 500", async () => {
      server.use(
        http.get(
          BGG_COLLECTION_URL,
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      const res = await GET(makeRequest("testuser"));
      expect(res.status).toBe(500);
    });
  });
});

describe("properties", () => {
  // Feature: bgg-collection-browser, Property 14: API Proxy XML Passthrough
  it("Given any valid XML string returned by BGG with status 200, When the handler is called, Then it returns that exact XML with Content-Type application/xml", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1 })
          .map((s) => `<root>${s.replace(/[<>&"']/g, "")}</root>`),
        async (xml) => {
          server.use(
            http.get(
              BGG_COLLECTION_URL,
              () =>
                new HttpResponse(xml, {
                  status: 200,
                  headers: { "Content-Type": "text/xml" },
                }),
            ),
          );

          const res = await GET(makeRequest("testuser"));
          const body = await res.text();

          return (
            res.status === 200 &&
            res.headers.get("Content-Type") === "application/xml" &&
            body === xml
          );
        },
      ),
      { numRuns: 20 },
    );
  });

  // Feature: bgg-collection-browser, Property 15: API Proxy Error Status Passthrough
  it("Given any non-200, non-202 status from BGG, When the handler is called, Then it returns a response with that same status code", async () => {
    // Valid HTTP error status codes to test (excluding 202 and 200)
    const errorStatuses = fc.integer({ min: 400, max: 599 });

    await fc.assert(
      fc.asyncProperty(errorStatuses, async (status) => {
        server.use(
          http.get(
            BGG_COLLECTION_URL,
            () => new HttpResponse(null, { status }),
          ),
        );

        const res = await GET(makeRequest("testuser"));
        return res.status === status;
      }),
      { numRuns: 20 },
    );
  });
});
