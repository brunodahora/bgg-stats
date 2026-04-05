import { useQuery } from "@tanstack/react-query";
import { parseCollection } from "./parse-collection";
import type { CollectionResult } from "./types";

async function fetchCollection(username: string): Promise<CollectionResult> {
  const res = await fetch(
    `/api/bgg/collection?username=${encodeURIComponent(username)}`,
  );
  if (!res.ok) {
    const { error } = await res.json();
    return { status: "error", message: error };
  }
  const xml = await res.text();
  return parseCollection(xml);
}

export function useBggCollection(username: string | null) {
  return useQuery({
    queryKey: ["bgg-collection", username],
    queryFn: () => fetchCollection(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => attempt * 1000,
  });
}
