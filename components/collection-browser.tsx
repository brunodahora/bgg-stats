"use client";

import { useState, useMemo, useEffect, startTransition } from "react";
import { toast } from "sonner";
import { useBggCollection } from "@/lib/use-bgg-collection";
import { usePersistedUsername } from "@/lib/use-persisted-username";
import {
  filterGames,
  collectionTimeRange,
  countActiveFilters,
} from "@/lib/filter-games";
import type { FilterState } from "@/lib/types";
import { UsernameForm } from "@/components/username-form";
import { WeightFilter } from "@/components/filters/weight-filter";
import { TimeFilter } from "@/components/filters/time-filter";
import { PlayerCountFilter } from "@/components/filters/player-count-filter";
import { ItemTypeFilter } from "@/components/filters/item-type-filter";
import { GameCard } from "@/components/game-card";
import { BggLogo } from "@/components/bgg-logo";
import { Button } from "@/components/ui/button";

const DEFAULT_FILTER_STATE: FilterState = {
  weightCategories: [],
  timeRange: [0, 0],
  recommendedPlayerCount: "any",
  bestPlayerCount: "any",
  itemTypes: [],
};

export function CollectionBrowser() {
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [filterState, setFilterState] =
    useState<FilterState>(DEFAULT_FILTER_STATE);

  const { savedUsername } = usePersistedUsername();

  // Auto-trigger fetch on mount when a saved username exists
  useEffect(() => {
    if (savedUsername !== null) {
      startTransition(() => {
        setActiveUsername(savedUsername);
      });
    }
  }, [savedUsername]);

  const { data, isFetching } = useBggCollection(activeUsername);

  // Show a toast when the API returns an error or loads successfully
  useEffect(() => {
    if (data?.status === "error") {
      toast.error(data.message);
    } else if (data?.status === "success") {
      toast.success(
        `Loaded ${data.games.length} game${data.games.length !== 1 ? "s" : ""}`,
      );
    }
  }, [data]);

  const games = useMemo(
    () => (data?.status === "success" ? data.games : []),
    [data],
  );

  // Sync timeRange to collection bounds once games first load
  useEffect(() => {
    if (
      games.length > 0 &&
      filterState.timeRange[0] === 0 &&
      filterState.timeRange[1] === 0
    ) {
      startTransition(() => {
        setFilterState((prev) => ({
          ...prev,
          timeRange: collectionTimeRange(games),
        }));
      });
    }
  }, [games, filterState.timeRange]);

  const timeRangeBounds = useMemo(() => collectionTimeRange(games), [games]);

  const filteredGames = useMemo(
    () => filterGames(games, filterState),
    [games, filterState],
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(filterState, games),
    [filterState, games],
  );

  function handleUsernameSubmit(username: string) {
    setActiveUsername(username);
    // Reset filters when loading a new collection
    setFilterState(DEFAULT_FILTER_STATE);
  }

  function handleResetFilters() {
    setFilterState({
      ...DEFAULT_FILTER_STATE,
      timeRange: collectionTimeRange(games),
    });
  }

  const isLoaded = data?.status === "success";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-3 bg-bgg-navy">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <BggLogo />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <main className="bg-white rounded shadow-sm px-6 py-6 flex flex-col gap-6">
          <UsernameForm
            onSubmit={handleUsernameSubmit}
            initialUsername={savedUsername ?? ""}
          />

          {/* Loading skeleton */}
          {isFetching && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              aria-label="Loading collection"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-card h-64 animate-pulse"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Not found */}
          {!isFetching && data?.status === "not-found" && (
            <p role="alert" className="text-center py-12 text-muted-foreground">
              User not found. Please check the username and try again.
            </p>
          )}

          {/* Private collection */}
          {!isFetching && data?.status === "private" && (
            <p role="alert" className="text-center py-12 text-muted-foreground">
              This collection is private.
            </p>
          )}

          {/* Loaded state: filters + game grid */}
          {!isFetching && isLoaded && (
            <>
              {/* Filter panel */}
              <section
                aria-label="Filters"
                className="flex flex-col gap-6 p-4 rounded-lg border bg-card"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div>
                    <h2 className="text-sm font-semibold mb-2">Weight</h2>
                    <WeightFilter
                      selected={filterState.weightCategories}
                      onChange={(categories) =>
                        setFilterState((prev) => ({
                          ...prev,
                          weightCategories: categories,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold mb-2">Playing Time</h2>
                    <TimeFilter
                      min={timeRangeBounds[0]}
                      max={timeRangeBounds[1]}
                      value={filterState.timeRange}
                      onChange={(range) =>
                        setFilterState((prev) => ({
                          ...prev,
                          timeRange: range,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <PlayerCountFilter
                      label="Recommended Players"
                      selected={filterState.recommendedPlayerCount}
                      onChange={(value) =>
                        setFilterState((prev) => ({
                          ...prev,
                          recommendedPlayerCount: value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <PlayerCountFilter
                      label="Best Players"
                      selected={filterState.bestPlayerCount}
                      onChange={(value) =>
                        setFilterState((prev) => ({
                          ...prev,
                          bestPlayerCount: value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold mb-2">Type</h2>
                    <ItemTypeFilter
                      selected={filterState.itemTypes}
                      onChange={(types) =>
                        setFilterState((prev) => ({
                          ...prev,
                          itemTypes: types,
                        }))
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Filter summary bar */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {filteredGames.length === games.length
                    ? `${games.length} game${games.length !== 1 ? "s" : ""}`
                    : `${filteredGames.length} of ${games.length} game${games.length !== 1 ? "s" : ""}`}
                </p>
                {activeFilterCount > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {activeFilterCount} active filter
                      {activeFilterCount !== 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Empty state */}
              {filteredGames.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">
                  No games match the current filters.
                </p>
              ) : (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  aria-label="Game collection"
                >
                  {filteredGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
