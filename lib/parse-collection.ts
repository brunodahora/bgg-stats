import type { CollectionResult, Game } from "./types";

function parsePlayerCountPoll(
  item: Element,
  voteValue: "Best" | "Recommended",
): number[] {
  const poll = item.querySelector('poll[name="suggested_numplayers"]');
  if (!poll) return [];
  const counts: number[] = [];
  for (const results of poll.querySelectorAll("results")) {
    const numPlayers = parseInt(results.getAttribute("numplayers") ?? "", 10);
    if (isNaN(numPlayers)) continue;
    const votes = Object.fromEntries(
      Array.from(results.querySelectorAll("result")).map((r) => [
        r.getAttribute("value"),
        parseInt(r.getAttribute("numvotes") ?? "0", 10),
      ]),
    );
    const maxVotes = Math.max(...Object.values(votes));
    if (maxVotes > 0 && votes[voteValue] === maxVotes) {
      counts.push(numPlayers);
    }
  }
  return counts;
}

export function parseCollection(xml: string): CollectionResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  // Check for parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return { status: "error", message: "Failed to parse XML response" };
  }

  // Check for <message> root element
  const root = doc.documentElement;
  if (root.tagName === "message") {
    const text = root.textContent?.toLowerCase() ?? "";
    if (text.includes("private")) {
      return { status: "private" };
    }
    return { status: "not-found" };
  }

  const items = doc.querySelectorAll("item[subtype='boardgame']");
  const games: Game[] = [];

  for (const item of items) {
    const id = parseInt(item.getAttribute("objectid") ?? "", 10);
    if (isNaN(id)) continue;

    const name = item.querySelector("name")?.textContent ?? "";

    const thumbnailText = item.querySelector("thumbnail")?.textContent?.trim();
    const thumbnail =
      thumbnailText && thumbnailText.length > 0 ? thumbnailText : null;

    const yearText = item.querySelector("yearpublished")?.textContent?.trim();
    const yearPublished =
      yearText && yearText.length > 0 ? parseInt(yearText, 10) : null;

    const stats = item.querySelector("stats");
    const minPlayers = parseInt(stats?.getAttribute("minplayers") ?? "0", 10);
    const maxPlayers = parseInt(stats?.getAttribute("maxplayers") ?? "0", 10);
    const minPlayingTime = parseInt(
      stats?.getAttribute("minplaytime") ?? "0",
      10,
    );
    const maxPlayingTime = parseInt(
      stats?.getAttribute("maxplaytime") ?? "0",
      10,
    );

    const weightText = item
      .querySelector("averageweight")
      ?.getAttribute("value");
    const weight = weightText != null ? parseFloat(weightText) : 0;

    const bggRankText = item
      .querySelector("rank[name='boardgame']")
      ?.getAttribute("value");
    const bggRank =
      bggRankText != null && bggRankText !== "N/A" && bggRankText !== ""
        ? parseInt(bggRankText, 10)
        : null;

    const userRatingText = item
      .querySelector("stats rating")
      ?.getAttribute("value");
    const userRating =
      userRatingText != null &&
      userRatingText !== "N/A" &&
      userRatingText !== ""
        ? parseFloat(userRatingText)
        : null;

    const recommendedPlayerCounts = parsePlayerCountPoll(item, "Recommended");
    const bestPlayerCounts = parsePlayerCountPoll(item, "Best");

    games.push({
      id,
      name,
      thumbnail,
      yearPublished: isNaN(yearPublished as number) ? null : yearPublished,
      minPlayers: isNaN(minPlayers) ? 0 : minPlayers,
      maxPlayers: isNaN(maxPlayers) ? 0 : maxPlayers,
      minPlayingTime: isNaN(minPlayingTime) ? 0 : minPlayingTime,
      maxPlayingTime: isNaN(maxPlayingTime) ? 0 : maxPlayingTime,
      weight: isNaN(weight) ? 0 : weight,
      bggRank: bggRank != null && isNaN(bggRank) ? null : bggRank,
      userRating: userRating != null && isNaN(userRating) ? null : userRating,
      recommendedPlayerCounts,
      bestPlayerCounts,
    });
  }

  return { status: "success", games };
}
