# Testing Guidelines

## Strategy: Testing Trophy

We follow the [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) strategy, which prioritizes **integration tests** as the highest-ROI layer, supported by static analysis at the base and targeted unit and end-to-end tests where appropriate.

```
        /\
       /E2E\          ← Few: critical user journeys only
      /------\
     /        \
    /Integration\     ← Most: components + hooks + pages with mocked HTTP
   /------------\
  /     Unit     \    ← Some: pure functions, utilities, parsers
 /----------------\
/      Static      \  ← Always: TypeScript + ESLint
```

### Layer Definitions

| Layer | What we test | Tools |
|---|---|---|
| Static | Types, lint rules | TypeScript, ESLint |
| Unit | Pure functions, utilities, parsers, hooks in isolation | Vitest |
| Integration | React components and pages with mocked HTTP (MSW) | Vitest + React Testing Library + user-event |
| E2E | Critical user journeys in a real browser | (future) |

### Priorities

- **Write mostly integration tests.** Test components the way users interact with them — through the DOM, not implementation details.
- **Unit test pure logic.** Functions like `filterGames`, `parseCollection`, `getWeightCategory`, and `usePersistedUsername` are pure or near-pure and benefit from focused unit tests and property-based tests.
- **Avoid testing implementation details.** Don't assert on internal state, component method calls, or React internals. Assert on what the user sees and can do.
- **Mock at the network boundary.** Use [MSW (Mock Service Worker)](https://mswjs.io/) to intercept HTTP requests rather than mocking `fetch` directly.

---

## Testing Libraries

| Library | Purpose |
|---|---|
| `vitest` | Test runner and assertion library |
| `@testing-library/react` | Render components and query the DOM |
| `@testing-library/user-event` | Simulate realistic user interactions |
| `@testing-library/jest-dom` | Custom DOM matchers (`toBeInTheDocument`, etc.) |
| `fast-check` | Property-based testing for pure functions |
| `msw` | Mock HTTP requests at the network level |

---

## Test Description Format: Gherkin Notation

All test descriptions **must** use Gherkin-style notation. This makes tests readable as specifications and keeps them focused on behavior rather than implementation.

### Format

```
Given <initial context or state>
When <action or event>
Then <expected outcome>
```

Use `And` to chain multiple conditions in any clause.

### Rules

- Write descriptions in plain English from the user's or system's perspective.
- Avoid technical jargon in descriptions (no "renders", "mounts", "dispatches").
- Each test should have exactly one `Then` outcome (one assertion focus).
- Use `And` for setup steps or secondary assertions, not to pack multiple behaviors into one test.

### Examples

```typescript
// ✅ Good — Gherkin, behavior-focused
it("Given a saved username in localStorage, When the page loads, Then the collection is fetched automatically", async () => { ... });

it("Given the weight filter has no categories selected, When the user selects 'Medium', Then only Medium-weight games are shown", async () => { ... });

it("Given a collection is loaded, When the user clicks Reset Filters, Then all games are shown again", async () => { ... });

// ❌ Bad — implementation-focused, no Gherkin
it("renders loading skeleton", () => { ... });
it("calls filterGames with correct args", () => { ... });
it("dispatches SET_FILTER action", () => { ... });
```

### `describe` Blocks

Group tests by component, hook, or module. Use the component/function name as the `describe` label.

```typescript
describe("CollectionBrowser", () => {
  describe("username input", () => {
    it("Given an empty username field, When the user submits the form, Then a validation message is shown", ...);
  });

  describe("filter panel", () => {
    it("Given games are loaded, When the user selects the 'Light' weight category, Then only Light games are visible", ...);
  });
});
```

---

## File Conventions

- Test files live next to the code they test: `foo.ts` → `foo.test.ts`
- Integration tests for pages/components: `components/game-card.test.tsx`
- Unit tests for utilities: `lib/filter-games.test.ts`
- Property-based tests: co-located in the same test file, in a `describe("properties", ...)` block
- MSW handlers: `tests/msw/handlers.ts` (shared across integration tests)

---

## Property-Based Tests

Property-based tests use `fast-check` and live in a `describe("properties", ...)` block within the relevant unit test file.

Each property test must include a comment referencing the design property it validates:

```typescript
// Feature: bgg-collection-browser, Property 3: Weight Filter Correctness
it("Given any selection of weight categories, When filterGames is called, Then every returned game matches one of the selected categories", () => {
  fc.assert(
    fc.property(fc.array(gameArbitrary), weightCategoriesArbitrary, (games, categories) => {
      const result = filterGames(games, { ...defaultFilters, weightCategories: categories });
      return result.every(g => categories.includes(getWeightCategory(g.weight)!));
    })
  );
});
```

---

## What NOT to Test

- Shadcn UI component internals (they are third-party)
- Next.js framework behavior (routing, SSR)
- CSS styles or visual appearance
- Implementation details (internal state shape, private functions)
