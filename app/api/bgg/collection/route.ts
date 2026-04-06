import { type NextRequest } from "next/server";

const BGG_BASE = "https://boardgamegeek.com/xmlapi2";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();

  if (!username) {
    return new Response(JSON.stringify({ error: "username is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = `${BGG_BASE}/collection?username=${encodeURIComponent(username)}&stats=1&own=1`;

  const headers: HeadersInit = {};
  if (process.env.BGG_API_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.BGG_API_TOKEN}`;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, { cache: "no-store", headers });

    if (res.status === 202) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return new Response(
        JSON.stringify({
          error: "BGG is still processing the request. Please try again.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `BGG API returned ${res.status}` }),
        { status: res.status, headers: { "Content-Type": "application/json" } },
      );
    }

    const xml = await res.text();

    // BGG returns errors as XML with a 200 status, e.g. invalid username
    if (xml.includes("<errors>")) {
      const match = xml.match(/<message>([^<]+)<\/message>/);
      const message = match?.[1] ?? "Unknown BGG error";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  // Unreachable — loop always returns, but satisfies TypeScript
  return new Response(JSON.stringify({ error: "Unexpected error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
