"use client";

import Image from "next/image";
import { getWeightCategory } from "@/lib/types";
import type { Game } from "@/lib/types";

interface GameTableProps {
  games: Game[];
}

function formatPlayingTime(min: number, max: number): string {
  if (min === max) return `${min} min`;
  return `${min}\u2013${max} min`;
}

export function GameTable({ games }: GameTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-bgg-navy text-white">
          <tr>
            <th className="text-left px-3 py-2 font-semibold w-8"></th>
            <th className="text-left px-3 py-2 font-semibold">Name</th>
            <th className="text-left px-3 py-2 font-semibold">Year</th>
            <th className="text-left px-3 py-2 font-semibold">BGG Rank</th>
            <th className="text-left px-3 py-2 font-semibold">Weight</th>
            <th className="text-left px-3 py-2 font-semibold">Time</th>
            <th className="text-left px-3 py-2 font-semibold">Players</th>
            <th className="text-left px-3 py-2 font-semibold">Type</th>
            <th className="text-left px-3 py-2 font-semibold">Your Rating</th>
          </tr>
        </thead>
        <tbody className="text-gray-800">
          {games.map((game, i) => {
            const weightCategory = getWeightCategory(game.weight);
            const weightLabel = weightCategory
              ? `${game.weight.toFixed(1)} \u2013 ${weightCategory}`
              : game.weight.toFixed(1);

            return (
              <tr
                key={game.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-3 py-2">
                  <div className="relative w-8 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                    {game.thumbnail ? (
                      <Image
                        src={game.thumbnail}
                        alt={game.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-muted"
                        aria-label="No thumbnail"
                      />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 font-medium text-gray-900">
                  <a
                    href={`https://boardgamegeek.com/boardgame/${game.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {game.name}
                  </a>
                </td>
                <td className="px-3 py-2">{game.yearPublished ?? "—"}</td>
                <td className="px-3 py-2">{game.bggRank ?? "N/A"}</td>
                <td className="px-3 py-2">{weightLabel}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatPlayingTime(game.minPlayingTime, game.maxPlayingTime)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {`${game.minPlayers}\u2013${game.maxPlayers}`}
                </td>
                <td className="px-3 py-2 capitalize">{game.itemType}</td>
                <td className="px-3 py-2">
                  {game.userRating !== null
                    ? `${game.userRating.toFixed(1)}/10`
                    : "Not rated"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
