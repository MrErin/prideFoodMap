# Requirements: Pride Food Map

**Defined:** 2026-02-03
**Core Value:** People can find food resources in Chattanooga TN quickly

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Tech Debt & Testing

- [x] **DEBT-01**: Replace `as any` type assertions with properly typed Vitest mocks
- [x] **DEBT-02**: Replace `setTimeout` DOM timing with event-driven patterns (MutationObserver, Leaflet events)
- [x] **TEST-01**: Add unit tests for `addMarkersFromCSV` function (marker creation, coordinate validation)
- [x] **TEST-02**: Add unit tests for `initializeMap` function (map init, tile loading, layer controls)
- [x] **TEST-03**: Add unit tests for `announce` function (ARIA live region updates)

### Card List UI

- [x] **CARD-01**: Location cards displayed below map in scrollable list
- [x] **CARD-02**: Each card shows location name, full address, and category badge (fridge/donation, indoor/outdoor)
- [x] **CARD-03**: Cards sorted alphabetically by location name
- [x] **CARD-04**: All cards visible at once (no pagination)
- [x] **CARD-05**: Cards display on mobile-responsive layout (stacked below map on screens <768px)

### Bi-directional Sync

- [x] **SYNC-01**: Clicking a card highlights corresponding map marker with border
- [x] **SYNC-02**: Clicking a map marker highlights corresponding card with border
- [x] **SYNC-03**: Only one item highlighted at a time (single selection)
- [x] **SYNC-04**: Highlight persists until another item is selected or user presses Escape

### Search & Filter

- [x] **SRCH-01**: Text search box filters cards by location name (real-time as user types)
- [x] **SRCH-02**: When map layer control toggles visibility, corresponding cards are hidden/shown
- [x] **SRCH-03**: Empty state message displays when search returns no results
- [x] **SRCH-04**: Clear/reset button appears when search is active

### Polish

- [ ] **POLI-01**: When marker clicked, card list auto-scrolls to corresponding card
- [ ] **POLI-02**: Keyboard navigation works on cards (Tab to navigate, Enter to select, Escape to deselect)
- [ ] **POLI-03**: All interactive elements have proper ARIA attributes (aria-selected, aria-live for announcements)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Additional Features

- **V2-01**: "Search this area" button (viewport-based filtering)
- **V2-02**: Distance sorting (nearest first)
- **V2-03**: Status badges (Open/Closed) with hours data

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Backend server or database | Static GitHub Pages deployment only |
| User accounts or authentication | Public resource, no personalization needed |
| Real-time data updates | Manual CSV updates are sufficient |
| Database for location data | CSV files in public/ are adequate for current scale (~32 locations) |
| Framework migration (React, Vue, etc.) | Vanilla TypeScript stack is working and sufficient |
| Server-side rendering | Static site hosting only |
| Offline service worker | Out of scope for v1, requires additional complexity |
| Pagination or virtual scrolling | Current dataset small enough for all-at-once rendering |

## Deployment Constraints

**Critical:** All requirements must be compatible with:

- **Static site hosting:** GitHub Pages (no server-side runtime)
- **No backend:** All logic runs in browser
- **Data source:** CSV files in `public/data/` directory
- **Build output:** Static assets via Vite build process
- **No environment variables requiring server:** Build-time configuration only

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-01 | Phase 1 | Complete |
| DEBT-02 | Phase 1 | Complete |
| TEST-01 | Phase 1 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 1 | Complete |
| CARD-01 | Phase 2 | Complete |
| CARD-02 | Phase 2 | Complete |
| CARD-03 | Phase 2 | Complete |
| CARD-04 | Phase 2 | Complete |
| CARD-05 | Phase 2 | Complete |
| SYNC-01 | Phase 2 | Complete |
| SYNC-02 | Phase 2 | Complete |
| SYNC-03 | Phase 2 | Complete |
| SYNC-04 | Phase 2 | Complete |
| SRCH-01 | Phase 3 | Complete |
| SRCH-02 | Phase 3 | Complete |
| SRCH-03 | Phase 3 | Complete |
| SRCH-04 | Phase 3 | Complete |
| POLI-01 | Phase 4 | Pending |
| POLI-02 | Phase 4 | Pending |
| POLI-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-04 after Phase 3 completion*
