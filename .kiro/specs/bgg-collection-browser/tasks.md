# Implementation Plan: BGG Collection Browser

## Overview

Incremental implementation of a Next.js App Router application that fetches, parses, and filters a BoardGameGeek user's board game collection. Each task builds on the previous, with integration wired at the end.

## Tasks

- [x] 1. Project setup — dependencies, Shadcn, Tailwind theme, test infrastructure
  - Install runtime dependencies: `@tanstack/react-query`, `msw`, `fast-check`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest`, `@vitejs/plugin-react`, `jsdom`
  - Initialise Shadcn UI (`npx shadcn@latest init`) and add required components: `button`, `input`, `checkbox`, `slider`
  - Apply BGG color theme in `app/globals.css` using Tailwind v4 `@theme inline` block with `--color-bgg-orange: #FF5100` and `--color-bgg-navy: #1a1a2e`; define `:root` and `.dark` CSS custom property overrides for `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring`
  - Create `vitest.config.ts` with `jsdom` environment, `@testing-library/jest-dom` setup file, and path aliases matching `tsconfig.json`
  - Create `tests/msw/handlers.ts` with a placeholder MSW handler for `GET /api/bgg/collection`
  - Create `tests/msw/server.ts` that sets up the MSW Node server for Vitest
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 2. Core types and data models
  - [x] 2.1 Create `lib/types.ts` with `WeightCategory` union type, `Game` interface, `FilterState` interface, and `CollectionResult` discriminated union exactly as specified in the design
  - Implement and export `getWeightCategory(weight: number): WeightCategory | null` in `lib/types.ts`
  - _Requirements: 3.1, 5.1, 6.1, 7.1, 8.1_

  - [x] 2.2 Write unit tests for `getWeightCategory` in `lib/types.test.ts`
    - Test boundary values: 0, 1.0, 2.0, 3.0, 4.0, 5.0 and values just above/below each boundary
    - Use Gherkin notation for all test descriptions
    - _Requirements: 5.2, 5.3_

- [x] 3. BGG API proxy route handler
  - [x] 3.1 Create `app/api/bgg/collection/route.ts` implementing the `GET` handler
    - Forward requests to `https://boardgamegeek.com/xmlapi2/collection?username={username}&stats=1&own=1` with `cache: "no-store"`
    - Retry up to 3 times with 2-second delay on HTTP 202
    - Return raw XML with `Content-Type: application/xml` on success
    - Return HTTP 400 JSON error when `username` param is absent or empty
    - Return HTTP 503 JSON error when retries are exhausted on 202
    - Pass through non-200/non-202 status codes as JSON errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Write property tests for the route handler in `app/api/bgg/collection/route.test.ts`
    - **Property 14: API Proxy XML Passthrough** — for any valid XML string returned by BGG with status 200, the handler returns that exact XML with `Content-Type: application/xml`
    - **Property 15: API Proxy Error Status Passthrough** — for any non-200, non-202 status from BGG, the handler returns a response with that same status code
    - Use MSW to mock the upstream BGG fetch; use Gherkin notation
    - **Validates: Requirements 2.2, 2.4, 2.6**

- [x] 4. XML parser
  - [x] 4.1 Create `lib/parse-collection.ts` implementing `parseCollection(xml: string): CollectionResult`
    - Use browser `DOMParser` to parse XML
    - Detect `<message>` root element and return `{ status: "not-found" }` or `{ status: "private" }` based on message content
    - Query `item[subtype='boardgame']` elements and map each to a `Game` object
    - Parse all fields per the design's parsing strategy: `id`, `name`, `thumbnail`, `yearPublished`, `minPlayers`, `maxPlayers`, `minPlayingTime`, `maxPlayingTime`, `weight`, `bggRank`, `userRating`
    - Implement `parsePlayerCountPoll(item, voteValue)` helper for `recommendedPlayerCounts` and `bestPlayerCounts`
    - Set optional fields (`thumbnail`, `yearPublished`, `bggRank`, `userRating`) to `null` when absent or "N/A"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 4.2 Write unit tests for `parseCollection` in `lib/parse-collection.test.ts`
    - Test with a full XML fixture containing all fields
    - Test with a `<message>` root element (not-found and private cases)
    - Test with missing optional fields (`thumbnail`, `yearPublished`, `bggRank`, `userRating`)
    - Test `userRating` "N/A" → `null` mapping
    - Use Gherkin notation for all test descriptions
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 4.3 Write property tests for `parseCollection` in the same file under `describe("properties", ...)`
    - **Property 1: XML Parsing Round-Trip** — for any `Game[]`, `JSON.parse(JSON.stringify(games))` produces a deeply equal array
    - **Property 2: Missing Optional Fields Produce Null, Not Errors** — for any XML with absent optional fields, parsing succeeds and those fields are `null`
    - Use `fc.assert` with `fast-check` arbitraries; include property number comments
    - **Validates: Requirements 3.9, 3.4, 3.2, 3.7**

