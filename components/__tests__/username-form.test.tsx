import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UsernameForm } from "../username-form";
import { STORAGE_KEY } from "@/lib/use-persisted-username";

// MSW server is set up globally via tests/setup.ts + tests/msw/server.ts
// For this component we only need to verify fetch is NOT triggered for invalid input.

describe("UsernameForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Load button", () => {
    it("Given an empty input, When the user clicks Load, Then a validation message is shown and onSubmit is not called", async () => {
      const onSubmit = vi.fn();
      render(<UsernameForm onSubmit={onSubmit} />);

      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("Given a whitespace-only input, When the user clicks Load, Then a validation message is shown and onSubmit is not called", async () => {
      const onSubmit = vi.fn();
      render(<UsernameForm onSubmit={onSubmit} />);

      await userEvent.type(screen.getByRole("textbox"), "   ");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("Given a valid username, When the user clicks Load, Then onSubmit is called with the trimmed username", async () => {
      const onSubmit = vi.fn();
      render(<UsernameForm onSubmit={onSubmit} />);

      await userEvent.type(screen.getByRole("textbox"), "  boardgamer42  ");
      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      expect(onSubmit).toHaveBeenCalledWith("boardgamer42");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("Given an initialUsername prop, When the user clicks Load, Then onSubmit is called with that username", async () => {
      const onSubmit = vi.fn();
      render(
        <UsernameForm onSubmit={onSubmit} initialUsername="existinguser" />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Load" }));

      expect(onSubmit).toHaveBeenCalledWith("existinguser");
    });
  });

  describe("Save button", () => {
    it("Given a whitespace-only input, When the user clicks Save, Then a validation message is shown and localStorage is not written", async () => {
      const onSubmit = vi.fn();
      render(<UsernameForm onSubmit={onSubmit} />);

      await userEvent.type(screen.getByRole("textbox"), "   ");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("Given an empty input, When the user clicks Save, Then a validation message is shown and localStorage is not written", async () => {
      const onSubmit = vi.fn();
      render(<UsernameForm onSubmit={onSubmit} />);

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("Given a valid username, When the user clicks Save, Then the username is persisted to localStorage", async () => {
      const onSubmit = vi.fn();
      render(<UsernameForm onSubmit={onSubmit} />);

      await userEvent.type(screen.getByRole("textbox"), "boardgamer42");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(localStorage.getItem(STORAGE_KEY)).toBe("boardgamer42");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Clear button", () => {
    it("Given a saved username, When the user clicks Clear, Then the input is cleared and localStorage is empty", async () => {
      localStorage.setItem(STORAGE_KEY, "boardgamer42");
      const onSubmit = vi.fn();
      render(
        <UsernameForm onSubmit={onSubmit} initialUsername="boardgamer42" />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Clear" }));

      expect(screen.getByRole("textbox")).toHaveValue("");
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("Given a validation message is shown, When the user clicks Clear, Then the validation message is dismissed", async () => {
      const onSubmit = vi.fn();
      render(<UsernameForm onSubmit={onSubmit} />);

      // Trigger a validation message first
      await userEvent.click(screen.getByRole("button", { name: "Load" }));
      expect(screen.getByRole("alert")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Clear" }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe("properties", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Feature: bgg-collection-browser, Property 18: Whitespace Username Rejected at Submission
  it("Given any whitespace-only username, When the user clicks Load, Then onSubmit is not called and a validation message is shown", async () => {
    // Validates: Requirements 1.3, 12.3
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1 })
          .map((s) => s.replace(/\S/g, " "))
          .filter((s) => s.length > 0),
        async (whitespaceUsername) => {
          const onSubmit = vi.fn();
          const { unmount } = render(<UsernameForm onSubmit={onSubmit} />);

          const input = screen.getByRole("textbox");
          await userEvent.clear(input);
          if (whitespaceUsername.length > 0) {
            await userEvent.type(input, whitespaceUsername);
          }
          await userEvent.click(screen.getByRole("button", { name: "Load" }));

          expect(onSubmit).not.toHaveBeenCalled();
          expect(screen.getByRole("alert")).toBeInTheDocument();

          unmount();
        },
      ),
    );
  });
});
