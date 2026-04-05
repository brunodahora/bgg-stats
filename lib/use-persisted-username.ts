"use client";

import { useState, useEffect, startTransition } from "react";

export const STORAGE_KEY = "bgg-stats:username";

export function usePersistedUsername() {
  const [savedUsername, setSavedUsername] = useState<string | null>(null);

  // Read from localStorage post-hydration to avoid SSR/client mismatch.
  // startTransition defers the state update so it doesn't cause a cascading
  // synchronous render inside the effect body.
  useEffect(() => {
    startTransition(() => {
      setSavedUsername(localStorage.getItem(STORAGE_KEY));
    });
  }, []);

  /**
   * Persist a username to localStorage.
   * Returns false (and does not write) if the input is empty or whitespace-only.
   */
  const save = (username: string): boolean => {
    const trimmed = username.trim();
    if (!trimmed) return false;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSavedUsername(trimmed);
    return true;
  };

  /** Remove the saved username from localStorage and clear state. */
  const clear = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedUsername(null);
  };

  return { savedUsername, save, clear };
}
