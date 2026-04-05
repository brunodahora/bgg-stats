import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { usePersistedUsername, STORAGE_KEY } from "../use-persisted-username";

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe("usePersistedUsername", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("initial state", () => {
    it("Given no saved username in localStorage, When the hook mounts, Then savedUsername is null", () => {
      const { result } = renderHook(() => usePersistedUsername());
      expect(result.current.savedUsername).toBeNull();
    });

    it("Given a saved username in localStorage, When the hook mounts, Then savedUsername reflects the stored value", () => {
      localStorage.setItem(STORAGE_KEY, "boardgamer42");
      const { result } = renderHook(() => usePersistedUsername());
      expect(result.current.savedUsername).toBe("boardgamer42");
    });
  });

  describe("save", () => {
    it("Given a valid username, When save is called, Then it returns true and persists the trimmed value to localStorage", () => {
      const { result } = renderHook(() => usePersistedUsername());
      let returnValue: boolean;
      act(() => {
        returnValue = result.current.save("  testuser  ");
      });
      expect(returnValue!).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBe("testuser");
      expect(result.current.savedUsername).toBe("testuser");
    });

    it("Given a whitespace-only username, When save is called, Then it returns false and does not write to localStorage", () => {
      const { result } = renderHook(() => usePersistedUsername());
      let returnValue: boolean;
      act(() => {
        returnValue = result.current.save("   ");
      });
      expect(returnValue!).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result.current.savedUsername).toBeNull();
    });

    it("Given an empty string, When save is called, Then it returns false and does not write to localStorage", () => {
      const { result } = renderHook(() => usePersistedUsername());
      let returnValue: boolean;
      act(() => {
        returnValue = result.current.save("");
      });
      expect(returnValue!).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("clear", () => {
    it("Given a saved username, When clear is called, Then localStorage is empty and savedUsername is null", () => {
      localStorage.setItem(STORAGE_KEY, "boardgamer42");
      const { result } = renderHook(() => usePersistedUsername());
      act(() => {
        result.current.clear();
      });
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result.current.savedUsername).toBeNull();
    });

    it("Given no saved username, When clear is called, Then savedUsername remains null without error", () => {
      const { result } = renderHook(() => usePersistedUsername());
      act(() => {
        result.current.clear();
      });
      expect(result.current.savedUsername).toBeNull();
    });
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe("properties", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Feature: bgg-collection-browser, Property 16: localStorage Save and Reject
  it("Given any non-empty non-whitespace username, When save is called, Then it is persisted; given any whitespace-only string, When save is called, Then it is rejected and returns false", () => {
    // Validates: Requirements 12.2, 12.3
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (username) => {
          localStorage.clear();
          const { result } = renderHook(() => usePersistedUsername());
          let saved: boolean;
          act(() => {
            saved = result.current.save(username);
          });
          expect(saved!).toBe(true);
          expect(localStorage.getItem(STORAGE_KEY)).toBe(username.trim());
        },
      ),
    );

    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .map((s) => s.replace(/\S/g, " "))
          .filter((s) => s.length > 0),
        (whitespaceOnly) => {
          localStorage.clear();
          const { result } = renderHook(() => usePersistedUsername());
          let saved: boolean;
          act(() => {
            saved = result.current.save(whitespaceOnly);
          });
          expect(saved!).toBe(false);
          expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        },
      ),
    );
  });

  // Feature: bgg-collection-browser, Property 17: localStorage Clear Round-Trip
  it("Given any saved username, When clear is called after save, Then localStorage.getItem returns null", () => {
    // Validates: Requirements 12.6
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (username) => {
          localStorage.clear();
          const { result } = renderHook(() => usePersistedUsername());
          act(() => {
            result.current.save(username);
          });
          act(() => {
            result.current.clear();
          });
          expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
          expect(result.current.savedUsername).toBeNull();
        },
      ),
    );
  });
});
