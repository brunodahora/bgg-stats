"use client";

import Image from "next/image";
import { getWeightCategory } from "@/lib/types";
import type { Game } from "@/lib/types";

export interface GameCardProps {
  game: Game;
}

function formatPlayingTime(min: number, max: number): string {
  if (min === max) return `${min} min`;
  return `${min}\u2013${max} min`;
}

export function GameCard({ game }: GameCardProps) {
  const weightCategory = getWeightCategory(game.weight);
  const weightLabel = weightCategory
    ? `${game.weight.toFixed(1)} \u2013 ${weightCategory}`
    : game.weight.toFixed(1);

  return (
    <article className="flex flex-col rounded-lg border bg-card text-card-foreground overflow-hidden">
      <div className="relative w-full h-32 bg-muted flex items-center justify-center">
        {game.thumbnail ? (
          <Image
            src={game.thumbnail}
            alt={game.name}
            fill
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-muted-foreground text-sm"
            aria-label="No thumbnail available"
          >
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1">
        <h2 className="font-semibold text-sm leading-tight">
          <a
            href={`https://boardgamegeek.com/boardgame/${game.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {game.name}
          </a>
        </h2>

        <dl className="text-xs text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
          {game.yearPublished !== null && (
            <>
              <dt>Year</dt>
              <dd>{game.yearPublished}</dd>
            </>
          )}

          <dt>BGG Rank</dt>
          <dd>{game.bggRank !== null ? game.bggRank : "N/A"}</dd>

          <dt>Weight</dt>
          <dd>{weightLabel}</dd>

          <dt>Time</dt>
          <dd>{formatPlayingTime(game.minPlayingTime, game.maxPlayingTime)}</dd>

          <dt>Players</dt>
          <dd>{`${game.minPlayers}\u2013${game.maxPlayers}`}</dd>

          <dt>Your rating</dt>
          <dd>
            {game.userRating !== null
              ? `${game.userRating.toFixed(1)}/10`
              : "Not rated"}
          </dd>
        </dl>
      </div>
    </article>
  );
}
