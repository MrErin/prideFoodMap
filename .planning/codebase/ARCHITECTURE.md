# Architecture

**Analysis Date:** 2025-02-03

## Pattern Overview

**Overall:** Client-side Single Page Application (SPA) with CDN-based map library

**Key Characteristics:**
- Vanilla TypeScript with module imports (no framework)
- Leaflet.js for interactive mapping via CDN
- Static data loading from CSV files
- No backend/server component (static hosting only)
- Accessibility-first design with ARIA live regions

## Layers

**Application Entry Layer:**
- Purpose: Bootstraps the application and handles initialization
- Location: `src/main.ts`
- Contains: DOM ready event listener, error handling UI logic
- Depends on: `src/map.ts` for core functionality
- Used by: `index.html` as module entry point

**Core Logic Layer:**
- Purpose: Map initialization, data loading, marker management, accessibility
- Location: `src/map.ts`
- Contains: CSV loading, marker creation, layer management, ARIA announcements
- Depends on: Leaflet (via CDN), PapaParse for CSV parsing
- Used by: `src/main.ts`, `src/test/map.test.ts`

**Data Layer:**
- Purpose: Static geospatial data storage
- Location: `public/data/`
- Contains: `fridgePins.csv`, `donationPins.csv`
- Depends on: None (static files)
- Used by: `src/map.ts` via fetch API

**Presentation Layer:**
- Purpose: HTML structure and inline styles
- Location: `index.html`
- Contains: DOM elements for map container, loading indicator, ARIA live regions
- Depends on: Leaflet CSS (via CDN)
- Used by: Browser as main document

**Asset Layer:**
- Purpose: Custom map marker icons
- Location: `public/icons/`
- Contains: `fridge.png`, `donation.png`
- Depends on: None
- Used by: `src/map.ts` for custom marker icons

## Data Flow

**Initialization Flow:**

1. Browser loads `index.html`
2. Module script loads `src/main.ts`
3. DOM ready event fires
4. `main.ts` calls `initializeMap()` from `src/map.ts`
5. `initializeMap()` creates Leaflet map instance and tile layer
6. Parallel CSV data fetch via `Promise.all()`:
   - `loadCSV()` fetches `public/data/fridgePins.csv`
   - `loadCSV()` fetches `public/data/donationPins.csv`
7. PapaParse parses CSV text into `MarkerData[]` arrays
8. `addMarkersFromCSV()` creates markers for each data row
9. Markers added to layer groups
10. Map bounds fitted to all markers
11. Layer controls added
12. Loading indicator hidden
13. Initial ARIA announcement made

**Marker Interaction Flow:**

1. User clicks marker or presses Enter/Space on focused marker
2. Leaflet opens popup
3. `popupopen` event triggers
4. `announce()` called with location name
5. ARIA live region updated for screen readers

**Error Flow:**

1. CSV fetch fails or parsing errors occur
2. Error logged to console
3. `announce()` called with error message
4. Loading element text updated to error message
5. Error thrown from `initializeMap()`

**State Management:**
- No centralized state management
- State held in Leaflet map instance and layer groups
- DOM elements store loading/error state
- No persistence (state resets on page reload)

## Key Abstractions

**MarkerData Interface:**
- Purpose: Type-safe contract for CSV row data
- Examples: `src/map.ts` (lines 4-13)
- Pattern: TypeScript interface defining shape of parsed CSV data

**Layer Groups:**
- Purpose: Organize markers by category for toggleable display
- Examples: `fridgeLayer`, `donationLayer` in `src/map.ts`
- Pattern: Leaflet LayerGroup for managing collections of markers

**Custom Icons:**
- Purpose: Visual differentiation between resource types
- Examples: `fridgeIcon`, `donationIcon` in `src/map.ts`
- Pattern: L.icon() factory with URL, size, anchor configuration

**ARIA Announcer:**
- Purpose: Screen reader notifications for state changes
- Examples: `announce()` function in `src/map.ts`
- Pattern: Live region update with 100ms delay for AT processing

## Entry Points

**Application Entry:**
- Location: `index.html`
- Triggers: Browser page load
- Responsibilities: HTML structure, CSS reset, Leaflet CSS import, module script loading

**Module Entry:**
- Location: `src/main.ts`
- Triggers: Module import by browser
- Responsibilities: Import Leaflet CSS, initialize map on DOM ready, handle loading/error UI

**Public API:**
- Location: `src/map.ts` (exported functions)
- Triggers: Called by `src/main.ts` and unit tests
- Responsibilities: `initializeMap()` for full setup, `loadCSV()` for data loading, `announce()` for accessibility

## Error Handling

**Strategy:** Try-catch at initialization level with console logging and user-facing error messages

**Patterns:**
- CSV fetch failures throw Error with status text
- Invalid coordinates logged as warnings, skipped
- Parsing warnings logged but don't halt execution
- Network errors caught and announced to user
- Loading element updates with error message on failure

## Cross-Cutting Concerns

**Logging:** Console warnings for invalid data, console.error for failures

**Validation:** Coordinate validation (NaN check) before marker creation, empty string handling in address formatting

**Authentication:** Not applicable (public static site)

**Accessibility:** ARIA labels on all interactive elements, live region announcements, keyboard navigation support, skip link, focus management

**Internationalization:** Not applicable (English-only site)

---

*Architecture analysis: 2025-02-03*
