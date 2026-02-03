# Pride Food Map

## What This Is

Interactive map showing food resources (community fridges and donation sites) in Chattanooga, TN, maintained by the Chattanooga Pride Food Coalition. Users can view locations on a map, filter by type, and access location details.

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

### Active

- [ ] Fix TypeScript `any` type usage in test mocks
- [ ] Fix DOM timing race conditions (setTimeout → event-driven)
- [ ] Add unit tests for addMarkersFromCSV function
- [ ] Add unit tests for initializeMap function
- [ ] Add unit tests for accessibility announcements
- [ ] Add location card list below map (all locations, scrollable)
- [ ] Cards show location name, address, type/category badges
- [ ] Cards sorted alphabetically by location name
- [ ] Click card → border highlight on corresponding marker
- [ ] Click marker → border highlight on corresponding card
- [ ] Cards filter when map layer control changes
- [ ] Search box to filter cards by location name

### Out of Scope

- Server-side rendering or backend — static site only
- User accounts or authentication — public resource
- Database — CSV files are sufficient
- Mobile native app — web-only
- Offline support — out of scope for v1
- Real-time data updates — manual CSV updates

## Context

**Existing codebase state:**
- Working map application deployed to GitHub Pages (https://mrerin.github.io/prideFoodMap/)
- ~32 total markers across 2 CSV files
- Vanilla TypeScript with Leaflet.js, no framework
- Vitest for unit tests, Playwright for E2E tests
- Prettier for code formatting

**Outstanding concerns to address:**
- TypeScript `any` types in test mocks reduce type safety (src/test/map.test.ts)
- DOM timing uses setTimeout which creates race conditions (src/map.ts lines 153-167)
- Missing test coverage for marker creation, map initialization, accessibility

**New feature context:**
- Cards will be added below existing map (new DOM element)
- Search input will filter card list independently
- Bi-directional linking requires tracking marker-card relationships
- Layer control already exists; need to hook into its events

## Constraints

- **Tech stack**: TypeScript 5.9.3, Vite 7.2.4, Leaflet 1.9.4, PapaParse 5.5.3 — established codebase
- **Hosting**: Static GitHub Pages — no server-side runtime
- **No framework**: Vanilla TypeScript only — no React, Vue, etc.
- **Testing**: Vitest for unit tests, Playwright for E2E — existing patterns
- **Accessibility**: Must maintain ARIA live regions and keyboard navigation
- **Deployment`: Existing CI/CD via GitHub Actions — must not break

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Border highlight for emphasis | Cleaner than background color, works with existing design | — Pending |
| Alphabetical card ordering | Predictable for users, easy to implement | — Pending |
| All cards visible at once | Current dataset is small (~32 items), scrolling is sufficient | — Pending |
| Search filters cards only | Simpler UX than filtering both cards and map simultaneously | — Pending |

---
*Last updated: 2026-02-03 after initialization*