- [x] 5. Filter logic
  - [x] 5.1 Create `lib/filter-games.ts` implementing `filterGames(games: Game[], filters: FilterState): Game[]`
    - Weight filter: exclude games with `weight <= 0` when any category is selected; include only games whose `getWeightCategory(weight)` is in `filters.weightCategories`
    - Time filter: skip when at default full range; otherwise include games where `maxPlayingTime >= min AND minPlayingTime <= max`; exclude games where both times are 0 when filter is active
    - Recommended player count filter: include only games where `recommendedPlayerCounts.includes(N)` when not "any"
    - Best player count filter: include only games where `bestPlayerCounts.includes(N)` when not "any"
    - Export helper `collectionTimeRange(games: Game[]): [number, number]` returning `[min minPlayingTime, max maxPlayingTime]`
    - _Requirements: 5.2, 5.3, 5.4, 6.5, 6.6, 6.7, 7.2, 7.3, 8.2, 8.3, 9.1_

  - [x] 5.2 Write unit tests for `filterGames` in `lib/filter-games.test.ts`
    - Test each filter dimension in isolation with concrete game fixtures
    - Test combined filters (AND composition)
    - Test default `FilterState` returns all games unchanged
    - Use Gherkin notation
    - _Requirements: 5.2, 6.5, 7.2, 8.2, 9.1_

  - [x] 5.3 Write property tests for `filterGames` under `describe("properties", ...)` in the same file
    - **Property 3: Weight Filter Correctness** — every returned game's weight maps to one of the selected categories; games with `weight <= 0` excluded
    - **Property 4: Playing Time Filter Overlap Correctness** — every returned game satisfies `maxPlayingTime >= sliderMin AND minPlayingTime <= sliderMax`; games with both times 0 excluded
    - **Property 5: Recommended Player Count Filter Correctness** — every returned game has `N` in `recommendedPlayerCounts`
    - **Property 6: Best Player Count Filter Correctness** — every returned game has `N` in `bestPlayerCounts`
    - **Property 7: AND Filter Composition** — result is subset of each individual filter's result
    - **Property 8: Reset Filters Round-Trip** — default `FilterState` returns all games unchanged
    - **Property 9: Active Filter Count Accuracy** — active filter count equals number of non-default filter dimensions
    - **Property 12: Time Range Bounds Derived from Collection** — `collectionTimeRange` returns `[min minPlayingTime, max maxPlayingTime]`
    - **Property 13: Time Range Label Format** — label string matches `"{min}–{max} min"` format
    - Include property number comments; use `fc.assert` with `fast-check` arbitraries
    - **Validates: Requirements 5.2, 5.3, 6.5, 6.7, 7.2, 8.2, 9.1, 9.2, 9.4, 6.2, 6.4**

- [x] 6. Custom SVG logo asset
  - [x] 6.1 Create `public/bgg-stats-logo.svg` as a self-contained SVG (`width="140" height="38"`) combining the BGG orange polygon mark, the white "BGG" text paths, and new white "Stats" text paths at the same baseline and visual weight
    - _Requirements: 11.4, 11.5_

  - [x] 6.2 Create `components/bgg-logo.tsx` as a Client Component that renders the SVG inline (not as `<img>`) so fill colors can respond to CSS variables
    - _Requirements: 11.4_

