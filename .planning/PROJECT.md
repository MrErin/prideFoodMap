# Pride Food Map

## What This Is

Interactive map showing food resources (community fridges and donation sites) in Chattanooga, TN, maintained by the Chattanooga Pride Food Coalition. Users can view locations on a map, see a synchronized card list below, filter by type and name, and access location details through both map markers and cards.

## Core Value

People can find food resources in Chattanooga TN quickly.

## Requirements

### Validated

- ✓ Map displays with OpenStreetMap tiles — existing
- ✓ CSV data loads from public/data/ (fridgePins.csv, donationPins.csv) — existing
- ✓ Markers display for fridge and donation locations — existing
- ✓ Layer control toggles marker visibility — existing
- ✓ Popups show location details on click — existing
- ✓ Accessibility features (ARIA announcements, skip link, keyboard navigation) — existing
- ✓ Custom marker icons (fridge, donation) — existing
- ✓ Type-safe test mocks (vi.spyOn) with no `as any` patterns — v1
- ✓ Event-driven DOM timing (requestAnimationFrame, Leaflet events) — v1
- ✓ Unit tests for addMarkersFromCSV, initializeMap, and announce functions — v1
- ✓ Location card list below map with scrollable list — v1
- ✓ Cards show name, address, and category badges (fridge/donation) — v1
- ✓ Cards sorted alphabetically by location name — v1
- ✓ Mobile-responsive layout (cards stacked on <768px) — v1
- ✓ Bi-directional sync: click card highlights marker, click marker highlights card — v1
- ✓ Single selection state with Escape key to deselect — v1
- ✓ Real-time search filters cards by location name (300ms debounce) — v1
- ✓ Layer control toggles card visibility (AND logic with search) — v1
- ✓ Empty state message with aria-live announcements — v1
- ✓ Clear/reset button for search — v1
- ✓ Auto-scroll to card on marker click with prefers-reduced-motion support — v1
- ✓ Keyboard navigation (Tab/Enter/Escape) on cards — v1
- ✓ Complete ARIA coverage on all interactive elements — v1

### Active

(No active requirements — all v1 requirements shipped)

### Out of Scope

- Server-side rendering or backend — static site only
- User accounts or authentication — public resource
- Database — CSV files are sufficient
- Mobile native app — web-only
- Offline support — out of scope for v1
- Real-time data updates — manual CSV updates

## Context

**Current codebase state:**

- Working map application deployed to GitHub Pages (https://mrerin.github.io/prideFoodMap/)
- ~32 total markers across 2 CSV files
- ~1,793 LOC TypeScript/JS/CSS
- Vanilla TypeScript with Leaflet.js, no framework
- Vitest for unit tests (23/23 passing), Playwright for E2E tests
- Prettier for code formatting

**v1 milestone shipped:**

- Type-safe test infrastructure with vi.spyOn() patterns
- Card list UI with CSS Grid responsive layout
- StateManager with Observer pattern for bi-directional sync
- Real-time search with debounce and empty state
- Layer-based filtering with AND logic
- Auto-scroll with prefers-reduced-motion detection
- Complete keyboard navigation and ARIA coverage

**Next milestone goals:**

- Gather user feedback on v1 features
- Consider distance-based sorting
- Consider "search this area" viewport filtering
- Consider status badges (Open/Closed) with hours data

## Constraints

- **Tech stack**: TypeScript 5.9.3, Vite 7.2.4, Leaflet 1.9.4, PapaParse 5.5.3 — established codebase
- **Hosting**: Static GitHub Pages — no server-side runtime
- **No framework**: Vanilla TypeScript only — no React, Vue, etc.
- **Testing**: Vitest for unit tests, Playwright for E2E — existing patterns
- **Accessibility**: Must maintain ARIA live regions and keyboard navigation
- **Deployment**: Existing CI/CD via GitHub Actions — must not break

## Key Decisions

| Decision                                 | Rationale                                                     | Outcome |
| ---------------------------------------- | ------------------------------------------------------------- | ------- |
| Border highlight for emphasis            | Cleaner than background color, works with existing design     | ✓ Good  |
| Alphabetical card ordering               | Predictable for users, easy to implement                      | ✓ Good  |
| All cards visible at once                | Current dataset is small (~32 items), scrolling is sufficient | ✓ Good  |
| Search filters cards only                | Simpler UX than filtering both cards and map simultaneously   | ✓ Good  |
| Reduce map height to 50vh                | Make room for card list display below map                     | ✓ Good  |
| Extend SelectionState via FilterState    | Backward compatibility for existing code                      | ✓ Good  |
| Use scrollIntoView with block: 'nearest' | Minimal viewport disruption when scrolling                    | ✓ Good  |
| 300ms debounce for search                | Prevents excessive DOM updates while feeling responsive       | ✓ Good  |
| StateManager Observer pattern            | Single source of truth for selection state                    | ✓ Good  |
| L.Util.stamp() for marker IDs            | Unique ID generation without additional libraries             | ✓ Good  |

---

_Last updated: 2026-02-03 after v1 milestone completion_
