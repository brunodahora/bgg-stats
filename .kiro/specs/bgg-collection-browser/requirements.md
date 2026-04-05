# Requirements Document

## Introduction

A BGG (BoardGameGeek) collection browser that allows users to look up any BGG user's board game collection by username, then explore and filter it interactively. The application fetches data from the BGG XML API v2 (no authentication required), parses the XML response into structured game objects, and presents the collection with composable filters for weight, playing time, and player count recommendations. The UI is themed after BGG's visual identity using Shadcn components.

## Glossary

- **BGG**: BoardGameGeek — the world's largest board game database and community at boardgamegeek.com
- **BGG_API**: The BGG XML API v2 at `https://boardgamegeek.com/xmlapi2`, used to fetch collection and game data
- **Collection**: The set of board games a BGG user has marked as owned in their BGG account
- **Game**: A single board game entry in a user's collection, including metadata such as name, weight, playing time, and player count recommendations
- **Weight**: BGG's "average weight" metric representing game complexity, on a scale from 1.0 (lightest) to 5.0 (heaviest)
- **Weight_Category**: A human-readable label derived from a game's numeric Weight value, using the following ranges: Light (weight ≤ 1.0), Medium Light (1.0 < weight ≤ 2.0), Medium (2.0 < weight ≤ 3.0), Medium Heavy (3.0 < weight ≤ 4.0), Heavy (weight > 4.0)
- **Playing_Time**: The estimated duration of a game session in minutes, as reported by BGG; a game may have both a minimum and maximum playing time
- **Min_Playing_Time**: The minimum estimated duration of a game session in minutes, as reported by BGG
- **Max_Playing_Time**: The maximum estimated duration of a game session in minutes, as reported by BGG
- **BGG_Rank**: The overall ranking of a game on BGG based on community ratings
- **Player_Count**: The number of players a game supports, with two sub-classifications: Recommended (the community considers this count playable) and Best (the community considers this count optimal)
- **Filter**: A composable UI control that narrows the displayed collection based on a game attribute
- **Filter_State**: The combined set of currently active filter values applied to the collection
- **XML_Parser**: The component responsible for parsing BGG XML API v2 responses into typed Game objects
- **Collection_Browser**: The main page component that orchestrates username input, data fetching, and filtered display
- **API_Proxy**: A Next.js Route Handler that proxies requests to the BGG_API to avoid CORS issues
- **TanStack_Query**: The client-side data fetching and caching library (React Query v5) used to manage BGG API request state
- **User_Rating**: The numeric score (1–10) the collection owner has given to a game on BGG; may be `null` if the owner has not rated the game

---

## Requirements

### Requirement 1: Username Input and Collection Fetching

**User Story:** As a board game enthusiast, I want to enter a BGG username and load their collection, so that I can browse what games they own.

#### Acceptance Criteria

1. THE Collection_Browser SHALL render a text input field and a submit button for entering a BGG username.
2. WHEN the user submits a non-empty username, THE Collection_Browser SHALL initiate a fetch of that user's BGG collection via the API_Proxy.
3. IF the submitted username is empty or contains only whitespace, THEN THE Collection_Browser SHALL display an inline validation message and SHALL NOT initiate a fetch.
4. WHILE a collection fetch is in progress, THE Collection_Browser SHALL display a loading skeleton in place of the game grid.
5. WHEN a collection fetch completes successfully, THE Collection_Browser SHALL display the fetched games in a grid layout.
6. THE Collection_Browser SHALL preserve the last successfully loaded username and collection in memory for the duration of the current session, with persistent storage across sessions handled per Requirement 12.

---

### Requirement 2: BGG API Proxy

**User Story:** As a developer, I want a server-side proxy for BGG API calls, so that browser CORS restrictions do not block collection fetches.

#### Acceptance Criteria

1. THE API_Proxy SHALL expose a GET endpoint at `/api/bgg/collection` that accepts a `username` query parameter.
2. WHEN a request is received with a valid `username`, THE API_Proxy SHALL forward the request to `https://boardgamegeek.com/xmlapi2/collection?username={username}&stats=1&own=1`.
3. IF the BGG_API returns HTTP status 202 (queued), THEN THE API_Proxy SHALL retry the request up to 3 times with a 2-second delay between retries before returning an error response.
4. IF the BGG_API returns a non-200, non-202 HTTP status, THEN THE API_Proxy SHALL return an error response with the original status code and a descriptive message.
5. IF the `username` query parameter is absent or empty, THEN THE API_Proxy SHALL return HTTP 400 with a descriptive error message.
6. WHEN the BGG_API returns a successful XML response, THE API_Proxy SHALL return the raw XML body to the caller with `Content-Type: application/xml`.

---

### Requirement 3: XML Parsing

**User Story:** As a developer, I want the BGG XML response parsed into typed objects, so that the UI can work with structured game data.

#### Acceptance Criteria