- [x] 7. TanStack Query setup and collection hook
  - [x] 7.1 Create `app/providers.tsx` as a `'use client'` component wrapping children in `QueryClientProvider` with a stable `QueryClient` instance via `useState`
  - Update `app/layout.tsx` to wrap the app in `<Providers>`
  - _Requirements: 1.2, 1.4, 1.5_

  - [x] 7.2 Create `lib/use-bgg-collection.ts` implementing `useBggCollection(username: string | null)`
    - Query key: `["bgg-collection", username]`
    - `queryFn`: fetch `/api/bgg/collection?username=...`, parse XML via `parseCollection`, return `CollectionResult`
    - `enabled: !!username`, `staleTime: 5 * 60 * 1000`, `retry: 2`, `retryDelay: (attempt) => attempt * 1000`
    - _Requirements: 1.2, 1.4, 1.5, 1.6_

- [x] 8. localStorage persistence hook
  - [x] 8.1 Create `lib/use-persisted-username.ts` implementing `usePersistedUsername()`
    - Read from `localStorage` in `useEffect` (post-hydration) and set `savedUsername` state
    - `save(username)`: trim, reject empty/whitespace (return `false`), write to `localStorage` key `"bgg-stats:username"`, update state, return `true`
    - `clear()`: remove from `localStorage`, set state to `null`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 8.2 Write unit tests for `usePersistedUsername` in `lib/use-persisted-username.test.ts`
    - Mock `localStorage` via `vi.stubGlobal` or jsdom's built-in implementation
    - Test save with valid username, save with whitespace-only input, clear after save
    - Use Gherkin notation
    - _Requirements: 12.2, 12.3, 12.6_

  - [x] 8.3 Write property tests under `describe("properties", ...)` in the same file
    - **Property 16: localStorage Save and Reject** — any non-empty non-whitespace string is persisted; any whitespace-only string is rejected and returns `false`
    - **Property 17: localStorage Clear Round-Trip** — after `save` then `clear`, `localStorage.getItem(STORAGE_KEY)` returns `null`
    - **Validates: Requirements 12.2, 12.3, 12.6**

- [x] 9. Username form component
  - [x] 9.1 Create `components/username-form.tsx` as a Client Component
    - Render a text `Input`, a "Load" `Button`, a "Save" `Button`, and a "Clear" `Button` (Shadcn components)
    - On "Load" submit: validate non-empty/non-whitespace; show inline validation message if invalid; call `onSubmit(username)` if valid
    - On "Save": call `usePersistedUsername().save`; show inline validation message on rejection
    - On "Clear": call `usePersistedUsername().clear`; clear the input field
    - Accept props: `onSubmit: (username: string) => void`, `initialUsername?: string`
    - _Requirements: 1.1, 1.3, 12.1, 12.2, 12.3, 12.6_

  - [x] 9.2 Write integration tests for `UsernameForm` in `components/username-form.test.tsx`
    - Given an empty input, When the user clicks Load, Then a validation message is shown and `onSubmit` is not called
    - Given a whitespace-only input, When the user clicks Save, Then a validation message is shown and localStorage is not written
    - Given a valid username, When the user clicks Load, Then `onSubmit` is called with the trimmed username
    - Given a saved username, When the user clicks Clear, Then the input is cleared and localStorage is empty
    - **Property 18: Whitespace Username Rejected at Submission** — use `fc.assert` to verify no fetch is triggered for any whitespace-only string
    - Use `userEvent`, Gherkin notation, MSW for any network assertions
    - **Validates: Requirements 1.1, 1.3, 12.1, 12.2, 12.3, 12.6; Property 18**

