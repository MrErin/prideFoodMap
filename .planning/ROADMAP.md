# Roadmap: Pride Food Map

## Overview

The Pride Food Map enhancement journey progresses from technical foundation through core feature delivery to refinement. We first establish type-safe testing patterns, then build the synchronized card list interface with bi-directional highlighting, add search and layer filtering capabilities, and finally polish the user experience with improved accessibility and event-driven timing patterns.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Type Safety & Test Infrastructure** - Establish properly typed testing patterns before complex feature work
- [x] **Phase 2: Card List & Bi-directional Sync** - Build synchronized map-marker and card-list interface
- [x] **Phase 3: Search & Filter Integration** - Add real-time search and layer-based filtering
- [ ] **Phase 4: Polish & Accessibility Enhancement** - Refine UX with auto-scroll, keyboard nav, and event-driven timing

## Phase Details

### Phase 1: Type Safety & Test Infrastructure

**Goal**: Tests use properly typed mocks without `any` types, and core functions have unit coverage.

**Status**: ✓ Complete (2026-02-04)

**Depends on**: Nothing (first phase)

**Requirements**: DEBT-01, DEBT-02, TEST-01, TEST-02, TEST-03

**Success Criteria** (what must be TRUE):
1. All test mocks use `vi.spyOn()` with proper types instead of `as any` assertions
2. `setTimeout` DOM timing patterns are replaced with event-driven patterns (MutationObserver, Leaflet events)
3. Unit tests verify marker creation, coordinate validation, and CSV parsing for `addMarkersFromCSV`
4. Unit tests verify map initialization, tile loading, and layer control setup for `initializeMap`
5. Unit tests verify ARIA live region announcements trigger correctly for `announce` function

**Plans**: 3 plans

Plans:
- [x] 01-01: Replace `as any` type assertions with properly typed Vitest mocks using `vi.spyOn()`
- [x] 01-02: Replace `setTimeout` DOM timing with event-driven patterns (MutationObserver, Leaflet `whenReady`)
- [x] 01-03: Add unit tests for `addMarkersFromCSV`, `initializeMap`, and `announce` functions

### Phase 2: Card List & Bi-directional Sync

**Goal**: Users can view all locations in a card list below the map and click either cards or markers to highlight the corresponding item.

**Status**: ✓ Complete (2026-02-03)

**Depends on**: Phase 1 (test infrastructure ensures reliable development patterns)

**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, SYNC-01, SYNC-02, SYNC-03, SYNC-04

**Success Criteria** (what must be TRUE):
1. Location cards display below the map in a scrollable list showing name, address, and category badges
2. Cards are sorted alphabetically by location name and display in a mobile-responsive layout
3. Clicking a card highlights the corresponding map marker with a visible border
4. Clicking a map marker highlights the corresponding card with a visible border
5. Only one item is highlighted at a time; pressing Escape clears the selection

**Plans**: 3 plans

Plans:
- [x] 02-01: Create `cards.ts` module with card rendering, alphabetical sorting, and mobile-responsive layout
- [x] 02-02: Implement `StateManager` class for bi-directional marker-card synchronization using `L.Util.stamp()` IDs (TDD)
- [x] 02-03: Wire up click handlers for card-to-marker and marker-to-card highlighting with single-selection state

### Phase 3: Search & Filter Integration

**Goal**: Users can filter the card list by name and layer visibility, with clear feedback when no results match.

**Status**: ✓ Complete (2026-02-04)

**Depends on**: Phase 2 (card list must exist to be filtered)

**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04

**Success Criteria** (what must be TRUE):
1. Text search box filters cards by location name in real-time as the user types
2. When map layer control toggles marker visibility, corresponding cards are hidden or shown
3. Empty state message displays when search or layer filtering returns no results
4. Clear/reset button appears when search is active to restore full card list

**Plans**: 3 plans in 2 waves

Plans:
- [x] 03-01: Extend StateManager with FilterState foundation (searchQuery field and setSearchQuery method)
- [x] 03-02: Implement real-time text search with empty state messaging and clear/reset button
- [x] 03-03: Connect layer control changes to card visibility with proper event listener cleanup

### Phase 4: Polish & Accessibility Enhancement

**Goal**: Users experience smooth interactions with auto-scroll, keyboard navigation, and reliable DOM timing.

**Status:** Ready to execute

**Depends on**: Phase 3 (polish features depend on working search/filter)

**Requirements**: POLI-01, POLI-02, POLI-03

**Success Criteria** (what must be TRUE):
1. Clicking a marker auto-scrolls the card list to show the corresponding card
2. Users can navigate cards with keyboard (Tab to navigate, Enter to select, Escape to deselect)
3. All interactive elements have proper ARIA attributes (aria-selected, aria-live for announcements)

**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Implement auto-scroll to card on marker click with smooth scroll behavior
- [ ] 04-02-PLAN.md — Add keyboard navigation and complete ARIA attribute coverage for all interactive elements

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Type Safety & Test Infrastructure | 3/3 | Complete | 2026-02-04 |
| 2. Card List & Bi-directional Sync | 3/3 | Complete | 2026-02-03 |
| 3. Search & Filter Integration | 3/3 | Complete | 2026-02-04 |
| 4. Polish & Accessibility Enhancement | 0/2 | Not started | - |

**Overall Progress:** 9/10 plans complete (90%)