1. WHEN a valid BGG collection XML response is provided, THE XML_Parser SHALL parse it into an array of Game objects containing: `id`, `name`, `thumbnail`, `yearPublished`, `minPlayers`, `maxPlayers`, `minPlayingTime`, `maxPlayingTime`, `weight`, `bggRank`, `userRating`, `recommendedPlayerCounts`, and `bestPlayerCounts`.
2. THE XML_Parser SHALL parse `userRating` from the `value` attribute of the `<rating>` element within `<stats>` for each game entry, setting `userRating` to `null` when the value is "N/A" or the attribute is absent.
3. WHEN an XML response contains a `<message>` element at the root level, THE XML_Parser SHALL return a typed error result indicating the collection is unavailable or the username does not exist.
4. IF a Game entry is missing optional fields such as `thumbnail` or `yearPublished`, THEN THE XML_Parser SHALL populate those fields with `null` rather than throwing an error.
5. THE XML_Parser SHALL parse `recommendedPlayerCounts` and `bestPlayerCounts` from the `<poll name="suggested_numplayers">` element, extracting player counts where the community vote result is "Recommended" or "Best" respectively.
6. THE XML_Parser SHALL parse `weight` from the `<averageweight>` element within `<statistics>`.
7. THE XML_Parser SHALL parse `bggRank` from the `<rank type="subtype" name="boardgame">` element within `<statistics>`, using `null` if the rank is not available.
8. THE XML_Parser SHALL parse `minPlayingTime` and `maxPlayingTime` from the `<minplaytime>` and `<maxplaytime>` elements respectively.
9. FOR ALL valid BGG collection XML strings, parsing then serializing then parsing SHALL produce an equivalent array of Game objects (round-trip property).

---

### Requirement 4: Collection Display

**User Story:** As a user, I want to see the games in a collection displayed as cards, so that I can visually browse the library.

#### Acceptance Criteria