- [x] 10. Filter components
  - [x] 10.1 Create `components/filters/weight-filter.tsx` implementing `WeightFilterProps`
    - Render five Shadcn `Checkbox` controls labelled Light, Medium Light, Medium, Medium Heavy, Heavy
    - Call `onChange` with the updated `WeightCategory[]` on each toggle
    - _Requirements: 5.1_

  - [x] 10.2 Create `components/filters/time-filter.tsx` implementing `TimeFilterProps`
    - Render a Shadcn dual-handle `Slider` with `min`, `max`, and `value` props
    - Display the current range label as `"{value[0]}–{value[1]} min"`
    - Call `onChange` with the new `[number, number]` tuple on slider change
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 10.3 Create `components/filters/player-count-filter.tsx` implementing `PlayerCountFilterProps`
    - Render selectable values 1–10 and "Any" (e.g. as toggle buttons or a select)
    - Call `onChange` with the selected value or `"any"`
    - _Requirements: 7.1, 8.1_

  - [x] 10.4 Write integration tests for filter components in `components/filters/weight-filter.test.tsx`, `time-filter.test.tsx`, `player-count-filter.test.tsx`
    - WeightFilter: Given no categories selected, When user selects "Medium", Then `onChange` is called with `["Medium"]`
    - TimeFilter: Given a range slider, When user moves the max handle, Then `onChange` is called with the updated range
    - PlayerCountFilter: Given "Any" selected, When user selects 4, Then `onChange` is called with `4`
    - Use `userEvent` and Gherkin notation
    - _Requirements: 5.1, 6.1, 7.1, 8.1_

- [x] 11. GameCard component
  - [x] 11.1 Create `components/game-card.tsx` implementing `GameCardProps`
    - Render thumbnail (or placeholder when `null`) using Next.js `<Image>`
    - Render game name as a link to `https://boardgamegeek.com/boardgame/{id}`
    - Render year published, BGG rank ("N/A" when `null`), weight as `"{value.toFixed(1)} – {category}"`, playing time as `"{min}–{max} min"` or `"{N} min"` when equal, player count range as `"{minPlayers}–{maxPlayers}"`, user rating as `"{value.toFixed(1)}/10"` or "Not rated" when `null`
    - _Requirements: 4.1, 4.2, 4.6_

  - [x] 11.2 Write integration tests for `GameCard` in `components/game-card.test.tsx`
    - Given a game with all fields populated, When the card is rendered, Then all fields are visible with correct formatting
    - Given a game with `thumbnail: null`, When the card is rendered, Then a placeholder image is shown
    - Given a game with `bggRank: null`, When the card is rendered, Then "N/A" is displayed
    - Given a game with `userRating: null`, When the card is rendered, Then "Not rated" is displayed
    - Given a game with equal min/max playing time, When the card is rendered, Then time is shown as `"{N} min"`
    - **Property 11: GameCard Renders All Required Display Fields** — use `fc.assert` with a `Game` arbitrary to verify all required fields are present in the rendered output
    - Use Gherkin notation
    - **Validates: Requirements 4.1, 4.2, 4.6; Property 11**

- [x] 12. CollectionBrowser orchestrator
  - [x] 12.1 Create `components/collection-browser.tsx` as the main Client Component orchestrating all state
    - Initialise `filterState` with `useState<FilterState>` (default: empty weight categories, full time range, "any" player counts)
    - Use `usePersistedUsername()` to pre-fill username input and auto-trigger fetch on mount when `savedUsername` is non-null
    - Use `useBggCollection(activeUsername)` for fetch state
    - Derive `filteredGames` via `useMemo(() => filterGames(games, filterState), [games, filterState])`
    - Derive time range bounds from collection via `collectionTimeRange(games)`
    - Render `UsernameForm`, `FilterPanel` (containing all four filter components), `FilterSummaryBar` (active filter count + Reset button), and `GameGrid`
    - Map `CollectionResult` status to: loading skeleton, error state with retry button, not-found message, private message, game grid
    - Display total visible game count
    - Show empty-state message when `filteredGames.length === 0` and collection is loaded
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.3, 4.4, 4.5, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 12.4, 12.7_

  - [x] 12.2 Write integration tests for `CollectionBrowser` in `components/collection-browser.test.tsx`
    - Given a saved username in localStorage, When the page loads, Then the collection is fetched automatically
    - Given a username is submitted, When the fetch is in progress, Then a loading skeleton is shown
    - Given a fetch completes successfully, When games are returned, Then the game grid is visible with the correct count
    - Given the API returns an error, When the error state is shown, Then a retry button is visible
    - Given the username does not exist, When the response indicates not-found, Then a "user not found" message is shown
    - Given the collection is private, When the response indicates private, Then a "collection is private" message is shown
    - Given games are loaded, When the user selects the "Light" weight category, Then only Light games are visible
    - Given games are loaded, When the user clicks Reset Filters, Then all games are shown again
    - Given an empty username field, When the user submits the form, Then a validation message is shown and no fetch is triggered
    - **Property 10: Displayed Game Count Equals Filtered Length** — use `fc.assert` to verify the displayed count always equals `filterGames(games, filterState).length`
    - Use MSW handlers from `tests/msw/handlers.ts`, `userEvent`, and Gherkin notation
    - **Validates: Requirements 1.1–1.6, 4.3, 4.4, 9.2, 9.3, 9.4, 10.1–10.4, 12.4, 12.7; Property 10**

