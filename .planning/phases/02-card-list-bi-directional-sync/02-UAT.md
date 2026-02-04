---
status: testing
phase: 02-card-list-bi-directional-sync
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-02-03T00:00:00Z
updated: 2026-02-04T12:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Card List Display
expected: When the page loads, a list of location cards appears below the map. Each card shows the location name, address, and category (Community Fridge or Food Donation). The cards are displayed in a grid layout.
result: pass

### 2. Alphabetical Ordering
expected: Cards are sorted alphabetically by location name (A to Z).
result: pass

### 3. Responsive Layout
expected: On wider screens, cards appear in multiple columns (3+). On mobile/narrow screens, cards stack in a single column.
result: pass

### 4. Card Click Selection
expected: Clicking a card highlights it with a blue border. The corresponding map marker also becomes highlighted (drop-shadow effect). Only one card/marker can be selected at a time.
result: pass

### 5. Marker Click Selection
expected: Clicking a map marker highlights it with a drop-shadow effect. The corresponding card also becomes highlighted with a blue border. Only one marker/card can be selected at a time.
result: pass

### 6. Selection Clearing (Escape)
expected: Pressing the Escape key clears all selections - the blue border disappears from cards, the marker highlight is removed, and any open popup closes.
result: issue
reported: "To reproduce: click on marker (popup opens, marker is highlighted, card is highlighted), click on different card. Expected: popup closes, highlights for marker and card move to new selection. Actual: popup remains open, highlights move correctly. User requested: remove all popup logic as it's redundant - cards contain all relevant information."
severity: major

### 7. Visual Feedback
expected: Selected items have clear visual feedback: cards show a blue border, markers show a drop-shadow/scale effect. The transitions are smooth.
result: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Remove all Leaflet popup logic since cards contain all relevant information"
  status: failed
  reason: "User reported: To reproduce: click on marker (popup opens, marker is highlighted, card is highlighted), click on different card. Expected: popup closes, highlights for marker and card move to new selection. Actual: popup remains open, highlights move correctly. User requested: remove all popup logic as it's redundant - cards contain all relevant information."
  severity: major
  test: 6
  root_cause: "Popup functionality is redundant with card list. Popups add complexity without value since cards display all location info."
  artifacts:
    - path: "src/map.ts"
      issue: "Lines 21-22, 89-95, 104-109, 112-114, 160-167: All popup-related code including bindPopup, openPopup, popupopen handler, and closePopup() function"
    - path: "src/main.ts"
      issue: "Lines 8, 86-91: closePopup import and Escape key handler call"
    - path: "src/test/map.test.ts"
      issue: "Lines 154, 179-200, 290, 314-315: Popup-related unit tests"
    - path: "e2e/map.spec.ts"
      issue: "Lines 91-100: E2E test for popup opening"
  missing:
    - "Remove popup anchor from icon definitions"
    - "Remove popup content creation and bindPopup() calls"
    - "Remove keyboard handler that opens popup on Enter/Space"
    - "Remove popupopen event handler and ARIA announcement"
    - "Remove closePopup() function and its usage"
    - "Remove 2 popup tests (1 unit, 1 E2E)"
    - "Update 2 unit tests to remove popup assertions"
  debug_session: ".planning/debug/popup-removal-scope.md"
