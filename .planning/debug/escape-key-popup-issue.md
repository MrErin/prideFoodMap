---
status: diagnosed
trigger: "Escape key doesn't close popup when marker is selected"
created: 2026-02-03T12:00:00Z
updated: 2026-02-03T12:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - The highlightMarker() function only removes CSS classes and does not close Leaflet popups
test: COMPLETED - Traced Escape key flow from main.ts through StateManager to highlightMarker
expecting: highlightMarker only removes CSS classes, does not close popups - CONFIRMED
next_action: DIAGNOSIS COMPLETE - Root cause identified

## Symptoms

expected: Pressing Escape key should close any open popup, remove marker highlight, and remove card selection
actual: When a popup is open and Escape is pressed, the popup stays open and the marker drop shadow (highlight) remains, but the card selection blue border is removed
errors: None (no console errors)
reproduction:
  1. Click on a map marker to select it and open its popup
  2. Press the Escape key
  3. Observe: The card selection blue border disappears, but the popup remains open and marker highlight stays
started: Not specified (likely always broken)

## Eliminated

- hypothesis: StateManager.clearSelection() is not being called
  evidence: main.ts line 87 shows escapeHandler calls stateManager.clearSelection()
  timestamp: 2026-02-03T12:00:00Z

- hypothesis: highlightMarker is not being called with null
  evidence: main.ts line 102 shows highlightMarker(state.selectedId) in the subscription
  timestamp: 2026-02-03T12:00:00Z

## Evidence

- timestamp: 2026-02-03T12:00:00Z
  checked: main.ts lines 84-90 (Escape key handler)
  found: Escape handler calls stateManager.clearSelection()
  implication: This sets selectedId to null and triggers state change notification

- timestamp: 2026-02-03T12:00:00Z
  checked: main.ts lines 99-114 (state subscription)
  found: State change listener calls updateCardSelection() and highlightMarker()
  implication: Both functions are called when Escape clears the selection

- timestamp: 2026-02-03T12:00:00Z
  checked: map.ts lines 128-154 (highlightMarker function)
  found: highlightMarker() only adds/removes the 'marker-selected' CSS class; does NOT close popups
  implication: The marker drop shadow (from CSS class) should be removed, but popups are NOT handled here

- timestamp: 2026-02-03T12:00:00Z
  checked: map.ts lines 86-92 (popup binding)
  found: Popups are bound to markers using marker.bindPopup(popupContent)
  implication: Popups are managed by Leaflet, not by our state management system

- timestamp: 2026-02-03T12:00:00Z
  checked: map.ts lines 101-106 (keyboard popup opening)
  found: marker.openPopup() is called explicitly for keyboard activation
  implication: No explicit closePopup() call exists in the codebase

## Root Cause Analysis

**PRIMARY ISSUE:** The Escape key handler in main.ts (lines 84-90) calls `stateManager.clearSelection()`, which correctly updates state and triggers listeners. However, the `highlightMarker()` function in map.ts only handles CSS class manipulation (`marker-selected` class) and **does NOT close the Leaflet popup**.

**WHY POPUPS STAY OPEN:**
- Leaflet popups are opened through default marker click behavior OR via `marker.openPopup()`
- No explicit `marker.closePopup()` call exists in the codebase
- The `highlightMarker()` function has no access to individual marker popup state
- The global Escape handler at window level doesn't close Leaflet popups

**WHY DROP SHADOW REMAINS (PARTIAL BUG):**
- The CSS class `marker-selected` should be removed by `highlightMarker(null)` call
- The user report says "drop shadow remains" - this suggests `highlightMarker` might not be working correctly OR the user is seeing a different visual element (the popup itself)

## Resolution

root_cause: The Escape key handler (main.ts line 87) calls `stateManager.clearSelection()`, which triggers the state subscription that calls `highlightMarker(state.selectedId)` with `null`. However, `highlightMarker()` in map.ts (lines 133-154) only removes the CSS class `marker-selected` from marker elements - it does NOT close the Leaflet popup. Leaflet provides a `map.closePopup()` method to close popups, but this is not being called when the selection is cleared.

**Affected Artifacts:**

1. **src/map.ts** (lines 133-154)
   - The `highlightMarker()` function only manipulates CSS classes
   - Missing: Call to `map.closePopup()` or individual `marker.closePopup()` when markerId is null

2. **src/main.ts** (lines 99-114)
   - The state subscription listener calls `updateCardSelection()` and `highlightMarker()`
   - Missing: No call to close popups when selection is cleared

**Missing Functionality:**
- No mechanism to close Leaflet popups when selection is cleared via Escape key
- The map instance (returned from `initializeMap()`) is available in main.ts but not stored in a variable accessible to the Escape handler
- Need to either:
  a) Store map instance globally/accessible scope to call `map.closePopup()`, OR
  b) Track the currently open popup marker and call `marker.closePopup()`, OR
  c) Export a new function from map.ts (e.g., `closeAllPopups()`) that closes popups

**Note:** The user report mentions "drop shadow remains on the marker" - this might be confusion about what visual element they're seeing. The popup itself has a shadow, and if the popup stays open, the shadow would appear to remain. The `marker-selected` CSS class should be removed correctly by the current code, so the "drop shadow" is likely the popup's shadow, not the marker highlight.

fix: TBD

verification: Not yet fixed

files_changed: []