- [x] 13. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Page layout and header assembly
  - [x] 14.1 Update `app/page.tsx` to render `<CollectionBrowser />` as the sole page content
  - [x] 14.2 Create a `Header` section inside `CollectionBrowser` (or as a separate `components/header.tsx`) that renders `<BggLogo />` and a page title
  - Ensure the responsive grid in `GameGrid` uses Tailwind classes for 1 → 2 → 3 → 4 column breakpoints
  - _Requirements: 4.5, 11.1, 11.2, 11.3, 11.4_

- [x] 15. End-to-end wiring and final polish
  - [x] 15.1 Wire `app/globals.css` with the complete BGG Tailwind v4 theme (light and dark mode CSS custom properties) as specified in the design
  - [x] 15.2 Verify `app/layout.tsx` wraps the tree in `<Providers>` and applies the correct font variables
  - [x] 15.3 Update MSW handlers in `tests/msw/handlers.ts` with realistic BGG XML fixture responses for use across all integration tests
  - [x] 15.4 Run the full test suite (`vitest --run`) and fix any remaining failures
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 16. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Item type filter (standalone vs expansion)
  - [x] 17.1 Add `ItemType = "standalone" | "expansion"` to `lib/types.ts`; add `itemType: ItemType` field to `Game`; add `itemTypes: ItemType[]` to `FilterState` (empty = all)
  - [x] 17.2 Update `lib/parse-collection.ts` to query both `item[subtype='boardgame']` and `item[subtype='boardgameexpansion']`; derive `itemType` from the `subtype` attribute
  - [x] 17.3 Update `lib/filter-games.ts` to filter by `itemTypes` when non-empty; update `countActiveFilters` to count `itemTypes` as an active filter when non-empty
  - [x] 17.4 Create `components/filters/item-type-filter.tsx` with two checkboxes: "Standalone" and "Expansion"; call `onChange` with updated `ItemType[]` on toggle
  - [x] 17.5 Wire `ItemTypeFilter` into `CollectionBrowser`: add `itemTypes: []` to `DEFAULT_FILTER_STATE`; render the filter in the filter panel
  - [x] 17.6 Update `tests/msw/handlers.ts` fixture to include one `boardgameexpansion` item alongside the existing `boardgame` item
  - [x] 17.7 Write integration tests for `ItemTypeFilter` in `components/filters/__tests__/item-type-filter.test.tsx`
    - Given both types unchecked (default), When rendered, Then both checkboxes are unchecked
    - Given both types unchecked, When user checks "Expansion", Then `onChange` is called with `["expansion"]`
    - Given "Expansion" checked, When user unchecks it, Then `onChange` is called with `[]`
  - [x] 17.8 Write unit/property tests for the item type filter in `lib/__tests__/filter-games.test.ts`
    - Given only "standalone" selected, When `filterGames` is called, Then only standalone games are returned
    - Given only "expansion" selected, When `filterGames` is called, Then only expansion games are returned
    - Given empty `itemTypes`, When `filterGames` is called, Then all games are returned regardless of type
    - **Property: Item Type Filter Correctness** — every returned game's `itemType` is in `filters.itemTypes` when non-empty

## Notes

- Each task references specific requirements for traceability
- Property tests use `fast-check` and live in `describe("properties", ...)` blocks co-located with unit tests
- All test descriptions use Gherkin notation: `Given ... When ... Then ...`
- MSW mocks HTTP at the network boundary — never mock `fetch` directly
- The design document contains the full pseudocode for all implementations; refer to it during each task