1. THE Collection_Browser SHALL display each Game as a card showing: thumbnail image, name (as a clickable link to the game's BGG page at `https://boardgamegeek.com/boardgame/{id}`), year published, BGG rank, weight displayed as the numeric value to one decimal place followed by its Weight_Category label (e.g. "3.2 – Medium Heavy"), playing time range (formatted as "{min}–{max} min", or "{N} min" when min and max are equal), supported player counts (min–max), and the User_Rating formatted as a score out of 10 to one decimal place (e.g. "8.0"), displaying "Not rated" when `userRating` is null.
2. WHEN a Game has no thumbnail, THE Collection_Browser SHALL display a placeholder image in place of the thumbnail.
3. THE Collection_Browser SHALL display the total count of games currently visible after filtering.
4. WHEN the Filter_State results in zero matching games, THE Collection_Browser SHALL display an empty-state message indicating no games match the current filters.
5. THE Collection_Browser SHALL display game cards in a responsive grid that adapts from 1 column on mobile to a maximum of 4 columns on large screens.
6. WHEN a Game has a null `bggRank`, THE Collection_Browser SHALL display "N/A" in place of the rank value.

---

### Requirement 5: Weight Filter

**User Story:** As a user, I want to filter games by complexity weight, so that I can find games appropriate for my group's experience level.

#### Acceptance Criteria

1. THE Collection_Browser SHALL render a weight filter control with Weight_Category checkboxes for: Light, Medium Light, Medium, Medium Heavy, and Heavy.
2. WHEN the user selects one or more Weight_Category values, THE Collection_Browser SHALL display only games whose Weight_Category matches one of the selected categories.
3. IF a Game has a `weight` of 0 or null (unrated), THEN THE Collection_Browser SHALL exclude that game when any Weight_Category is selected.
4. WHEN no Weight_Category checkboxes are selected (default state), THE Collection_Browser SHALL include all games regardless of weight.

---

### Requirement 6: Playing Time Filter

**User Story:** As a user, I want to filter games by playing time, so that I can find games that fit the time I have available.

#### Acceptance Criteria

1. THE Collection_Browser SHALL render a playing time filter control as a dual-handle range slider with a minimum handle and a maximum handle, both expressed in minutes.
2. WHEN a collection is loaded, THE Collection_Browser SHALL derive the slider's lower bound from the smallest `Min_Playing_Time` across all games in the collection and the slider's upper bound from the largest `Max_Playing_Time` across all games in the collection.
3. WHEN a collection is loaded, THE Collection_Browser SHALL initialise the slider with the minimum handle at the lower bound and the maximum handle at the upper bound, representing the default full-range (unfiltered) state.
4. THE Collection_Browser SHALL display a label showing the currently selected range in the format "{min}–{max} min" (e.g. "30–120 min").
5. WHEN the slider is not at its default full range, THE Collection_Browser SHALL display only games whose playing time range overlaps with the selected slider range (i.e. `Max_Playing_Time` >= slider minimum AND `Min_Playing_Time` <= slider maximum).
6. WHEN the slider is at its default full range, THE Collection_Browser SHALL include all games regardless of playing time.
7. WHEN the slider is not at its default full range and a Game has both `Min_Playing_Time` and `Max_Playing_Time` equal to 0 or null, THEN THE Collection_Browser SHALL exclude that game.

---

### Requirement 7: Recommended Player Count Filter

**User Story:** As a user, I want to filter games by recommended player count, so that I can find games suited for the number of people in my group.

#### Acceptance Criteria

1. THE Collection_Browser SHALL render a recommended player count filter control with selectable values from 1 to 10 and "Any".
2. WHEN the user selects a player count N, THE Collection_Browser SHALL display only games whose `recommendedPlayerCounts` array includes N.
3. WHEN "Any" is selected, THE Collection_Browser SHALL include all games regardless of recommended player counts.

---

### Requirement 8: Best Player Count Filter

**User Story:** As a user, I want to filter games by their best player count, so that I can find games that are optimal for my exact group size.

#### Acceptance Criteria

1. THE Collection_Browser SHALL render a best player count filter control with selectable values from 1 to 10 and "Any".
2. WHEN the user selects a player count N, THE Collection_Browser SHALL display only games whose `bestPlayerCounts` array includes N.
3. WHEN "Any" is selected, THE Collection_Browser SHALL include all games regardless of best player counts.

---

### Requirement 9: Composable Filter Behavior

**User Story:** As a user, I want all active filters to apply simultaneously, so that I can narrow down the collection using multiple criteria at once.

#### Acceptance Criteria

1. THE Collection_Browser SHALL apply all active filters as a logical AND, displaying only games that satisfy every active filter simultaneously.
2. THE Collection_Browser SHALL render a "Reset Filters" control that, when activated, returns all filters to their default (unfiltered) state.
3. WHEN the Filter_State changes, THE Collection_Browser SHALL update the displayed game list without triggering a new network request to the BGG_API.
4. THE Collection_Browser SHALL display the count of active (non-default) filters so the user can see how many filters are applied.

---

### Requirement 10: Error Handling

**User Story:** As a user, I want clear feedback when something goes wrong, so that I understand what happened and what I can do next.

#### Acceptance Criteria

1. WHEN the API_Proxy returns an error response, THE Collection_Browser SHALL display a human-readable error message and a retry button.
2. WHEN the BGG username does not correspond to an existing BGG account, THE Collection_Browser SHALL display a message indicating the user was not found.
3. WHEN the BGG collection is marked private by the owner, THE Collection_Browser SHALL display a message indicating the collection is private.
4. IF a network error occurs during a collection fetch, THEN THE Collection_Browser SHALL display a connectivity error message and a retry button.

---

### Requirement 11: BGG-Themed UI

**User Story:** As a user, I want the application to feel visually consistent with BGG, so that it feels like a natural extension of the BGG experience.

#### Acceptance Criteria

1. THE Collection_Browser SHALL apply a color theme derived from BGG's primary colors: dark navy/charcoal background (`#1a1a2e` or equivalent), orange accent (`#FF5100` matching the BGG logo mark), and light text on dark surfaces.
2. THE Collection_Browser SHALL use Shadcn UI components for all interactive controls including inputs, buttons, and filter selectors.
3. THE Collection_Browser SHALL support both light and dark mode, with the dark mode palette matching the BGG site aesthetic.
4. THE Collection_Browser SHALL display a custom combined SVG logo in the header that incorporates the original BGG logo mark (the orange polygon) and the white "BGG" letterforms from `https://cf.geekdo-static.com/images/logos/navbar-logo-bgg-b2.svg`, with the word "Stats" appended to the right in a visually matching style (same weight, same fill color, same vertical alignment).
5. THE combined SVG logo SHALL be created as a self-contained SVG asset (no external font dependencies) by extending the original BGG SVG paths with additional path data for the "Stats" text, maintaining the same 38px height and expanding the width to accommodate the additional text.

---

### Requirement 12: Username Persistence via localStorage

**User Story:** As a returning user, I want my BGG username saved locally, so that I don't have to re-enter it every time I visit the page.

#### Acceptance Criteria

1. THE Collection_Browser SHALL render a "Save" button adjacent to the username input field.
2. WHEN the user activates the "Save" button with a non-empty username, THE Collection_Browser SHALL write the current username value to `localStorage` under a defined key.
3. IF the username input is empty or contains only whitespace when the "Save" button is activated, THEN THE Collection_Browser SHALL display an inline validation message and SHALL NOT write to `localStorage`.
4. WHEN the page loads and a saved username exists in `localStorage`, THE Collection_Browser SHALL pre-fill the username input with the saved value and automatically initiate a collection fetch for that username.
5. THE Collection_Browser SHALL persist the saved username across browser sessions, surviving page reloads and browser restarts.
6. THE Collection_Browser SHALL render a "Clear saved username" control that, when activated, removes the saved username from `localStorage` and clears the username input field.
7. WHEN the saved username is cleared, THE Collection_Browser SHALL NOT automatically trigger a new collection fetch.
