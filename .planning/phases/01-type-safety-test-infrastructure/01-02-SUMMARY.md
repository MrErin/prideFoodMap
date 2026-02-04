---
phase: 01-type-safety-test-infrastructure
plan: 02
subsystem: testing
tags: [requestanimationframe, leaflet-events, vitest, real-timers, event-driven]

# Dependency graph
requires: []
provides:
  - Event-driven DOM timing patterns for Leaflet map initialization
  - Test patterns for requestAnimationFrame using vi.waitFor()
  - Zero setTimeout-based race conditions in map.ts
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Leaflet 'add' event for DOM detection instead of setTimeout"
    - "requestAnimationFrame for announcement timing instead of setTimeout"
    - "vi.waitFor() for testing requestAnimationFrame instead of fake timers"

key-files:
  created: []
  modified:
    - src/map.ts - Replaced setTimeout with event-driven patterns
    - src/test/map.test.ts - Updated tests to use real timers

key-decisions:
  - "Use Leaflet's built-in 'add' event instead of setTimeout for layer control DOM detection"
  - "Use requestAnimationFrame instead of setTimeout for ARIA announcement timing"
  - "Use vi.waitFor() instead of vi.advanceTimersByTime() for testing async DOM updates"

patterns-established:
  - "Event-driven DOM detection: Listen for Leaflet 'add' event instead of polling with setTimeout"
  - "Native browser timing: Use requestAnimationFrame for frame-synchronized DOM updates"
  - "Real timer testing: Use vi.waitFor() for async behavior instead of fake timers"

# Metrics
duration: 1min
completed: 2026-02-04
---

# Phase 01 Plan 02: Event-Driven DOM Timing Summary

**Replaced all setTimeout-based DOM timing with Leaflet events and requestAnimationFrame, eliminating race conditions from arbitrary delays**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-04T00:38:34Z
- **Completed:** 2026-02-04T00:39:44Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- **Zero setTimeout calls in src/map.ts** - All DOM timing now uses event-driven patterns
- **Layer control accessibility via Leaflet events** - Uses 'add' event to guarantee DOM exists
- **Announcement timing via requestAnimationFrame** - Frame-synchronized DOM updates for ARIA
- **Tests pass with real timers** - No fake timers needed, tests use vi.waitFor()

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace setTimeout in announce() with requestAnimationFrame** - `5df296f` (refactor)
2. **Task 2: Replace setTimeout for layer control with Leaflet event** - `72051ad` (refactor)
3. **Task 3: Update announce tests to use real timers** - `48fa1a2` (test)

**Plan metadata:** (to be added in final commit)

## Files Created/Modified

- `src/map.ts` - Replaced setTimeout(100) with requestAnimationFrame in announce(); replaced layer control setTimeout with Leaflet 'add' event handler
- `src/test/map.test.ts` - Removed vi.useFakeTimers() and vi.advanceTimersByTime(); updated announce tests to use vi.waitFor()

## Decisions Made

- **Leaflet 'add' event for layer control**: The event fires when the control is added to the map, guaranteeing the DOM element exists without arbitrary delays. This is more reliable than setTimeout and eliminates race conditions.
- **requestAnimationFrame for announcements**: Ensures the DOM update (clearing textContent) is rendered before setting the new message. No arbitrary 100ms delay needed - rAF guarantees next paint frame.
- **vi.waitFor() for async testing**: With requestAnimationFrame, tests need to wait for the next animation frame instead of advancing fake timers. vi.waitFor() is the correct pattern for this.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- File modification conflict during Task 3: src/test/map.test.ts had been modified (likely by a linter or previous edit) and needed to be re-read before editing. Resolved by re-reading the file before making changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DOM timing is now event-driven and race-condition-free
- Tests use real timers, providing more confidence in actual browser behavior
- Ready for next phase: Type-safe mocking with vi.spyOn() (Plan 01-03)

---
*Phase: 01-type-safety-test-infrastructure*
*Completed: 2026-02-04*
