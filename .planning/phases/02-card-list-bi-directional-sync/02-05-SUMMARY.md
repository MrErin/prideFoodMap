---
phase: 02-card-list-bi-directional-sync
plan: 05
subsystem: ui-map-interactions
tags: [leaflet, popup-removal, state-manager, keyboard-accessibility, cleanup]

# Dependency graph
requires:
  - phase: 02-card-list-bi-directional-sync
    provides: 02-01 (Card List UI), 02-03 (Bi-directional sync)
provides:
  - Clean codebase without any popup-related code
  - Markers only highlight corresponding cards via StateManager
  - Keyboard accessibility preserved (Enter/Space triggers selection)
affects: [future UI maintenance - simpler codebase without popup complexity]

# Tech tracking
tech-stack:
  added: []
  patterns: [state-manager-selection, keyboard-accessibility-without-popups]

key-files:
  created: []
  modified: [src/map.ts, src/main.ts, src/test/map.test.ts, e2e/map.spec.ts]

key-decisions:
  - 'Remove all popup logic as cards already display all information - removes redundancy'
  - 'Pass StateManager to addMarkersFromCSV to maintain keyboard accessibility without popups'
  - 'Keyboard Enter/Space on markers now triggers StateManager selection instead of opening popup'

patterns-established:
  - 'Pattern: StateManager.setSelected() for marker keyboard activation (Enter/Space keys)'
  - 'Pattern: Simplified marker interaction - click/keyboard both trigger selection via StateManager'

# Metrics
duration: 4min
completed: 2026-02-04
---

# Phase 2 Plan 5: Popup Removal Summary

**Complete removal of Leaflet popup logic since cards contain all relevant information - markers now only highlight corresponding cards via StateManager**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-04T05:11:27Z
- **Completed:** 2026-02-04T05:15:00Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Removed all popup-related code from src/map.ts (popupAnchor, bindPopup, openPopup, popupopen, closePopup, mapInstance)
- Updated keyboard handlers to use StateManager.setSelected() instead of openPopup()
- Removed closePopup import and call from src/main.ts Escape key handler
- Deleted popup content unit test and updated remaining tests to remove popup assertions
- Deleted popup opening E2E test
- All tests pass with 22 tests in map.test.ts (reduced from 23 after deleting popup test)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove popup binding and keyboard handlers from map.ts** - `39ca74d` (fix)
2. **Task 2: Remove closePopup import and call from main.ts** - `058747b` (fix)
3. **Task 3: Remove and update popup-related unit tests in map.test.ts** - `f21fbda` (test)
4. **Task 4: Remove popup E2E test from map.spec.ts** - `6f82fd9` (test)

## Files Created/Modified

- `src/map.ts` - Removed popupAnchor from icons, removed popup binding/handling, removed mapInstance and closePopup function, added StateManager parameter to addMarkersFromCSV and initializeMap
- `src/main.ts` - Removed closePopup import and call, updated initializeMap call to pass stateManager
- `src/test/map.test.ts` - Deleted popup content test, removed popup assertions, added StateManager mock instances to all tests
- `e2e/map.spec.ts` - Deleted "should open popup when marker is clicked" test

## Decisions Made

- Updated addMarkersFromCSV signature to accept StateManager parameter - necessary to maintain keyboard accessibility without popups
- Updated initializeMap signature to accept StateManager parameter - required for passing to addMarkersFromCSV
- Replaced openPopup() call with stateManager.setSelected() in keyboard handler - maintains accessibility while removing popups
- Kept keyboard event listener for Enter/Space keys - accessibility requirement, just changed the action

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- None - all tasks executed smoothly

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Popup removal complete - markers only highlight cards via StateManager
- UAT issue resolved: clicking different cards no longer leaves popup open (no popups exist)
- Keyboard accessibility preserved: Enter/Space on markers triggers StateManager selection
- Escape key clears selections without needing to close popups
- No blockers - ready to proceed

---

_Phase: 02-card-list-bi-directional-sync_
_Completed: 2026-02-04_
